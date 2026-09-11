(()=>{
  const SETTINGS_KEY='majlis.settings';
  const PREFERRED='gemini-3.8-flash';
  const FALLBACKS=['gemini-3.8-flash','gemini-3.7-flash','gemini-3.6-flash'];
  const sleep=ms=>new Promise(r=>setTimeout(r,ms));

  try{
    const saved=JSON.parse(localStorage.getItem(SETTINGS_KEY)||'{}');
    if(!saved.model || /^gemini-2\.5/.test(saved.model)){
      saved.model=PREFERRED;
      localStorage.setItem(SETTINGS_KEY,JSON.stringify(saved));
    }
  }catch{}

  function updateModel(model,requested){
    if(model===requested)return;
    try{
      const saved=JSON.parse(localStorage.getItem(SETTINGS_KEY)||'{}');
      saved.model=model;
      localStorage.setItem(SETTINGS_KEY,JSON.stringify(saved));
    }catch{}
    setTimeout(()=>{
      const select=document.getElementById('model');
      if(select && [...select.options].some(o=>o.value===model)) select.value=model;
      const status=document.getElementById('status');
      if(status) status.textContent=`Gemini saturé : bascule automatique vers ${model}.`;
    },0);
  }

  async function readMessage(response){
    try{return (await response.clone().json())?.error?.message||''}catch{return ''}
  }

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
      for(let attempt=0;attempt<2;attempt++){
        if(attempt>0) await sleep(700);
        const response=await nativeFetch(nextUrl,init);
        if(response.ok){
          updateModel(model,requested);
          return response;
        }
        lastResponse=response;
        const message=await readMessage(response);
        const unavailable=response.status===404 || /no longer available|not found|deprecated|not supported|model.+available/i.test(message);
        const overloaded=response.status===500 || response.status===502 || response.status===503 || /high demand|overload|temporar(?:ily|y) unavailable|try again later|capacity/i.test(message);
        if(!unavailable && !overloaded) return response;
        if(unavailable) break;
      }
    }
    return lastResponse;
  };

  function loadContinuity(){
    if(document.querySelector('script[data-majlis-continuity]'))return;
    const s=document.createElement('script');s.src='./continuity.js?v=8';s.async=false;s.dataset.majlisContinuity='1';document.head.appendChild(s);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',loadContinuity,{once:true});else loadContinuity();
})();
