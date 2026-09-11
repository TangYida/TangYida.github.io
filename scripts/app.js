'use strict';
(() => {
  const $=id=>document.getElementById(id);
  const book=$('book'),viewport=$('bookViewport'),reader=$('reader'),frame=$('legacyFrame'),dialog=$('navigation');
  let articles=[],current=0,page=0,pageCount=1,mode='md',loadId=0,timelineItems=[],focusIndex=0,ticks=[];
  let pageWidth=700,loading=true,lastGesture=0,wheelSum=0,wheelAxis='',wheelLast=0,wheelConsumed=false,resizeTimer;
  const titles=new Map();
  const titleFor=a=>titles.get(a.title)||a.title.replaceAll('_',' ');
  const siteBase=new URL('../',document.currentScript.src);
  const pathFor=(a,ext)=>new URL(`passages/${encodeURIComponent(a.title)}.${ext}`,siteBase).href;
  function updateProgress(){
    let progress=loading?0:(page+1)/pageCount;
    if(mode==='html'&&!loading){
      const sc=frame.contentDocument?.scrollingElement;
      const total=sc?sc.scrollHeight-sc.clientHeight:0;
      progress=total>0?sc.scrollTop/total:1;
    }
    $('navToggle').style.setProperty('--progress',String(Math.max(0,Math.min(1,progress))));
  }
  const status=()=>{
    reader.dataset.page=String(page+1);reader.dataset.pages=String(pageCount);updateProgress();
    $('previousPage').disabled=page===0||loading;
    $('nextPage').disabled=page>=pageCount-1||loading;
  };
  function measure(keepPosition=true){
    if(mode!=='md')return;
    const oldPage=page,oldCount=pageCount;
    pageWidth=Math.min(innerWidth<=760?innerWidth-64:innerWidth-250,700);
    pageWidth=Math.max(180,pageWidth);
    document.documentElement.style.setProperty('--page-width',`${pageWidth}px`);
    document.documentElement.style.setProperty('--page-height',`${Math.floor(reader.clientHeight)}px`);
    book.style.transition='none';book.style.transform='none';
    pageCount=Math.max(1,Math.ceil((book.scrollWidth+80-2)/(pageWidth+80)));
    page=keepPosition?Math.min(pageCount-1,Math.round(oldPage/Math.max(1,oldCount-1)*Math.max(0,pageCount-1))):0;
    book.style.transform=`translateX(${-page*(pageWidth+80)}px)`;
    requestAnimationFrame(()=>book.style.transition='');status();
  }
  function turn(delta){if(loading||mode!=='md'||dialog.open)return;const next=Math.max(0,Math.min(pageCount-1,page+delta));if(next===page)return;page=next;book.style.transform=`translateX(${-page*(pageWidth+80)}px)`;status();}
  function changeArticle(delta){if(loading||dialog.open)return;const next=current+delta;if(next<0||next>=articles.length)return;openArticle(next);}
  function normalizeMarkdown(html,a){
    const clean=DOMPurify.sanitize(html,{ADD_TAGS:['video','audio','source'],ADD_ATTR:['controls','playsinline']});
    const template=document.createElement('template');template.innerHTML=clean;
    // A Markdown title is displayed once, in the page heading.
    const first=template.content.firstElementChild;
    let display=titleFor(a);
    if(first?.tagName==='H1')display=first.textContent;
    titles.set(a.title,display);
    const base=new URL('passages/',siteBase);
    for(const el of template.content.querySelectorAll('[src],[href],[poster]')){
      for(const attr of ['src','href','poster']){
        const val=el.getAttribute(attr);if(!val||val.startsWith('#')||/^(data:|mailto:|https?:|\/\/)/i.test(val))continue;
        try{el.setAttribute(attr,new URL(val,base).href);}catch{}
      }
    }
    // Inline author styles must not force text beyond the page box.
    for(const el of template.content.querySelectorAll('[style]')){
      if(el.matches('img,video')){el.style.height='auto';el.style.maxWidth='100%';}
      else el.removeAttribute('style');
    }
    for(const img of template.content.querySelectorAll('img')){
      if(/\.(mp4|webm|mov)(?:[?#]|$)/i.test(img.src)){
        const video=document.createElement('video');video.src=img.src;video.setAttribute('aria-label',img.alt||'文章视频');video.playsInline=true;img.replaceWith(video);
      }
    }
    for(const video of template.content.querySelectorAll('video,audio')){video.controls=true;video.preload='metadata';}
    book.replaceChildren(template.content);
    for(const img of book.querySelectorAll('img')){img.loading='eager';img.addEventListener('error',()=>{img.alt=img.alt||'图片未能加载';img.classList.add('broken-image');});}
  }
  async function sourceFor(a){
    const source=window.BLOG_CONTENT?.sources[a.title];
    if(!source)throw Error('找不到文章');
    return source;
  }
  async function openArticle(index,{historyMode='push'}={}){
    const token=++loadId;current=index;loading=true;page=0;pageCount=1;status();
    $('loading').hidden=false;$('loading').textContent='';
    frame.onload=null;frame.hidden=true;frame.removeAttribute('srcdoc');frame.removeAttribute('src');book.replaceChildren();
    const a=articles[index];
    try{
      const source=await sourceFor(a);if(token!==loadId)return;
      mode=source.mode;document.body.classList.toggle('legacy',mode==='html');viewport.hidden=mode==='html';
      if(mode==='md'){
        normalizeMarkdown(marked.parse(source.text.replace(/^---\s*\n[\s\S]*?\n---\s*\n/,''),{breaks:false,gfm:true}),a);
        measure(false);
        await Promise.all([document.fonts.ready,...[...book.querySelectorAll('img')].map(img=>img.complete?Promise.resolve():new Promise(resolve=>{img.addEventListener('load',resolve,{once:true});img.addEventListener('error',resolve,{once:true});setTimeout(resolve,5000);})),...[...book.querySelectorAll('video')].map(video=>video.readyState>=1?Promise.resolve():new Promise(resolve=>{video.addEventListener('loadedmetadata',resolve,{once:true});video.addEventListener('error',resolve,{once:true});setTimeout(resolve,5000);}))]);
        if(token!==loadId)return;measure(false);
      }else{
        frame.hidden=false;
        await new Promise((resolve,reject)=>{
          const timeout=setTimeout(()=>reject(Error('原版文章加载超时，请重试')),12000);
          frame.onload=()=>{
            if(token!==loadId)return;
            if(!frame.contentDocument?.querySelector('base[data-reader-base]'))return;
            clearTimeout(timeout);attachLegacy();resolve();
          };
          // Keep original markup and relative assets, without a failing Markdown probe
          // or a second network fetch. srcdoc also supports direct local previews.
          const base=document.createElement('base');base.href=pathFor(a,'html');base.dataset.readerBase='';
          const raw=source.text;
          const prefix=base.outerHTML;
          frame.srcdoc=/<head\b[^>]*>/i.test(raw)?raw.replace(/<head\b[^>]*>/i,m=>m+prefix):prefix+raw;
        });
        if(token!==loadId)return;
      }
      loading=false;$('loading').hidden=true;status();
      document.title="Yida's Simple Blog";
      const hash='#'+encodeURIComponent(a.title);
      if(historyMode==='push'&&location.hash!==hash)history.pushState(null,'',hash);
      else if(historyMode==='replace')history.replaceState(null,'',hash);
    }catch(error){
      if(token!==loadId)return;loading=false;
      $('loading').replaceChildren(document.createTextNode(error.message+' '));
      const retry=document.createElement('button');retry.textContent='点击重试';retry.onclick=()=>openArticle(index,{historyMode:'replace'});$('loading').append(retry);status();
    }
  }
  function canScrollInside(target,dx,dy,doc){
    for(let el=target instanceof Element?target:target?.parentElement;el&&el!==doc.body;el=el.parentElement){
      const style=doc.defaultView.getComputedStyle(el);
      if(Math.abs(dx)>Math.abs(dy)&&/(auto|scroll)/.test(style.overflowX)&&el.scrollWidth>el.clientWidth)return true;
      if(/(auto|scroll)/.test(style.overflowY)&&el.scrollHeight>el.clientHeight&&((dy>0&&el.scrollTop+el.clientHeight<el.scrollHeight-2)||(dy<0&&el.scrollTop>2)))return true;
    }return false;
  }
  function gestureWheel(event,legacy=false){
    if(event.ctrlKey||dialog.open||loading)return;
    const now=performance.now(),factor=event.deltaMode===1?18:event.deltaMode===2?reader.clientHeight:1;
    const dx=event.deltaX*factor,dy=event.deltaY*factor,axis=Math.abs(dx)>Math.abs(dy)?'x':'y';
    const doc=legacy?frame.contentDocument:document;
    if(canScrollInside(event.target,dx,dy,doc))return;
    if(now-wheelLast>180){wheelSum=0;wheelConsumed=false;wheelAxis=axis;}wheelLast=now;
    if(legacy){
      const sc=doc.scrollingElement;
      if(axis==='x'||(dy<0&&sc.scrollTop>2)||(dy>0&&sc.scrollTop+sc.clientHeight<sc.scrollHeight-3)){wheelConsumed=true;wheelSum=0;return;}
    }
    event.preventDefault();
    if(wheelConsumed||now-lastGesture<650)return;
    if(axis!==wheelAxis){wheelSum=0;wheelAxis=axis;}
    const delta=axis==='x'?dx:dy;
    if(Math.sign(delta)!==Math.sign(wheelSum))wheelSum=0;
    wheelSum+=delta;
    if(Math.abs(wheelSum)<65)return;
    wheelConsumed=true;lastGesture=now;
    if(axis==='x')turn(Math.sign(wheelSum));else changeArticle(Math.sign(wheelSum));
  }
  let touch=null,suppressClickUntil=0;
  function bindTouch(target,legacy=false){
    target.addEventListener('touchstart',e=>{
      if(e.touches.length!==1||e.target.closest('a,button,input,textarea,video,audio,select')){touch=null;return;}
      const p=e.touches[0],sc=legacy?frame.contentDocument.scrollingElement:null;
      touch={x:p.clientX,y:p.clientY,time:performance.now(),top:!sc||sc.scrollTop<=2,bottom:!sc||sc.scrollTop+sc.clientHeight>=sc.scrollHeight-3};
    },{passive:true});
    target.addEventListener('touchend',e=>{
      if(!touch||e.changedTouches.length!==1)return;const start=touch;touch=null;
      const p=e.changedTouches[0],dx=p.clientX-start.x,dy=p.clientY-start.y;
      if(Math.max(Math.abs(dx),Math.abs(dy))<48||performance.now()-start.time>1400)return;
      suppressClickUntil=performance.now()+500;
      if(Math.abs(dx)>Math.abs(dy)*1.25){if(!legacy)turn(dx<0?1:-1);}
      else if(Math.abs(dy)>Math.abs(dx)*1.25&&(!legacy||(dy>0&&start.top)||(dy<0&&start.bottom)))changeArticle(dy<0?1:-1);
    },{passive:true});
    target.addEventListener('touchcancel',()=>touch=null,{passive:true});
  }
  function articleLink(event){
    const link=event.target.closest('a');if(!link)return;
    const url=new URL(link.href,location.href);
    if(url.origin===location.origin){
      if(mode==='md'&&url.hash&&(link.getAttribute('href').startsWith('#')||url.pathname===new URL(pathFor(articles[current],'md')).pathname)){
        event.preventDefault();const el=book.querySelector(`[id="${CSS.escape(decodeURIComponent(url.hash.slice(1)))}"]`);if(el){const left=el.getBoundingClientRect().left-viewport.getBoundingClientRect().left+page*(pageWidth+80);page=Math.max(0,Math.min(pageCount-1,Math.floor(left/(pageWidth+80))));book.style.transform=`translateX(${-page*(pageWidth+80)}px)`;status();}return;
      }
      const name=decodeURIComponent(url.pathname.split('/').pop()).replace(/\.(html|md)$/,'');
      const idx=articles.findIndex(a=>a.title===name);
      if(idx>=0){event.preventDefault();openArticle(idx);return;}
    }
    link.target='_blank';link.rel='noopener noreferrer';
  }
  function attachLegacy(){
    try{
      const doc=frame.contentDocument;if(!doc)return;
      doc.documentElement.style.overscrollBehavior='none';
      doc.addEventListener('wheel',e=>gestureWheel(e,true),{passive:false});bindTouch(doc,true);
      doc.addEventListener('click',articleLink);
      doc.addEventListener('keydown',keyboard);
      doc.addEventListener('scroll',updateProgress,{passive:true});
    }catch{}
  }
  let timelineFractions=[],timelineHover=null,tickGeometry=[];
  function renderTimeline(){
    timelineItems=articles.map((a,index)=>({...a,index})).reverse();
    focusIndex=Math.max(0,timelineItems.findIndex(a=>a.index===current));
    if(!timelineItems.length)return;
    const start=Date.parse(timelineItems[0].date),end=Date.parse(timelineItems.at(-1).date);
    timelineFractions=timelineItems.map(a=>end===start?.5:(Date.parse(a.date)-start)/(end-start));
    ticks=timelineItems.map((a,i)=>{
      const button=document.createElement('button');button.className='tick';button.setAttribute('aria-label',`${a.date} ${titleFor(a)}`);
      const label=document.createElement('span');label.className='tick-year';button.append(label);
      button.addEventListener('focus',()=>{if(button.matches(':focus-visible'))focusTimeline(i,null);});
      button.dataset.index=String(i);
      return button;
    });
    $('timeline').replaceChildren(...ticks);
    timelineHover=null;focusTimeline(focusIndex,null);
  }
  function focusTimeline(index,fraction=timelineHover){
    if(!timelineItems.length)return;focusIndex=Math.max(0,Math.min(timelineItems.length-1,index));timelineHover=fraction;
    const a=timelineItems[focusIndex];$('previewTitle').textContent=titleFor(a);$('titleFrame').dataset.theme=a.category;
    const width=$('timeline').clientWidth-16;
    const distort=x=>{if(fraction===null)return x;const span=x<fraction?fraction:1-fraction;if(span<.0001)return x;const r=Math.abs(x-fraction)/span;return fraction+Math.sign(x-fraction)*span*(3.5*r/(2.5*r+1));};
    const positions=timelineFractions.map(x=>8+distort(x)*width),lanes=[];
    // Reserve a viewport-sized plot; crowding changes spacing, never its box.
    const axisHeight=$('timeline').clientHeight;
    const packed=positions.map((x,i)=>{
      let lane=0;while(lane<lanes.length&&x-lanes[lane]<4)lane++;lanes[lane]=x;
      const crowded=lane>0||(i+1<positions.length&&positions[i+1]-x<4);
      return {x,lane,crowded};
    });
    const available=Math.max(1,axisHeight-12);
    const spacing=Math.min(8,available/Math.max(1,lanes.length));
    tickGeometry=packed.map(({x,lane,crowded},i)=>{
      const distance=fraction===null?1:Math.abs(timelineFractions[i]-fraction);
      const height=crowded?Math.min(5,spacing*.65):Math.min(available,22+(fraction===null?0:48*Math.exp(-distance*distance/.007)));
      const bottom=lane*spacing,tick=ticks[i];
      tick.style.left=`${x}px`;tick.style.setProperty('--tick-height',`${height}px`);tick.style.setProperty('--tick-bottom',`${bottom}px`);tick.classList.toggle('active',i===focusIndex);
      tick.firstChild.textContent=i===focusIndex?a.date:'';
      tick.firstChild.style.bottom=`${axisHeight-bottom+8}px`;
      return {x,bottom,height};
    });
    $('timeline').dataset.magnified=String(fraction!==null);
    for(const node of $('timeline').querySelectorAll('.axis-year'))node.remove();
    const first=Date.parse(timelineItems[0].date),last=Date.parse(timelineItems.at(-1).date);
    for(let year=new Date(first).getUTCFullYear();year<=new Date(last).getUTCFullYear();year++){
      const fraction=last===first?.5:Math.max(0,(Date.UTC(year,0,1)-first)/(last-first));
      const label=document.createElement('span');label.className='axis-year';label.textContent=year;label.style.left=`${8+distort(fraction)*width}px`;$('timeline').append(label);
    }
  }
  function pointTimeline(event){
    const rect=$('timeline').getBoundingClientRect(),fraction=Math.max(0,Math.min(1,(event.clientX-rect.left-8)/(rect.width-16)));
    // Date position determines the lens; vertical position selects coincident dates.
    focusTimeline(focusIndex,fraction);
    const bounds=$('timeline').getBoundingClientRect(),x=event.clientX-bounds.left,y=bounds.bottom-event.clientY;
    let index=0,distance=Infinity;
    tickGeometry.forEach((g,i)=>{const d=Math.hypot((g.x-x)*2,Math.max(g.bottom-y,0,y-g.bottom-g.height));if(d<distance){distance=d;index=i;}});
    focusTimeline(index,fraction);
  }
  function openNavigation(){
    if(!articles.length)return;dialog.showModal();$('navToggle').setAttribute('aria-expanded','true');$('navToggle').setAttribute('aria-label','关闭快速导航');renderTimeline();
    // The close control lives in the dialog top layer so it also works above HTML frames.
    dialog.append($('navToggle'));
  }
  function closeNavigation(){dialog.close();document.querySelector('.header-right').append($('navToggle'));$('navToggle').setAttribute('aria-expanded','false');$('navToggle').setAttribute('aria-label','打开快速导航');$('navToggle').focus();}
  $('navToggle').onclick=()=>dialog.open?closeNavigation():openNavigation();
  dialog.addEventListener('cancel',e=>{e.preventDefault();closeNavigation();});
  $('timeline').addEventListener('click',event=>{
    if(performance.now()<suppressClickUntil||!timelineItems.length)return;
    const index=event.detail===0&&event.target.closest('.tick')?Number(event.target.closest('.tick').dataset.index):focusIndex;
    const target=timelineItems[index].index;closeNavigation();openArticle(target);
  });
  let timelineTouch=null;
  $('timeline').addEventListener('pointermove',e=>{if(e.pointerType==='touch'&&!timelineTouch)return;pointTimeline(e);if(timelineTouch&&Math.abs(e.clientX-timelineTouch.x)>8)timelineTouch.moved=true;});
  $('timeline').addEventListener('pointerdown',e=>{if(e.pointerType==='touch')timelineTouch={x:e.clientX,moved:false};pointTimeline(e);});
  $('timeline').addEventListener('pointerup',()=>{if(timelineTouch?.moved)suppressClickUntil=performance.now()+500;timelineTouch=null;});
  $('timeline').addEventListener('pointerleave',()=>{timelineTouch=null;focusTimeline(focusIndex,null);});
  $('timeline').addEventListener('pointercancel',()=>{timelineTouch=null;focusTimeline(focusIndex,null);});
  $('previousPage').onclick=()=>turn(-1);$('nextPage').onclick=()=>turn(1);
  viewport.addEventListener('click',e=>{if(e.target.closest('a,button,video,audio,input')||getSelection()?.toString()||performance.now()<suppressClickUntil)return;turn(e.clientX<innerWidth/2?-1:1);});
  book.addEventListener('click',articleLink);
  reader.addEventListener('wheel',e=>gestureWheel(e),{passive:false});bindTouch(reader);
  function keyboard(e){if(e.target.closest('input,textarea,select,video,audio')||dialog.open)return;if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key)){e.preventDefault();if(e.key==='ArrowLeft')turn(-1);if(e.key==='ArrowRight')turn(1);if(e.key==='ArrowUp')changeArticle(-1);if(e.key==='ArrowDown')changeArticle(1);}}
  document.addEventListener('keydown',keyboard);
  window.addEventListener('resize',()=>{clearTimeout(resizeTimer);resizeTimer=setTimeout(()=>{measure();if(dialog.open)focusTimeline(focusIndex);},120);});
  function indexFromHash(){let title;try{title=decodeURIComponent(location.hash.slice(1));}catch{return 0;}const idx=articles.findIndex(a=>a.title===title);return idx>=0?idx:0;}
  window.addEventListener('popstate',()=>openArticle(indexFromHash(),{historyMode:'none'}));
  window.addEventListener('hashchange',()=>{const index=indexFromHash();if(index!==current)openArticle(index,{historyMode:'none'});});
  async function init(){
    try{articles=window.BLOG_CONTENT?.articles||[];if(!articles.length)throw Error('文章目录加载失败');await openArticle(indexFromHash(),{historyMode:'replace'});}
    catch(e){$('loading').textContent=e.message+'，请刷新重试。';}
  }
  init();
})();
