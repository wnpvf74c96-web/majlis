(()=>{
  const $=id=>document.getElementById(id);
  let reloading=false;
  function addCss(){
    if(document.getElementById('majlisChatMobileCss'))return;
    const l=document.createElement('link');l.id='majlisChatMobileCss';l.rel='stylesheet';l.href='./chat-mobile.css?v=14';document.head.appendChild(l);
  }
  function chatReady(){return !!($('deepChatPanel')&&$('dcInput')&&$('dcSend'))}
  function focusComposer(scroll=true){
    const input=$('dcInput');if(!input)return false;
    if(scroll) setTimeout(()=>input.scrollIntoView({behavior:'smooth',block:'center'}),80);
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
    const s=document.createElement('script');s.id='majlisDeepChatScript';s.src=`./deep-chat.js?v=14&t=${Date.now()}`;
    s.onload=()=>{reloading=false;setTimeout(()=>done?.(),60)};
    s.onerror=()=>{reloading=false;console.error('Majlis: impossible de charger le chat')};
    document.body.appendChild(s);
  }
  function ensureChat(opts={}){
    addCss();
    const finish=()=>{
      if(!chatReady())return;
      window.MajlisBoard?.show?.('chat');
      setTimeout(()=>{
        if(opts.mode)setMode(opts.mode);
        focusComposer(opts.focus!==false);
      },120);
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
  window.addEventListener('majlis:open-chat',e=>ensureChat(e.detail||{}));
  window.MajlisChatRescue={ensureChat,setMode,focusComposer};
  addCss();
})();
