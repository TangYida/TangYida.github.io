const fs = require('node:fs');
const path = require('node:path');
const readline = require('node:readline');

const root = path.resolve(__dirname, '..');
const passagesDir = path.join(root, 'passages');
const listPath = path.join(root, 'list.json');
const contentPath = path.join(root, 'scripts/content.js');
const categories = ['风', '夜晚', '夏天', '时间'];

function readList() {
  const list = JSON.parse(fs.readFileSync(listPath, 'utf8'));
  if (!Array.isArray(list)) throw new Error('list.json 的顶层必须是数组');
  return list;
}

function passageFiles() {
  const byTitle = new Map();
  for (const file of fs.readdirSync(passagesDir)) {
    const match = file.match(/^(.*)\.(md|html)$/);
    if (!match) continue;
    const [, title, extension] = match;
    const current = byTitle.get(title);
    // 同名文件同时存在时沿用原有规则：Markdown 优先。
    if (!current || extension === 'md') byTitle.set(title, { title, file, mode: extension });
  }
  return byTitle;
}

function plain(text) {
  return text
    .replace(/<(script|style)\b[\s\S]*?<\/\1>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&(?:nbsp|#160);/g, ' ')
    .trim();
}

function dateValue(value) {
  const match = String(value || '').match(/\b(20\d{2})[.\-/年](\d{1,2})[.\-/月](\d{1,2})/);
  if (!match) return null;
  const valueString = `${match[1]}-${match[2].padStart(2, '0')}-${match[3].padStart(2, '0')}`;
  const date = new Date(valueString);
  return !Number.isNaN(date.valueOf()) && date.toISOString().slice(0, 10) === valueString
    ? valueString
    : null;
}

function guessCategory(title, text) {
  const terms = {
    风: ['风', '海', '远方', '旅行', '行车', '火车', '路上', '漂泊', '流浪'],
    夜晚: ['夜', '月光', '月亮', '梦', '孤独', '黑暗', '失眠', '星星', '爱', '情诗'],
    夏天: ['夏', '青春', '校园', '毕业', '蝉', '盛夏', '少年', '生日', '春天', '春日'],
    时间: ['日记', '时间', '历史', '回忆', '过去', '哲学', '算法', '题解', '总结', '教育']
  };
  const scores = categories
    .map(category => [category, terms[category].reduce(
      (score, term) => score + (title.includes(term) ? 15 : 0) + text.split(term).length - 1,
      0
    )])
    .sort((a, b) => b[1] - a[1]);
  return scores[0][1] ? scores[0][0] : '时间';
}

function metadataFor(source) {
  const fullPath = path.join(passagesDir, source.file);
  const raw = fs.readFileSync(fullPath, 'utf8');
  const text = plain(raw);
  const frontMatter = raw.match(/^---\s*\n[\s\S]*?\bdate:\s*([^\n]+)[\s\S]*?\n---/);
  const boundary = source.mode === 'md'
    ? `${raw.slice(0, 350)}\n${raw.slice(-250)}`
    : `${text.slice(0, 350)}\n${text.slice(-250)}`;
  const stats = fs.statSync(fullPath);
  const fileTime = stats.birthtimeMs > 0 ? stats.birthtimeMs : stats.mtimeMs;
  const date = dateValue(frontMatter?.[1])
    || dateValue(boundary)
    || new Date(fileTime).toLocaleDateString('sv-SE', { timeZone: 'Asia/Shanghai' });
  return { title: source.title, category: guessCategory(source.title, text), date };
}

function parseSelection(answer, count) {
  const value = answer.trim();
  if (!value || value === '0') return [];
  const numbers = value.split(/[\s,，、]+/).map(Number);
  if (numbers.some(number => !Number.isInteger(number) || number < 1 || number > count)) {
    return null;
  }
  return [...new Set(numbers)];
}

async function chooseUnsynced(candidates) {
  if (!candidates.length) return [];

  console.log(`有 ${candidates.length} 篇文章没有同步到网站：`);
  candidates.forEach((source, index) => console.log(`${index + 1}. ${source.file}`));
  const prompt = '输入对应序号选择你要同步更新的文章（可多选，用空格分隔），输入 0 则不同步：';

  if (!process.stdin.isTTY) {
    console.log(prompt);
    const answer = fs.readFileSync(0, 'utf8').trim();
    const selection = parseSelection(answer || '0', candidates.length);
    if (selection === null) throw new Error('输入的序号无效，未同步任何文章');
    return selection.map(number => candidates[number - 1]);
  }

  const input = readline.createInterface({ input: process.stdin, output: process.stdout });
  try {
    while (true) {
      const answer = await new Promise(resolve => input.question(prompt, resolve));
      const selection = parseSelection(answer, candidates.length);
      if (selection !== null) return selection.map(number => candidates[number - 1]);
      console.log(`请输入 1-${candidates.length} 之间的序号，多个序号可用空格分隔；或输入 0。`);
    }
  } finally {
    input.close();
  }
}

function warnAboutMissingSources(list, sources) {
  const missing = list.filter(article => !sources.has(article.title));
  if (!missing.length) return;
  console.warn(`警告：list.json 中有 ${missing.length} 个条目没有对应的 HTML 或 Markdown 文件：`);
  missing.forEach((article, index) => console.warn(`${index + 1}. ${article.title}`));
}

function writeContent(list, sources) {
  const bundledSources = {};
  for (const article of list) {
    const source = sources.get(article.title);
    if (!source) continue;
    bundledSources[article.title] = {
      mode: source.mode,
      text: fs.readFileSync(path.join(passagesDir, source.file), 'utf8')
    };
  }
  const bundle = JSON.stringify({ articles: list, sources: bundledSources })
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029');
  fs.writeFileSync(contentPath, `window.BLOG_CONTENT = ${bundle};\n`);
}

async function main() {
  const list = readList();
  const sources = passageFiles();
  const listedTitles = new Set(list.map(article => article.title));

  warnAboutMissingSources(list, sources);

  const unsynced = [...sources.values()]
    .filter(source => !listedTitles.has(source.title))
    .sort((a, b) => a.title.localeCompare(b.title, 'zh-Hans'));
  const selected = await chooseUnsynced(unsynced);

  if (selected.length) {
    const additions = selected.map(metadataFor);
    list.push(...additions);
    list.sort((a, b) => String(b.date).localeCompare(String(a.date)) || a.title.localeCompare(b.title, 'zh-Hans'));
    fs.writeFileSync(listPath, `${JSON.stringify(list, null, 2)}\n`);
    console.log(`已将 ${selected.length} 篇文章加入 list.json：${selected.map(item => item.title).join('、')}`);
  } else if (unsynced.length) {
    console.log('未同步新的文章，list.json 保持不变。');
  }

  writeContent(list, sources);
  const availableCount = list.filter(article => sources.has(article.title)).length;
  console.log(`已根据 list.json 建立 ${list.length} 条索引，打包 ${availableCount} 篇文章。`);
}

main().catch(error => {
  console.error(`构建失败：${error.message}`);
  process.exitCode = 1;
});
