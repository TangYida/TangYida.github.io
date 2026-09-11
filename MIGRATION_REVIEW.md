# 迁移复核清单

## 没有列入文章的 HTML

| 文件 | 原因 |
| --- | --- |
| docs/trade.cpp.html | C++ 源码的 Vim HTML 导出，是算法文章引用的附件，不单独作为文章 |
| archives.html | 旧版目录框架，没有文章正文 |
| birthday.html | 生日动画入口，主要内容由脚本生成 |
| cal_diary.html | 只有占位文字 yeah |
| sweetwishes.html | 生日祝福导语与音乐启动页，正文在 sweetwishes2 |

以上文件保留在 passages，可人工决定是否收录。

## 按要求不导入的页面

index.html（新首页）、old.html、la.html、map.html。旧索引中的 map 因这一排除规则未收录。旧版文件保存在站点外备份。

## 其他未收录文件

- README.md：源仓库说明。
- note.md：班会工作议程和 TODO 清单。
- 一毛钱的日记：十二月.md：空白 Markdown 文件。
- 班委自我介绍.md：没有可识别的正文。

## 元数据规则

- list.json 只包含 title、category、date；title 是准确的文件名。页面优先使用正文标题展示。
- 原索引日期优先；缺省时从正文起止位置识别日期，再使用原文件创建日期。创建日期不代表写作日期。
- 旧分类 Bullshit / Mystery / Project 不属于四种新分类，根据标题和正文关键词重新推断。
- 自动分类是初步整理，可直接修改 list.json；再次运行 node build.js 会保留已有日期与分类。
- 完整逐篇依据：scripts/index-audit.json；复制与去重记录：scripts/migration.json。
- 神秘入口（快戳我）原本就在 build.js 中，按保留旧索引文章的规则收录，实际为生日互动入口，可复核后移除。

## 同名 Markdown 优先

删除 passages 中 63 个同名 HTML 副本（旧原件已备份）。

## 素材修复

- 相册和教育文章的 file:/// 本机路径改为站内相对路径。
- 一切都从这里开始、月光无言：从旧 HTML 的内嵌图片恢复本地原图，替换已经失效的外链。
- 十二月日记中用图片语法引用的 glass.mp4，在阅读器中按视频呈现。
- 移除两篇 HTML 引用的失效本机编辑器样式；补全两个外部链接的协议；生日互动结束后跳转到新阅读器。

## 旧索引缺失项

- map（posts.js）
