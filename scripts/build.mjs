import { promises as fs } from "node:fs";
import path from "node:path";
import process from "node:process";

const root = process.cwd();
const contentRoot = path.join(root, "content");
const sectionsRoot = path.join(contentRoot, "sections");
const outRoot = path.join(root, "_site");
const mediaRoot = path.join(outRoot, "media");
const imageExtensions = new Set([".jpg", ".jpeg", ".png", ".webp", ".avif", ".gif", ".svg"]);
const videoExtensions = new Set([".mp4", ".webm", ".ogg", ".mov", ".m4v"]);
const codeExtensions = new Set([".js", ".mjs", ".ts", ".tsx", ".jsx", ".py", ".cpp", ".c", ".h", ".hpp", ".cs", ".java", ".rs", ".go", ".glsl", ".vert", ".frag", ".comp", ".shader", ".json", ".yaml", ".yml", ".toml", ".html", ".css", ".md", ".txt"]);

async function exists(filePath) { try { await fs.access(filePath); return true; } catch { return false; } }
async function readJson(filePath, fallback = null) {
  if (!(await exists(filePath))) return fallback;
  try { return JSON.parse(await fs.readFile(filePath, "utf8")); }
  catch (error) { throw new Error(`Invalid JSON: ${path.relative(root, filePath)}\n${error.message}`); }
}
async function directories(dirPath) {
  if (!(await exists(dirPath))) return [];
  return (await fs.readdir(dirPath, {withFileTypes:true})).filter(entry => entry.isDirectory() && !entry.name.startsWith("_") && !entry.name.startsWith(".")).map(entry => entry.name);
}
async function files(dirPath) {
  if (!(await exists(dirPath))) return [];
  return (await fs.readdir(dirPath, {withFileTypes:true})).filter(entry => entry.isFile() && !entry.name.startsWith(".")).map(entry => entry.name);
}
async function copyFile(source, destination) { await fs.mkdir(path.dirname(destination), {recursive:true}); await fs.copyFile(source, destination); }
function posix(...parts) { return parts.join("/").replaceAll("\\", "/").replace(/\/{2,}/g, "/"); }
async function detectCover(dirPath) {
  const candidates = (await files(dirPath)).filter(name => /^cover\./i.test(name) && imageExtensions.has(path.extname(name).toLowerCase())).sort();
  return candidates[0] || null;
}
async function copyNamedAsset(sourceDir, fileName, publicDir) {
  if (!fileName) return null;
  await copyFile(path.join(sourceDir, fileName), path.join(outRoot, publicDir, fileName));
  return posix(publicDir, fileName);
}
async function collectMedia(sourceDir, publicDir, extensions) {
  if (!(await exists(sourceDir))) return [];
  const names = (await files(sourceDir)).filter(name => extensions.has(path.extname(name).toLowerCase())).sort((a,b)=>a.localeCompare(b, undefined, {numeric:true}));
  const output = [];
  for (const name of names) {
    await copyFile(path.join(sourceDir, name), path.join(outRoot, publicDir, name));
    output.push({name, path:posix(publicDir, name)});
  }
  return output;
}
async function collectCode(sourceDir) {
  if (!(await exists(sourceDir))) return [];
  const names = (await files(sourceDir)).filter(name => codeExtensions.has(path.extname(name).toLowerCase())).sort();
  const output = [];
  for (const name of names) {
    const filePath = path.join(sourceDir, name);
    const stat = await fs.stat(filePath);
    if (stat.size > 250_000) { console.warn(`Skipping code file over 250 KB: ${path.relative(root,filePath)}`); continue; }
    output.push({name, content:await fs.readFile(filePath,"utf8")});
  }
  return output;
}
async function localizedMarkdown(itemDir) {
  const content = {};
  for (const language of ["en", "ja", "zh"]) {
    const filePath = path.join(itemDir, `content.${language}.md`);
    if (await exists(filePath)) content[language] = await fs.readFile(filePath, "utf8");
  }
  return content;
}

async function build() {
  await fs.rm(outRoot, {recursive:true, force:true});
  await fs.mkdir(path.join(outRoot, "generated"), {recursive:true});
  await fs.mkdir(mediaRoot, {recursive:true});

  for (const file of ["index.html", "styles.css", "app.js", "favicon.svg"]) await copyFile(path.join(root,file), path.join(outRoot,file));
  await fs.writeFile(path.join(outRoot, ".nojekyll"), "");

  const site = await readJson(path.join(contentRoot, "site.json"));
  if (!site) throw new Error("content/site.json is required.");

  const siteAssetsDir = path.join(contentRoot, "site-assets");
  site.assets = {};
  if (await exists(siteAssetsDir)) {
    for (const name of await files(siteAssetsDir)) {
      await copyFile(path.join(siteAssetsDir,name), path.join(outRoot,"media","site",name));
      site.assets[path.parse(name).name] = posix("media","site",name);
    }
  }

  const sections = [];
  for (const sectionSlug of await directories(sectionsRoot)) {
    const sectionDir = path.join(sectionsRoot, sectionSlug);
    const section = await readJson(path.join(sectionDir, "section.json"));
    if (!section) continue;
    section.slug = sectionSlug;
    section.cover = await copyNamedAsset(sectionDir, await detectCover(sectionDir), posix("media",sectionSlug));
    section.categories = [];

    for (const categorySlug of await directories(sectionDir)) {
      const categoryDir = path.join(sectionDir, categorySlug);
      const category = await readJson(path.join(categoryDir, "category.json"));
      if (!category) continue;
      category.slug = categorySlug;
      category.cover = await copyNamedAsset(categoryDir, await detectCover(categoryDir), posix("media",sectionSlug,categorySlug));
      category.items = [];

      for (const itemSlug of await directories(categoryDir)) {
        const itemDir = path.join(categoryDir, itemSlug);
        const meta = await readJson(path.join(itemDir, "meta.json"));
        if (!meta) continue;
        const publicItemDir = posix("media",sectionSlug,categorySlug,itemSlug);
        const cover = await copyNamedAsset(itemDir, await detectCover(itemDir), publicItemDir);
        const gallery = await collectMedia(path.join(itemDir,"gallery"), posix(publicItemDir,"gallery"), imageExtensions);
        const localVideos = await collectMedia(path.join(itemDir,"videos"), posix(publicItemDir,"videos"), videoExtensions);
        const code = await collectCode(path.join(itemDir,"code"));
        const externalVideos = await readJson(path.join(itemDir,"videos.json"), []);
        const links = await readJson(path.join(itemDir,"links.json"), []);
        const content = await localizedMarkdown(itemDir);
        category.items.push({...meta, slug:itemSlug, cover, gallery, localVideos, code, externalVideos, links, content});
      }
      category.items.sort((a,b) => (b.date || "").localeCompare(a.date || "") || (a.order || 999) - (b.order || 999));
      section.categories.push(category);
    }
    section.categories.sort((a,b)=>(a.order || 999)-(b.order || 999));
    sections.push(section);
  }
  sections.sort((a,b)=>(a.order || 999)-(b.order || 999));

  const index = {generatedAt:new Date().toISOString(), site, sections};
  await fs.writeFile(path.join(outRoot,"generated","content-index.json"), JSON.stringify(index,null,2)+"\n");
  console.log(`Built ${sections.length} sections to ${path.relative(root,outRoot)}/`);
}

build().catch(error => { console.error(error); process.exit(1); });
