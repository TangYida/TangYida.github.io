const fs = require('node:fs'), path = require('node:path');
const root=path.resolve(__dirname,'..'), dir=path.join(root,'passages');
const read=p=>JSON.parse(fs.readFileSync(path.join(root,p),'utf8'));
const legacy=read('scripts/legacy-index.json'), migration=read('scripts/migration.json');
const previous=fs.existsSync(path.join(root,'list.json'))?read('list.json'):[];
const categories=['风','夜晚','夏天','时间'];
const sources=new Map(legacy.map(x=>[x.title,x])), saved=new Map(previous.map(x=>[x.title,x]));
const excluded=new Map([
 ['archives','旧版目录框架，没有文章正文'],['birthday','生日动画入口，主要内容由脚本生成'],
 ['cal_diary','只有占位文字 yeah'],['sweetwishes','生日祝福导语与音乐启动页，正文在 sweetwishes2'],
 ['README','源仓库说明'],['note','班会工作议程和 TODO 清单'],['一毛钱的日记：十二月','空白 Markdown 文件']
]);
function plain(s){return s.replace(/<(script|style)\b[\s\S]*?<\/\1>/gi,'').replace(/<[^>]+>/g,' ').replace(/&(?:nbsp|#160);/g,' ').trim();}
function dateValue(s){
 const m=String(s||'').match(/\b(20\d{2})[.\-/年](\d{1,2})[.\-/月](\d{1,2})/);if(!m)return null;
 const v=`${m[1]}-${m[2].padStart(2,'0')}-${m[3].padStart(2,'0')}`,d=new Date(v);
 return !isNaN(d)&&d.toISOString().slice(0,10)===v?v:null;
}
function guessCategory(title,text){
 const terms={'风':['风','海','远方','旅行','行车','火车','路上','漂泊','流浪'],'夜晚':['夜','月光','月亮','梦','孤独','黑暗','失眠','星星','爱','情诗'],'夏天':['夏','青春','校园','毕业','蝉','盛夏','少年','生日','春天','春日'],'时间':['日记','时间','历史','回忆','过去','哲学','算法','题解','总结','教育']};
 const scores=categories.map(c=>[c,terms[c].reduce((n,t)=>n+(title.includes(t)?15:0)+(text.split(t).length-1),0)]).sort((a,b)=>b[1]-a[1]);
 return scores[0][1]?scores[0][0]:'时间';
}
const audit=[],omissions=[],list=[];
if(fs.existsSync(path.join(dir,'docs/trade.cpp.html')))omissions.push({file:'docs/trade.cpp.html',reason:'C++ 源码的 Vim HTML 导出，是算法文章引用的附件，不单独作为文章'});
const names=[...new Set(fs.readdirSync(dir).filter(x=>/\.(md|html)$/.test(x)).map(x=>x.replace(/\.(md|html)$/,'')))];
for(const title of names){
 const ext=fs.existsSync(path.join(dir,title+'.md'))?'.md':'.html',file=title+ext,full=path.join(dir,file),raw=fs.readFileSync(full,'utf8'),text=plain(raw);
 const old=sources.get(title),prev=saved.get(title),reason=excluded.get(title)||(!text?'没有可识别的正文':null);
 if(reason&&!old&&!prev){omissions.push({file,reason});continue;}
 let date=dateValue(prev?.date)||dateValue(old?.date),dateSource=prev?.date?'list.json（保留现有值）':'旧索引';
 if(!date){
  const front=raw.match(/^---\s*\n[\s\S]*?\bdate:\s*([^\n]+)[\s\S]*?\n---/);
  const boundary=ext==='.md'?raw.slice(0,350)+'\n'+raw.slice(-250):text.slice(0,350)+'\n'+text.slice(-250);
  date=dateValue(front?.[1])||dateValue(boundary);dateSource='正文开头或结尾的日期（自动推断，请复核）';
 }
 if(!date){const stamp=migration.files[file]?.birthtime||fs.statSync(full).birthtimeMs/1000;date=new Date(stamp*1000).toLocaleDateString('sv-SE',{timeZone:'Asia/Shanghai'});dateSource='原始文件创建日期（不一定是写作日期）';}
 const category=categories.includes(prev?.category)?prev.category:categories.includes(old?.category)?old.category:guessCategory(title,text);
 list.push({title,category,date});
 audit.push({file,date,dateSource,category,categorySource:categories.includes(prev?.category)||categories.includes(old?.category)?'现有分类':'标题和正文关键词自动推断',legacyCategory:old?.category||'',indexedBy:old?.source||'目录自动识别'});
}
list.sort((a,b)=>b.date.localeCompare(a.date)||a.title.localeCompare(b.title,'zh-Hans'));
fs.writeFileSync(path.join(root,'list.json'),JSON.stringify(list,null,2)+'\n');
const auditPath=path.join(root,'scripts/index-audit.json'),oldAudit=fs.existsSync(auditPath)?JSON.parse(fs.readFileSync(auditPath,'utf8')):[];
for(const item of audit){const prior=oldAudit.find(x=>x.file===item.file);if(prior&&prior.date===item.date)item.dateSource=prior.dateSource;if(prior&&prior.category===item.category)item.categorySource=prior.categorySource;}
fs.writeFileSync(auditPath,JSON.stringify(audit,null,2)+'\n');
const missing=legacy.filter(x=>!names.includes(x.title));
let review='# 迁移复核清单\n\n## 没有列入文章的 HTML\n\n| 文件 | 原因 |\n| --- | --- |\n';
for(const o of omissions.filter(x=>x.file.endsWith('.html')))review+=`| ${o.file} | ${o.reason} |\n`;
review+='\n以上文件保留在 passages，可人工决定是否收录。\n\n## 按要求不导入的页面\n\nindex.html（新首页）、old.html、la.html、map.html。旧索引中的 map 因这一排除规则未收录。旧版文件保存在站点外备份。\n\n## 其他未收录文件\n\n';
for(const o of omissions.filter(x=>!x.file.endsWith('.html')))review+=`- ${o.file}：${o.reason}。\n`;
review+='\n## 元数据规则\n\n- list.json 只包含 title、category、date；title 是准确的文件名。页面优先使用正文标题展示。\n- 原索引日期优先；缺省时从正文起止位置识别日期，再使用原文件创建日期。创建日期不代表写作日期。\n- 旧分类 Bullshit / Mystery / Project 不属于四种新分类，根据标题和正文关键词重新推断。\n- 自动分类是初步整理，可直接修改 list.json；再次运行 node build.js 会保留已有日期与分类。\n- 完整逐篇依据：scripts/index-audit.json；复制与去重记录：scripts/migration.json。\n- 神秘入口（快戳我）原本就在 build.js 中，按保留旧索引文章的规则收录，实际为生日互动入口，可复核后移除。\n\n## 同名 Markdown 优先\n\n';
review+=`删除 passages 中 ${migration.removedHtmlDuplicates.length} 个同名 HTML 副本（旧原件已备份）。\n\n## 素材修复\n\n- 相册和教育文章的 file:/// 本机路径改为站内相对路径。\n- 一切都从这里开始、月光无言：从旧 HTML 的内嵌图片恢复本地原图，替换已经失效的外链。\n- 十二月日记中用图片语法引用的 glass.mp4，在阅读器中按视频呈现。\n- 移除两篇 HTML 引用的失效本机编辑器样式；补全两个外部链接的协议；生日互动结束后跳转到新阅读器。\n\n## 旧索引缺失项\n\n`+missing.map(x=>`- ${x.title}（${x.source}）`).join('\n')+'\n';
fs.writeFileSync(path.join(root,'MIGRATION_REVIEW.md'),review);
console.log(`Indexed ${list.length} articles; ${omissions.length} files excluded. See MIGRATION_REVIEW.md.`);
// Static content bundle: no per-article fetch, missing-MD probes, or file:// CORS.
const bundledSources=Object.fromEntries(list.map(article=>{
 const mode=fs.existsSync(path.join(dir,article.title+'.md'))?'md':'html';
 return [article.title,{mode,text:fs.readFileSync(path.join(dir,article.title+'.'+mode),'utf8')}];
}));
fs.writeFileSync(path.join(root,'scripts/content.js'),'window.BLOG_CONTENT = '+JSON.stringify({articles:list,sources:bundledSources}).replace(/\u2028/g,'\\u2028').replace(/\u2029/g,'\\u2029')+';\n');
