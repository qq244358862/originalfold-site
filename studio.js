(() => {
  'use strict';
  const button=document.getElementById('copy-email'), status=document.getElementById('copy-status'), address='hello@tianmengdesign.com';
  let timer=0;
  button.addEventListener('click',async()=>{
    let ok=false;
    try{
      if(navigator.clipboard&&window.isSecureContext){await navigator.clipboard.writeText(address);ok=true;}
    }catch{}
    if(!ok){
      const field=document.createElement('textarea');field.value=address;field.setAttribute('readonly','');field.style.cssText='position:fixed;left:-9999px;top:0';document.body.appendChild(field);field.select();
      try{ok=document.execCommand('copy');}catch{}field.remove();button.focus({preventScroll:true});
    }
    clearTimeout(timer);status.textContent=ok?'邮箱已复制':'请选中邮箱地址复制';button.querySelector('use').setAttribute('href',ok?'#ic-check':'#ic-copy');
    timer=setTimeout(()=>{status.textContent='';button.querySelector('use').setAttribute('href','#ic-copy');},2600);
  });
})();
