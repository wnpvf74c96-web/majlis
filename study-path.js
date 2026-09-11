(()=>{
const $=id=>document.getElementById(id);
const CACHE='majlis.study.impacts', SETTINGS='majlis.settings', DRAFT='majlis.draft';
const load=(k,d)=>{try{return JSON.parse(localStorage.getItem(k))??d}catch{return d}};
const save=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v));return true}catch{return false}};
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const md=s=>window.marked?marked.parse(s||''):esc(s).replace(/\n/g,'<br>');
const yt=q=>`https://www.youtube.com/results?search_query=${encodeURIComponent(q)}`;
let current={topic:'',content:'',mode:'cours',level:'M1',depth:'Avancé'};
let generation=0,lastObserved='';
function key(topic){return String(topic||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'-').slice(0,90)}
function library(topic){
 const t=topic||'sujet';
 return [
  ['🎓 Cours universitaire',`${t} cours universitaire complet Collège de France université`,'Commencer par une base structurée et longue.'],
  ['🌍 Cours international',`${t} full university lecture MIT Yale Stanford LSE`,'Comparer le traitement français avec les grands cours internationaux.'],
  ['🧠 Chercheurs & experts',`${t} conférence chercheur expert university lecture`,'Accéder aux débats et résultats plus avancés.'],
  ['⚖️ Critiques & controverses',`${t} critique controverse débat arguments`,'Éviter une vision à sens unique du sujet.'],
  ['🎬 Documentaire / terrain',`${t} documentaire ARTE terrain enquête`,'Voir les institutions, acteurs et effets concrets.'],
  ['العربية · منظور آخر',`${t} محاضرة جامعة وثائقي شرح`,'Changer de langue et de cadre intellectuel quand c’est pertinent.']
 ];
}
function renderLibrary(topic){const root=$('bridgeLibrary');if(!root)return;root.innerHTML=library(topic).map(([label,q,why])=>`<a class="bridge-link" href="${yt(q)}" target="_blank" rel="noopener noreferrer"><strong>${esc(label)}</strong><small>${esc(why)}</small></a>`).join('')}
function renderSkills(topic){const root=$('bridgeSkills');if(!root)return;const list=window.MajlisSkills?.recommend?.(topic)||[];root.innerHTML=list.length?list.map(m=>`<button class="bridge-skill" type="button" data-skill="${esc(m.id)}">${esc(m.track)} · ${esc(m.title)}</button>`).join(''):'<span class="muted">Les compétences liées apparaîtront ici.</span>';root.querySelectorAll('[data-skill]').forEach(b=>b.onclick=()=>{window.MajlisSkills?.focusModule?.(b.dataset.skill);$('skillsPanel')?.scrollIntoView({behavior:'smooth',block:'start'})})}
function syncFullLibrary(topic){if($('resourceTopic'))$('resourceTopic').value=topic||'';$('resourceSmart')?.click();$('resourcesPanel')?.scrollIntoView({behavior:'smooth',block:'start'})}
function renderImpact(text){const root=$('impactContent');if(root)root.innerHTML=md(text)}
async function callImpact(detail){
 const s=load(SETTINGS,{});if(!s.apiKey)throw new Error('Configure Gemini pour générer la cartographie d’impact.');
 const model=s.model||'gemini-3.8-flash';
 const excerpt=String(detail.content||'').slice(0,12000);
 const prompt=`Sujet étudié : ${detail.topic}\nNiveau : ${detail.level||'M1'}\nMode : ${detail.mode||'cours'}\n\nExtrait du cours :\n${excerpt}\n\nRédige une CARTOGRAPHIE D’IMPACT ET DES SPHÈRES du sujet, complémentaire au cours et sans le répéter. Je veux une analyse substantielle, précise et interdisciplinaire. Structure obligatoire :\n\n## Pourquoi ce sujet compte\nUne synthèse dense de sa portée réelle.\n\n## Sphères auxquelles il appartient\nPour chaque sphère réellement pertinente (économique, sociale, politique, juridique, technologique, environnementale, culturelle, historique, philosophique, organisationnelle, scientifique), explique le lien et le mécanisme. N’inclus pas artificiellement une sphère non pertinente.\n\n## Échelles d’impact\nIndividu, organisation/entreprise, territoire, État/institutions, international : précise les niveaux qui comptent et les effets.\n\n## Effets directs et effets de second ordre\nDistingue conséquences immédiates, indirectes, externalités, boucles de rétroaction et arbitrages.\n\n## Acteurs, métiers et décisions concernés\nQui utilise réellement ce savoir ? Pour quelles décisions, quels métiers, quels secteurs, quelles politiques ?\n\n## Connexions intellectuelles\nDonne 6 à 10 sujets adjacents qu’il devient logique d’étudier ensuite, en expliquant le pont conceptuel en une phrase.\n\n## Ce qu’il faut savoir faire, pas seulement savoir\nTraduis le sujet en 4 à 7 capacités opérationnelles observables.\n\n## Angle critique\nDonne les deux simplifications les plus dangereuses et une question ouverte majeure.\n\nVise environ 900 à 1500 mots si la matière le justifie. Ne remplis pas artificiellement. Ne donne ni source ni chiffre inventé.`;
 const r=await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`,{method:'POST',headers:{'Content-Type':'application/json','x-goog-api-key':s.apiKey},body:JSON.stringify({contents:[{role:'user',parts:[{text:prompt}]}],generationConfig:{temperature:.55,topP:.9,maxOutputTokens:3500}})});
 const data=await r.json().catch(()=>({}));if(!r.ok)throw new Error(data?.error?.message||`Gemini ${r.status}`);const text=(data.candidates?.[0]?.content?.parts||[]).map(x=>x.text||'').join('\n').trim();if(!text)throw new Error('Aucune cartographie reçue.');return text;
}
async function generateImpact(force=false){
 const topic=current.topic;if(!topic)return;const my=++generation;const caches=load(CACHE,{}),k=key(topic);
 if(!force&&caches[k]?.text){renderImpact(caches[k].text);setImpactStatus('Analyse mémorisée');return}
 const root=$('impactContent');if(root)root.innerHTML='<div class="impact-loading">Majlis relie le cours aux sphères économiques, sociales, politiques, techniques et professionnelles…</div>';setImpactStatus('Analyse en cours…');const b=$('impactRetry');if(b)b.disabled=true;
 try{const text=await callImpact(current);if(my!==generation)return;caches[k]={topic,text,date:new Date().toISOString()};const entries=Object.values(caches).sort((a,b)=>new Date(b.date)-new Date(a.date)).slice(0,30);const trimmed={};entries.forEach(x=>trimmed[key(x.topic)]=x);save(CACHE,trimmed);renderImpact(text);setImpactStatus('Cartographie prête ✓')}
 catch(e){if(my!==generation)return;if(root)root.innerHTML=`<div class="impact-loading">Impossible de générer cette partie maintenant : ${esc(e.message)}. Le cours et la bibliothèque restent disponibles.</div>`;setImpactStatus('À relancer')}
 finally{if(b)b.disabled=false}
}
function setImpactStatus(t){if($('impactStatus'))$('impactStatus').textContent=t}
function prepare(detail,autoImpact=true){
 if(!detail?.topic)return;current={...current,...detail};$('studyBridge').hidden=false;$('bridgeTopic').textContent=detail.topic;renderLibrary(detail.topic);renderSkills(detail.topic);
 const caches=load(CACHE,{}),cached=caches[key(detail.topic)];if(cached?.text){renderImpact(cached.text);setImpactStatus('Analyse mémorisée')}else if(autoImpact)generateImpact(false);else{renderImpact('**Cartographie disponible.** Appuie sur « Générer l’impact » pour relier ce sujet à ses sphères, acteurs, métiers, décisions et effets de second ordre.');setImpactStatus('Prête à générer')}
}
function observeCourses(){
 const folio=$('folio');if(!folio)return;const valid=new Set(['cours','approfondir','cas','comparer','auteurs','parcours']);
 const obs=new MutationObserver(()=>{setTimeout(()=>{const d=load(DRAFT,null);if(!d?.topic||!d?.content||!valid.has(d.mode||'cours'))return;const sig=`${d.topic}|${d.mode}|${String(d.content).length}`;if(sig===lastObserved)return;lastObserved=sig;prepare({topic:d.topic,content:d.content,mode:d.mode,level:d.level,depth:d.depth},true)},0)});obs.observe(folio,{childList:true,subtree:true});
}
function init(){
 if(!$('studyBridge'))return;$('bridgeLibraryAll').onclick=()=>syncFullLibrary(current.topic);$('impactRetry').onclick=()=>generateImpact(true);$('bridgeSkillsAll').onclick=()=>$('skillsPanel')?.scrollIntoView({behavior:'smooth',block:'start'});
 window.addEventListener('majlis:study-ready',e=>prepare(e.detail,true));observeCourses();
 const d=load(DRAFT,null);if(d?.topic&&d?.content)prepare({topic:d.topic,content:d.content,mode:d.mode,level:d.level,depth:d.depth},false);
}
window.MajlisStudyPath={prepare,generateImpact};
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',init):init();
})();