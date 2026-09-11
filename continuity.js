(()=>{
const $=id=>document.getElementById(id);
const CKEY='majlis.continuity';
const SETTINGS='majlis.settings';
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const load=(k,d)=>{try{return JSON.parse(localStorage.getItem(k))??d}catch{return d}};
const save=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v));return true}catch{return false}};
let state=Object.assign({lastAction:null,lastSave:Date.now(),lastError:'',requests:0},load(CKEY,{}));

function fmtTime(ts){try{return new Date(ts).toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'})}catch{return ''}}
function setText(id,text){const e=$(id);if(e)e.textContent=text}
function setLongStatus(text,kind=''){const e=$('continuityRuntime');if(!e)return;e.textContent=text;e.className='continuity-runtime '+kind}
function render(){
  const online=navigator.onLine;
  setText('continuityNet',online?'En ligne':'Hors ligne');
  const n=$('continuityNet');if(n)n.className='continuity-pill '+(online?'ok':'bad');
  setText('continuitySave',`Sauvegarde auto · ${fmtTime(state.lastSave)}`);
  const r=$('resumeGeneration');if(r)r.hidden=!state.lastAction;
  if(!online)setLongStatus('Connexion perdue : ton travail local reste sauvegardé.','bad');
  else if(state.lastError)setLongStatus(state.lastError,'warn');
  else setLongStatus('Continuité active : Majlis sauvegarde le travail et réessaie les appels Gemini temporaires.','ok');
}
function markSaved(){state.lastSave=Date.now();save(CKEY,state);render()}
let saveTimer=null;
function scheduleMark(){clearTimeout(saveTimer);saveTimer=setTimeout(markSaved,700)}

function captureAction(target){
  if(!target)return;
  const known=['launch','deeper','challenge','quiz','startDebate','sendReply','verdict','askProject'];
  const ai=target.closest?.('[data-ai]');
  const el=ai||target.closest?.('button');
  if(!el)return;
  const id=ai?`ai:${ai.dataset.ai}`:el.id;
  if(!id||(!known.includes(id)&&!id.startsWith('ai:')))return;
  state.lastAction={
    id,
    ts:Date.now(),
    topic:$('topic')?.value||'',
    angle:$('angle')?.value||'',
    level:$('level')?.value||'',
    depth:$('depth')?.value||'',
    debateTopic:$('debateTopic')?.value||'',
    debateReply:$('debateReply')?.value||'',
    projectQuestion:$('projectQuestion')?.value||''
  };
  save(CKEY,state);render();
}
function clearAction(){state.lastAction=null;state.lastError='';save(CKEY,state);render()}
function resumeLast(){
  const a=state.lastAction;if(!a)return;
  if($('topic')&&a.topic)$('topic').value=a.topic;
  if($('angle'))$('angle').value=a.angle||'';
  if($('level')&&a.level)$('level').value=a.level;
  if($('depth')&&a.depth)$('depth').value=a.depth;
  if($('debateTopic')&&a.debateTopic)$('debateTopic').value=a.debateTopic;
  if($('debateReply')&&a.debateReply)$('debateReply').value=a.debateReply;
  if($('projectQuestion')&&a.projectQuestion)$('projectQuestion').value=a.projectQuestion;
  let btn=null;
  if(a.id.startsWith('ai:'))btn=document.querySelector(`[data-ai="${CSS.escape(a.id.slice(3))}"]`);
  else btn=$(a.id);
  if(btn){state.lastError='Reprise de la dernière génération…';save(CKEY,state);render();btn.click();}
}

async function readMessage(response){try{return (await response.clone().json())?.error?.message||''}catch{return ''}}
const previousFetch=window.fetch.bind(window);
window.fetch=async function(input,init){
  const url=typeof input==='string'?input:(input&&input.url)||'';
  const isGemini=/generativelanguage\.googleapis\.com\/.*:generateContent/.test(url);
  if(!isGemini)return previousFetch(input,init);
  state.requests=(state.requests||0)+1;save(CKEY,state);
  const delays=[0,3000,8000];
  let lastResponse=null,lastError=null;
  for(let i=0;i<delays.length;i++){
    if(i>0){
      const sec=Math.round(delays[i]/1000);
      state.lastError=`Gemini occupé : nouvel essai automatique dans ${sec} s…`;
      save(CKEY,state);render();
      await sleep(delays[i]);
    }
    try{
      const res=await previousFetch(input,init);
      if(res.ok){clearAction();return res;}
      lastResponse=res;
      const msg=await readMessage(res);
      const transient=[429,500,502,503,504].includes(res.status)||/high demand|overload|temporar|try again|capacity|resource exhausted|rate limit|too many requests/i.test(msg);
      if(!transient)return res;
      if(i===delays.length-1){state.lastError='Gemini reste momentanément indisponible. Ton travail est sauvegardé : utilise « Reprendre » plus tard.';save(CKEY,state);render();}
    }catch(e){
      if(e?.name==='AbortError')throw e;
      lastError=e;
      if(i===delays.length-1){state.lastError='Réseau interrompu. Rien n’est perdu : utilise « Reprendre » quand la connexion revient.';save(CKEY,state);render();}
    }
  }
  if(lastResponse)return lastResponse;
  throw lastError||new Error('Connexion Gemini indisponible');
};

function collectBackup(){
  const data={version:1,created:new Date().toISOString(),items:{}};
  for(let i=0;i<localStorage.length;i++){
    const key=localStorage.key(i);if(!key||!key.startsWith('majlis.'))continue;
    if(key===CKEY)continue;
    let raw=localStorage.getItem(key);
    if(key===SETTINGS){
      try{const s=JSON.parse(raw||'{}');delete s.apiKey;raw=JSON.stringify(s)}catch{}
    }
    data.items[key]=raw;
  }
  return data;
}
function exportBackup(){
  const blob=new Blob([JSON.stringify(collectBackup(),null,2)],{type:'application/json'});
  const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=`majlis-backup-${new Date().toISOString().slice(0,10)}.json`;document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove()},1200);
  setLongStatus('Sauvegarde exportée. Garde ce fichier dans Fichiers/iCloud.','ok');
}
async function importBackup(file){
  if(!file)return;
  try{
    const text=await file.text();const data=JSON.parse(text);if(!data?.items)throw new Error('Fichier invalide');
    const currentSettings=load(SETTINGS,{});const apiKey=currentSettings.apiKey||'';
    Object.entries(data.items).forEach(([key,raw])=>{if(!key.startsWith('majlis.'))return;if(key===SETTINGS){try{const s=JSON.parse(raw||'{}');s.apiKey=apiKey;localStorage.setItem(key,JSON.stringify(s))}catch{}}else localStorage.setItem(key,String(raw))});
    setLongStatus('Sauvegarde restaurée. Majlis va se recharger…','ok');setTimeout(()=>location.reload(),700);
  }catch(e){setLongStatus(`Import impossible : ${e.message}`,'bad')}
}

function bind(){
  document.addEventListener('click',e=>captureAction(e.target),true);
  document.addEventListener('input',scheduleMark,true);
  document.addEventListener('change',scheduleMark,true);
  window.addEventListener('online',()=>{state.lastError='';save(CKEY,state);render()});
  window.addEventListener('offline',render);
  window.addEventListener('pagehide',markSaved);
  document.addEventListener('visibilitychange',()=>{if(document.hidden)markSaved();else render()});
  $('resumeGeneration')?.addEventListener('click',resumeLast);
  $('exportMajlis')?.addEventListener('click',exportBackup);
  $('importMajlis')?.addEventListener('click',()=>$('importMajlisFile')?.click());
  $('importMajlisFile')?.addEventListener('change',e=>importBackup(e.target.files?.[0]));
}
function init(){bind();markSaved();setInterval(markSaved,30000);}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
