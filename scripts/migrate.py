"""One-time import. The complete source site must be backed up before running."""
from pathlib import Path
import shutil, json, hashlib

ROOT = Path(__file__).resolve().parent.parent
SOURCE = ROOT.parent / 'imfess'
DEST = ROOT / 'passages'
MANIFEST = ROOT / 'scripts' / 'migration.json'
if MANIFEST.exists():
    raise SystemExit('Migration already recorded; use node build.js to refresh the index.')
DEST.mkdir(exist_ok=True)
media = {'.png','.jpg','.jpeg','.gif','.webp','.svg','.avif','.ico','.mp3','.m4a','.wav','.ogg','.flac','.mp4','.webm','.ttf','.woff','.woff2'}
records, collisions = {}, []
def copy(p, base):
    rel = p.relative_to(base)
    target = DEST / rel
    if target.exists() and target.read_bytes() != p.read_bytes():
        collisions.append({'path':str(rel),'kept':str(target),'incoming':str(p)})
        raise RuntimeError('Conflicting asset: '+str(rel))
    target.parent.mkdir(parents=True, exist_ok=True)
    st = p.stat()
    shutil.copy2(p,target)
    records[str(rel)] = {'source':str(p),'birthtime':getattr(st,'st_birthtime',st.st_mtime),'mtime':st.st_mtime,'sha256':hashlib.sha256(p.read_bytes()).hexdigest()}

for base in (ROOT,SOURCE):
    for p in sorted(base.rglob('*')):
        rel=p.relative_to(base)
        if any(part.startswith('.') for part in rel.parts) or rel.parts[0] in {'passages','vendor','scripts','styles'}: continue
        if not p.is_file(): continue
        if p.suffix.lower() in media or (base==SOURCE and p.suffix.lower()=='.md'):
            copy(p,base)
        elif base==ROOT and len(rel.parts)==1 and p.suffix.lower()=='.html' and p.stem not in {'index','old','la','map'}:
            copy(p,base)
        elif base==ROOT and (rel.parts[0]=='docs' or str(rel) in {'js/Main.js','main.css','C27Last.md','fourteen.md'}):
            copy(p,base)

rewritten=[]
for p in DEST.rglob('*.md'):
    raw=p.read_text()
    fixed=raw.replace('file:///Users/tomtom/Documents/imfess/','./')
    if fixed!=raw:
        p.write_text(fixed)
        rewritten.append(str(p.relative_to(DEST)))
duplicates=[]
for p in DEST.glob('*.html'):
    if p.with_suffix('.md').exists():
        duplicates.append(p.name)
        p.unlink()
MANIFEST.write_text(json.dumps({'files':records,'removedHtmlDuplicates':duplicates,'repairedLocalPaths':rewritten,'collisions':collisions},ensure_ascii=False,indent=2)+'\n')
print(f'Copied {len(records)} files; removed {len(duplicates)} duplicate HTML files; repaired local paths in {len(rewritten)} Markdown files.')
