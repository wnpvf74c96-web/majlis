(()=>{
const $=id=>document.getElementById(id);
const PKEY='majlis.workspace.projects', IKEY='majlis.workspace.inbox', HKEY='majlis.history', DKEY='majlis.draft', SKEY='majlis.settings', RSEEN='majlis.radar.lastSeen', RINSIGHTS='majlis.radar.projectInsights';
const load=(k,d)=>{try{return JSON.parse(localStorage.getItem(k))??d}catch{return d}};
const save=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v));return true}catch{return false}};
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const uid=()=>Date.now().toString(36)+Math.random().toString(36).slice(2,7);
let radarData=null, radarExpanded=false, radarProjectInsights={}, enrichTimer=null, enriching=false;

function greeting(){const h=new Date().getHours();return h<12?'Bonjour':h<18?'Bon après-midi':'Bonsoir'}
function fmtDate(){return new Intl.DateTimeFormat('fr-FR',{weekday:'long',day:'numeric',month:'long'}).format(new Date())}
function fmtAgo(iso){if(!iso)return'';const d=new Date(iso),m=Math.max(0,Math.round((Date.now()-d)/60000));if(m<2)return'à l’instant';if(m<60)return`il y a ${m} min`;const h=Math.round(m/60);if(h<24)return`il y a ${h} h`;const j=Math.round(h/24);return`il y a ${j} j`}
function projects(){return load(PKEY,[])}
function history(){return load(HKEY,[])}
function inbox(){return load(IKEY,[])}
function relevantProjects(){return projects().filter(p=>p.status!=='done')}

function renderStats(){
 const ps=projects(), active=ps.filter(p=>p.status==='active'), pending=ps.flatMap(p=>(p.tasks||[]).filter(t=>!t.done).map(t=>({p,t}))), notes=inbox(), hist=history();
 $('dashGreeting').textContent=`${greeting()}.`;$('dashDate').textContent=fmtDate();
 $('statProjects').textContent=active.length;$('statTasks').textContent=pending.length;$('statNotes').textContent=notes.length;$('statStudies').textContent=hist.length;
 const pri=$('dashPriorities');pri.innerHTML='';
 const sorted=pending.sort((a,b)=>new Date(b.p.updated||0)-new Date(a.p.updated||0)).slice(0,3);
 if(!sorted.length){pri.innerHTML='<div class="dash-empty">Aucune tâche en attente. Ajoute une prochaine action dans un projet.</div>'}
 else sorted.forEach((x,i)=>{const d=document.createElement('div');d.className='dash-task';d.innerHTML=`<i>${i+1}</i><div><b>${esc(x.t.text)}</b><small>${esc(x.p.name)}</small></div>`;d.onclick=()=>openProjectById(x.p.id,x.p.name);pri.appendChild(d)})
 renderContinue(active,hist);
}
function renderContinue(active,hist){
 const wrap=$('dashContinue');wrap.innerHTML='';
 const p=[...active].sort((a,b)=>new Date(b.updated||0)-new Date(a.updated||0))[0];
 if(p){const d=document.createElement('div');d.className='dash-continue-item';d.innerHTML=`<b>Projet · ${esc(p.name)}</b><small>${esc(p.goal||'Objectif à préciser')} · ${fmtAgo(p.updated)}</small><div class="dash-mini-actions"><button class="ghost" type="button">Reprendre le projet</button></div>`;d.querySelector('button').onclick=()=>openProjectById(p.id,p.name);wrap.appendChild(d)}
 const h=hist[0];const draft=load(DKEY,null);const study=h||((draft&&draft.topic)?{topic:draft.topic,date:null}:null);
 if(study){const d=document.createElement('div');d.className='dash-continue-item';d.innerHTML=`<b>Étude · ${esc(study.topic||'Dernier sujet')}</b><small>${study.date?fmtAgo(study.date):'Brouillon en cours'}</small><div class="dash-mini-actions"><button class="ghost" type="button">Reprendre l’étude</button></div>`;d.querySelector('button').onclick=()=>openStudy(study.topic);wrap.appendChild(d)}
 if(!wrap.children.length)wrap.innerHTML='<div class="dash-empty">Commence une étude ou crée ton premier projet : Majlis te proposera ensuite quoi reprendre.</div>';
}
function openProjectById(id,name=''){
 $('workspacePanel')?.scrollIntoView({behavior:'smooth',block:'start'});
 setTimeout(()=>{const cards=[...document.querySelectorAll('.project-card')];const p=projects().find(x=>x.id===id);const label=p?.name||name;const c=cards.find(x=>x.textContent.includes(label));c?.click()},350)
}
function openStudy(topic){if($('topic'))$('topic').value=topic||'';$('normalPanel')?.scrollIntoView({behavior:'smooth',block:'center'});setTimeout(()=>$('topic')?.focus(),350)}
function commandStudy(){const v=$('dashCommand').value.trim();if(!v)return;openStudy(v)}
function commandCapture(){const v=$('dashCommand').value.trim();if(!v)return;const list=inbox();list.unshift({id:uid(),text:v,ts:Date.now()});save(IKEY,list.slice(0,60));$('dashCommand').value='';renderStats();setDashStatus('Ajouté au carnet ✓','ok');setTimeout(()=>location.hash='',20)}
function setDashStatus(t,kind=''){const e=$('dashStatus');if(!e)return;e.textContent=t;e.className='radar-status '+kind;setTimeout(()=>{if(e.textContent===t)e.textContent=''},3200)}

function kindLabel(k){return k==='opportunity'?'Opportunité':k==='new'?'Nouveauté':'Actualité'}
function safeUrl(v){try{const u=new URL(v,location.href);return /^https?:$/.test(u.protocol)?u.href:'#'}catch{return'#'}}
function projectById(id){return projects().find(p=>p.id===id)}
function renderRadarMeta(){
 const meta=$('radarMeta');if(!meta||!radarData)return;
 const topicChips=(radarData.topics||[]).map(t=>`<span class="radar-chip">${esc(t.label)}</span>`).join('');
 const linked=Object.keys(radarProjectInsights).length;
 const smart=linked?`<span class="radar-chip radar-project-summary">✦ ${linked} signal${linked>1?'aux':''} lié${linked>1?'s':''} à tes projets</span>`:'';
 meta.innerHTML=topicChips+smart;
}
function renderRadar(){
 const wrap=$('radarFeed');if(!wrap)return;
 if(!radarData){wrap.innerHTML='<div class="dash-empty">Chargement de la veille…</div>';return}
 renderRadarMeta();
 const seen=Number(localStorage.getItem(RSEEN)||0);const items=(radarData.items||[]).slice(0,radarExpanded?12:4);wrap.innerHTML='';
 if(!items.length){wrap.innerHTML='<div class="dash-empty">La première veille est en préparation. GitHub l’actualise automatiquement toutes les 6 heures.</div>';return}
 items.forEach(item=>{
   const insight=radarProjectInsights[item.id];const p=insight?projectById(insight.projectId):null;const card=document.createElement('article');card.className='radar-item'+(insight?' project-relevant':'');const isNew=new Date(item.published).getTime()>seen;const url=safeUrl(item.url);
   card.innerHTML=`<div class="radar-item-top"><span class="radar-kind ${item.kind==='opportunity'?'opportunity':''}">${kindLabel(item.kind)}</span>${isNew?'<span class="radar-new">NOUVEAU</span>':''}</div><a class="radar-headline" href="${esc(url)}" target="_blank" rel="noopener noreferrer"><b>${esc(item.title)}</b></a><p>${esc(item.topicLabel||'Veille Majlis')}</p><small>${esc(item.source||'Source web')} · ${fmtAgo(item.published)}</small>`;
   if(insight&&p){
     const box=document.createElement('div');box.className='radar-project-box';box.innerHTML=`<div class="radar-project-head"><span>✦ LIÉ À TON PROJET</span><b>${esc(p.name)}</b></div><p><strong>Pourquoi :</strong> ${esc(insight.reason)}</p><p><strong>Action :</strong> ${esc(insight.action)}</p><div class="radar-project-actions"><a class="ghost small" href="${esc(url)}" target="_blank" rel="noopener noreferrer">Ouvrir la source</a><button class="ghost small" type="button" data-open>Voir le projet</button><button class="ghost small" type="button" data-task>+ Ajouter l’action</button></div>`;
     box.querySelector('[data-open]').onclick=()=>openProjectById(p.id,p.name);
     box.querySelector('[data-task]').onclick=()=>addInsightTask(p.id,insight.action,box.querySelector('[data-task]'));
     card.appendChild(box);
   }
   wrap.appendChild(card)
 });
 $('radarGenerated').textContent=radarData.generatedAt?`Mise à jour ${fmtAgo(radarData.generatedAt)}`:'Initialisation de la veille';
 $('radarMore').hidden=(radarData.items||[]).length<=4;$('radarMore').textContent=radarExpanded?'Réduire':'Voir plus';
}
function addInsightTask(projectId,action,btn){
 if(!action)return;const all=projects(),p=all.find(x=>x.id===projectId);if(!p)return;p.tasks=p.tasks||[];
 if(p.tasks.some(t=>String(t.text).trim().toLowerCase()===String(action).trim().toLowerCase())){setDashStatus('Cette action est déjà dans le projet.','ok');return}
 p.tasks.push({id:uid(),text:action,done:false});p.updated=new Date().toISOString();save(PKEY,all);renderStats();window.dispatchEvent(new Event('majlis:workspace-changed'));if(btn){btn.textContent='Ajoutée ✓';btn.disabled=true}setDashStatus(`Action ajoutée à « ${p.name} » ✓`,'ok')
}
function projectSignature(){return relevantProjects().map(p=>`${p.id}:${p.updated||p.created||''}`).sort().join('|')}
function radarSignature(){return `${radarData?.generatedAt||''}::${projectSignature()}`}
function compactProjects(){return relevantProjects().slice(0,12).map(p=>({id:p.id,name:p.name,goal:String(p.goal||'').slice(0,500),notes:String(p.notes||'').slice(0,700),tasks:(p.tasks||[]).filter(t=>!t.done).slice(0,6).map(t=>t.text)}))}
function compactItems(){return (radarData?.items||[]).slice(0,16).map(i=>({id:i.id,title:i.title,topic:i.topicLabel,source:i.source,kind:i.kind,published:i.published}))}
function normalize(s){return String(s||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9+#.-]+/g,' ')}
const STOP=new Set('avec dans pour sur une des les le la un du de et en au aux par est sont vers entre plus moins cette cet ces mon ton son notre votre leur projet objectif notes faire avoir être etre comme nouveau nouvelle'.split(' '));
function tokens(s){return [...new Set(normalize(s).split(/\s+/).filter(x=>x.length>2&&!STOP.has(x)))]}
function localProjectInsights(){
 const ps=compactProjects(),items=compactItems(),out={};
 for(const item of items){const it=tokens(`${item.title} ${item.topic}`);let best=null;for(const p of ps){const name=tokens(p.name),goal=tokens(p.goal),ctx=tokens(`${p.notes} ${(p.tasks||[]).join(' ')}`);let score=0;const matches=[];for(const w of it){if(name.includes(w)){score+=5;matches.push(w)}else if(goal.includes(w)){score+=3;matches.push(w)}else if(ctx.includes(w)){score+=1;matches.push(w)}}if(score>=6&&(!best||score>best.score))best={projectId:p.id,score,reason:`Le signal partage des éléments importants avec « ${p.name} »${matches.length?` (${[...new Set(matches)].slice(0,4).join(', ')})`:''}.`,action:`Vérifier la source et noter l’impact concret sur ${p.name}.`}}if(best)out[item.id]=best}
 return out
}
function cleanJson(text){const s=String(text||'').trim().replace(/^```(?:json)?\s*/i,'').replace(/\s*```$/,'');const a=s.indexOf('{'),b=s.lastIndexOf('}');return a>=0&&b>a?s.slice(a,b+1):s}
async function geminiProjectInsights(){
 const settings=load(SKEY,{});if(!settings.apiKey)throw new Error('Gemini non configuré');const ps=compactProjects(),items=compactItems();if(!ps.length||!items.length)return{};
 const prompt=`Tu es le moteur de pertinence du Radar Majlis. Compare les alertes web aux projets personnels de l'utilisateur.\n\nRÈGLES:\n- Utilise uniquement les informations fournies dans les projets et les titres/métadonnées des alertes.\n- N'invente aucun fait sur l'article.\n- Ne retiens que les correspondances réellement utiles (score >= 65/100).\n- Pour chaque alerte, choisis au maximum UN projet: le plus pertinent.\n- "reason" explique en une phrase pourquoi cela touche ce projet.\n- "action" est une action concrète, courte, faisable, adaptée au projet.\n- Les changements réglementaires, concurrents, nouveaux outils/API, financements, appels à projets, marchés et tendances peuvent être pertinents.\n- Réponds UNIQUEMENT en JSON valide, sans markdown, sous la forme {"matches":[{"itemId":"...","projectId":"...","score":82,"reason":"...","action":"..."}]}.\n\nPROJETS:\n${JSON.stringify(ps)}\n\nALERTES:\n${JSON.stringify(items)}`;
 const model=settings.model||'gemini-3.8-flash';const res=await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`,{method:'POST',headers:{'Content-Type':'application/json','x-goog-api-key':settings.apiKey},body:JSON.stringify({contents:[{role:'user',parts:[{text:prompt}]}],generationConfig:{temperature:.2,topP:.85,maxOutputTokens:1800,responseMimeType:'application/json'}})});const data=await res.json().catch(()=>({}));if(!res.ok)throw new Error(data?.error?.message||`Gemini ${res.status}`);const text=(data.candidates?.[0]?.content?.parts||[]).map(x=>x.text||'').join('\n').trim();const parsed=JSON.parse(cleanJson(text));const validItems=new Set(items.map(x=>x.id)),validProjects=new Set(ps.map(x=>x.id)),out={};for(const m of parsed.matches||[]){const score=Number(m.score)||0;if(score<65||!validItems.has(m.itemId)||!validProjects.has(m.projectId))continue;out[m.itemId]={projectId:m.projectId,score,reason:String(m.reason||'').slice(0,260),action:String(m.action||'').slice(0,220)}}return out
}
async function enrichRadarWithProjects(force=false){
 if(enriching||!radarData)return;const ps=relevantProjects();if(!ps.length){radarProjectInsights={};renderRadar();return}
 const sig=radarSignature(),cached=load(RINSIGHTS,null);if(!force&&cached?.signature===sig&&cached?.matches){radarProjectInsights=cached.matches;renderRadar();return}
 enriching=true;const baseline=localProjectInsights();radarProjectInsights=baseline;renderRadar();
 try{const smart=await geminiProjectInsights();radarProjectInsights=Object.keys(smart).length?smart:baseline;save(RINSIGHTS,{signature:sig,at:Date.now(),matches:radarProjectInsights});renderRadar();if(Object.keys(radarProjectInsights).length)setDashStatus('Radar relié à tes projets ✓','ok')}
 catch(e){radarProjectInsights=baseline;save(RINSIGHTS,{signature:sig,at:Date.now(),matches:baseline});renderRadar()}
 finally{enriching=false}
}
function scheduleProjectRadar(force=false){clearTimeout(enrichTimer);enrichTimer=setTimeout(()=>enrichRadarWithProjects(force),900)}
async function loadRadar(manual=false){
 const btn=$('radarRefresh');if(btn){btn.disabled=true;btn.textContent='Actualisation…'}
 try{const r=await fetch(`./radar.json?t=${Date.now()}`,{cache:'no-store'});if(!r.ok)throw new Error(`HTTP ${r.status}`);radarData=await r.json();renderRadar();scheduleProjectRadar(manual);if(manual)setDashStatus('Radar actualisé. Analyse de tes projets…','ok')}
 catch(e){setDashStatus('Veille indisponible pour le moment.','bad');const wrap=$('radarFeed');if(wrap&&!radarData)wrap.innerHTML='<div class="dash-empty">Impossible de charger la veille. Tes autres données restent disponibles hors ligne.</div>'}
 finally{if(btn){btn.disabled=false;btn.textContent='Actualiser'}}
}
function markRadarSeen(){localStorage.setItem(RSEEN,String(Date.now()));renderRadar();setDashStatus('Alertes marquées comme vues.','ok')}
function bind(){
 $('dashStudy').onclick=commandStudy;$('dashCapture').onclick=commandCapture;$('dashCommand').onkeydown=e=>{if(e.key==='Enter'){e.preventDefault();commandStudy()}};
 $('goProjects').onclick=()=>$('workspacePanel')?.scrollIntoView({behavior:'smooth'});$('goLibrary').onclick=()=>$('resourcesPanel')?.scrollIntoView({behavior:'smooth'});
 $('radarRefresh').onclick=()=>loadRadar(true);$('radarSeen').onclick=markRadarSeen;$('radarMore').onclick=()=>{radarExpanded=!radarExpanded;renderRadar()};
 window.addEventListener('storage',()=>{renderStats();scheduleProjectRadar(false)});window.addEventListener('majlis:workspace-changed',()=>{renderStats();scheduleProjectRadar(false)});document.addEventListener('visibilitychange',()=>{if(!document.hidden){renderStats();loadRadar(false)}})
}
function init(){renderStats();bind();loadRadar(false);setInterval(renderStats,60000)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
