(()=>{
 const previous=window.fetch.bind(window);
 window.fetch=function(input,init){
  const url=typeof input==='string'?input:(input&&input.url)||'';
  if(!/generativelanguage\.googleapis\.com\/.*:generateContent/.test(url)||!init?.body)return previous(input,init);
  try{
   const body=JSON.parse(init.body);const text=(body.contents||[]).flatMap(c=>c.parts||[]).map(p=>p.text||'').join('\n');
   const isLong=/COURS APPROFONDI|SÉMINAIRE D'APPROFONDISSEMENT|ÉTUDE DE CAS APPROFONDIE|COMPARAISON APPROFONDIE|CARTOGRAPHIE INTELLECTUELLE|PARCOURS DE MAÎTRISE/.test(text);
   if(isLong){body.generationConfig=body.generationConfig||{};body.generationConfig.maxOutputTokens=Math.max(Number(body.generationConfig.maxOutputTokens)||0,6500);init={...init,body:JSON.stringify(body)}}
  }catch{}
  return previous(input,init);
 };
 function addCss(href,id){const old=document.getElementById(id);if(old){old.href=href;return}const l=document.createElement('link');l.id=id;l.rel='stylesheet';l.href=href;document.head.appendChild(l)}
 function addScript(src,id,next){const old=document.getElementById(id);if(old)old.remove();const s=document.createElement('script');s.id=id;s.src=src;s.onload=()=>next?.();s.onerror=()=>next?.();document.body.appendChild(s)}
 function loadV16(){
  addCss('./board.css?v=16','majlisBoardCss');
  addScript('./chat-stable.js?v=16','majlisStableChatScript',()=>
   addScript('./board.js?v=16','majlisBoardScript'));
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',loadV16);else loadV16();
})();