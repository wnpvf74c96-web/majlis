(()=>{
const $=id=>document.getElementById(id);
const PKEY='majlis.workspace.projects', IKEY='majlis.workspace.inbox', HKEY='majlis.history', DKEY='majlis.draft', RSEEN='majlis.radar.lastSeen';
const load=(k,d)=>{try{return JSON.parse(localStorage.getItem(k))??d}catch{return d}};
const save=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v));return true}catch{return false}};
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let radarData=null, radarExpanded=false;

function greeting(){const h=new Date().getHours();return h<12?'Bonjour':h<18?'Bon après-midi':'Bonsoir'}
function fmtDate(){return new Intl.DateTimeFormat('fr-FR',{weekday:'long',day:'numeric',month:'long'}).format(new Date())}
function fmtAgo(iso){if(!iso)return'';const d=new Date(iso),m=Math.max(0,Math.round((Date.now()-d)/60000));if(m<2)return'à l’instant';if(m<60)return`il y a ${m} min`;const h=Math.round(m/60);if(h<24)return`il y a ${h} h`;const j=Math.round(h/24);return`il y a ${j} j`}
function projects(){return load(PKEY,[])}
function history(){return load(HKEY,[])}
function inbox(){return load(IKEY,[])}

function renderStats(){
 const ps=projects(), active=ps.filter(p=>p.status==='active'), pending=ps.flatMap(p=>(p.tasks||[]).filter(t=>!t.done).map(t=>({p,t}))), notes=inbox(), hist=history();
 $('dashGreeting').textContent=`${greeting()}.`;$('dashDate').textContent=fmtDate();
 $('statProjects').textContent=active.length;$('statTasks').textContent=pending.length;$('statNotes').textContent=notes.length;$('statStudies').textContent=hist.length;
 const pri=$('dashPriorities');pri.innerHTML='';
 const sorted=pending.sort((a,b)=>new Date(b.p.updated||0)-new Date(a.p.updated||0)).slice(0,3);
 if(!sorted.length){pri.innerHTML='<div class="dash-empty">Aucune tâche en attente. Ajoute une prochaine action dans un projet.</div>'}
 else sorted.forEach((x,i)=>{const d=document.createElement('div');d.className='dash-task';d.innerHTML=`<i>${i+1}</i><div><b>${esc(x.t.text)}</b><small>${esc(x.p.name)}</small></div>`;d.onclick=()=>openProjectByName(x.p.name);pri.appendChild(d)})
 renderContinue(active,hist);
}
function renderContinue(active,hist){
 const wrap=$('dashContinue');wrap.innerHTML='';
 const p=[...active].sort((a,b)=>new Date(b.updated||0)-new Date(a.updated||0))[0];
 if(p){const d=document.createElement('div');d.className='dash-continue-item';d.innerHTML=`<b>Projet · ${esc(p.name)}</b><small>${esc(p.goal||'Objectif à préciser')} · ${fmtAgo(p.updated)}</small><div class="dash-mini-actions"><button class="ghost" type="button">Reprendre le projet</button></div>`;d.querySelector('button').onclick=()=>openProjectByName(p.name);wrap.appendChild(d)}
 const h=hist[0];const draft=load(DKEY,null);const study=h||((draft&&draft.topic)?{topic:draft.topic,date:null}:null);
 if(study){const d=document.createElement('div');d.className='dash-continue-item';d.innerHTML=`<b>Étude · ${esc(study.topic||'Dernier sujet')}</b><small>${study.date?fmtAgo(study.date):'Brouillon en cours'}</small><div class="dash-mini-actions"><button class="ghost" type="button">Reprendre l’étude</button></div>`;d.querySelector('button').onclick=()=>openStudy(study.topic);wrap.appendChild(d)}
 if(!wrap.children.length)wrap.innerHTML='<div class="dash-empty">Commence une étude ou crée ton premier projet : Majlis te proposera ensuite quoi reprendre.</div>';
}
function openProjectByName(name){
 $('workspacePanel')?.scrollIntoView({behavior:'smooth',block:'start'});
 setTimeout(()=>{const cards=[...document.querySelectorAll('.project-card')];const c=cards.find(x=>x.textContent.includes(name));c?.click()},350)
}
function openStudy(topic){if($('topic'))$('topic').value=topic||'';$('normalPanel')?.scrollIntoView({behavior:'smooth',block:'center'});setTimeout(()=>$('topic')?.focus(),350)}
function commandStudy(){const v=$('dashCommand').value.trim();if(!v)return;openStudy(v)}
function commandCapture(){const v=$('dashCommand').value.trim();if(!v)return;const list=inbox();list.unshift({id:Date.now().toString(36)+Math.random().toString(36).slice(2,6),text:v,ts:Date.now()});save(IKEY,list.slice(0,60));$('dashCommand').value='';renderStats();setDashStatus('Ajouté au carnet ✓','ok');setTimeout(()=>location.hash='',20)}
function setDashStatus(t,kind=''){const e=$('dashStatus');if(!e)return;e.textContent=t;e.className='radar-status '+kind;setTimeout(()=>{if(e.textContent===t)e.textContent=''},2600)}

function kindLabel(k){return k==='opportunity'?'Opportunité':k==='new'?'Nouveauté':'Actualité'}
function renderRadar(){
 const wrap=$('radarFeed'),meta=$('radarMeta');if(!wrap||!meta)return;
 if(!radarData){wrap.innerHTML='<div class="dash-empty">Chargement de la veille…</div>';return}
 meta.innerHTML=(radarData.topics||[]).map(t=>`<span class="radar-chip">${esc(t.label)}</span>`).join('');
 const seen=Number(localStorage.getItem(RSEEN)||0);const items=(radarData.items||[]).slice(0,radarExpanded?12:4);wrap.innerHTML='';
 if(!items.length){wrap.innerHTML='<div class="dash-empty">La première veille est en préparation. GitHub l’actualise automatiquement toutes les 6 heures.</div>';return}
 items.forEach(item=>{const a=document.createElement('a');a.className='radar-item';a.href=item.url;a.target='_blank';a.rel='noopener noreferrer';const isNew=new Date(item.published).getTime()>seen;a.innerHTML=`<div class="radar-item-top"><span class="radar-kind ${item.kind==='opportunity'?'opportunity':''}">${kindLabel(item.kind)}</span>${isNew?'<span class="radar-new">NOUVEAU</span>':''}</div><b>${esc(item.title)}</b><p>${esc(item.topicLabel||'Veille Majlis')}</p><small>${esc(item.source||'Source web')} · ${fmtAgo(item.published)}</small>`;wrap.appendChild(a)});
 $('radarGenerated').textContent=radarData.generatedAt?`Mise à jour ${fmtAgo(radarData.generatedAt)}`:'Initialisation de la veille';
 $('radarMore').hidden=(radarData.items||[]).length<=4;$('radarMore').textContent=radarExpanded?'Réduire':'Voir plus';
}
async function loadRadar(manual=false){
 const btn=$('radarRefresh');if(btn){btn.disabled=true;btn.textContent='Actualisation…'}
 try{const r=await fetch(`./radar.json?t=${Date.now()}`,{cache:'no-store'});if(!r.ok)throw new Error(`HTTP ${r.status}`);radarData=await r.json();renderRadar();if(manual)setDashStatus('Radar actualisé ✓','ok')}
 catch(e){setDashStatus('Veille indisponible pour le moment.','bad');const wrap=$('radarFeed');if(wrap&&!radarData)wrap.innerHTML='<div class="dash-empty">Impossible de charger la veille. Tes autres données restent disponibles hors ligne.</div>'}
 finally{if(btn){btn.disabled=false;btn.textContent='Actualiser'}}
}
function markRadarSeen(){localStorage.setItem(RSEEN,String(Date.now()));renderRadar();setDashStatus('Alertes marquées comme vues.','ok')}
function bind(){
 $('dashStudy').onclick=commandStudy;$('dashCapture').onclick=commandCapture;$('dashCommand').onkeydown=e=>{if(e.key==='Enter'){e.preventDefault();commandStudy()}};
 $('goProjects').onclick=()=>$('workspacePanel')?.scrollIntoView({behavior:'smooth'});$('goLibrary').onclick=()=>$('resourcesPanel')?.scrollIntoView({behavior:'smooth'});
 $('radarRefresh').onclick=()=>loadRadar(true);$('radarSeen').onclick=markRadarSeen;$('radarMore').onclick=()=>{radarExpanded=!radarExpanded;renderRadar()};
 window.addEventListener('storage',renderStats);document.addEventListener('visibilitychange',()=>{if(!document.hidden){renderStats();loadRadar(false)}})
}
function init(){renderStats();bind();loadRadar(false);setInterval(renderStats,60000)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
