# Yida's Simple Blog

黑白灰的静态博客。文章文件在 `passages/`，索引在 `list.json`。

## 本地预览

```sh
python3 -m http.server 4173 --bind 127.0.0.1
```

打开 http://127.0.0.1:4173 。也可直接打开 `index.html`；索引和正文使用构建时生成的本地脚本，不再依赖逐篇 fetch。

## 文章与索引

每个索引项只含 `title`、`category`、`date`。`title` 必须与文件名完全相同，不含扩展名。分类限于「风、夜晚、夏天、时间」，日期格式为 `YYYY-MM-DD`。

```json
{ "title": "风和海", "category": "风", "date": "2022-12-26" }
```

运行 `node build.js` 合并旧索引和目录中的文章，更新 `list.json`、`MIGRATION_REVIEW.md` 和 `scripts/index-audit.json`。旧索引保存在 `scripts/legacy-index.json`；原始 `posts.js` 也保留供对照。构建无需联网或安装依赖。已有条目的日期和分类会保留，适合直接人工校正 `list.json`。排除规则在 `scripts/build-index.cjs`。

构建时优先寻找同名 `.md`，没有时使用 `.html`，将索引与正文写入 `scripts/content.js`。编辑文章或 list.json 后需运行 `node build.js`。Markdown 在浏览器中安全解析，图片、视频和字体加载后按视口重新分页。窗口尺寸改变时保留相对阅读进度。HTML 在独立框架中呈现原版排版。新增同名 Markdown 后可以删除旧 HTML；初次迁移已自动去重。

## 阅读操作

- 点击页面左半边／右半边，或左右滑动：上一页／下一页。首尾页停住。
- 上下滑动：上一篇／下一篇文章。
- HTML 正常滚动；已经到顶部／底部后，再做一次向外的滚动或滑动才切换文章，防止惯性滚动误跳。
- 左上角圆圈：点击打开／关闭时间轴，悬浮显示操作提示。填充比例显示当前文章的阅读进度（Markdown 随翻页，HTML 随滚动）。导航只显示时间轴和上方的「关于：主题」，点击时间轴刻度阅读。
- 方向键可作为补充操作。文章 URL 使用 `/#文章文件名`，浏览器前进后退可恢复文章。

GitHub Pages 使用根目录 `404.html` 将旧的文章 `.html` 链接导向新阅读器。没有收录的旧页面显示返回首页入口。

## 迁移与复核

`MIGRATION_REVIEW.md` 是未收录 HTML 和其他例外的复核清单；`scripts/index-audit.json` 逐篇记录日期、分类的来源。自动推断的分类、正文日期与文件创建日期需要人工复核，尤其创建日期并不等于写作日期。

完整旧站和移出站点的旧目录保存在站点外备份，具体路径见 `scripts/cleanup.json`。`imfess` 源目录未修改。`scripts/migrate.py` 是一次性导入记录，不应重复运行。

运行 `node scripts/check-content.cjs` 检查内容完整性。浏览器检查记录在 `VALIDATION.md`。

浏览器依赖已固定并本地保存：Marked 15.0.12、DOMPurify 3.4.15，许可证在 `vendor/`。中文衬线字体优先使用系统宋体；另附按现有文章与 GB2312 常用字集制作的 Noto Serif SC 字体子集，供缺少中文衬线字体的设备使用，SIL OFL 许可证在 `vendor/fonts/`。文章无需外部 CDN 即可渲染；原版 HTML 自带的外部服务和链接可能仍需联网。

## 发布

保留原仓库的 `.github/workflows/static.yml` 发布流程。提交并推送到 `master` 后由 GitHub Pages 发布。此次重组本身不会自动提交或推送。
