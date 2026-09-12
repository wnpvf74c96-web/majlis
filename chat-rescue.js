(()=>{
  const $=id=>document.getElementById(id);
  let reloading=false, boundInput=null;
  function addCss(){
    if(document.getElementById('majlisChatMobileCss'))return;
    const l=document.createElement('link');l.id='majlisChatMobileCss';l.rel='stylesheet';l.href='./chat-mobile.css?v=15';document.head.appendChild(l);
  }
  function chatReady(){return !!($('deepChatPanel')&&$('dcInput')&&$('dcSend'))}
  function prepareInput(){
    const input=$('dcInput');
    if(!input)return false;
    input.disabled=false;
    input.readOnly=false;
    input.removeAttribute('disabled');
    input.removeAttribute('readonly');
    input.setAttribute('tabindex','0');
    input.setAttribute('inputmode','text');
    input.setAttribute('autocomplete','off');
    input.style.pointerEvents='auto';
    input.style.webkitUserSelect='text';
    input.style.userSelect='text';
    if(boundInput!==input){
      boundInput=input;
      const begin=()=>{
        document.body.classList.add('majlis-chat-typing');
        setTimeout(()=>input.scrollIntoView({block:'center',behavior:'smooth'}),120);
      };
      const end=()=>setTimeout(()=>document.body.classList.remove('majlis-chat-typing'),180);
      input.addEventListener('focus',begin);
      input.addEventListener('blur',end);
      input.addEventListener('touchend',()=>{
        try{input.focus({preventScroll:true})}catch{input.focus()}
      },{passive:true});
      input.addEventListener('pointerup',()=>{
        if(document.activeElement!==input){try{input.focus({preventScroll:true})}catch{input.focus()}}
      });
    }
    return true;
  }
  function focusComposer(scroll=true){
    const input=$('dcInput');if(!input)return false;
    prepareInput();
    if(scroll)setTimeout(()=>input.scrollIntoView({behavior:'smooth',block:'center'}),80);
    return true;
  }
  function setMode(mode){
    const btn=document.querySelector(`[data-dcmode="${mode}"]`);
    if(btn){btn.click();return true}
    return false;
  }
  function reloadChat(done){
    if(reloading)return;reloading=true;
    const old=document.getElementById('majlisDeepChatScript');old?.remove();
    const s=document.createElement('script');s.id='majlisDeepChatScript';s.src=`./deep-chat.js?v=15&t=${Date.now()}`;
    s.onload=()=>{reloading=false;setTimeout(()=>{prepareInput();done?.()},80)};
    s.onerror=()=>{reloading=false;console.error('Majlis: impossible de charger le chat')};
    document.body.appendChild(s);
  }
  function ensureChat(opts={}){
    addCss();
    const finish=()=>{
      if(!chatReady())return;
      window.MajlisBoard?.show?.('chat');
      setTimeout(()=>{
        prepareInput();
        if(opts.mode)setMode(opts.mode);
        focusComposer(opts.focus!==false);
      },100);
    };
    if(chatReady())return finish();
    reloadChat(finish);
  }
  document.addEventListener('click',e=>{
    const action=e.target.closest('[data-action]')?.dataset.action;
    const space=e.target.closest('[data-space]')?.dataset.space;
    if(action==='chat')setTimeout(()=>ensureChat({focus:false}),0);
    if(action==='debate')setTimeout(()=>ensureChat({mode:'contradiction'}),0);
    if(action==='text')setTimeout(()=>ensureChat({mode:'litteraire'}),0);
    if(space==='chat')setTimeout(()=>ensureChat({focus:false}),0);
  },true);
  document.addEventListener('touchstart',e=>{
    const input=e.target.closest?.('#dcInput');
    if(input)prepareInput();
  },{capture:true,passive:true});
  document.addEventListener('pointerdown',e=>{
    if(e.target.closest?.('#dcInput'))prepareInput();
  },true);
  const observer=new MutationObserver(()=>{if($('dcInput'))prepareInput()});
  observer.observe(document.documentElement,{childList:true,subtree:true});
  if(window.visualViewport){
    window.visualViewport.addEventListener('resize',()=>{
      if(document.activeElement===$('dcInput'))setTimeout(()=>$('dcInput')?.scrollIntoView({block:'center'}),50);
    });
  }
  window.addEventListener('majlis:open-chat',e=>ensureChat(e.detail||{}));
  window.MajlisChatRescue={ensureChat,setMode,focusComposer,prepareInput};
  addCss();prepareInput();
})();
