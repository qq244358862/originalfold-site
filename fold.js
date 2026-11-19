/* Hinges rotate a continuous sheet in 3D. Only painted paper receives a pointer. */
(() => {
  'use strict';
  const svg=document.querySelector('#sculpture'), model=svg.querySelector('#paper-model');
  const stage=svg.parentElement, hero=stage.closest('.hero'), defs=svg.querySelector('defs');
  const ns='http://www.w3.org/2000/svg', reduced=matchMedia('(prefers-reduced-motion: reduce)');
  const node=(name,attrs={})=>{const n=document.createElementNS(ns,name);for(const [k,v] of Object.entries(attrs))n.setAttribute(k,v);return n};
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v)), rad=a=>a*Math.PI/180;
  const plus=(a,b)=>a.map((v,i)=>v+b[i]), sub=(a,b)=>a.map((v,i)=>v-b[i]), mul=(a,s)=>a.map(v=>v*s);
  const dot=(a,b)=>a.reduce((s,v,i)=>s+v*b[i],0), cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
  const unit=a=>mul(a,1/(Math.hypot(...a)||1));
  const widths=[1.82,1.84,2.02,1.95,1.87,1.93,1.70,1.44], skew=[-.36,.39,-.52,.38,-.31,.51,-.41,.31], offsets=[.21,.07,-.17,-.22,-.07,.10,.24,.06];
  const seams=widths.map((w,j)=>{const x=j*1.08-3.78,k=skew[j],y=offsets[j];return [[x+k,y-w/2,0],[x-k,y+w/2,0]]});
  [-108,127,-113,121,-105,95].forEach((angle,i)=>{
    const j=i+1,a=seams[j][0],u=unit(sub(seams[j][1],a)),t=rad(angle*.83),s=Math.sin(t),c=Math.cos(t);
    for(let k=j+1;k<seams.length;k++)seams[k]=seams[k].map(p=>{const v=sub(p,a);return plus(a,plus(plus(mul(v,c),mul(cross(u,v),s)),mul(u,dot(u,v)*(1-c))))});
  });
  const all=seams.flat(),center=mul(all.reduce(plus,[0,0,0]),1/all.length);
  const geometry=seams.map(seam=>seam.map(p=>sub(p,center)));
  const light=unit([-.48,-.73,.85]), rows=[];
  model.replaceChildren();svg.style.touchAction='none';
  for(let j=0;j<7;j++){
    const grad=node('linearGradient',{id:'k'+j,gradientUnits:'userSpaceOnUse'}),stops=[0,.55,1].map(t=>node('stop',{offset:t}));
    grad.append(...stops);defs.append(grad);
    const group=node('g'), surface=node('path',{class:'face',fill:'url(#k'+j+')','stroke-linejoin':'round','stroke-width':.65}), rim=node('path',{fill:'none','pointer-events':'none','stroke-width':.85}), grain=node('path',{fill:'none','pointer-events':'none','stroke-width':.5,stroke:'#ddd','stroke-opacity':.067});
    group.append(surface,grain,rim);model.append(group);rows.push({group,grad,stops,surface,grain,rim});
  }
  let w=1,h=1,limits=null,yaw=0,pitch=0,x=0,y=0,velocity=[0,0],held=null,time=0,auto=!reduced.matches,last=0,raf=0,visible=true,covered=false;
  const gray=n=>{const k=Math.round(clamp(n,0,255));return 'rgb('+[k,k,k].join(',')+')'};
  const fmt=p=>p[0].toFixed(2)+' '+p[1].toFixed(2);
  const lerp2=(p,q,t)=>[p[0]+(q[0]-p[0])*t,p[1]+(q[1]-p[1])*t];
  function render(){
    if(!limits||w<2||h<2)return;
    const a=rad(-11)+yaw+Math.sin(time*.46)*.12,b=rad(-21)+pitch+Math.sin(time*.34)*.075,c=rad(-19)+Math.sin(time*.31)*.024;
    const ca=Math.cos(a),sa=Math.sin(a),cb=Math.cos(b),sb=Math.sin(b),cc=Math.cos(c),sc=Math.sin(c);
    const v=geometry.map(seam=>seam.map(p=>{const X=ca*p[0]+sa*p[2],Z=-sa*p[0]+ca*p[2],Y=cb*p[1]-sb*Z;return [cc*X-sc*Y,sc*X+cc*Y,sb*p[1]+cb*Z]}));
    const project=p=>[p[0]*12/(12-p[2]),p[1]*12/(12-p[2])],xy=v.flat().map(project);
    const xs=xy.map(p=>p[0]),ys=xy.map(p=>p[1]),lo=Math.min(...xs),hi=Math.max(...xs),top=Math.min(...ys),bottom=Math.max(...ys);
    const factor=Math.min(w*.85/Math.max(.1,hi-lo),h*.77/Math.max(.1,bottom-top),w*.213,h*.34);
    const hw=(hi-lo)*factor/2,hh=(bottom-top)*factor/2,homeX=w*.50,homeY=h*.50;
    const cx=clamp(homeX+x,limits.left+hw+3,Math.max(limits.left+hw+3,limits.right-hw-3));
    const cy=clamp(homeY+y,limits.top+hh+3,Math.max(limits.top+hh+3,limits.bottom-hh-3));
    x=cx-homeX;y=cy-homeY;
    const screen=p=>{const q=project(p);return [cx+(q[0]-(lo+hi)/2)*factor,cy+(q[1]-(top+bottom)/2)*factor]};
    const faces=rows.map((row,i)=>{const q=[v[i][0],v[i+1][0],v[i+1][1],v[i][1]];return {row,q,i,depth:q.reduce((s,p)=>s+p[2],0)/4}}).sort((a,b)=>a.depth-b.depth);
    faces.forEach(({row,q,i},order)=>{
      const pts=q.map(screen),[a,b,c,d]=pts,n0=unit(cross(sub(q[1],q[0]),sub(q[3],q[0]))),back=n0[2]<0,n=back?mul(n0,-1):n0;
      const lit=clamp(dot(n,light)*.78+.17,0,1),tone=(back?12:18)+lit*(back?48:66)+(i%3-1)*2;
      row.surface.setAttribute('d','M'+pts.map(fmt).join('L')+'Z');row.surface.setAttribute('stroke',gray(tone-5));
      [7,0,-8].forEach((o,k)=>row.stops[k].setAttribute('stop-color',gray(tone+o)));
      for(const [k,z] of Object.entries({x1:a[0],y1:a[1],x2:c[0]+.03,y2:c[1]}))row.grad.setAttribute(k,z.toFixed(2));
      row.rim.setAttribute('d','M'+fmt(a)+'L'+fmt(d)+'L'+fmt(c));row.rim.setAttribute('stroke',gray(tone+(back?20:30)));
      let lines='';for(let j=1;j<18;j++){const t=j/18;lines+='M'+fmt(lerp2(a,b,t))+'L'+fmt(lerp2(d,c,t))}
      row.grain.setAttribute('d',lines);if(model.children[order]!==row.group)model.insertBefore(row.group,model.children[order]||null);
    });
  }
  function measure(){
    const s=stage.getBoundingClientRect(),a=hero.getBoundingClientRect();w=s.width;h=s.height;
    limits={left:a.left-s.left,right:a.right-s.left,top:a.top-s.top+5,bottom:a.bottom-s.top-5};
    svg.setAttribute('viewBox','0 0 '+Math.max(1,w)+' '+Math.max(1,h));render();
  }
  function wake(){if(!raf&&visible&&!covered&&!document.hidden)raf=requestAnimationFrame(step)}
  function step(now){raf=0;const dt=Math.min(.045,(now-(last||now))/1000);last=now;
    if(!held){if(auto)time+=dt;if(!reduced.matches){yaw+=velocity[0]*dt;pitch+=velocity[1]*dt;const damping=Math.exp(-dt*8);velocity=velocity.map(v=>v*damping)}}
    render();if(!held&&(auto||Math.abs(velocity[0])+Math.abs(velocity[1])>.006))wake();
  }
  const reset=()=>{yaw=pitch=x=y=time=0;velocity=[0,0];auto=!reduced.matches;render();wake()};
  function down(e){if(held||e.button!==0)return;e.preventDefault();auto=false;velocity=[0,0];held={id:e.pointerId,x:e.clientX,y:e.clientY,t:performance.now()};svg.setAttribute('data-held','');svg.focus({preventScroll:true});svg.setPointerCapture(e.pointerId)}
  model.addEventListener('pointerdown',down);
  svg.addEventListener('pointermove',e=>{if(!held||held.id!==e.pointerId)return;const dx=e.clientX-held.x,dy=e.clientY-held.y,now=performance.now(),dt=Math.max(.016,(now-held.t)/1000);
    x+=dx;y+=dy;yaw+=dx*.0095;pitch-=dy*.009;velocity=[clamp(dx*.003/dt,-1.6,1.6),clamp(-dy*.003/dt,-1.6,1.6)];Object.assign(held,{x:e.clientX,y:e.clientY,t:now});render()});
  function release(e){if(!held||e.pointerId!==held.id)return;if(performance.now()-held.t>75||e.type==='pointercancel')velocity=[0,0];held=null;svg.removeAttribute('data-held');if(svg.hasPointerCapture(e.pointerId))svg.releasePointerCapture(e.pointerId);last=0;wake()}
  for(const type of ['pointerup','pointercancel','lostpointercapture'])svg.addEventListener(type,release);
  svg.addEventListener('dblclick',reset);
  svg.addEventListener('keydown',e=>{if(e.key==='Home'){e.preventDefault();reset();return}if(e.key===' '){e.preventDefault();auto=!auto;wake();return}
    const v={ArrowLeft:[-1,0],ArrowRight:[1,0],ArrowUp:[0,-1],ArrowDown:[0,1]}[e.key];if(!v)return;e.preventDefault();auto=false;velocity=[0,0];if(e.shiftKey){x+=v[0]*24;y+=v[1]*24}else{yaw+=v[0]*.2;pitch-=v[1]*.2}render()});
  if(window.ResizeObserver)new ResizeObserver(measure).observe(stage);else window.addEventListener('resize',measure);
  if(window.IntersectionObserver)new IntersectionObserver(([e])=>{visible=e.isIntersecting;if(!visible&&raf){cancelAnimationFrame(raf);raf=0}else{last=0;wake()}}).observe(hero);
  document.addEventListener('visibilitychange',()=>{last=0;if(!document.hidden)wake()});
  document.addEventListener('originalfold:cover',e=>{
    covered=e.detail===true;last=0;
    if(covered){
      if(raf){cancelAnimationFrame(raf);raf=0}
      if(held){const id=held.id;held=null;svg.removeAttribute('data-held');if(svg.hasPointerCapture(id))svg.releasePointerCapture(id)}
      velocity=[0,0];
    }else wake();
  });
  reduced.addEventListener?.('change',()=>{if(reduced.matches){auto=false;velocity=[0,0]}render();wake()});
  measure();wake();
})();
