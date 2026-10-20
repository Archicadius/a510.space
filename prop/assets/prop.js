(function(){
  var root=document.documentElement, DEF=root.getAttribute('data-lang-default')||'ru', KEY=root.getAttribute('data-lang-key')||'prop-lang', L=['ru','en','tr'];
  root.classList.add('js');
  function setLang(l){if(L.indexOf(l)<0)l=DEF;root.lang=l;try{localStorage.setItem(KEY,l)}catch(e){}
    var t=document.querySelector('[data-title-'+l+']');if(t)document.title=t.getAttribute('data-title-'+l);
    document.querySelectorAll('.langs button').forEach(function(b){b.setAttribute('aria-pressed',b.dataset.l===l?'true':'false')});}
  var q=new URLSearchParams(location.search).get('lang'),saved=null;
  try{saved=localStorage.getItem(KEY)}catch(e){}
  setLang(L.indexOf(q)>=0?q:(saved||DEF));
  document.querySelectorAll('.langs button').forEach(function(b){b.addEventListener('click',function(){setLang(b.dataset.l)})});
  var box=document.getElementById('lightbox');
  if(box&&box.showModal){var im=box.querySelector('img'),cap=box.querySelector('[data-cap]');
    document.querySelectorAll('.shot').forEach(function(s){s.addEventListener('click',function(){var i=s.querySelector('img');im.src=i.currentSrc||i.src;im.alt=i.alt;cap.textContent=i.alt;box.showModal();});});
    box.querySelector('button').addEventListener('click',function(){box.close()});
    box.addEventListener('click',function(e){if(e.target===box)box.close()});}
  var els=document.querySelectorAll('.section,.facts,.intro,.manager,.band');
  if('IntersectionObserver' in window){
    var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target);}})},{rootMargin:'0px 0px -6% 0px'});
    els.forEach(function(el){el.classList.add('reveal');io.observe(el);});
  }
})();
