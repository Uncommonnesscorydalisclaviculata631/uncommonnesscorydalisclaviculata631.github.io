# Reid Portfolio — 自动内容驱动版 😈

这是一个无需修改网页结构代码的 GitHub Pages 作品集。

每次向 `main` 分支提交内容后，GitHub Actions 会自动：

1. 扫描 `content/sections/` 中的栏目、子分类和项目；
2. 识别每个文件夹内的 `cover.*`；
3. 读取三语 Markdown、图片、代码、本地视频、外部视频链接和其他链接；
4. 生成 `_site/generated/content-index.json`；
5. 发布到 GitHub Pages。

## 第一次部署

1. 把本压缩包中的所有文件上传到 `reidch.github.io` 仓库根目录，替换旧的 `index.html`。
2. 打开仓库 `Settings → Pages`。
3. 将 `Source` 改为 **GitHub Actions**。
4. 打开仓库顶部的 `Actions`，等待 `Build and deploy portfolio` 变成绿色。
5. 访问 `https://reidch.github.io/`。

## 内容结构

```text
content/
├── site.json                         # 姓名、首页、About、GitHub 等
└── sections/
    ├── computer-graphics/
    │   ├── section.json
    │   ├── cover.svg                 # 栏目封面
    │   ├── unity/
    │   │   ├── category.json
    │   │   ├── cover.svg             # 子分类封面
    │   │   └── your-project/
    │   │       ├── meta.json
    │   │       ├── cover.jpg         # 项目封面：自动识别
    │   │       ├── content.en.md
    │   │       ├── content.ja.md
    │   │       ├── content.zh.md
    │   │       ├── videos.json       # YouTube/Vimeo/Bilibili/直链
    │   │       ├── links.json        # 报告、论文、项目页等
    │   │       ├── gallery/          # 自动读取所有图片
    │   │       ├── videos/           # 自动读取本地 MP4/WebM
    │   │       └── code/             # 自动读取代码文件
    │   ├── unreal-engine/
    │   └── custom-engine/
    ├── games/
    ├── artificial-intelligence/
    ├── digital-arts/
    └── blog/
```

## 新建一个项目、作品或文章

最简单的方法：

1. 下载或复制 `content/_templates/item/`。
2. 把它放到目标分类下，例如：

```text
content/sections/digital-arts/concept-art/my-new-artwork/
```

3. 编辑 `meta.json`。
4. 编辑三个 `content.*.md` 文件。
5. 添加一个命名为 `cover.jpg`、`cover.png`、`cover.webp`、`cover.avif` 或 `cover.svg` 的封面。
6. 把其他图片放入 `gallery/`。
7. Commit。网页自动更新。

## 封面规则

每个栏目、子分类、具体内容文件夹都可以拥有自己的封面。构建程序会自动寻找：

```text
cover.jpg
cover.jpeg
cover.png
cover.webp
cover.avif
cover.gif
cover.svg
```

一个文件夹只保留一个 `cover.*` 最稳妥。

## 图片顺序

`gallery/` 内图片按文件名自然排序：

```text
01-overview.webp
02-closeup.webp
03-process.webp
```

上传新图片后无需修改 HTML 或 JavaScript。

## 外部视频

编辑具体内容文件夹内的 `videos.json`：

```json
[
  {
    "title": {
      "en": "Gameplay Demo",
      "ja": "ゲームプレイデモ",
      "zh": "游戏演示"
    },
    "url": "https://www.youtube.com/watch?v=VIDEO_ID"
  }
]
```

支持自动嵌入：

- YouTube
- Vimeo
- Bilibili 的 BV 视频链接
- `.mp4` / `.webm` / `.ogg` 直链

每个嵌入视频下面都会保留 **原始来源链接**，方便访客溯源。无法嵌入的平台会显示一个打开原始链接的按钮。

## 本地视频

把 `.mp4`、`.webm` 或 `.ogg` 文件放入具体项目的 `videos/`。它们会自动成为网页播放器。

大视频更推荐上传 YouTube、Vimeo 或 Bilibili，再将链接写入 `videos.json`，避免仓库过大。

## GitHub 和其他链接

项目 GitHub 地址写在 `meta.json` 的 `github` 字段。

其他链接写在 `links.json`：

```json
[
  {
    "label": {"en":"Paper","ja":"論文","zh":"论文"},
    "url": "https://example.com/paper",
    "note": {"en":"PDF source","ja":"PDF出典","zh":"PDF 来源"}
  }
]
```

## 三语规则

界面支持 EN / 日本語 / 中文切换。

每项内容使用：

```text
content.en.md
content.ja.md
content.zh.md
```

`meta.json` 中的标题与简介也分别填写：

```json
"title": {
  "en": "Title",
  "ja": "タイトル",
  "zh": "标题"
}
```

缺少当前语言时，网站会自动回退到其他已有语言，不会导致页面报错。

## 草稿

暂时不想公开某项内容，把 `meta.json` 改成：

```json
"status": "draft"
```

构建仍会成功，但网页不会展示该内容。

## 本地预览

需要安装 Node.js，然后在仓库根目录执行：

```bash
npm run build
npm run preview
```

浏览器打开：

```text
http://localhost:8000
```

## 重要说明

GitHub Pages 是静态托管，浏览器本身无法直接列出远程文件夹中的文件。这个项目通过 GitHub Actions 在每次提交时扫描文件夹并生成索引，因此既实现了“只上传内容文件即可更新”，又避免了前端调用 GitHub API 的请求限制。
