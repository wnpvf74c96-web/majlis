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
 function addScript(src,id,next){const old=document.getElementById(id);if(old)old.remove();const s=document.createElement('script');s.id=id;s.src=src;s.onload=()=>next?.();document.body.appendChild(s)}
 function loadV15(){
  addCss('./board.css?v=15','majlisBoardCss');
  addCss('./chat-mobile.css?v=15','majlisChatMobileCss');
  addScript('./deep-chat.js?v=15','majlisDeepChatScript',()=>
   addScript('./chat-rescue.js?v=15','majlisChatRescueScript',()=>
    addScript('./board.js?v=15','majlisBoardScript')));
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',loadV15);else loadV15();
})();