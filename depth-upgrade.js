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
})();