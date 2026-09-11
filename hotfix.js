(()=>{
  const $=id=>document.getElementById(id);
  const input=$('apiKey');
  const test=$('testApi');
  const saveBtn=$('saveSettings');
  const status=$('status');
  const badge=$('apiState');
  if(!input||!test)return;

  const setStatus=(txt,ok=false)=>{
    if(status) status.textContent=txt;
    if(badge&&ok){badge.textContent='Gemini connecté';badge.className='badge ok';}
  };

  input.addEventListener('input',()=>{
    if(input.value.trim().length>10) setStatus('Clé détectée. Appuie sur « Tester Gemini ».');
  });

  test.onclick=async()=>{
    const key=input.value.trim();
    const model=$('model')?.value||'gemini-2.5-flash';
    const profile=$('profile')?.value.trim()||'';
    if(!key){setStatus('Colle d’abord ta clé Gemini.');return;}
    test.disabled=true;
    test.textContent='Test…';
    setStatus('Connexion à Gemini…');
    try{
      const r=await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}`,{headers:{'x-goog-api-key':key}});
      if(!r.ok){const d=await r.json().catch(()=>({}));throw new Error(d?.error?.message||`Erreur ${r.status}`);}
      localStorage.setItem('majlis.settings',JSON.stringify({apiKey:key,model,profile}));
      setStatus('Gemini connecté ✓',true);
      test.textContent='Connecté ✓';
      setTimeout(()=>location.reload(),700);
    }catch(e){
      setStatus(`Clé refusée : ${e.message||'vérifie la clé'}`);
      test.textContent='Tester Gemini';
      test.disabled=false;
    }
  };

  if(saveBtn){
    const original=saveBtn.onclick;
    saveBtn.onclick=()=>{
      if(!input.value.trim()){setStatus('Colle d’abord ta clé Gemini.');return;}
      original?.();
    };
  }
})();
