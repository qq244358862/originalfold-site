/* A continuous strip of two-sided paper. Each shared seam is a real hinge. */
(() => {
  'use strict';
  const canvas = document.querySelector('#sculpture'), frame = document.querySelector('.instrument');
  const ctx = canvas.getContext && canvas.getContext('2d');
  if (!ctx) return;
  const range = document.querySelector('#fold-range'), value = document.querySelector('#fold-value');
  const toggle = document.querySelector('#fold-action'), motion = document.querySelector('#motion');
  const angle = document.querySelector('#angle'), reduce = matchMedia('(prefers-reduced-motion: reduce)');
  const clamp=(x,a,b)=>Math.max(a,Math.min(b,x)), mix=(a,b,t)=>a+(b-a)*t, rad=x=>x*Math.PI/180;
  const dot=(a,b)=>a[0]*b[0]+a[1]*b[1]+a[2]*b[2];
  const sub=(a,b)=>a.map((v,i)=>v-b[i]), add=(a,b)=>a.map((v,i)=>v+b[i]), times=(a,t)=>a.map(v=>v*t);
  const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
  const norm=a=>{const l=Math.sqrt(dot(a,a))||1;return times(a,1/l);};
  function spin(p, o, u, a) {
    const v=sub(p,o), c=Math.cos(a), s=Math.sin(a);
    return add(o,add(add(times(v,c),times(cross(u,v),s)),times(u,dot(u,v)*(1-c))));
  }
  const widths=[1.82,1.84,2.02,1.95,1.87,1.93,1.70,1.44];
  const skew=[-.36,.39,-.52,.38,-.31,.51,-.41,.31];
  const pitch=[.21,.07,-.17,-.22,-.07,.10,.24,.06];
  const hinges=[-108,127,-113,121,-105,95];
  function paper(amount){
    const seams=widths.map((w,j)=>{
      const k=skew[j],x=j*1.08-3.78,y=pitch[j];
      return [[x+k,y-w/2,0],[x-k,y+w/2,0]];
    });
    for(let j=1;j<seams.length-1;j++){
      const a=seams[j][0], u=norm(sub(seams[j][1],a)), t=rad(hinges[j-1])*amount;
      for(let k=j+1;k<seams.length;k++) seams[k]=seams[k].map(p=>spin(p,a,u,t));
    }
    return seams;
  }
  const base=[.95,.96,.95]; // base paper is tinted per facet, under a fixed studio light
  const light=norm([-.46,-.74,1]), highlight=norm([.5,-.45,.8]);
  let w=1,h=1,dpr=1,fold=.83,target=.83,mode=!reduce.matches,turn=0,tilt=0,vx=0,vy=0;
  let last=0,time=0,id=0,visible=true,drag=null,focus=false,lastPct=-1,lastAngle=-1;
  const dirt=Array.from({length:36},(_,i)=>[i/35,.72+((i*17)%11)/60]);
  function tint(values,amt=0){return 'rgb('+values.map((c,i)=>Math.round(clamp(c+amt*base[i],0,255))).join(',')+')';}
  function path(points){ctx.beginPath();ctx.moveTo(points[0][0],points[0][1]);for(let i=1;i<points.length;i++)ctx.lineTo(points[i][0],points[i][1]);ctx.closePath();}
  function bilerp(a,b,c,d,u,v){return a.map((_,i)=>mix(mix(a[i],b[i],u),mix(d[i],c[i],u),v));}
  function render(){
    if(w<4||h<4)return;
    ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,w,h);
    const seams=paper(fold), all=seams.flat(), center=times(all.reduce((a,p)=>add(a,p),[0,0,0]),1/all.length);
    const yaw=rad(-11)+turn+Math.sin(time*.30)*.105,pit=rad(-21)+tilt+Math.sin(time*.23)*.065,roll=rad(-19)+Math.sin(time*.23)*.026;
    const cY=Math.cos(yaw),sY=Math.sin(yaw),cP=Math.cos(pit),sP=Math.sin(pit),cR=Math.cos(roll),sR=Math.sin(roll);
    function view(p){const v=sub(p,center),x=cY*v[0]+sY*v[2],z=-sY*v[0]+cY*v[2],y=cP*v[1]-sP*z;return [cR*x-sR*y,sR*x+cR*y,sP*v[1]+cP*z];}
    const vs=seams.map(s=>s.map(view)), persp=p=>[p[0]*12/(12-p[2]),p[1]*12/(12-p[2])];
    const raw=vs.flat().map(persp);
    const xs=raw.map(p=>p[0]),ys=raw.map(p=>p[1]);
    const xmin=Math.min(...xs),xmax=Math.max(...xs),ymin=Math.min(...ys),ymax=Math.max(...ys);
    // Preserve breathing room and cap the lens scale so the volume never lunges toward the viewer.
    const scale=Math.min(w*.82/(xmax-xmin||1),h*.68/(ymax-ymin||1),w*.195,h*.31);
    const mx=(xmax+xmin)/2,my=(ymax+ymin)/2, screen=p=>{const q=persp(p);return [w*.5+(q[0]-mx)*scale,h*.525+(q[1]-my)*scale]}; 
    const shadowW=Math.max(w*.31,(xmax-xmin)*scale*.77),shadowY=Math.min(h*.882,h*.555+(ymax-ymin)*scale*.47);
    ctx.save();ctx.translate(w*.518,shadowY);ctx.scale(shadowW/2,h*.053);
    const shadow=ctx.createRadialGradient(0,0,0,0,0,1);shadow.addColorStop(0,'rgba(49,48,77,.23)');shadow.addColorStop(.46,'rgba(77,76,100,.11)');shadow.addColorStop(1,'rgba(70,70,90,0)');ctx.fillStyle=shadow;ctx.fillRect(-1,-1,2,2);ctx.restore();
    const faces=[];
    for(let j=0;j<vs.length-1;j++){
      const q=[vs[j][0],vs[j+1][0],vs[j+1][1],vs[j][1]];
      faces.push({j,q,dep:q.reduce((a,p)=>a+p[2],0)/4});
    }
    faces.sort((a,b)=>a.dep-b.dep);
    for(const f of faces){
      const q=f.q,j=f.j,sp=q.map(screen),n0=norm(cross(sub(q[1],q[0]),sub(q[3],q[0])));
      const back=n0[2]<0, n=back?times(n0,-1):n0;
      const strength=clamp(dot(n,light)*.79+.22,0,1), glint=Math.max(0,dot(n,highlight));
      const bright=back?[155,161,234]:[187,191,255],dark=back?[44,47,112]:[55,62,153];
      const col=bright.map((v,k)=>mix(dark[k],v,strength)+(j%3-1)*2);
      const grad=ctx.createLinearGradient(sp[0][0],sp[0][1],sp[2][0]+.01,sp[2][1]);
      grad.addColorStop(0,tint(col,5+glint*6));grad.addColorStop(.56,tint(col));grad.addColorStop(1,tint(col,-9));
      path(sp);ctx.fillStyle=grad;ctx.fill();ctx.lineJoin='round';ctx.strokeStyle='rgba(40,43,101,.77)';ctx.lineWidth=.72;ctx.stroke();
      ctx.save();path(sp);ctx.clip();
      const [a,b,c,d]=q;
      // Fine cross-grain of the stock (fixed to the surface, even during rotation).
      ctx.lineWidth=.50;
      for(const [u,op] of dirt){
        const p0=screen(bilerp(a,b,c,d,u,0)),p1=screen(bilerp(a,b,c,d,u,1));
        ctx.beginPath();ctx.moveTo(...p0);ctx.lineTo(...p1);ctx.strokeStyle='rgba(236,238,255,'+(back?.034:op*.075)+')';ctx.stroke();
      }
      if(j===0||j===3||j===6){
        // A faint manufacturing guide on alternating panels.
        ctx.beginPath();const u=j%2?.77:.20;ctx.moveTo(...screen(bilerp(a,b,c,d,0,u)));ctx.lineTo(...screen(bilerp(a,b,c,d,1,u)));
        ctx.setLineDash([2.6,3.4]);ctx.strokeStyle='rgba(228,232,255,.29)';ctx.lineWidth=.8;ctx.stroke();ctx.setLineDash([]);
      }
      ctx.restore();
      ctx.beginPath();ctx.moveTo(...sp[0]);ctx.lineTo(...sp[3]);ctx.strokeStyle='rgba(234,237,255,.73)';ctx.lineWidth=1.05;ctx.stroke();
      ctx.beginPath();ctx.moveTo(...sp[3]);ctx.lineTo(...sp[2]);ctx.strokeStyle=back?'rgba(178,184,248,.58)':'rgba(225,227,255,.60)';ctx.lineWidth=.86;ctx.stroke();
    }
    const pct=Math.round(fold*100),deg=Math.round(fold*115);
    if(pct!==lastPct){lastPct=pct;range.value=pct;range.style.setProperty('--fill',pct+'%');value.value=pct+'%';}
    if(deg!==lastAngle){lastAngle=deg;angle.textContent=String(deg).padStart(3,'0')+'°';}
    frame.classList.add('rendering');
  }
  function wake(){if(!id&&visible&&!document.hidden)id=requestAnimationFrame(tick);}
  function tick(now){id=0;const dt=Math.min(.05,(now-(last||now))/1000);last=now;
    if(mode&&!drag)time+=dt;const moving=Math.abs(target-fold)>.00022;
    if(moving)fold=reduce.matches?target:mix(fold,target,1-Math.exp(-dt*9));else fold=target;
    if(!drag){if(!reduce.matches){turn+=vx*dt;tilt=clamp(tilt+vy*dt,-1.03,1.03);vx*=Math.exp(-dt*7);vy*=Math.exp(-dt*7);}else{vx=vy=0;}}
    render();if(mode||moving||Math.abs(vx)+Math.abs(vy)>.002)wake();
  }
  function resize(){const rect=canvas.getBoundingClientRect();w=rect.width;h=rect.height;dpr=Math.min(devicePixelRatio||1,2.1);canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr);render();wake();}
  function setTarget(t,instant=false){target=clamp(t,0,1);if(instant||reduce.matches){fold=target;render();}toggle.querySelector('span').textContent=target>.46?'展开纸面':'折起纸面';wake();}
  function setMode(v){mode=v;const label=v?'暂停转动':'继续转动';motion.title=label;motion.setAttribute('aria-label',label);motion.querySelector('use').setAttribute('href',v?'#ic-pause':'#ic-play');last=0;wake();}
  toggle.addEventListener('click',()=>setTarget(target>.46?.04:.90));
  range.addEventListener('input',e=>setTarget(Number(e.target.value)/100,true));
  motion.addEventListener('click',()=>setMode(!mode));
  canvas.addEventListener('pointerdown',e=>{if(e.button!==0||drag)return;drag={id:e.pointerId,x:e.clientX,y:e.clientY,t:performance.now(),decided:e.pointerType==='mouse',sx:e.clientX,sy:e.clientY};vx=vy=0;canvas.classList.add('dragging');if(e.pointerType==='mouse')canvas.setPointerCapture(e.pointerId);wake();});
  canvas.addEventListener('pointermove',e=>{if(!drag||e.pointerId!==drag.id)return;
    if(!drag.decided){const dx=Math.abs(e.clientX-drag.sx),dy=Math.abs(e.clientY-drag.sy);if(Math.max(dx,dy)<5)return;if(dy>dx*1.2){end(e);return;}drag.decided=true;canvas.setPointerCapture(e.pointerId);}
    const dx=e.clientX-drag.x,dy=e.clientY-drag.y,now=performance.now(),dt=Math.max(.012,(now-drag.t)/1000);
    turn+=dx*.009;tilt=clamp(tilt-dy*.0075,-1.03,1.03);vx=clamp(dx*.005/dt,-2,2);vy=clamp(-dy*.003/dt,-1.4,1.4);Object.assign(drag,{x:e.clientX,y:e.clientY,t:now});render();wake();
  });
  function end(e){if(!drag||e.pointerId!==drag.id)return;if(performance.now()-drag.t>90){vx=vy=0;}drag=null;canvas.classList.remove('dragging');if(canvas.hasPointerCapture(e.pointerId))canvas.releasePointerCapture(e.pointerId);wake();}
  canvas.addEventListener('pointerup',end);canvas.addEventListener('pointercancel',end);canvas.addEventListener('lostpointercapture',end);
  canvas.addEventListener('keydown',e=>{const k=e.key;if(!['ArrowRight','ArrowLeft','ArrowUp','ArrowDown',' ','Home'].includes(k))return;e.preventDefault();if(k===' '){setMode(!mode);return;}if(k==='Home'){turn=tilt=vx=vy=0;setTarget(.83);return;}if(k==='ArrowLeft')turn-=.16;if(k==='ArrowRight')turn+=.16;if(k==='ArrowUp')tilt=clamp(tilt+.12,-1.03,1.03);if(k==='ArrowDown')tilt=clamp(tilt-.12,-1.03,1.03);render();wake();});
  if('ResizeObserver' in window)new ResizeObserver(resize).observe(canvas);else window.addEventListener('resize',resize);
  if('IntersectionObserver' in window)new IntersectionObserver(([e])=>{visible=e.isIntersecting;if(!visible&&id){cancelAnimationFrame(id);id=0;}else{last=0;wake();}}).observe(frame);
  document.addEventListener('visibilitychange',()=>{if(document.hidden&&id){cancelAnimationFrame(id);id=0;}else{last=0;wake();}});
  reduce.addEventListener?.('change',()=>{if(reduce.matches)setMode(false);});
  resize();setMode(mode);
})();
