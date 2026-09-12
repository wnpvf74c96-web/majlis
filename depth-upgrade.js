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
 function addCss(href,id){if(document.getElementById(id))return;const l=document.createElement('link');l.id=id;l.rel='stylesheet';l.href=href;document.head.appendChild(l)}
 function addScript(src,id,next){if(document.getElementById(id)){next?.();return}const s=document.createElement('script');s.id=id;s.src=src;s.onload=()=>next?.();document.body.appendChild(s)}
 function loadV14(){
  addCss('./board.css?v=14','majlisBoardCss');
  addCss('./chat-mobile.css?v=14','majlisChatMobileCss');
  addScript('./deep-chat.js?v=14','majlisDeepChatScript',()=>
   addScript('./chat-rescue.js?v=14','majlisChatRescueScript',()=>
    addScript('./board.js?v=14','majlisBoardScript')));
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',loadV14);else loadV14();
})();