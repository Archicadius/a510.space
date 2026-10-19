(function(){
  var root=document.documentElement, KEY='prop-lang';
  function setLang(l){root.lang=l;try{localStorage.setItem(KEY,l)}catch(e){}
    document.querySelectorAll('[data-title-'+l+']').forEach(function(n){document.title=n.getAttribute('data-title-'+l)});
    var b=document.getElementById('lang');if(b)b.setAttribute('aria-label',l==='ru'?'Switch to English':'Переключить на русский');}
  var q=new URLSearchParams(location.search).get('lang'),saved=null;
  try{saved=localStorage.getItem(KEY)}catch(e){}
  setLang(q==='en'||q==='ru'?q:(saved||'ru'));
  var b=document.getElementById('lang');
  if(b)b.addEventListener('click',function(){setLang(root.lang==='ru'?'en':'ru')});
  var box=document.getElementById('lightbox');
  if(box&&box.showModal){var im=box.querySelector('img'),cap=box.querySelector('[data-cap]');
    document.querySelectorAll('.shot').forEach(function(s){s.addEventListener('click',function(){var i=s.querySelector('img');im.src=s.getAttribute('data-full')||i.src;im.alt=i.alt;cap.textContent=i.alt;box.showModal();});});
    box.querySelector('button').addEventListener('click',function(){box.close()});
    box.addEventListener('click',function(e){if(e.target===box)box.close()});}
})();
