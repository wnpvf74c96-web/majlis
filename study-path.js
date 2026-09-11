(()=>{
const $=id=>document.getElementById(id);
const CACHE='majlis.study.impacts', SETTINGS='majlis.settings', DRAFT='majlis.draft', READ='majlis.reading';
const load=(k,d)=>{try{return JSON.parse(localStorage.getItem(k))??d}catch{return d}};
const save=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v));return true}catch{return false}};
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const md=s=>window.marked?marked.parse(s||''):esc(s).replace(/\n/g,'<br>');
const yt=q=>`https://www.youtube.com/results?search_query=${encodeURIComponent(q)}`;
let current={topic:'',content:'',mode:'cours',level:'M1',depth:'Avancé'};
let generation=0,lastObserved='',polishTimer=null;
function key(topic){return String(topic||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'-').slice(0,90)}
function library(topic){const t=topic||'sujet';return[['🎓 Cours universitaire',`${t} cours universitaire complet Collège de France université`,'Commencer par une base structurée et longue.'],['🌍 Cours international',`${t} full university lecture MIT Yale Stanford LSE`,'Comparer le traitement français avec les grands cours internationaux.'],['🧠 Chercheurs & experts',`${t} conférence chercheur expert university lecture`,'Accéder aux débats et résultats plus avancés.'],['⚖️ Critiques & controverses',`${t} critique controverse débat arguments`,'Éviter une vision à sens unique du sujet.'],['🎬 Documentaire / terrain',`${t} documentaire ARTE terrain enquête`,'Voir les institutions, acteurs et effets concrets.'],['العربية · منظور آخر',`${t} محاضرة جامعة وثائقي شرح`,'Changer de langue et de cadre intellectuel quand c’est pertinent.']]}
function renderLibrary(topic){const root=$('bridgeLibrary');if(!root)return;root.innerHTML=library(topic).map(([label,q,why])=>`<a class="bridge-link" href="${yt(q)}" target="_blank" rel="noopener noreferrer"><strong>${esc(label)}</strong><small>${esc(why)}</small></a>`).join('')}
function renderSkills(topic){const root=$('bridgeSkills');if(!root)return;const list=window.MajlisSkills?.recommend?.(topic)||[];root.innerHTML=list.length?list.map(m=>`<button class="bridge-skill" type="button" data-skill="${esc(m.id)}">${esc(m.track)} · ${esc(m.title)}</button>`).join(''):'<span class="muted">Les compétences liées apparaîtront ici.</span>';root.querySelectorAll('[data-skill]').forEach(b=>b.onclick=()=>{window.MajlisSkills?.focusModule?.(b.dataset.skill);$('skillsPanel')?.scrollIntoView({behavior:'smooth',block:'start'})})}
function syncFullLibrary(topic){if($('resourceTopic'))$('resourceTopic').value=topic||'';$('resourceSmart')?.click();$('resourcesPanel')?.scrollIntoView({behavior:'smooth',block:'start'})}

function latexReadable(input=''){
 let s=String(input);
 for(let i=0;i<3;i++)s=s.replace(/\\text\{([^{}]*)\}/g,'$1').replace(/\\mathrm\{([^{}]*)\}/g,'$1').replace(/\\mathbf\{([^{}]*)\}/g,'$1').replace(/\\operatorname\{([^{}]*)\}/g,'$1');
 s=s.replace(/\\xrightarrow\{([^{}]*)\}/g,' → $1 → ').replace(/\\xleftarrow\{([^{}]*)\}/g,' ← $1 ← ')
 .replace(/\\Rightarrow/g,' ⇒ ').replace(/\\Leftarrow/g,' ⇐ ').replace(/\\leftrightarrow/g,' ↔ ').replace(/\\rightarrow/g,' → ').replace(/\\leftarrow/g,' ← ').replace(/\\to/g,' → ').replace(/\\mapsto/g,' ↦ ')
 .replace(/\\times/g,' × ').replace(/\\cdot/g,' · ').replace(/\\pm/g,' ± ').replace(/\\neq/g,' ≠ ').replace(/\\leq/g,' ≤ ').replace(/\\geq/g,' ≥ ').replace(/\\approx/g,' ≈ ').replace(/\\sim/g,' ∼ ')
 .replace(/\\alpha/g,'α').replace(/\\beta/g,'β').replace(/\\gamma/g,'γ').replace(/\\delta/g,'δ').replace(/\\lambda/g,'λ').replace(/\\mu/g,'μ').replace(/\\pi/g,'π').replace(/\\sigma/g,'σ').replace(/\\omega/g,'ω')
 .replace(/\\left|\\right|\\,/g,' ').replace(/\\;/g,' ').replace(/\\quad/g,'  ').replace(/\\qquad/g,'   ')
 .replace(/\$\$/g,'').replace(/\$/g,'').replace(/[{}]/g,'').replace(/\s{2,}/g,' ').trim();
 return s;
}
function containsLatex(s=''){return /\$\$|\\text\{|\\xrightarrow|\\rightarrow|\\Rightarrow|\\frac\{|\\left|\\right|\\mathrm\{|\\mathbf\{/.test(s)}
function cleanLatex(root){
 if(!root)return;
 root.querySelectorAll('p,li,blockquote,td,th').forEach(el=>{
   const before=el.textContent||'';if(!containsLatex(before))return;
   const walker=document.createTreeWalker(el,NodeFilter.SHOW_TEXT);const nodes=[];while(walker.nextNode())nodes.push(walker.currentNode);nodes.forEach(n=>{if(containsLatex(n.nodeValue||''))n.nodeValue=latexReadable(n.nodeValue||'')});
   if(/\$\$|\\xrightarrow|\\rightarrow|\\Rightarrow|\\text\{/.test(before)&&before.length<900)el.classList.add('majlis-equation');
 });
}
function cleanDiagrams(root){
 if(!root)return;
 root.querySelectorAll('pre').forEach(pre=>{const t=pre.textContent||'';if(/[│─┌┐└┘├┤┬┴\\/_\[\]▲▼△▽→←]/.test(t)||/(FORCE DU GROUPE|Asabiyya|Déclin endogène|High\s+▲|Low)/i.test(t))pre.classList.add('majlis-diagram')});
 root.querySelectorAll('p').forEach(p=>{const t=p.textContent||'';if(t.length<1200&&/(FORCE DU GROUPE|Asabiyya.*max|Déclin endogène)/i.test(t)&&/[\\|_▲→]/.test(t))p.classList.add('majlis-diagram')});
}
function classifyCallouts(root){
 if(!root)return;
 root.querySelectorAll('p').forEach(p=>{
   if(p.classList.contains('academic-callout'))return;const t=(p.textContent||'').trim();let type='';
   if(/^(?:à retenir|idée centrale|point clé|enjeu central)\s*[:—-]/i.test(t))type='idea';
   else if(/^(?:mécanisme|chaîne causale|comment ça marche)\s*[:—-]/i.test(t))type='mechanism';
   else if(/^(?:exemple|cas concret|illustration)\s*[:—-]/i.test(t))type='example';
   else if(/^(?:limite|nuance|réserve)\s*[:—-]/i.test(t))type='limit';
   else if(/^(?:piège|erreur fréquente|attention)\s*[:—-]/i.test(t))type='trap';
   if(type)p.classList.add('academic-callout',type);
 });
}
function headingId(text,i){return 'majlis-'+String(text||'section').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,55)+'-'+i}
function buildToc(root){
 const toc=$('folioToc'),nav=$('folioTocNav');if(!toc||!nav||!root)return;const hs=[...root.querySelectorAll('h2,h3')].slice(0,18);if(hs.length<2){toc.hidden=true;nav.innerHTML='';return}
 hs.forEach((h,i)=>{if(!h.id)h.id=headingId(h.textContent,i)});nav.innerHTML=hs.map(h=>`<a class="${h.tagName==='H3'?'sub':''}" href="#${esc(h.id)}">${esc(h.textContent||'Section')}</a>`).join('');toc.hidden=false;
}
function polishAcademic(root){if(!root)return;cleanLatex(root);cleanDiagrams(root);classifyCallouts(root);if(root.id==='folio')buildToc(root)}
function schedulePolish(root){clearTimeout(polishTimer);polishTimer=setTimeout(()=>polishAcademic(root),35)}

function ensureReadingUI(){
 const folio=$('folio'),wrap=folio?.parentElement;if(!folio||!wrap||$('readingShell'))return;
 const saved=load(READ,{scale:1});document.documentElement.style.setProperty('--folioScale',String(Math.min(1.18,Math.max(.9,Number(saved.scale)||1))));
 const shell=document.createElement('div');shell.id='readingShell';shell.className='reading-shell';shell.innerHTML=`<div class="reading-tools"><div class="reading-tools-left"><b>Lecture</b><span>mise en page académique</span></div><div class="reading-tools-right"><button id="readMinus" type="button" aria-label="Réduire la taille">A−</button><button id="readReset" type="button" aria-label="Taille normale">A</button><button id="readPlus" type="button" aria-label="Augmenter la taille">A+</button></div></div><div class="reading-progress"><span id="readingProgressBar"></span></div>`;
 const toc=document.createElement('details');toc.id='folioToc';toc.className='folio-toc';toc.hidden=true;toc.innerHTML='<summary>Sommaire du cours</summary><nav id="folioTocNav"></nav>';
 wrap.insertBefore(shell,folio);wrap.insertBefore(toc,folio);
 const setScale=v=>{v=Math.min(1.18,Math.max(.9,Math.round(v*20)/20));document.documentElement.style.setProperty('--folioScale',String(v));save(READ,{scale:v})};
 $('readMinus').onclick=()=>setScale((Number(load(READ,{scale:1}).scale)||1)-.05);$('readPlus').onclick=()=>setScale((Number(load(READ,{scale:1}).scale)||1)+.05);$('readReset').onclick=()=>setScale(1);
 const updateProgress=()=>{const bar=$('readingProgressBar'),r=folio.getBoundingClientRect(),vh=window.innerHeight||1,total=Math.max(1,folio.offsetHeight-vh*.35);const passed=Math.min(total,Math.max(0,-r.top+vh*.18));if(bar)bar.style.width=`${Math.round(passed/total*100)}%`};window.addEventListener('scroll',updateProgress,{passive:true});window.addEventListener('resize',updateProgress);updateProgress();
}
function observeAcademic(){
 const folio=$('folio');if(folio){const obs=new MutationObserver(()=>schedulePolish(folio));obs.observe(folio,{childList:true,subtree:true,characterData:true});schedulePolish(folio)}
 const impact=$('impactContent');if(impact){const obs2=new MutationObserver(()=>schedulePolish(impact));obs2.observe(impact,{childList:true,subtree:true,characterData:true})}
}

function renderImpact(text){const root=$('impactContent');if(root){root.innerHTML=md(text);polishAcademic(root)}}
async function callImpact(detail){
 const s=load(SETTINGS,{});if(!s.apiKey)throw new Error('Configure Gemini pour générer la cartographie d’impact.');const model=s.model||'gemini-3.8-flash';const excerpt=String(detail.content||'').slice(0,12000);
 const prompt=`Sujet étudié : ${detail.topic}\nNiveau : ${detail.level||'M1'}\nMode : ${detail.mode||'cours'}\n\nExtrait du cours :\n${excerpt}\n\nRédige une CARTOGRAPHIE D’IMPACT ET DES SPHÈRES du sujet, complémentaire au cours et sans le répéter. Je veux une analyse substantielle, précise et interdisciplinaire. Structure obligatoire :\n\n## Pourquoi ce sujet compte\nUne synthèse dense de sa portée réelle.\n\n## Sphères auxquelles il appartient\nPour chaque sphère réellement pertinente (économique, sociale, politique, juridique, technologique, environnementale, culturelle, historique, philosophique, organisationnelle, scientifique), explique le lien et le mécanisme. N’inclus pas artificiellement une sphère non pertinente.\n\n## Échelles d’impact\nIndividu, organisation/entreprise, territoire, État/institutions, international : précise les niveaux qui comptent et les effets.\n\n## Effets directs et effets de second ordre\nDistingue conséquences immédiates, indirectes, externalités, boucles de rétroaction et arbitrages.\n\n## Acteurs, métiers et décisions concernés\nQui utilise réellement ce savoir ? Pour quelles décisions, quels métiers, quels secteurs, quelles politiques ?\n\n## Connexions intellectuelles\nDonne 6 à 10 sujets adjacents qu’il devient logique d’étudier ensuite, en expliquant le pont conceptuel en une phrase.\n\n## Ce qu’il faut savoir faire, pas seulement savoir\nTraduis le sujet en 4 à 7 capacités opérationnelles observables.\n\n## Angle critique\nDonne les deux simplifications les plus dangereuses et une question ouverte majeure.\n\nFORMAT MOBILE: pas de LaTeX brut, pas de $$, pas de schéma ASCII. Utilise des flèches Unicode comme A → B → C, des listes ou des tableaux courts. Pour les passages pédagogiquement importants, tu peux commencer un paragraphe par « À retenir — », « Mécanisme — », « Exemple — », « Limite — » ou « Piège — ».\n\nVise environ 900 à 1500 mots si la matière le justifie. Ne remplis pas artificiellement. Ne donne ni source ni chiffre inventé.`;
 const r=await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`,{method:'POST',headers:{'Content-Type':'application/json','x-goog-api-key':s.apiKey},body:JSON.stringify({contents:[{role:'user',parts:[{text:prompt}]}],generationConfig:{temperature:.55,topP:.9,maxOutputTokens:3500}})});const data=await r.json().catch(()=>({}));if(!r.ok)throw new Error(data?.error?.message||`Gemini ${r.status}`);const text=(data.candidates?.[0]?.content?.parts||[]).map(x=>x.text||'').join('\n').trim();if(!text)throw new Error('Aucune cartographie reçue.');return text;
}
async function generateImpact(force=false){const topic=current.topic;if(!topic)return;const my=++generation;const caches=load(CACHE,{}),k=key(topic);if(!force&&caches[k]?.text){renderImpact(caches[k].text);setImpactStatus('Analyse mémorisée');return}const root=$('impactContent');if(root)root.innerHTML='<div class="impact-loading">Majlis relie le cours aux sphères économiques, sociales, politiques, techniques et professionnelles…</div>';setImpactStatus('Analyse en cours…');const b=$('impactRetry');if(b)b.disabled=true;try{const text=await callImpact(current);if(my!==generation)return;caches[k]={topic,text,date:new Date().toISOString()};const entries=Object.values(caches).sort((a,b)=>new Date(b.date)-new Date(a.date)).slice(0,30);const trimmed={};entries.forEach(x=>trimmed[key(x.topic)]=x);save(CACHE,trimmed);renderImpact(text);setImpactStatus('Cartographie prête ✓')}catch(e){if(my!==generation)return;if(root)root.innerHTML=`<div class="impact-loading">Impossible de générer cette partie maintenant : ${esc(e.message)}. Le cours et la bibliothèque restent disponibles.</div>`;setImpactStatus('À relancer')}finally{if(b)b.disabled=false}}
function setImpactStatus(t){if($('impactStatus'))$('impactStatus').textContent=t}
function prepare(detail,autoImpact=true){if(!detail?.topic)return;current={...current,...detail};$('studyBridge').hidden=false;$('bridgeTopic').textContent=detail.topic;renderLibrary(detail.topic);renderSkills(detail.topic);const caches=load(CACHE,{}),cached=caches[key(detail.topic)];if(cached?.text){renderImpact(cached.text);setImpactStatus('Analyse mémorisée')}else if(autoImpact)generateImpact(false);else{renderImpact('**Cartographie disponible.** Appuie sur « Générer l’impact » pour relier ce sujet à ses sphères, acteurs, métiers, décisions et effets de second ordre.');setImpactStatus('Prête à générer')}}
function observeCourses(){const folio=$('folio');if(!folio)return;const valid=new Set(['cours','approfondir','cas','comparer','auteurs','parcours']);const obs=new MutationObserver(()=>{setTimeout(()=>{const d=load(DRAFT,null);if(!d?.topic||!d?.content||!valid.has(d.mode||'cours'))return;const sig=`${d.topic}|${d.mode}|${String(d.content).length}`;if(sig===lastObserved)return;lastObserved=sig;prepare({topic:d.topic,content:d.content,mode:d.mode,level:d.level,depth:d.depth},true)},0)});obs.observe(folio,{childList:true,subtree:true})}
function init(){if(!$('studyBridge'))return;ensureReadingUI();observeAcademic();$('bridgeLibraryAll').onclick=()=>syncFullLibrary(current.topic);$('impactRetry').onclick=()=>generateImpact(true);$('bridgeSkillsAll').onclick=()=>$('skillsPanel')?.scrollIntoView({behavior:'smooth',block:'start'});window.addEventListener('majlis:study-ready',e=>prepare(e.detail,true));observeCourses();const d=load(DRAFT,null);if(d?.topic&&d?.content)prepare({topic:d.topic,content:d.content,mode:d.mode,level:d.level,depth:d.depth},false);setTimeout(()=>polishAcademic($('folio')),100)}
window.MajlisStudyPath={prepare,generateImpact,polishAcademic};document.readyState==='loading'?document.addEventListener('DOMContentLoaded',init):init();
})();