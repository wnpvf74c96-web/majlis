(()=>{
  const $=id=>document.getElementById(id);
  const FAV_KEY='majlis.resourceFavorites';
  const ytSearch=q=>`https://www.youtube.com/results?search_query=${encodeURIComponent(q)}`;

  const RESOURCES=[
    // Universités / cours complets
    {id:'mitocw',name:'MIT OpenCourseWare',cat:'Universités',lang:'EN',kind:'Cours complets',url:'https://www.youtube.com/@mitocw',desc:'Cours complets du MIT : maths, économie, physique, informatique, ingénierie.'},
    {id:'stanford',name:'Stanford',cat:'Universités',lang:'EN',kind:'Université',url:'https://www.youtube.com/@stanford',desc:'Conférences, cours et recherche de Stanford.'},
    {id:'yale',name:'YaleCourses',cat:'Universités',lang:'EN',kind:'Cours complets',url:'https://www.youtube.com/@YaleCourses',desc:'Grands cours filmés de Yale en philosophie, économie, histoire, psychologie et sciences.'},
    {id:'harvard',name:'Harvard University',cat:'Universités',lang:'EN',kind:'Université',url:'https://www.youtube.com/@harvard',desc:'Cours, conférences et idées de chercheurs de Harvard.'},
    {id:'cdf',name:'Collège de France',cat:'Universités',lang:'FR',kind:'Cours & séminaires',url:'https://www.youtube.com/@College-de-France',desc:'Savoir en train de se faire : sciences, histoire, économie, philosophie, société.'},
    {id:'oxford',name:'Oxford — cours & conférences',cat:'Universités',lang:'EN',kind:'Recherche YouTube',url:ytSearch('University of Oxford full lectures courses'),desc:'Cours publics, conférences et séries de l’Université d’Oxford.'},
    {id:'lse',name:'London School of Economics',cat:'Universités',lang:'EN',kind:'Économie & politique',url:ytSearch('LSE public lectures economics politics'),desc:'Économie, politiques publiques, sociologie, relations internationales.'},
    {id:'cs50',name:'Harvard CS50',cat:'Universités',lang:'EN',kind:'Informatique',url:'https://www.youtube.com/@cs50',desc:'Un des meilleurs cours d’introduction à l’informatique et au développement.'},

    // Économie
    {id:'mru',name:'Marginal Revolution University',cat:'Économie',lang:'EN',kind:'Cours',url:'https://www.youtube.com/@MarginalRevolutionUniversity',desc:'Micro, macro, croissance, commerce, développement, économétrie.'},
    {id:'shiller',name:'Robert Shiller — Financial Markets',cat:'Économie',lang:'EN',kind:'Cours Yale',url:ytSearch('Robert Shiller Financial Markets Yale full course'),desc:'Finance, marchés, risques et institutions par le prix Nobel Robert Shiller.'},
    {id:'angrist',name:'Joshua Angrist — Econometrics',cat:'Économie',lang:'EN',kind:'Masterclass',url:ytSearch('Joshua Angrist Mastering Econometrics course'),desc:'Causalité, expériences naturelles et économétrie moderne avec un prix Nobel.'},
    {id:'piketty',name:'Thomas Piketty — inégalités & capital',cat:'Économie',lang:'FR/EN',kind:'Conférences',url:ytSearch('Thomas Piketty lectures inequality capital'),desc:'Capital, inégalités, histoire économique et fiscalité.'},
    {id:'duflo',name:'Esther Duflo — développement',cat:'Économie',lang:'FR/EN',kind:'Conférences',url:ytSearch('Esther Duflo lectures development economics'),desc:'Économie du développement, pauvreté, politiques publiques et expérimentation.'},
    {id:'moneyacro',name:'Money & Macro',cat:'Économie',lang:'EN',kind:'Analyse',url:'https://www.youtube.com/@MoneyMacro',desc:'Macroéconomie et banques centrales expliquées avec rigueur.'},
    {id:'stupideco',name:'Stupid Economics',cat:'Économie',lang:'FR',kind:'Vulgarisation',url:'https://www.youtube.com/@StupidEconomics',desc:'Économie contemporaine, institutions et politiques publiques en français.'},
    {id:'heureka',name:'Heu?reka',cat:'Économie',lang:'FR',kind:'Vulgarisation approfondie',url:ytSearch('Heu?reka économie finance chaîne'),desc:'Monnaie, finance, banques, dette et mécanismes économiques en profondeur.'},

    // Philosophie
    {id:'wiphi',name:'Wireless Philosophy',cat:'Philosophie',lang:'EN',kind:'Cours courts',url:'https://www.youtube.com/@WirelessPhilosophy',desc:'Philosophie analytique, logique, épistémologie, éthique et pensée critique.'},
    {id:'sandel',name:'Michael Sandel — Justice',cat:'Philosophie',lang:'EN',kind:'Cours Harvard',url:ytSearch('Michael Sandel Justice Harvard full course'),desc:'Justice, morale, liberté, mérite et philosophie politique.'},
    {id:'kagan',name:'Shelly Kagan — Death',cat:'Philosophie',lang:'EN',kind:'Cours Yale',url:ytSearch('Shelly Kagan Death Yale full course'),desc:'Métaphysique de la mort, identité personnelle, rationalité et valeur de la vie.'},
    {id:'precepteur',name:'Le Précepteur',cat:'Philosophie',lang:'FR',kind:'Philosophie',url:'https://www.youtube.com/@LePrecepteur',desc:'Philosophie, grands auteurs et problèmes existentiels en français.'},
    {id:'monsieurphi',name:'Monsieur Phi',cat:'Philosophie',lang:'FR',kind:'Analyse',url:'https://www.youtube.com/@MonsieurPhi',desc:'Philosophie analytique, logique, morale, IA et esprit critique.'},
    {id:'sadler',name:'Gregory B. Sadler',cat:'Philosophie',lang:'EN',kind:'Cours longs',url:ytSearch('Gregory B Sadler philosophy lectures'),desc:'Lectures très détaillées sur Hegel, Nietzsche, Stoïciens, existentialisme et classiques.'},
    {id:'philoverdose',name:'Philosophy Overdose',cat:'Philosophie',lang:'EN',kind:'Archives',url:ytSearch('Philosophy Overdose lectures'),desc:'Entretiens et conférences de philosophes majeurs, souvent issus d’archives universitaires.'},

    // Histoire / géopolitique
    {id:'crashhistory',name:'CrashCourse History',cat:'Histoire & géopolitique',lang:'EN',kind:'Cours',url:'https://www.youtube.com/@crashcourse',desc:'Histoire mondiale, histoire américaine, politique, économie et sciences humaines.'},
    {id:'arte',name:'ARTE',cat:'Histoire & géopolitique',lang:'FR',kind:'Documentaires',url:'https://www.youtube.com/@arte',desc:'Documentaires et analyses sur histoire, géopolitique, société et culture.'},
    {id:'notabene',name:'Nota Bene',cat:'Histoire & géopolitique',lang:'FR',kind:'Histoire',url:ytSearch('Nota Bene histoire chaîne'),desc:'Histoire, civilisations, personnages et contextes historiques.'},
    {id:'caspian',name:'CaspianReport',cat:'Histoire & géopolitique',lang:'EN',kind:'Géopolitique',url:'https://www.youtube.com/@CaspianReport',desc:'Géopolitique, géographie stratégique, puissances et conflits.'},
    {id:'kingsgenerals',name:'Kings and Generals',cat:'Histoire & géopolitique',lang:'EN',kind:'Histoire',url:'https://www.youtube.com/@KingsandGenerals',desc:'Histoire militaire, empires, guerres et géopolitique avec cartes.'},
    {id:'yaleeuro',name:'Yale — European Civilization',cat:'Histoire & géopolitique',lang:'EN',kind:'Cours complet',url:ytSearch('Yale European Civilization John Merriman full course'),desc:'Cours universitaire complet sur l’Europe moderne et contemporaine.'},
    {id:'ajdoc',name:'الجزيرة الوثائقية',cat:'Histoire & géopolitique',lang:'AR',kind:'Documentaires',url:ytSearch('الجزيرة الوثائقية تاريخ سياسة'),desc:'Documentaires arabophones sur histoire, sociétés et politique.'},

    // Sciences / maths
    {id:'3b1b',name:'3Blue1Brown',cat:'Sciences & maths',lang:'EN',kind:'Maths visuelles',url:'https://www.youtube.com/@3blue1brown',desc:'Algèbre linéaire, calcul, probabilités, réseaux de neurones — compréhension visuelle exceptionnelle.'},
    {id:'scienceetonnante',name:'ScienceEtonnante',cat:'Sciences & maths',lang:'FR',kind:'Science',url:'https://www.youtube.com/@ScienceEtonnante',desc:'Physique, maths, biologie, complexité et méthode scientifique en français.'},
    {id:'veritasium',name:'Veritasium',cat:'Sciences & maths',lang:'EN',kind:'Science',url:'https://www.youtube.com/@veritasium',desc:'Physique, expérimentation, raisonnement scientifique et grandes idées.'},
    {id:'numberphile',name:'Numberphile',cat:'Sciences & maths',lang:'EN',kind:'Mathématiques',url:'https://www.youtube.com/@numberphile',desc:'Mathématiques racontées par des chercheurs et passionnés.'},
    {id:'statquest',name:'StatQuest',cat:'Sciences & maths',lang:'EN',kind:'Stats & ML',url:'https://www.youtube.com/@statquest',desc:'Statistiques, machine learning et concepts quantitatifs expliqués clairement.'},
    {id:'pbsspace',name:'PBS Space Time',cat:'Sciences & maths',lang:'EN',kind:'Physique',url:'https://www.youtube.com/@pbsspacetime',desc:'Relativité, cosmologie, quantique et physique théorique.'},
    {id:'royalinstitution',name:'The Royal Institution',cat:'Sciences & maths',lang:'EN',kind:'Conférences',url:'https://www.youtube.com/@TheRoyalInstitution',desc:'Conférences scientifiques de haut niveau et démonstrations historiques.'},
    {id:'fermilab',name:'Fermilab',cat:'Sciences & maths',lang:'EN',kind:'Physique',url:'https://www.youtube.com/@fermilab',desc:'Particules, cosmologie et physique moderne expliquées par des chercheurs.'},

    // IA / code
    {id:'karpathy',name:'Andrej Karpathy',cat:'IA & code',lang:'EN',kind:'IA avancée',url:'https://www.youtube.com/@AndrejKarpathy',desc:'Réseaux de neurones, LLM et construction de modèles expliqués depuis les fondations.'},
    {id:'freecodecamp',name:'freeCodeCamp.org',cat:'IA & code',lang:'EN',kind:'Tutoriels complets',url:'https://www.youtube.com/@freecodecamp',desc:'Cours gratuits de plusieurs heures : web, Python, data, IA, cloud, bases de données.'},
    {id:'computerphile',name:'Computerphile',cat:'IA & code',lang:'EN',kind:'Informatique',url:'https://www.youtube.com/@Computerphile',desc:'Sécurité, algorithmes, systèmes, IA et histoire de l’informatique.'},
    {id:'deepmind',name:'Google DeepMind',cat:'IA & code',lang:'EN',kind:'Recherche IA',url:'https://www.youtube.com/@googledeepmind',desc:'Recherche de pointe en intelligence artificielle, agents et science.'},
    {id:'cs229',name:'Stanford CS229 — Machine Learning',cat:'IA & code',lang:'EN',kind:'Cours Stanford',url:ytSearch('Stanford CS229 Machine Learning full lectures'),desc:'Cours universitaire classique de machine learning.'},
    {id:'cs231n',name:'Stanford CS231n — Vision',cat:'IA & code',lang:'EN',kind:'Cours Stanford',url:ytSearch('Stanford CS231n full lectures'),desc:'Deep learning pour la vision par ordinateur.'},
    {id:'mitdeeplearn',name:'MIT — Introduction to Deep Learning',cat:'IA & code',lang:'EN',kind:'Cours MIT',url:ytSearch('MIT Introduction to Deep Learning 6.S191 full course'),desc:'Cours intensif sur deep learning, transformers et modèles génératifs.'},
    {id:'fireship',name:'Fireship',cat:'IA & code',lang:'EN',kind:'Veille rapide',url:'https://www.youtube.com/@Fireship',desc:'Développement moderne, outils, frameworks et concepts expliqués rapidement.'},

    // Grands esprits / masterclasses
    {id:'feynman',name:'Richard Feynman — Messenger Lectures',cat:'Grands esprits',lang:'EN',kind:'Masterclass',url:ytSearch('Richard Feynman Messenger Lectures full'),desc:'Feynman pense la physique devant toi : intuition, lois et méthode scientifique.'},
    {id:'sapolsky',name:'Robert Sapolsky — Human Behavioral Biology',cat:'Grands esprits',lang:'EN',kind:'Cours Stanford',url:ytSearch('Robert Sapolsky Human Behavioral Biology Stanford full course'),desc:'Biologie du comportement, stress, évolution, neurosciences et société.'},
    {id:'strang',name:'Gilbert Strang — Linear Algebra',cat:'Grands esprits',lang:'EN',kind:'Cours MIT',url:ytSearch('Gilbert Strang MIT Linear Algebra full course'),desc:'Un cours légendaire d’algèbre linéaire par un immense pédagogue.'},
    {id:'kahneman',name:'Daniel Kahneman — décision & biais',cat:'Grands esprits',lang:'EN',kind:'Conférences',url:ytSearch('Daniel Kahneman lecture thinking decision biases'),desc:'Jugement, biais cognitifs, risque et décision par le prix Nobel.'},
    {id:'chomsky',name:'Noam Chomsky — langage & politique',cat:'Grands esprits',lang:'EN',kind:'Conférences',url:ytSearch('Noam Chomsky lectures language politics'),desc:'Linguistique, cognition, médias et politique — à confronter avec ses critiques.'},
    {id:'taleb',name:'Nassim Nicholas Taleb — risque',cat:'Grands esprits',lang:'EN',kind:'Conférences',url:ytSearch('Nassim Nicholas Taleb lectures risk antifragile'),desc:'Risque, incertitude, antifragilité et critique des modèles.'},
    {id:'sen',name:'Amartya Sen — justice & développement',cat:'Grands esprits',lang:'EN',kind:'Conférences',url:ytSearch('Amartya Sen lectures justice development economics'),desc:'Capabilités, justice, famine, développement humain et choix social.'},
    {id:'hofstadter',name:'Douglas Hofstadter — esprit & cognition',cat:'Grands esprits',lang:'EN',kind:'Conférences',url:ytSearch('Douglas Hofstadter lectures consciousness cognition'),desc:'Esprit, analogie, conscience, Gödel et intelligence.'},

    // Arabe
    {id:'da7ee7',name:'الدحيح',cat:'Arabe',lang:'AR',kind:'Science & culture',url:ytSearch('الدحيح حلقات علم اقتصاد تاريخ'),desc:'Vulgarisation scientifique, histoire, économie et culture en arabe.'},
    {id:'akhdar',name:'أخضر',cat:'Arabe',lang:'AR',kind:'Livres & idées',url:ytSearch('أخضر ملخص كتب فلسفة اقتصاد'),desc:'Idées, livres, psychologie, économie et développement intellectuel.'},
    {id:'khanar',name:'Khan Academy بالعربي',cat:'Arabe',lang:'AR',kind:'Cours',url:ytSearch('Khan Academy عربي رياضيات علوم اقتصاد'),desc:'Maths, sciences et bases académiques en arabe.'},
    {id:'ajdoc2',name:'الجزيرة الوثائقية — علوم ومجتمع',cat:'Arabe',lang:'AR',kind:'Documentaires',url:ytSearch('الجزيرة الوثائقية علوم مجتمع اقتصاد'),desc:'Documentaires arabophones pour élargir les sujets au contexte régional et mondial.'}
  ];

  let active='Tous';
  let favorites=new Set((()=>{try{return JSON.parse(localStorage.getItem(FAV_KEY)||'[]')}catch{return[]}})());

  const cats=['Tous','★ Favoris','Universités','Économie','Philosophie','Histoire & géopolitique','Sciences & maths','IA & code','Grands esprits','Arabe'];
  const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

  function saveFavs(){localStorage.setItem(FAV_KEY,JSON.stringify([...favorites]));}
  function renderFilters(){
    const root=$('resourceFilters'); if(!root)return;
    root.innerHTML='';
    cats.forEach(cat=>{
      const b=document.createElement('button');
      b.type='button'; b.className='resource-chip'+(active===cat?' active':''); b.textContent=cat;
      b.onclick=()=>{active=cat;renderFilters();renderResources();};
      root.appendChild(b);
    });
  }

  function match(r,q){
    const hay=`${r.name} ${r.cat} ${r.lang} ${r.kind} ${r.desc}`.toLowerCase();
    return !q||hay.includes(q.toLowerCase());
  }

  function renderResources(){
    const grid=$('resourceGrid'); if(!grid)return;
    const q=$('resourceSearch')?.value.trim()||'';
    let items=RESOURCES.filter(r=>match(r,q));
    if(active==='★ Favoris')items=items.filter(r=>favorites.has(r.id));
    else if(active!=='Tous')items=items.filter(r=>r.cat===active);
    $('resourceCount').textContent=`${items.length} ressource${items.length>1?'s':''}`;
    grid.innerHTML='';
    if(!items.length){grid.innerHTML='<div class="resource-empty">Aucune ressource ici. Essaie un autre filtre.</div>';return;}
    items.forEach(r=>{
      const card=document.createElement('article'); card.className='resource-card';
      const fav=favorites.has(r.id);
      card.innerHTML=`<div class="resource-card-top"><div><span class="resource-kind">${esc(r.kind)}</span><span class="resource-lang">${esc(r.lang)}</span></div><button class="resource-fav ${fav?'on':''}" type="button" aria-label="Favori">${fav?'★':'☆'}</button></div><h3>${esc(r.name)}</h3><p>${esc(r.desc)}</p><div class="resource-card-foot"><span>${esc(r.cat)}</span><a href="${r.url}" target="_blank" rel="noopener noreferrer">Ouvrir YouTube ↗</a></div>`;
      card.querySelector('.resource-fav').onclick=()=>{favorites.has(r.id)?favorites.delete(r.id):favorites.add(r.id);saveFavs();renderResources();};
      grid.appendChild(card);
    });
  }

  function buildSmartLinks(){
    const fromInput=$('resourceTopic')?.value.trim();
    const fromCourse=$('topic')?.value.trim();
    const topic=fromInput||fromCourse;
    const root=$('smartLinks'); if(!root)return;
    if(!topic){root.innerHTML='<span class="muted">Écris un sujet ici ou dans ton cours pour générer des accès YouTube ciblés.</span>';return;}
    if($('resourceTopic')&&!fromInput)$('resourceTopic').value=topic;
    const lang=$('resourceLang')?.value||'FR';
    const suffix={FR:{course:'cours universitaire complet',playlist:'playlist cours',expert:'conférence expert chercheur',doc:'documentaire',debate:'débat controverse',tutorial:'explication approfondie tutoriel'},EN:{course:'full university course',playlist:'course playlist',expert:'expert lecture researcher',doc:'documentary',debate:'debate controversy',tutorial:'deep explanation tutorial'},AR:{course:'محاضرات جامعية كاملة',playlist:'دروس كاملة قائمة تشغيل',expert:'محاضرة خبير باحث',doc:'وثائقي',debate:'مناظرة نقاش',tutorial:'شرح عميق درس'}}[lang];
    const links=[['🎓 Cours universitaire',suffix.course],['▶︎ Playlist complète',suffix.playlist],['🧠 Conférence d’expert',suffix.expert],['🎬 Documentaire',suffix.doc],['⚖️ Débat / controverse',suffix.debate],['🛠 Tutoriel / explication',suffix.tutorial]];
    root.innerHTML=links.map(([label,s])=>`<a class="smart-link" href="${ytSearch(`${topic} ${s}`)}" target="_blank" rel="noopener noreferrer">${label}<small>${esc(topic)}</small></a>`).join('');
  }

  function init(){
    if(!$('resourceGrid'))return;
    renderFilters(); renderResources(); buildSmartLinks();
    $('resourceSearch')?.addEventListener('input',renderResources);
    $('resourceTopic')?.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();buildSmartLinks();}});
    $('resourceSmart')?.addEventListener('click',buildSmartLinks);
    $('resourceLang')?.addEventListener('change',buildSmartLinks);
    $('topic')?.addEventListener('change',()=>{if(!$('resourceTopic').value.trim())buildSmartLinks();});
  }
  document.readyState==='loading'?document.addEventListener('DOMContentLoaded',init):init();
})();
