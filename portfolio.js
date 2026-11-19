/* The portfolio is a sheet inside the hero. Its launch point is measured on the
   projected black paper at the moment of opening, including after a drag. */
(() => {
  'use strict';
  const find=s=>document.querySelector(s),hero=find('.hero'),layer=find('#works');
  if(!hero||!layer)return;
  const slot=find('.sheet-slot'),mover=find('.sheet-mover'),mask=find('.paper-window'),copy=find('.sheet-content'),gleam=find('.crease-light');
  const home=find('.hero-type'),air=find('.paper-air'),grid=layer.querySelector('.work-grid'),heading=find('#works-title'),close=layer.querySelector('.sheet-close');
  const triggers=[...document.querySelectorAll('a[aria-controls="works"]')],reduce=matchMedia('(prefers-reduced-motion: reduce)');
  const clamp=(x,a=0,b=1)=>Math.max(a,Math.min(b,x)),lerp=(a,b,t)=>a+(b-a)*t;
  function smooth(a,b,x){const t=clamp((x-a)/(b-a));return t*t*(3-2*t)}
  const n=x=>x.toFixed(3);
  let t=0,goal=0,frame=0,last=0,launch=null,opener=null,focusAfter=null,covered=false;
  let modality='pointer';
  document.addEventListener('keydown',()=>{modality='key'},true);
  document.addEventListener('pointerdown',()=>{modality='pointer'},true);
  const route=()=>/^#works(?:\/(?:open|xiangguo|segment))?$/.test(location.hash);
  function holdPaper(value){
    if(covered===value)return;covered=value;
    home.inert=air.inert=value;
    document.dispatchEvent(new CustomEvent('originalfold:cover',{detail:value}));
  }
  function hinge(){
    const model=find('#paper-model'),b=model?.getBoundingClientRect()||air.getBoundingClientRect();
    const middle=[b.left+b.width*.51,b.top+b.height*.52];
    let best=middle,score=Infinity;
    Array.from(model?.querySelectorAll('.face')||[]).reverse().forEach((face,index)=>{
      const m=face.getScreenCTM();
      const c=(face.getAttribute('d')||'').match(/-?\d+(?:\.\d+)?/g)?.map(Number);
      if(!m||!c||c.length!==8)return;
      for(const [j,k] of [[0,6],[2,4]]){
        const pt=new DOMPoint(lerp(c[j],c[k],.52),lerp(c[j+1],c[k+1],.52)).matrixTransform(m);
        const weight=Math.hypot(pt.x-middle[0],pt.y-middle[1])+index*2.4;
        if(weight<score){score=weight;best=[pt.x,pt.y]}
      }
    });
    return best;
  }
  function measure(){
    const box=slot.getBoundingClientRect(),p=hinge(),x=p[0]-box.left,y=p[1]-box.top;
    const dir=x>=box.width/2?1:-1,u=dir===1?.70:.30,v=.52;
    launch={dx:x-u*box.width,dy:y-v*box.height,w:box.width,u,v,dir};
    mover.style.transformOrigin=n(u*100)+'% '+n(v*100)+'%';
  }
  function fit(){
    const r=slot.getBoundingClientRect(),h=document.documentElement.clientHeight;
    if(r.height<h-24&&(r.top<9||r.bottom>h-8)){
      if(r.top<9)window.scrollBy({top:r.top-12,behavior:'instant'});
      else window.scrollBy({top:r.bottom-h+12,behavior:'instant'});
    }
  }
  function draw(){
    if(!launch)measure();
    const {dx,dy,w,u,v,dir}=launch,travel=smooth(.01,.89,t),height=smooth(.08,.94,t),flatten=smooth(.15,1,t),arc=Math.sin(Math.PI*t);
    // The leading edge slips out first; the back pleat opens later. The same
    // parameter runs backwards so a mid-motion reversal retraces its geometry.
    const near=smooth(.015,.77,t),far=smooth(.18,.99,t),left=lerp(u*100-.85,0,dir===1?near:far),right=lerp(u*100+.85,100,dir===1?far:near);
    const a=lerp(v*100-2.6,0,height),b=lerp(v*100+2.6,100,height),k=Math.sin(Math.PI*height)*3.5;
    const tx=dx*(1-travel)-dir*w*.035*arc,ty=dy*(1-travel)-Math.min(13,w*.018)*arc;
    mover.style.transform='translate3d('+n(tx)+'px,'+n(ty)+'px,0) rotate('+n(-dir*13*(1-flatten))+'deg) skewX('+n(dir*7*(1-flatten))+'deg) scale('+n(lerp(.48,1,travel))+','+n(lerp(.48,1,flatten))+')';
    mask.style.clipPath='polygon('+n(left)+'% '+n(a+(dir===1?k:0))+'%,'+n(right)+'% '+n(a+(dir===1?0:k))+'%,'+n(right)+'% '+n(b-(dir===1?k:0))+'%,'+n(left)+'% '+n(b-(dir===1?0:k))+'%)';
    copy.style.opacity=n(smooth(.36,.84,t));
    home.style.opacity=n(1-smooth(.13,.57,t));air.style.opacity=n(1-smooth(.24,.78,t));
    gleam.style.opacity=n(arc*.88);gleam.style.transform='translateX('+n(dir*lerp(-62,56,t))+'%)';
    grid.inert=!goal||t<.87;
  }
  function focusResult(){
    const node=focusAfter;focusAfter=null;
    if(node?.isConnected){
      if(node===heading&&modality==='pointer')heading.dataset.pointed='';else delete heading.dataset.pointed;
      node.focus({preventScroll:true});
    }
  }
  function finish(){
    delete hero.dataset.turning;
    if(goal){
      layer.dataset.state='open';grid.inert=false;
      mover.style.transform='none';mask.style.clipPath='none';gleam.style.opacity='0';copy.style.opacity='1';
    }else{
      layer.dataset.state='closed';delete layer.dataset.shown;layer.inert=true;layer.setAttribute('aria-hidden','true');
      home.style.removeProperty('opacity');air.style.removeProperty('opacity');holdPaper(false);launch=null;
    }
    focusResult();
  }
  function tick(now){
    frame=0;const ms=last?Math.min(55,now-last):16;last=now;
    t=reduce.matches?goal:goal?Math.min(1,t+ms/760):Math.max(0,t-ms/760);
    draw();if(t===goal){last=0;finish()}else frame=requestAnimationFrame(tick);
  }
  function move(to,focus,instant=false){
    const end=to?1:0;
    if(end===goal&&!(instant&&t!==end))return;
    goal=end;if(focus)focusAfter=end?heading:(opener?.isConnected?opener:triggers[0]);else focusAfter=null;
    if(end){
      if(t===0){holdPaper(true);if(!instant)fit();measure()}
      layer.dataset.shown='';layer.inert=false;layer.removeAttribute('aria-hidden');
    }else if(layer.contains(document.activeElement)){close.blur();if(document.activeElement!==document.body)document.activeElement?.blur?.()}
    for(const a of triggers)a.setAttribute('aria-expanded',String(!!end));
    hero.dataset.turning='';layer.dataset.state=end?'opening':'closing';
    if(frame)cancelAnimationFrame(frame);frame=0;last=0;
    if(instant||reduce.matches){t=end;draw();finish()}else{draw();frame=requestAnimationFrame(tick)}
  }
  function openFrom(link){
    if(goal){heading.focus({preventScroll:true});return}
    opener=link;
    if(!route())history.pushState({originalFoldSheet:true},'','#works');
    move(true,true);
  }
  function closeSheet(){
    if(!goal)return;
    if(history.state?.originalFoldSheet&&route()){
      move(false,true);history.back();
    }else{
      history.replaceState(null,'',location.pathname+location.search+'#top');move(false,true);
    }
  }
  const normal=e=>e.button===0&&!e.metaKey&&!e.ctrlKey&&!e.shiftKey&&!e.altKey;
  triggers.forEach(a=>a.addEventListener('click',e=>{if(normal(e)){e.preventDefault();openFrom(a)}}));
  close.addEventListener('click',e=>{if(normal(e)){e.preventDefault();closeSheet()}});
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&goal){e.preventDefault();closeSheet()}});
  function sync(){
    if(location.hash==='#studio'){location.replace('./studio.html');return}
    const next=route();if(next!==!!goal)move(next,next||(!['#contact','#main'].includes(location.hash)));
  }
  window.addEventListener('popstate',sync);window.addEventListener('hashchange',sync);
  window.addEventListener('resize',()=>{if((t>0&&t<1)||frame){measure();draw()}});
  reduce.addEventListener?.('change',()=>{if(frame&&reduce.matches){cancelAnimationFrame(frame);frame=0;t=goal;draw();finish()}});
  document.documentElement.dataset.portfolio='';layer.dataset.state='closed';layer.inert=true;layer.setAttribute('aria-hidden','true');
  triggers.forEach(a=>a.setAttribute('aria-expanded','false'));
  if(location.hash==='#studio'){location.replace('./studio.html')}else if(route()){move(true,false,true)}
})();
