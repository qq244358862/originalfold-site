/* A single pleated sheet, rendered from the same two playheads in both directions. */
(() => {
  'use strict';
  const $=s=>document.querySelector(s), stage=$('#portfolio'), space=$('#fan-space'), svg=$('#work-fan');
  const action=$('#fan-action'), choices=$('#leaf-choices'), buttons=[...choices.querySelectorAll('button')], detail=$('#leaf-detail');
  const head=$('#detail-title'), hint=$('#fan-hint'), status=$('#fan-status'), motion=matchMedia('(prefers-reduced-motion: reduce)');
  const works=[
    {id:'xiangguo',title:'想过',index:'01 / XIANGGUO',desc:'记下一句想明白的话。下次遇到相似的处境，再翻回自己当时写下的原话。',url:'https://qq244358862.github.io/xiangguo-support/',paper:[197,187,204],sheet:[234,227,232]},
    {id:'segment',title:'段落计时器',index:'02 / SEGMENT TIMER',desc:'把一次工作拆成几段，各自写下计划用时。结束后对照实际花掉的时间，看清一段工作是怎样完成的。',url:'https://qq244358862.github.io/segment-timer-support/',paper:[185,199,165],sheet:[225,230,211]}
  ];
  const ns='http://www.w3.org/2000/svg',N=12;
  function make(tag,attrs={},parent=svg){const el=document.createElementNS(ns,tag);for(const [a,b] of Object.entries(attrs))el.setAttribute(a,b);parent.append(el);return el}
  const attr=(n,obj)=>{for(const [k,v] of Object.entries(obj))n.setAttribute(k,v)};
  const pin=(v,a=0,b=1)=>Math.max(a,Math.min(b,v)),mix=(a,b,t)=>a+(b-a)*t, ease=t=>t*t*(3-2*t);
  const tween=(a,b,t)=>[mix(a[0],b[0],t),mix(a[1],b[1],t)],rad=d=>d*Math.PI/180;
  const F=p=>p[0].toFixed(2)+' '+p[1].toFixed(2), line=pts=>'M'+pts.map(F).join('L'), polygon=pts=>line(pts)+'Z';
  const ink=(a,b,t,offset)=>'rgb('+a.map((x,i)=>Math.round(pin(mix(x,b[i],t)+offset,0,255))).join(',')+')';
  const sticks=make('g',{'pointer-events':'none'}),leaves=make('g',{'pointer-events':'none'}),guards=make('g',{'pointer-events':'none'});
  const stickData=[],panels=[],caps=[];
  for(let i=0;i<=N*2;i+=2){const stick=make('path',{fill:'#7e795f',stroke:'#615f4c','stroke-width':.55},sticks);const grain=make('path',{fill:'none',stroke:'#dcd4ae','stroke-width':.75},sticks);stickData.push({i,stick,grain})}
  for(let w=0;w<2;w++){
    const g=make('g',{},leaves),facets=[];
    for(let j=0;j<N;j++){
      const surface=make('path',{'stroke-width':.65,'stroke-linejoin':'round'},g);
      const stripe=make('path',{fill:'none',stroke:'#faf7e7','stroke-width':.9},g);
      const engraving=make('path',{fill:'none',stroke:'#4e5145','stroke-width':.69},g);
      const edge=make('path',{fill:'none',stroke:'#333328','stroke-width':.62},g);
      facets.push({surface,stripe,engraving,edge});
    }
    panels.push({g,facets});
  }
  for(let i=0;i<2;i++){const wood=make('path',{fill:i===0?'#45463d':'#373b33',stroke:'#34362f','stroke-width':.72},guards);
    const inlay=make('path',{fill:'none',stroke:'#adac92','stroke-width':.85},guards);
    const notch=make('path',{fill:'none',stroke:'#cfccb1','stroke-width':1.1},guards);caps.push({wood,inlay,notch})}
  const hinge=make('g',{'pointer-events':'none'}),pinOuter=make('circle',{fill:'#c7bc88',stroke:'#453f2a','stroke-width':1.25},hinge),pinInner=make('circle',{fill:'#625e48'},hinge);
  const targets=make('g',{}),leafHits=works.map((item,i)=>make('path',{class:'blade-hit','data-blade':item.id,fill:'transparent',stroke:'transparent','stroke-linejoin':'round'},targets));
  const centreHit=make('circle',{class:'fan-hit',fill:'transparent'},targets);
  let W=1,H=1,f=0,d=0,which=0,target='closed',raf=0,last=0,focusGoal='',announced='',lastDetail=-1;
  const encoded=k=>k==='closed'?'#works':k==='open'?'#works/open':'#works/'+k;
  stage.addEventListener('pointerdown',()=>{stage.dataset.input='pointer'},{capture:true});
  document.addEventListener('keydown',()=>{stage.dataset.input='keys'},{capture:true});
  const fromURL=()=>location.hash==='#works/open'?'open':works.some(p=>location.hash===encoded(p.id))?location.hash.slice(7):'closed';
  const idx=k=>works.findIndex(p=>p.id===k);
  function detailContent(i){if(lastDetail===i)return;lastDetail=i;const item=works[i];$('#detail-index').textContent=item.index;head.textContent=item.title;$('#detail-body').textContent=item.desc;const link=$('#detail-link');link.href=item.url;link.setAttribute('aria-label','访问'+item.title+'产品页（新窗口）')}
  function updateUI(){
    const descriptions={closed:'轻点纸扇，翻看扇页里的作品。',open:'选一片扇页，展开它背后的项目。',detail:'点返回，扇页就沿原来的折痕合回去。'};
    const view=idx(target)>=0?'detail':target;stage.dataset.state=view;hint.textContent=descriptions[view];
    action.lastElementChild.textContent=view==='closed'?'展开作品扇':view==='open'?'收起纸扇':'返回作品扇';
    action.setAttribute('aria-expanded',String(view!=='closed'));
  }
  function setTarget(k,focus=false){
    if(!['closed','open',...works.map(p=>p.id)].includes(k))k='closed';
    if(k===target&&!focus)return;
    const old=target;target=k;if(idx(k)>=0&&d===0){which=idx(k);detailContent(which)}
    if(focus){focusGoal=idx(k)>=0?'heading':k==='open'?(idx(old)>=0?old:'first'):'action';
      const bounds=stage.getBoundingClientRect();
      if(bounds.height<innerHeight-24&&(bounds.bottom<=0||bounds.top<0||bounds.bottom>innerHeight))stage.scrollIntoView({behavior:'instant',block:'start'});
      if(document.activeElement===head||detail.contains(document.activeElement)||choices.contains(document.activeElement))action.focus({preventScroll:true});
    }else{focusGoal=''}
    updateUI();start();
  }
  function navigate(k){
    if(k===target)return;history.pushState({ofFan:true,from:target},'',encoded(k));setTarget(k,true);
  }
  function back(){
    const parent=idx(target)>=0?'open':'closed';if(target==='closed')return;
    if(history.state?.ofFan&&history.state.from===parent)history.back();
    else{history.replaceState({ofFan:false},'',encoded(parent));setTarget(parent,true)}
  }
  action.addEventListener('click',()=>target==='closed'?navigate('open'):back());
  $('#sheet-back').addEventListener('click',back);
  buttons.forEach(b=>b.addEventListener('click',()=>{if(target==='open')navigate(b.dataset.work)}));
  leafHits.forEach((hit,i)=>hit.addEventListener('click',()=>{if(target==='closed')navigate('open');else if(target==='open')navigate(works[i].id)}));
  centreHit.addEventListener('click',()=>{if(target==='closed')navigate('open')});
  function syncHistory(){const k=fromURL();if(k!==target)setTarget(k,/^#works(?:\/|$)/.test(location.hash)||stage.contains(document.activeElement))}
  window.addEventListener('popstate',syncHistory);window.addEventListener('hashchange',syncHistory);
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&target!=='closed'){e.preventDefault();back()}});
  function settleFocus(){
    if(!focusGoal)return;const goal=focusGoal;focusGoal='';
    if(goal==='heading')head.focus({preventScroll:true});
    else if(goal==='action')action.focus({preventScroll:true});
    else (buttons.find(b=>b.dataset.work===goal)||buttons[0]).focus({preventScroll:true});
  }
  function render(){
    if(W<2||H<2)return;
    const o=ease(f),z=ease(d),mobile=W<480,openedR=Math.min(W*.504,H*.765),closedR=Math.min(W*.64,H*1.02),R=mix(closedR,openedR,o);
    const th=rad(51),cx=mix(W*.50-Math.sin(th)*closedR*.43,W*.5,o),cy=mix(H*.50+Math.cos(th)*closedR*.44,H*.842,o);
    const axis=mix(th,0,o),span=rad(mix(15,151,o)),pivot=[cx,cy];
    const dir=a=>[Math.sin(a),-Math.cos(a)],theta=q=>axis+(q-.5)*span;
    function polar(a,r){const b=dir(a);return [cx+b[0]*r,cy+b[1]*r]}
    const paperX=W*(mobile?.042:.065),paperW=W-2*paperX,paperY=H*.09,paperH=H*.82;
    function ring(w,j){
      const i=w*N+j,q=i/(2*N),ridge=i%2===0?1:-1, r=R*(ridge>0?1:.974),a=theta(q),foldZ=z;
      let top=polar(a,r),bot=polar(a,r*(ridge>0?.317:.328));
      if(w===which&&foldZ>0){
        const u=j/N;
        const depth=Math.sin(Math.PI*foldZ)*(mobile?8:15), bow=(2*u-1)*Math.sin(Math.PI*foldZ)*.11*paperH;
        const tx=paperX+u*paperW+Math.sin(u*Math.PI*2)*depth*.36;
        const crease=(j%2?1:-1)*(mobile?2:3);
        const topGoal=[tx+(1-u)*4,paperY+crease+bow+(1-u)*2],botGoal=[tx,paperY+paperH+crease*.62+bow-(1-u)*1.5];
        top=tween(top,topGoal,foldZ);bot=tween(bot,botGoal,foldZ);
      }else if(w!==which&&foldZ>0){
        const hide=ease(Math.min(1,foldZ*1.12)),a2=mix(a,theta(.5),hide*.93);
        top=polar(a2,r*(1-hide*.43));bot=polar(a2,r*.32*(1-hide*.43));
      }
      return {top,bot};
    }
    const points=works.map((_,w)=>Array.from({length:N+1},(_v,j)=>ring(w,j)));
    stickData.forEach(({i,stick,grain})=>{
      const a=theta(i/(2*N)),u=dir(a),side=[-u[1],u[0]],p=polar(a,-R*.098),q=polar(a,R*.39),s=mix(1.4,2.15,o)*Math.min(1,R/210+.16);
      const offset=(p,v)=>[p[0]+side[0]*v,p[1]+side[1]*v];
      stick.setAttribute('d',polygon([offset(p,-s),offset(q,-s*.79),offset(q,s*.79),offset(p,s)]));grain.setAttribute('d',line([offset(p,s*.24),offset(q,s*.24)]));
    });sticks.setAttribute('opacity',Math.pow(1-z,2).toFixed(3));
    for(let w=0;w<2;w++){
      const active=w===which,local=active?z:0,fade=active?1:1-ease(pin(z*1.58));
      const group=panels[w];group.g.setAttribute('opacity',fade.toFixed(3));if(active)leaves.append(group.g);
      group.facets.forEach((objects,j)=>{
        const A=points[w][j],B=points[w][j+1],side=j%2,at=(P,t)=>tween(P.bot,P.top,t);
        const contrast=mix(1,.24,local),tone=((side? -15:12)+(j/N-.5)*5)*contrast-8*(1-o)*(1-local);
        const faceColor=ink(works[w].paper,works[w].sheet,local,tone);
        attr(objects.surface,{d:polygon([A.top,B.top,B.bot,A.bot]),fill:faceColor,stroke:faceColor});
        // Two fine, continuous printed bands follow every valley and ridge.
        const stripes=[.89,.915,.124].map(t=>line([at(A,t),at(B,t)])).join('');
        attr(objects.stripe,{d:stripes,opacity:(.67*(1-local)+.20*local).toFixed(3)});
        const s=j/N,t=(j+1)/N;
        const h=q=>w===0?.28+.13*Math.sin(q*6.6+.6)+.05*Math.sin(q*13):.25+.14*q+.085*(Math.floor(q*5)/5);
        const engr=[line([at(A,h(s)),at(B,h(t))]),line([at(A,h(s)+.022),at(B,h(t)+.022)]),line([at(A,.955),at(B,.955)])].join('');
        attr(objects.engraving,{d:engr,opacity:(.44*(1-local)+.115*local).toFixed(3)});
        attr(objects.edge,{d:line([A.bot,A.top]),opacity:(.30*(1-local)+.12*local).toFixed(3)});
      });
      const p=points[w],boundary=[...p.map(P=>P.top),...p.slice().reverse().map(P=>P.bot)];
      if(target==='closed'||(target==='open'&&d<.24))boundary.push(pivot);
      attr(leafHits[w],{d:polygon(boundary),'stroke-width':target==='closed'?18:2,'pointer-events':(target==='closed'||(target==='open'&&f>.60&&d<.24))?'all':'none'});
    }
    caps.forEach(({wood,inlay,notch},i)=>{
      const a=theta(i),v=dir(a),n=[-v[1],v[0]],bias=i===0?-1:1;
      const shape=(t,delta)=>{const p=polar(a,R*t);return [p[0]+n[0]*delta*bias,p[1]+n[1]*delta*bias]};
      const g=mix(R*.015,R*.012,o);
      wood.setAttribute('d',polygon([shape(-.115,-g*.75),shape(.992,-g*.50),shape(1.012,g*.35),shape(1.005,g*.80),shape(-.105,g*.95)]));
      inlay.setAttribute('d',line([shape(-.073,g*.32),shape(.972,g*.22)]));
      notch.setAttribute('d',[.18,.197,.215].map(t=>line([shape(t,-g*.45),shape(t+.004,g*.62)])).join(''));
    });guards.setAttribute('opacity',Math.pow(1-z,2.3).toFixed(3));
    const pr=Math.max(2.6,R*.015);attr(pinOuter,{cx,cy,r:pr});attr(pinInner,{cx,cy,r:pr*.35});
    hinge.setAttribute('opacity',Math.pow(1-z,2).toFixed(3));attr(centreHit,{cx,cy,r:Math.max(14,R*.095),'pointer-events':target==='closed'?'all':'none'});
    const labels=ease(pin((f-.67)/.33))*(1-ease(pin(d/.28)));
    choices.hidden=labels<.012;choices.inert=target!=='open'||labels<.66;choices.style.opacity=labels.toFixed(3);
    buttons.forEach((b,i)=>{const pos=polar(theta(i===0?.255:.745),R*.69);b.style.left=pos[0].toFixed(2)+'px';b.style.top=pos[1].toFixed(2)+'px'});
    const opacity=ease(pin((d-.57)/.43));detail.hidden=opacity<.011;detail.inert=idx(target)<0||opacity<.72;detail.style.opacity=opacity.toFixed(3);
    const final=target==='closed'&&f===0&&d===0||target==='open'&&f===1&&d===0||idx(target)===which&&f===1&&d===1;
    if(final){stage.dataset.view=target;if(announced!==target){status.textContent=target==='closed'?'作品扇已收起':target==='open'?'作品扇已展开，有两件作品':works[which].title+'，项目介绍已展开';announced=target}settleFocus()}else stage.dataset.view='turning';
  }
  function approach(from,to,dt){return from<to?Math.min(to,from+dt):Math.max(to,from-dt)}
  function tick(now){
    raf=0;const ms=last?Math.min(55,now-last):16;last=now;
    const want=idx(target),fo=target==='closed'?0:1;
    if(motion.matches){f=fo;d=want>=0?1:0;if(want>=0){which=want;detailContent(which)}}
    else{
      if(d>0&&(want!==which||fo===0))d=approach(d,0,ms/700);
      else if(f!==fo)f=approach(f,fo,ms/770);
      else if(want>=0){if(want!==which){which=want;detailContent(which)}d=approach(d,1,ms/700)}
    }
    render();if(!(f===fo&&d===(want>=0?1:0)&&(want<0||want===which)))raf=requestAnimationFrame(tick);else last=0;
  }
  function start(){if(!raf){last=0;raf=requestAnimationFrame(tick)}}
  function size(){const b=space.getBoundingClientRect();W=b.width;H=b.height;svg.setAttribute('viewBox','0 0 '+Math.max(W,1)+' '+Math.max(H,1));render()}
  if(window.ResizeObserver)new ResizeObserver(size).observe(space);else window.addEventListener('resize',size);
  motion.addEventListener?.('change',start);detailContent(0);action.hidden=false;target=fromURL();const first=idx(target);f=target==='closed'?0:1;d=first>=0?1:0;if(first>=0){which=first;detailContent(which)}
  updateUI();size();if(/^#works\//.test(location.hash))requestAnimationFrame(()=>$('#works').scrollIntoView({behavior:'instant',block:'start'}));
})();
