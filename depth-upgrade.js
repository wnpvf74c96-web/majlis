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
 function addScript(src,id,next){if(document.getElementById(id)){next?.();return}const s=document.createElement('script');s.id=id;s.src=src;s.onload=()=>next?.();document.body.appendChild(s)}
 function ensureIcon(){
  let touch=document.querySelector('link[rel="apple-touch-icon"]');
  if(!touch){touch=document.createElement('link');touch.rel='apple-touch-icon';document.head.appendChild(touch)}
  touch.href='./icons/apple-touch-icon.png?v=18';
  let icon=document.querySelector('link[rel="icon"]');
  if(!icon){icon=document.createElement('link');icon.rel='icon';document.head.appendChild(icon)}
  icon.href='./icon.svg?v=18';icon.type='image/svg+xml';
  const theme=document.querySelector('meta[name="theme-color"]');if(theme)theme.content='#0d1015';
 }
 function loadV18(){
  ensureIcon();
  addCss('./theme-light.css?v=18','majlisLightThemeCss');
  addCss('./board.css?v=17','majlisBoardCss');
  addScript('./deep-chat.js?v=17','majlisDeepChatScript',()=>addScript('./board.js?v=17','majlisBoardScript'));
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',loadV18);else loadV18();
})();