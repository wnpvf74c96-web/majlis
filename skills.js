(()=>{
const $=id=>document.getElementById(id);
const KEY='majlis.skills.progress';
const load=()=>{try{return JSON.parse(localStorage.getItem(KEY)||'{}')}catch{return{}}};
const save=v=>localStorage.setItem(KEY,JSON.stringify(v));
const yt=q=>`https://www.youtube.com/results?search_query=${encodeURIComponent(q)}`;
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

const TRACKS=[
 {id:'excel',name:'Excel',icon:'▦',modules:[
  {id:'excel-core',level:'Fondations',title:'Formules qui font gagner du temps',desc:'Références, SI, SOMME.SI.ENS, NB.SI.ENS, RECHERCHEX/XLOOKUP, fonctions texte et dates.',exercise:'Construire un tableau de suivi avec recherche automatique, statuts et alertes.',q:'Excel XLOOKUP SUMIFS IF formulas full tutorial français'},
  {id:'excel-pivot',level:'Intermédiaire',title:'TCD, nettoyage & Power Query',desc:'Tables structurées, tableaux croisés dynamiques, nettoyage, fusion et automatisation de fichiers répétitifs.',exercise:'Importer plusieurs fichiers mensuels et produire un reporting consolidé.',q:'Excel Power Query pivot tables dashboard tutorial français'},
  {id:'excel-dashboard',level:'Avancé',title:'Dashboard, scénarios & pilotage',desc:'KPI, graphiques utiles, validation, mise en forme conditionnelle, scénarios, Solver et modèles de décision.',exercise:'Créer un tableau de bord décisionnel avec objectifs, écarts et scénario pessimiste/central/optimiste.',q:'Excel advanced dashboard KPI scenario analysis Solver tutorial'}]},
 {id:'management',name:'Management',icon:'◎',modules:[
  {id:'manage-priority',level:'Fondations',title:'Prioriser et donner un cap',desc:'Objectifs, priorités, critères de réussite, arbitrage urgent/important et communication des attentes.',exercise:'Transformer une semaine confuse en 3 priorités et 5 résultats mesurables.',q:'management prioritization objectives KPI team leadership course'},
  {id:'manage-delegate',level:'Intermédiaire',title:'Déléguer, suivre, faire du feedback',desc:'Délégation claire, autonomie, points de contrôle, feedback factuel, 1:1 et responsabilisation.',exercise:'Préparer une délégation complète avec résultat, contraintes, deadline et contrôle.',q:'delegation feedback one on one management training'},
  {id:'manage-conflict',level:'Avancé',title:'Décider sous tension & gérer les conflits',desc:'Désaccords, incidents, décisions imparfaites, communication de crise, négociation et retour d’expérience.',exercise:'Analyser un incident d’équipe et produire décision, message et plan correctif.',q:'conflict management decision making crisis leadership course'}]},
 {id:'project',name:'Gestion de projet',icon:'◇',modules:[
  {id:'project-frame',level:'Fondations',title:'Cadrage, périmètre & responsabilités',desc:'Problème, objectif, livrables, parties prenantes, RACI, contraintes, critères de succès.',exercise:'Produire une note de cadrage d’une page et une matrice RACI.',q:'project management scope RACI WBS tutorial français'},
  {id:'project-plan',level:'Intermédiaire',title:'Planification, Kanban & risques',desc:'Découpage WBS, dépendances, jalons, Kanban, Gantt léger, registre de risques et plans B.',exercise:'Transformer un projet en lots, jalons, risques et prochaines actions.',q:'project management Kanban Gantt risk register tutorial'},
  {id:'project-agile',level:'Avancé',title:'Agile, estimation & rétrospective',desc:'Backlog, valeur, estimation, cycles courts, métriques de flux et amélioration continue.',exercise:'Créer un backlog priorisé puis mener une rétrospective orientée causes.',q:'Agile project management backlog estimation retrospective course'}]},
 {id:'data',name:'Data & BI',icon:'◫',modules:[
  {id:'data-kpi',level:'Fondations',title:'Choisir de bons KPI',desc:'Indicateur vs objectif, leading/lagging indicators, dénominateurs, biais de mesure et qualité des données.',exercise:'Définir 8 KPI utiles et supprimer 3 vanity metrics.',q:'KPI dashboard metrics leading lagging indicators course'},
  {id:'data-sql',level:'Intermédiaire',title:'SQL pour analyser',desc:'SELECT, WHERE, GROUP BY, JOIN, agrégations et logique de requête pour répondre à une question métier.',exercise:'Écrire les requêtes nécessaires à un reporting ventes/opérations.',q:'SQL data analysis full course beginner business'},
  {id:'data-powerbi',level:'Avancé',title:'Power BI & storytelling de données',desc:'Modèle de données, Power Query, mesures, DAX de base, dashboard et lecture décisionnelle.',exercise:'Construire un rapport Power BI avec 5 KPI, filtres et une page direction.',q:'Power BI full course Power Query DAX dashboard français'}]},
 {id:'communication',name:'Communication',icon:'✎',modules:[
  {id:'com-write',level:'Fondations',title:'Écrire clair et professionnel',desc:'Synthèse, structure pyramidale, messages courts, compte rendu, recommandation et prochaine action.',exercise:'Réduire un rapport d’une page à 8 lignes sans perdre l’essentiel.',q:'business writing executive summary pyramid principle course'},
  {id:'com-present',level:'Intermédiaire',title:'Présenter une décision',desc:'PowerPoint utile, narration, hiérarchie visuelle, données, objections et prise de parole.',exercise:'Préparer 5 slides pour obtenir une décision en moins de 10 minutes.',q:'presentation skills PowerPoint storytelling data executive course'},
  {id:'com-negotiate',level:'Avancé',title:'Négociation & influence',desc:'Intérêts, BATNA, concessions, ancrage, écoute, objections et accord robuste.',exercise:'Préparer une négociation avec objectifs, BATNA, seuil et concessions.',q:'negotiation course BATNA Harvard negotiation skills'}]},
 {id:'ai',name:'IA & productivité',icon:'✦',modules:[
  {id:'ai-prompt',level:'Fondations',title:'Bien déléguer à une IA',desc:'Contexte, objectif, contraintes, critères, exemples, vérification et itération.',exercise:'Transformer une demande vague en brief IA vérifiable et réutilisable.',q:'AI prompting workflow verification productivity course'},
  {id:'ai-workflow',level:'Intermédiaire',title:'Créer des workflows IA fiables',desc:'Recherche, synthèse, rédaction, contrôle qualité, templates et automatisations simples.',exercise:'Concevoir un workflow de veille → tri → synthèse → action.',q:'AI automation workflow no code productivity tutorial'},
  {id:'ai-agent',level:'Avancé',title:'Agents, API & automatisation',desc:'API, webhooks, outils, mémoire, limites, coûts, sécurité et conception de petits agents.',exercise:'Dessiner l’architecture d’un agent qui surveille une source et déclenche une action.',q:'AI agents API webhooks automation full tutorial'}]},
 {id:'operations',name:'Opérations',icon:'⚙',modules:[
  {id:'ops-process',level:'Fondations',title:'Process, SOP & contrôle',desc:'Standardiser une tâche, checklists, rôles, points de contrôle et gestion des exceptions.',exercise:'Transformer une activité répétitive en SOP d’une page.',q:'operations management SOP process improvement course'},
  {id:'ops-stock',level:'Intermédiaire',title:'Stock, capacité & prévision',desc:'Inventaire, consommation, seuils, rotation, capacité, charge et prévision simple.',exercise:'Créer un modèle Excel de stock avec seuil d’alerte et consommation moyenne.',q:'inventory management forecasting Excel operations tutorial'},
  {id:'ops-improve',level:'Avancé',title:'Amélioration continue & qualité',desc:'5 Why, Pareto, goulots, temps d’attente, qualité, incidents, Lean et boucles d’amélioration.',exercise:'Faire un RCA sur un problème récurrent puis choisir 3 actions à fort levier.',q:'Lean operations root cause analysis 5 why Pareto course'}]}
];
let active='Tous';

function allModules(){return TRACKS.flatMap(t=>t.modules.map(m=>({...m,track:t.name,trackId:t.id,icon:t.icon})))}
function topicText(topic=''){return topic.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'')}
function recommend(topic=''){
 const t=topicText(topic);let ids=[];
 const add=(...x)=>x.forEach(v=>{if(!ids.includes(v))ids.push(v)});
 if(/econo|finance|budget|marche|entreprise|rentab|compta|invest/.test(t))add('excel-dashboard','data-kpi','com-write','project-frame');
 if(/manage|equipe|lead|organisation|operation|stock|restaurant|logistique|qualite/.test(t))add('manage-priority','manage-delegate','ops-process','excel-pivot','data-kpi');
 if(/projet|saas|startup|produit|business|entrepren/.test(t))add('project-frame','project-plan','excel-dashboard','ai-workflow','com-present');
 if(/data|stat|quant|enquete|econometr|analyse|kpi|bi\b/.test(t))add('excel-pivot','data-sql','data-powerbi','data-kpi');
 if(/ia\b|intelligence artificielle|code|dev|java|angular|web|logiciel|api/.test(t))add('ai-prompt','ai-agent','project-agile','data-sql');
 if(/durab|ecolog|transition|territ|politique publique|amenagement/.test(t))add('data-kpi','project-frame','excel-dashboard','com-present');
 if(/philo|histoire|socio|politique|geopolit|droit|auteur/.test(t))add('com-write','com-present','data-kpi','project-frame');
 if(!ids.length)add('excel-core','manage-priority','project-frame','com-write','ai-prompt');
 return ids.map(id=>allModules().find(m=>m.id===id)).filter(Boolean).slice(0,5);
}
function doneCount(){const p=load();return allModules().filter(m=>p[m.id]).length}
function setDone(id){const p=load();p[id]=!p[id];save(p);render();renderContext($('topic')?.value||'')}
function study(m){
 if($('topic'))$('topic').value=`${m.track} — ${m.title}`;
 if($('angle'))$('angle').value=`Apprentissage pratique. Explique l’outil ou la compétence pas à pas, puis fais-moi réaliser cet exercice : ${m.exercise} Donne des exemples concrets, erreurs fréquentes et critères de maîtrise.`;
 $('normalPanel')?.scrollIntoView({behavior:'smooth',block:'center'});
 setTimeout(()=>$('launch')?.click(),450);
}
function focusModule(id){active='Tous';renderFilters();render();setTimeout(()=>document.querySelector(`[data-skill-id="${id}"]`)?.scrollIntoView({behavior:'smooth',block:'center'}),80)}
function renderContext(topic){const root=$('skillRecommendations');if(!root)return;const list=recommend(topic);root.innerHTML=list.map(m=>`<button type="button" class="skill-context-chip" data-rec="${esc(m.id)}">${esc(m.track)} · ${esc(m.title)}</button>`).join('');root.querySelectorAll('[data-rec]').forEach(b=>b.onclick=()=>focusModule(b.dataset.rec));const label=$('skillTopicLabel');if(label)label.textContent=topic?`Relié à : ${topic}`:'Suggestions de base';}
function renderFilters(){const root=$('skillFilters');if(!root)return;root.innerHTML='';['Tous',...TRACKS.map(t=>t.name)].forEach(name=>{const b=document.createElement('button');b.className='skill-filter '+(active===name?'active':'');b.type='button';b.textContent=name;b.onclick=()=>{active=name;renderFilters();render()};root.appendChild(b)})}
function render(){const grid=$('skillGrid');if(!grid)return;const p=load(),mods=allModules().filter(m=>active==='Tous'||m.track===active);const total=allModules().length,done=doneCount();$('skillProgress').textContent=`Progression : ${done}/${total} compétences maîtrisées`;
 grid.innerHTML='';mods.forEach(m=>{const card=document.createElement('article');card.className='skill-card';card.dataset.skillId=m.id;card.innerHTML=`<div class="skill-card-top"><div><span class="skill-track">${esc(m.icon)} ${esc(m.track)}</span><h3>${esc(m.title)}</h3></div><span class="skill-level">${esc(m.level)}</span></div><p>${esc(m.desc)}</p><div class="skill-exercise"><b>Exercice :</b> ${esc(m.exercise)}</div><div class="skill-actions"><button class="ghost" type="button" data-study>Étudier avec Majlis</button><a class="ghost" href="${yt(m.q)}" target="_blank" rel="noopener noreferrer">Tutoriel ↗</a><button class="skill-done ${p[m.id]?'done':''}" type="button" data-done>${p[m.id]?'✓ Maîtrisé':'○ À apprendre'}</button></div>`;card.querySelector('[data-study]').onclick=()=>study(m);card.querySelector('[data-done]').onclick=()=>setDone(m.id);grid.appendChild(card)});
 if($('skillDoneStat'))$('skillDoneStat').textContent=done;if($('skillTotalStat'))$('skillTotalStat').textContent=total;if($('skillPctStat'))$('skillPctStat').textContent=`${Math.round(done/total*100)||0}%`;
}
function init(){if(!$('skillsPanel'))return;renderFilters();render();renderContext($('topic')?.value||'');$('topic')?.addEventListener('input',()=>renderContext($('topic').value));window.addEventListener('majlis:study-ready',e=>renderContext(e.detail?.topic||''));}
window.MajlisSkills={recommend,focusModule,tracks:TRACKS,study};
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',init):init();
})();