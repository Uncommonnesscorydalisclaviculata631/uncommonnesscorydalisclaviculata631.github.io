const app = document.getElementById("app");
const navLinks = document.getElementById("navLinks");
const languageSelect = document.getElementById("languageSelect");
const menuButton = document.getElementById("menuButton");
const navPanel = document.getElementById("navPanel");
const lightbox = document.getElementById("lightbox");
const lightboxImage = document.getElementById("lightboxImage");
const lightboxCaption = document.getElementById("lightboxCaption");
const lightboxClose = document.getElementById("lightboxClose");

let data;
let locale = localStorage.getItem("portfolio-language") || "en";

const UI = {
  en: {
    work: "Work", blog: "Blog", about: "About", explore: "Explore my work", viewGithub: "View GitHub",
    selectedAreas: "Selected disciplines", selectedAreasTitle: "Where technology meets visual imagination.",
    openSection: "Explore section", categories: "Categories", projects: "Projects & entries", latest: "Latest entries",
    backHome: "Home", readMore: "View details", overview: "Overview", gallery: "Gallery", videos: "Videos",
    links: "Links & sources", code: "Code files", source: "Open source ↗", date: "Date", category: "Category",
    type: "Type", status: "Status", github: "GitHub", noItems: "No published entries yet.",
    noEmbed: "This provider does not allow automatic embedding here.", openVideo: "Open video source",
    aboutLabel: "About me", notFound: "Page not found", notFoundBody: "The requested content does not exist or is unpublished.",
    footer: "Designed with code and a little devilish energy 😈"
  },
  ja: {
    work: "作品", blog: "ブログ", about: "プロフィール", explore: "作品を見る", viewGithub: "GitHubを見る",
    selectedAreas: "制作分野", selectedAreasTitle: "技術と視覚的想像力が交わる場所。",
    openSection: "カテゴリを見る", categories: "サブカテゴリ", projects: "プロジェクト・記事", latest: "最新コンテンツ",
    backHome: "ホーム", readMore: "詳細を見る", overview: "概要", gallery: "ギャラリー", videos: "動画",
    links: "リンク・出典", code: "コードファイル", source: "元リンクを開く ↗", date: "日付", category: "カテゴリ",
    type: "種類", status: "状態", github: "GitHub", noItems: "公開済みコンテンツはまだありません。",
    noEmbed: "この動画サービスは自動埋め込みに対応していません。", openVideo: "動画の元リンクを開く",
    aboutLabel: "プロフィール", notFound: "ページが見つかりません", notFoundBody: "指定されたコンテンツは存在しないか、非公開です。",
    footer: "コードと少しの小悪魔エネルギーで制作 😈"
  },
  zh: {
    work: "作品", blog: "博客", about: "关于我", explore: "查看我的作品", viewGithub: "查看 GitHub",
    selectedAreas: "创作领域", selectedAreasTitle: "技术与视觉想象力交汇之处。",
    openSection: "进入栏目", categories: "子分类", projects: "项目与内容", latest: "最新内容",
    backHome: "首页", readMore: "查看详情", overview: "内容介绍", gallery: "图片画廊", videos: "视频",
    links: "链接与来源", code: "代码文件", source: "打开原始链接 ↗", date: "日期", category: "分类",
    type: "类型", status: "状态", github: "GitHub", noItems: "这里暂时还没有已发布内容。",
    noEmbed: "该视频平台无法在此自动嵌入。", openVideo: "打开视频原始链接",
    aboutLabel: "关于我", notFound: "页面不存在", notFoundBody: "请求的内容不存在或尚未发布。",
    footer: "由代码与一点小恶魔能量打造 😈"
  }
};

const ui = key => UI[locale]?.[key] || UI.en[key] || key;
const localize = value => {
  if (value == null) return "";
  if (typeof value === "string") return value;
  return value[locale] || value.en || value.zh || value.ja || Object.values(value)[0] || "";
};
const escapeHtml = value => String(value ?? "").replace(/[&<>'"]/g, char => ({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"}[char]));
const attr = value => escapeHtml(value).replace(/`/g, "&#96;");
const formatDate = value => {
  if (!value) return "";
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat(locale === "zh" ? "zh-CN" : locale === "ja" ? "ja-JP" : "en-IE", { year: "numeric", month: "long", day: "numeric" }).format(date);
};

function inlineMarkdown(text) {
  let safe = escapeHtml(text);
  safe = safe.replace(/`([^`]+)`/g, "<code>$1</code>");
  safe = safe.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  safe = safe.replace(/__([^_]+)__/g, "<strong>$1</strong>");
  safe = safe.replace(/\*([^*]+)\*/g, "<em>$1</em>");
  safe = safe.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
  return safe;
}

function renderMarkdown(markdown) {
  if (!markdown?.trim()) return "";
  const lines = markdown.replace(/\r/g, "").split("\n");
  const html = [];
  let paragraph = [];
  let listType = null;
  let inCode = false;
  let codeLanguage = "";
  let codeLines = [];

  const flushParagraph = () => {
    if (paragraph.length) html.push(`<p>${inlineMarkdown(paragraph.join(" "))}</p>`);
    paragraph = [];
  };
  const closeList = () => {
    if (listType) html.push(`</${listType}>`);
    listType = null;
  };

  for (const line of lines) {
    const codeMatch = line.match(/^```\s*([\w+-]*)\s*$/);
    if (codeMatch) {
      if (!inCode) {
        flushParagraph(); closeList(); inCode = true; codeLanguage = codeMatch[1] || "text"; codeLines = [];
      } else {
        html.push(`<pre><code data-language="${attr(codeLanguage)}">${escapeHtml(codeLines.join("\n"))}</code></pre>`);
        inCode = false;
      }
      continue;
    }
    if (inCode) { codeLines.push(line); continue; }
    if (!line.trim()) { flushParagraph(); closeList(); continue; }

    const heading = line.match(/^(#{1,4})\s+(.+)$/);
    if (heading) { flushParagraph(); closeList(); const level = heading[1].length; html.push(`<h${level}>${inlineMarkdown(heading[2])}</h${level}>`); continue; }
    const quote = line.match(/^>\s?(.*)$/);
    if (quote) { flushParagraph(); closeList(); html.push(`<blockquote>${inlineMarkdown(quote[1])}</blockquote>`); continue; }
    const unordered = line.match(/^[-*]\s+(.+)$/);
    if (unordered) {
      flushParagraph();
      if (listType !== "ul") { closeList(); listType = "ul"; html.push("<ul>"); }
      html.push(`<li>${inlineMarkdown(unordered[1])}</li>`); continue;
    }
    const ordered = line.match(/^\d+\.\s+(.+)$/);
    if (ordered) {
      flushParagraph();
      if (listType !== "ol") { closeList(); listType = "ol"; html.push("<ol>"); }
      html.push(`<li>${inlineMarkdown(ordered[1])}</li>`); continue;
    }
    paragraph.push(line.trim());
  }
  if (inCode) html.push(`<pre><code data-language="${attr(codeLanguage)}">${escapeHtml(codeLines.join("\n"))}</code></pre>`);
  flushParagraph(); closeList();
  return html.join("\n");
}

function sectionHref(section) { return `#/section/${encodeURIComponent(section.slug)}`; }
function categoryHref(section, category) { return `#/category/${encodeURIComponent(section.slug)}/${encodeURIComponent(category.slug)}`; }
function itemHref(section, category, item) { return `#/item/${encodeURIComponent(section.slug)}/${encodeURIComponent(category.slug)}/${encodeURIComponent(item.slug)}`; }
function getSection(slug) { return data.sections.find(section => section.slug === slug); }
function getCategory(section, slug) { return section?.categories.find(category => category.slug === slug); }
function getItem(category, slug) { return category?.items.find(item => item.slug === slug && item.status !== "draft"); }

function imageTag(path, altText, className = "") {
  return path ? `<img class="${className}" src="${attr(path)}" alt="${attr(altText)}" loading="lazy">` : "";
}

function renderNav() {
  const links = data.sections.map(section => `<a class="nav-link" data-section="${attr(section.slug)}" href="${sectionHref(section)}">${escapeHtml(localize(section.title))}</a>`);
  links.push(`<a class="nav-link" href="#/about">${escapeHtml(ui("about"))}</a>`);
  navLinks.innerHTML = links.join("");
  document.getElementById("brandName").textContent = data.site.name;
  document.getElementById("brandRole").textContent = localize(data.site.role);
  document.getElementById("copyright").textContent = `© ${new Date().getFullYear()} ${data.site.name}`;
  document.getElementById("footerLine").textContent = ui("footer");
}

function renderSectionCard(section, index) {
  return `<a class="feature-card" href="${sectionHref(section)}" style="--card-accent:${attr(section.accent || "#7e22ce")}">
    ${imageTag(section.cover, localize(section.title), "card-cover")}
    <span class="card-glow"></span>
    <div class="card-body">
      <div class="card-topline"><span class="card-icon">${escapeHtml(section.icon || "✦")}</span><span class="card-number">${String(index + 1).padStart(2, "0")}</span></div>
      <h3>${escapeHtml(localize(section.title))}</h3>
      <p>${escapeHtml(localize(section.description))}</p>
      <div class="tags">${section.categories.slice(0, 5).map(category => `<span class="tag">${escapeHtml(localize(category.title))}</span>`).join("")}</div>
      <span class="card-arrow">${escapeHtml(ui("openSection"))} ↘</span>
    </div>
  </a>`;
}

function renderHome() {
  document.title = `${data.site.name} | ${localize(data.site.role)}`;
  const github = data.site.social?.github;
  app.innerHTML = `
    <section class="hero">
      <div class="hero-grid">
        <div>
          <div class="eyebrow"><span class="status-dot"></span>${escapeHtml(localize(data.site.eyebrow))}</div>
          <h1>
            <span class="hero-title-lead">${escapeHtml(localize(data.site.heroLead))}</span>
            <span class="hero-title-highlight gradient-text">${escapeHtml(localize(data.site.heroHighlight))}</span>
          </h1>
          <p class="hero-description">${escapeHtml(localize(data.site.heroDescription))}</p>
          <div class="hero-actions">
            <button class="button button-primary" type="button" data-scroll-to="work">${escapeHtml(ui("explore"))} ↘</button>
            ${github ? `<a class="button button-secondary" href="${attr(github)}" target="_blank" rel="noopener noreferrer">${escapeHtml(ui("viewGithub"))} ↗</a>` : ""}
          </div>
        </div>
        <div class="hero-orb" aria-hidden="true"><div class="orb-core"><span>😈</span></div></div>
      </div>
    </section>

    <section class="section" id="work">
      <div class="section-heading">
        <p class="section-label">${escapeHtml(ui("selectedAreas"))}</p>
        <h2>${escapeHtml(ui("selectedAreasTitle"))}</h2>
      </div>
      <div class="card-grid">${data.sections.map(renderSectionCard).join("")}</div>
    </section>

    <section class="section">
      <div class="section-heading">
        <p class="section-label">${escapeHtml(ui("latest"))}</p>
        <h2>${escapeHtml(localize(data.site.latestTitle))}</h2>
      </div>
      ${renderItemsGrid(latestItems(6), "three")}
    </section>
  `;
}

function latestItems(limit = 6) {
  return data.sections.flatMap(section => section.categories.flatMap(category => category.items
    .filter(item => item.status !== "draft")
    .map(item => ({ section, category, item }))
  )).sort((a, b) => (b.item.date || "").localeCompare(a.item.date || "")).slice(0, limit);
}

function renderItemsGrid(entries, variant = "") {
  if (!entries.length) return `<div class="empty-state"><p>${escapeHtml(ui("noItems"))}</p></div>`;
  return `<div class="card-grid ${variant}">${entries.map(({section, category, item}) => renderItemCard(section, category, item)).join("")}</div>`;
}

function renderItemCard(section, category, item) {
  return `<a class="content-card" href="${itemHref(section, category, item)}" style="--card-accent:${attr(section.accent || "#7e22ce")}">
    ${imageTag(item.cover || category.cover || section.cover, localize(item.title), "card-cover")}
    <span class="card-glow"></span>
    <div class="card-body">
      <div class="content-meta"><span>${escapeHtml(localize(category.title))}</span>${item.date ? `<span>· ${escapeHtml(formatDate(item.date))}</span>` : ""}</div>
      <h3>${escapeHtml(localize(item.title))}</h3>
      <p>${escapeHtml(localize(item.summary))}</p>
      <div class="tags">${(item.tags || []).slice(0, 5).map(tag => `<span class="tag">${escapeHtml(localize(tag))}</span>`).join("")}</div>
      <span class="card-arrow">${escapeHtml(ui("readMore"))} ↘</span>
    </div>
  </a>`;
}

function breadcrumbs(parts) {
  return `<div class="breadcrumbs">${parts.map(part => `<span>${part.href ? `<a href="${part.href}">${escapeHtml(part.label)}</a>` : escapeHtml(part.label)}</span>`).join("")}</div>`;
}

function renderSection(section) {
  if (!section) return renderNotFound();
  document.title = `${localize(section.title)} | ${data.site.name}`;
  const allItems = section.categories.flatMap(category => category.items.filter(item => item.status !== "draft").map(item => ({ section, category, item })));
  app.innerHTML = `
    <header class="page-header">
      ${breadcrumbs([{label: ui("backHome"), href: "#/"}, {label: localize(section.title)}])}
      <p class="section-label">${escapeHtml(section.kind === "blog" ? ui("blog") : ui("work"))}</p>
      <h1>${escapeHtml(localize(section.title))}</h1>
      <p class="page-header-description">${escapeHtml(localize(section.description))}</p>
    </header>
    ${section.landing === "items" ? `
      <section class="section"><div class="section-heading"><p class="section-label">${escapeHtml(ui("projects"))}</p><h2>${escapeHtml(localize(section.itemsTitle || section.title))}</h2></div>${renderItemsGrid(allItems, "three")}</section>
    ` : `
      <section class="section"><div class="section-heading"><p class="section-label">${escapeHtml(ui("categories"))}</p><h2>${escapeHtml(localize(section.categoriesTitle || section.title))}</h2></div>
        <div class="card-grid three">${section.categories.map((category, index) => renderCategoryCard(section, category, index)).join("")}</div>
      </section>
      <section class="section"><div class="section-heading"><p class="section-label">${escapeHtml(ui("latest"))}</p><h2>${escapeHtml(ui("projects"))}</h2></div>${renderItemsGrid(allItems.slice().sort((a,b)=>(b.item.date||"").localeCompare(a.item.date||"")).slice(0,6), "three")}</section>
    `}
  `;
}

function renderCategoryCard(section, category, index) {
  return `<a class="category-card" href="${categoryHref(section, category)}" style="--card-accent:${attr(section.accent || "#7e22ce")}">
    ${imageTag(category.cover || section.cover, localize(category.title), "card-cover")}
    <span class="card-glow"></span>
    <div class="card-body">
      <div class="card-topline"><span class="card-icon">${escapeHtml(category.icon || section.icon || "✦")}</span><span class="card-number">${String(index + 1).padStart(2, "0")}</span></div>
      <h3>${escapeHtml(localize(category.title))}</h3><p>${escapeHtml(localize(category.description))}</p>
      <div class="tags"><span class="tag">${category.items.filter(item => item.status !== "draft").length} ${escapeHtml(ui("projects"))}</span></div>
      <span class="card-arrow">${escapeHtml(ui("openSection"))} ↘</span>
    </div>
  </a>`;
}

function renderCategory(section, category) {
  if (!section || !category) return renderNotFound();
  document.title = `${localize(category.title)} | ${data.site.name}`;
  const entries = category.items.filter(item => item.status !== "draft").map(item => ({section, category, item}));
  app.innerHTML = `
    <header class="page-header">
      ${breadcrumbs([{label: ui("backHome"), href: "#/"}, {label: localize(section.title), href: sectionHref(section)}, {label: localize(category.title)}])}
      <p class="section-label">${escapeHtml(localize(section.title))}</p>
      <h1>${escapeHtml(localize(category.title))}</h1>
      <p class="page-header-description">${escapeHtml(localize(category.description))}</p>
    </header>
    <section class="section">${renderItemsGrid(entries, "three")}</section>
  `;
}

function videoInfo(url) {
  let match;
  if ((match = url.match(/(?:youtube\.com\/(?:watch\?v=|shorts\/|embed\/)|youtu\.be\/)([\w-]{6,})/i))) return {type:"iframe", src:`https://www.youtube-nocookie.com/embed/${match[1]}`};
  if ((match = url.match(/vimeo\.com\/(?:video\/)?(\d+)/i))) return {type:"iframe", src:`https://player.vimeo.com/video/${match[1]}`};
  if ((match = url.match(/bilibili\.com\/video\/(BV[\w]+)/i))) return {type:"iframe", src:`https://player.bilibili.com/player.html?bvid=${match[1]}&page=1&high_quality=1`};
  if (/\.(mp4|webm|ogg)(?:\?.*)?$/i.test(url)) return {type:"video", src:url};
  return {type:"link", src:url};
}

function renderVideoCard(video) {
  const title = localize(video.title) || video.name || "Video";
  const info = videoInfo(video.url);
  let media;
  if (info.type === "iframe") media = `<iframe class="video-frame" src="${attr(info.src)}" title="${attr(title)}" loading="lazy" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>`;
  else if (info.type === "video") media = `<video class="video-frame" src="${attr(info.src)}" controls preload="metadata"></video>`;
  else media = `<div class="video-fallback"><span>▶</span><p>${escapeHtml(ui("noEmbed"))}</p><a class="button button-secondary" href="${attr(video.url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(ui("openVideo"))} ↗</a></div>`;
  return `<article class="video-card">${media}<div class="video-caption"><strong>${escapeHtml(title)}</strong><a class="source-link" href="${attr(video.url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(ui("source"))}</a></div></article>`;
}

function renderItem(section, category, item) {
  if (!section || !category || !item) return renderNotFound();
  document.title = `${localize(item.title)} | ${data.site.name}`;
  const externalVideos = item.externalVideos || [];
  const localVideos = (item.localVideos || []).map(video => ({title: {en: video.name, ja: video.name, zh: video.name}, url: video.path}));
  const allVideos = [...externalVideos, ...localVideos];
  const allLinks = [...(item.links || [])];
  if (item.github) allLinks.unshift({label:{en:"GitHub Repository", ja:"GitHub リポジトリ", zh:"GitHub 仓库"}, url:item.github, note:{en:"Source code",ja:"ソースコード",zh:"源代码"}});
  app.innerHTML = `
    <article>
      <header class="detail-header">
        ${breadcrumbs([{label:ui("backHome"),href:"#/"},{label:localize(section.title),href:sectionHref(section)},{label:localize(category.title),href:categoryHref(section,category)},{label:localize(item.title)}])}
        <div class="detail-layout">
          <div>
            <p class="section-label">${escapeHtml(localize(category.title))}</p>
            <h1 class="detail-title">${escapeHtml(localize(item.title))}</h1>
            <p class="detail-summary">${escapeHtml(localize(item.summary))}</p>
            <div class="page-actions">
              ${item.github ? `<a class="button button-primary" href="${attr(item.github)}" target="_blank" rel="noopener noreferrer">GitHub ↗</a>` : ""}
              ${allVideos[0] ? `<a class="button button-secondary" href="${attr(allVideos[0].url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(ui("videos"))} ↗</a>` : ""}
            </div>
            ${imageTag(item.cover || category.cover || section.cover, localize(item.title), "detail-cover")}
          </div>
          <aside class="detail-sidebar">
            <h3>${escapeHtml(ui("overview"))}</h3>
            <div class="detail-facts">
              ${item.date ? `<div class="detail-fact"><small>${escapeHtml(ui("date"))}</small><span>${escapeHtml(formatDate(item.date))}</span></div>` : ""}
              <div class="detail-fact"><small>${escapeHtml(ui("category"))}</small><span>${escapeHtml(localize(category.title))}</span></div>
              <div class="detail-fact"><small>${escapeHtml(ui("type"))}</small><span>${escapeHtml(item.type || "project")}</span></div>
              ${(item.tags || []).length ? `<div class="detail-fact"><small>Tags</small><div class="tags">${item.tags.map(tag=>`<span class="tag">${escapeHtml(localize(tag))}</span>`).join("")}</div></div>` : ""}
            </div>
          </aside>
        </div>
      </header>

      ${item.content?.[locale] || item.content?.en || item.content?.zh || item.content?.ja ? `<section class="detail-section"><h2>${escapeHtml(ui("overview"))}</h2><div class="prose">${renderMarkdown(item.content[locale] || item.content.en || item.content.zh || item.content.ja)}</div></section>` : ""}
      ${allVideos.length ? `<section class="detail-section"><h2>${escapeHtml(ui("videos"))}</h2><div class="video-grid">${allVideos.map(renderVideoCard).join("")}</div></section>` : ""}
      ${(item.gallery || []).length ? `<section class="detail-section"><h2>${escapeHtml(ui("gallery"))}</h2><div class="gallery-grid">${item.gallery.map(image => `<button class="gallery-button" type="button" data-lightbox-src="${attr(image.path)}" data-lightbox-caption="${attr(image.name)}"><img src="${attr(image.path)}" alt="${attr(image.name)}" loading="lazy"></button>`).join("")}</div></section>` : ""}
      ${allLinks.length ? `<section class="detail-section"><h2>${escapeHtml(ui("links"))}</h2><div class="link-grid">${allLinks.map(link => `<a class="external-link-card" href="${attr(link.url)}" target="_blank" rel="noopener noreferrer"><span><strong>${escapeHtml(localize(link.label) || link.url)}</strong><br><small>${escapeHtml(localize(link.note))}</small></span><span>↗</span></a>`).join("")}</div></section>` : ""}
      ${(item.code || []).length ? `<section class="detail-section"><h2>${escapeHtml(ui("code"))}</h2><div class="code-list">${item.code.map(file => `<details class="code-block"><summary>${escapeHtml(file.name)}</summary><pre><code>${escapeHtml(file.content)}</code></pre></details>`).join("")}</div></section>` : ""}
    </article>
  `;
}

function renderAbout() {
  document.title = `${ui("about")} | ${data.site.name}`;
  const socials = Object.entries(data.site.social || {}).filter(([,value]) => value);
  app.innerHTML = `
    <header class="page-header">
      ${breadcrumbs([{label:ui("backHome"),href:"#/"},{label:ui("about")}])}
      <p class="section-label">${escapeHtml(ui("aboutLabel"))}</p>
      <h1>${escapeHtml(localize(data.site.aboutTitle))}</h1>
      <p class="page-header-description">${escapeHtml(localize(data.site.aboutDescription))}</p>
    </header>
    <section class="detail-section">
      <div class="prose">${renderMarkdown(localize(data.site.aboutBody))}</div>
    </section>
    ${socials.length ? `<section class="detail-section"><h2>${escapeHtml(ui("links"))}</h2><div class="link-grid">${socials.map(([label,url])=>`<a class="external-link-card" href="${attr(url)}" target="_blank" rel="noopener noreferrer"><strong>${escapeHtml(label)}</strong><span>↗</span></a>`).join("")}</div></section>` : ""}
  `;
}

function renderNotFound() {
  document.title = `${ui("notFound")} | ${data?.site?.name || "Portfolio"}`;
  app.innerHTML = `<section class="error-state"><span class="loading-devil">😈</span><h1>${escapeHtml(ui("notFound"))}</h1><p>${escapeHtml(ui("notFoundBody"))}</p><a class="button button-primary" href="#/">${escapeHtml(ui("backHome"))}</a></section>`;
}

function updateActiveNav(path) {
  document.querySelectorAll(".nav-link").forEach(link => link.classList.remove("active"));
  const sectionSlug = path[1] === "section" || path[1] === "category" || path[1] === "item" ? path[2] : null;
  if (sectionSlug) document.querySelector(`[data-section="${CSS.escape(sectionSlug)}"]`)?.classList.add("active");
}

function route() {
  const path = (location.hash || "#/").replace(/^#/, "").split("/").filter(Boolean).map(decodeURIComponent);
  window.scrollTo({top:0, behavior:"instant"});
  navPanel.classList.remove("open"); menuButton.setAttribute("aria-expanded", "false");
  if (!path.length) renderHome();
  else if (path[0] === "section") renderSection(getSection(path[1]));
  else if (path[0] === "category") { const section = getSection(path[1]); renderCategory(section, getCategory(section, path[2])); }
  else if (path[0] === "item") { const section = getSection(path[1]); const category = getCategory(section, path[2]); renderItem(section, category, getItem(category, path[3])); }
  else if (path[0] === "about") renderAbout();
  else renderNotFound();
  updateActiveNav(["", ...path]);
  app.focus({preventScroll:true});
}

async function init() {
  try {
    const response = await fetch(`generated/content-index.json?v=${Date.now()}`);
    if (!response.ok) throw new Error(`Content index failed: ${response.status}`);
    data = await response.json();
    if (!data.site.supportedLanguages?.includes(locale)) locale = data.site.defaultLanguage || "en";
    languageSelect.value = locale;
    document.documentElement.lang = locale === "zh" ? "zh-CN" : locale === "ja" ? "ja" : "en";
    renderNav(); route();
  } catch (error) {
    console.error(error);
    app.innerHTML = `<section class="error-state"><span class="loading-devil">😈</span><h1>Build data missing</h1><p>Run <code>node scripts/build.mjs</code>, or let GitHub Actions build the site.</p></section>`;
  }
}

languageSelect.addEventListener("change", event => {
  locale = event.target.value;
  localStorage.setItem("portfolio-language", locale);
  document.documentElement.lang = locale === "zh" ? "zh-CN" : locale === "ja" ? "ja" : "en";
  renderNav(); route();
});
menuButton.addEventListener("click", () => {
  const open = navPanel.classList.toggle("open");
  menuButton.setAttribute("aria-expanded", String(open));
});
window.addEventListener("hashchange", route);
document.addEventListener("click", event => {
  const scrollButton = event.target.closest("[data-scroll-to]");
  if (scrollButton) {
    const target = document.getElementById(scrollButton.dataset.scrollTo);
    if (target) target.scrollIntoView({behavior: "smooth", block: "start"});
    return;
  }

  const button = event.target.closest("[data-lightbox-src]");
  if (!button) return;
  lightboxImage.src = button.dataset.lightboxSrc;
  lightboxImage.alt = button.dataset.lightboxCaption || "Artwork";
  lightboxCaption.textContent = button.dataset.lightboxCaption || "";
  lightbox.showModal();
});
lightboxClose.addEventListener("click", () => lightbox.close());
lightbox.addEventListener("click", event => { if (event.target === lightbox) lightbox.close(); });
init();
