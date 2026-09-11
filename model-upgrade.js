(()=>{
  const SETTINGS_KEY='majlis.settings';
  const PREFERRED='gemini-3.8-flash';
  const FALLBACKS=['gemini-3.8-flash','gemini-3.7-flash','gemini-3.6-flash'];

  // Migre automatiquement les anciens réglages Gemini 2.5.
  try{
    const saved=JSON.parse(localStorage.getItem(SETTINGS_KEY)||'{}');
    if(!saved.model || /^gemini-2\.5/.test(saved.model)){
      saved.model=PREFERRED;
      localStorage.setItem(SETTINGS_KEY,JSON.stringify(saved));
    }
  }catch{}

  // Protection contre les retraits de modèles : si Google désactive le modèle
  // sélectionné, Majlis essaie automatiquement les Flash stables suivants.
  const nativeFetch=window.fetch.bind(window);
  window.fetch=async function(input,init){
    const url=typeof input==='string'?input:(input&&input.url)||'';
    const match=url.match(/\/models\/([^/:]+):generateContent/);
    if(!match) return nativeFetch(input,init);

    const requested=decodeURIComponent(match[1]);
    const candidates=[requested,...FALLBACKS.filter(m=>m!==requested)];
    let lastResponse=null;

    for(const model of candidates){
      const nextUrl=url.replace(/\/models\/[^/:]+:generateContent/,`/models/${encodeURIComponent(model)}:generateContent`);
      const nextInput=typeof input==='string'?nextUrl:nextUrl;
      const response=await nativeFetch(nextInput,init);
      if(response.ok){
        if(model!==requested){
          try{
            const saved=JSON.parse(localStorage.getItem(SETTINGS_KEY)||'{}');
            saved.model=model;
            localStorage.setItem(SETTINGS_KEY,JSON.stringify(saved));
          }catch{}
          setTimeout(()=>{
            const select=document.getElementById('model');
            if(select && [...select.options].some(o=>o.value===model)) select.value=model;
            const status=document.getElementById('status');
            if(status) status.textContent=`Modèle mis à jour automatiquement vers ${model}.`;
          },0);
        }
        return response;
      }

      lastResponse=response;
      let message='';
      try{message=(await response.clone().json())?.error?.message||''}catch{}
      const unavailable=response.status===404 || /no longer available|not found|deprecated|not supported|model.+available/i.test(message);
      if(!unavailable) return response;
    }
    return lastResponse;
  };
})();
