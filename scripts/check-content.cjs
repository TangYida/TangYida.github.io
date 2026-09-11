const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'..'),dir=path.join(root,'passages');
const list=JSON.parse(fs.readFileSync(path.join(root,'list.json'))),migration=JSON.parse(fs.readFileSync(path.join(root,'scripts/migration.json')));
const titles=new Set(),categories=new Set(['风','夜晚','夏天','时间']);let md=0,html=0;
for(const item of list){
 assert.deepEqual(Object.keys(item).sort(),['category','date','title']);assert(!titles.has(item.title),'Duplicate title: '+item.title);titles.add(item.title);
 assert(categories.has(item.category));assert(/^\d{4}-\d{2}-\d{2}$/.test(item.date));assert.equal(new Date(item.date).toISOString().slice(0,10),item.date);
 const hasMd=fs.existsSync(path.join(dir,item.title+'.md')),hasHtml=fs.existsSync(path.join(dir,item.title+'.html'));
 assert(hasMd||hasHtml,'Missing source: '+item.title);assert(!(hasMd&&hasHtml),'Duplicate formats: '+item.title);hasMd?md++:html++;
}
const repaired=new Set([...migration.repairedLocalPaths,'js/Main.js','关于C32（上帝和规则的对话）的废话.html','上帝和规则之间的对话.html','C25count.html','C4ContestSummary2.html']);
let exactCopies=0;
for(const [file,record] of Object.entries(migration.files)){
 if(migration.removedHtmlDuplicates.includes(file)){assert(!fs.existsSync(path.join(dir,file)));continue;}
 const p=path.join(dir,file);assert(fs.existsSync(p),'Missing imported file: '+file);
 if(!repaired.has(file)){assert.equal(crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex'),record.sha256,'Changed imported content: '+file);exactCopies++;}
}
const legacy=JSON.parse(fs.readFileSync(path.join(root,'scripts/legacy-index.json')));
for(const a of legacy)if(a.title!=='map')assert(titles.has(a.title),'Lost legacy entry: '+a.title);
assert(!fs.existsSync(path.join(root,'NES.css-develop')));assert(!fs.existsSync(path.join(root,'archieve')));
console.log(`PASS: ${list.length} unique articles (${md} Markdown, ${html} HTML); ${exactCopies} unchanged imported files; legacy entries retained; duplicate HTML removed.`);
const bundleText=fs.readFileSync(path.join(root,'scripts/content.js'),'utf8');
const bundle=JSON.parse(bundleText.replace(/^window\.BLOG_CONTENT = /,'').replace(/;\s*$/,''));
assert.deepEqual(bundle.articles,list,'Content bundle index is stale; run node build.js');
for(const item of list){const source=bundle.sources[item.title];assert(source,'Missing bundled article');assert.equal(source.text,fs.readFileSync(path.join(dir,item.title+'.'+source.mode),'utf8'),'Stale bundled article: '+item.title);}
console.log('PASS: all bundled articles match the current index and source files.');
