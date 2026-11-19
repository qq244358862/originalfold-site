/* Two printed spreads, four physical faces. Every hinge is horizontal, and
   the first one is the rule between the hero and contact, never the sculpture. */
(() => {
  'use strict';
  const section=document.querySelector('#works');
  if(!section)return;
  const print=section.querySelector('.folio-print'),rig=section.querySelector('.fold-rig'),pages=[...print.querySelectorAll('.folio-page')];
  const triggers=[...document.querySelectorAll('a[aria-controls="works"]')],browse=document.querySelector('.browse-label'),title=document.querySelector('#works-title');
  const reduced=matchMedia('(prefers-reduced-motion: reduce)'),root=document.documentElement,halfTurn=Math.PI/2;
  const route=()=>/^#works(?:\/(?:open|xiangguo|segment))?$/.test(location.hash);
  const sat=x=>Math.max(0,Math.min(1,x)),smooth=x=>{const t=sat(x);return t*t*(3-2*t)};
  const num=x=>Number(x.toFixed(4)),px=x=>num(x)+'px';
  const el=c=>{const n=document.createElement('div');n.className=c;return n};
  let progress=0,target=0,ticket=0,prev=null,pairs=[],opener=null,focusWhenDone=null,usingKeys=false;
  document.addEventListener('pointerdown',()=>{usingKeys=false},true);
  document.addEventListener('keydown',()=>{usingKeys=true},true);

  function copyOf(page){
    const copy=page.cloneNode(true);
    for(const n of copy.querySelectorAll('[id]'))n.removeAttribute('id');
    for(const a of copy.querySelectorAll('a')){a.removeAttribute('href');a.removeAttribute('target');a.removeAttribute('aria-label');a.tabIndex=-1}
    return copy;
  }
  function build(){
    if(pairs.length)return;
    const fragment=document.createDocumentFragment();
    pairs=pages.map(page=>{
      const pair=el('rig-pair'),faces=[0,1].map(()=>{
        const plane=el('rig-plane'),win=el('strip-window'),slice=el('strip-print'),shade=el('face-shade');
        slice.append(copyOf(page));win.append(slice);plane.append(win,shade);pair.append(plane);
        return {plane,slice,shade};
      });fragment.append(pair);return {page,pair,faces,half:0};
    });
    rig.replaceChildren(fragment);measure();
  }
  function measure(){
    if(!pairs.length)return;
    const heights=pages.map(p=>p.getBoundingClientRect().height);
    rig.style.setProperty('--lens',px(Math.max(820,section.clientWidth*1.35,Math.max(...heights)*6)));
    pairs.forEach((p,i)=>{
      p.half=heights[i]/2;
      p.faces.forEach(({plane,slice},half)=>{plane.style.height=px(p.half);slice.style.top=px(-half*p.half)});
    });
  }
  function draw(){
    let y=0;
    pairs.forEach(({pair,faces,half},i)=>{
      // The lower spread follows the upper one. Within a spread, both halves
      // have equal length: the valley goes into the page and its foot returns
      // to z=0. Its projected bottom is exactly the next paper hinge.
      const local=smooth(i===0?progress/.69:(progress-.23)/.77);
      const angle=(1-local)*halfTurn,extent=half*Math.cos(angle),depth=half*Math.sin(angle),degrees=num(angle*180/Math.PI);
      pair.style.top=px(y);pair.style.visibility=extent>.055?'visible':'hidden';
      faces[0].plane.style.transform='rotateX('+(-degrees)+'deg)';
      faces[1].plane.style.transform='translate3d(0,'+px(extent)+','+px(-depth)+') rotateX('+degrees+'deg)';
      faces[0].shade.style.opacity=num(Math.sin(angle)*.94);faces[1].shade.style.opacity=num(Math.sin(angle)*.92);
      y+=extent*2;
    });
    // Occupy that actual height in the document on each frame. Contact follows
    // the moving edge without any transforms, jumps, or overlaid content.
    section.style.height=px(y);
  }
  function labels(){
    triggers.forEach(a=>a.setAttribute('aria-expanded',String(!!target)));
    if(browse)browse.textContent=target?'收起作品':'浏览作品';
  }
  function finish(){
    const on=!!target;
    section.dataset.state=on?'open':'closed';
    delete section.dataset.turning;delete root.dataset.foldInMotion;
    section.style.removeProperty('height');pairs=[];rig.replaceChildren();
    print.inert=!on;section.setAttribute('aria-hidden',String(!on));
    const node=focusWhenDone;focusWhenDone=null;
    if(node?.isConnected)node.focus({preventScroll:true});
  }
  function advance(now){
    ticket=0;const elapsed=prev===null?0:Math.max(0,Math.min(70,now-prev));prev=now;
    progress=reduced.matches?target:target?Math.min(1,progress+elapsed/950):Math.max(0,progress-elapsed/950);
    draw();
    if(progress===target){prev=null;finish()}else ticket=requestAnimationFrame(advance);
  }
  function move(on,{instant=false,focus=null}={}){
    if(Number(on)===target)return;
    target=Number(on);labels();focusWhenDone=focus;
    if(!target&&print.contains(document.activeElement))(opener||triggers[0]).focus({preventScroll:true});
    if(ticket)cancelAnimationFrame(ticket);ticket=0;prev=null;
    if(instant||reduced.matches){progress=target;finish();return}
    build();print.inert=true;section.setAttribute('aria-hidden','true');
    section.dataset.turning='';root.dataset.foldInMotion='';section.dataset.state=target?'opening':'closing';
    draw();ticket=requestAnimationFrame(advance);
  }
  function ensureHingeInView(){
    const y=section.getBoundingClientRect().top,h=document.documentElement.clientHeight;
    // If the hinge is already on screen, keep the viewport completely still.
    if(y>=h-4||y<0)window.scrollBy({top:y-h*.58,behavior:'instant'});
  }
  function open(link,keyboard){
    opener=link;ensureHingeInView();
    if(!route()){
      if('scrollRestoration' in history)history.scrollRestoration='manual';
      history.pushState({originalFoldDown:true},'','#works');
      if('scrollRestoration' in history)history.scrollRestoration='manual';
    }
    move(true,{focus:keyboard?title:null});
  }
  function close(restore){
    if(!target)return;
    const node=(restore||usingKeys)?(opener||triggers[0]):null;
    move(false,{focus:node});
    if(history.state?.originalFoldDown&&route())history.back();
    else history.replaceState(null,'',location.pathname+location.search+'#top');
  }
  const ordinary=e=>e.button===0&&!e.metaKey&&!e.ctrlKey&&!e.shiftKey&&!e.altKey;
  triggers.forEach(link=>link.addEventListener('click',e=>{
    if(!ordinary(e))return;e.preventDefault();
    if(target)close(true);else open(link,usingKeys||e.detail===0);
  }));
  print.querySelectorAll('.sheet-close').forEach(a=>a.addEventListener('click',e=>{if(ordinary(e)){e.preventDefault();close(true)}}));
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&target){e.preventDefault();close(true)}});
  function sync(){
    if(location.hash==='#studio'){location.replace('./studio.html');return}
    const on=route();if(on!==!!target)move(on,{focus:usingKeys?(on?title:location.hash==='#contact'?null:opener):null});
  }
  window.addEventListener('popstate',sync);window.addEventListener('hashchange',sync);
  function resize(){if(pairs.length){measure();draw()}}
  if(window.ResizeObserver){const observer=new ResizeObserver(resize);pages.forEach(p=>observer.observe(p))}else window.addEventListener('resize',resize);
  reduced.addEventListener?.('change',()=>{if(ticket&&reduced.matches){cancelAnimationFrame(ticket);ticket=0;prev=null;progress=target;finish()}});
  root.dataset.portfolio='';section.dataset.state='closed';print.inert=true;section.setAttribute('aria-hidden','true');labels();
  if(location.hash==='#studio')location.replace('./studio.html');
  else if(route()){
    move(true,{instant:true});
    if(location.hash!=='#works')requestAnimationFrame(()=>section.scrollIntoView({block:'start',behavior:'instant'}));
  }
})();
