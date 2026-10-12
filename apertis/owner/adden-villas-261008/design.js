document.querySelectorAll('.cmp').forEach(el=>{
 let dragging=false,x=0,y=0,gesture=null;
 const set=p=>{p=Math.max(0,Math.min(100,p));el.style.setProperty('--p',p+'%');el.setAttribute('aria-valuenow',Math.round(p));el.dataset.edge=p===0?'after':p===100?'before':'';};
 const at=e=>{const r=el.getBoundingClientRect();set((e.clientX-r.left)/r.width*100);};set(50);
 el.addEventListener('pointerdown',e=>{if(e.button&&e.pointerType!=='touch')return;dragging=true;x=e.clientX;y=e.clientY;gesture=e.pointerType==='touch'?null:'horizontal';if(gesture)at(e);el.setPointerCapture(e.pointerId);});
 el.addEventListener('pointermove',e=>{if(!dragging)return;if(!gesture){const dx=Math.abs(e.clientX-x),dy=Math.abs(e.clientY-y);if(Math.max(dx,dy)<7)return;gesture=dx>dy?'horizontal':'vertical';}if(gesture==='horizontal')at(e);});
 ['pointerup','pointercancel','lostpointercapture'].forEach(name=>el.addEventListener(name,()=>dragging=false));
 el.addEventListener('keydown',e=>{let p=Number(el.getAttribute('aria-valuenow'));if(e.key==='Home')p=0;else if(e.key==='End')p=100;else if(e.key==='ArrowLeft')p-=5;else if(e.key==='ArrowRight')p+=5;else return;e.preventDefault();set(p);});
});
const modal=document.getElementById('lightbox');
if(modal){const image=modal.querySelector('img'),caption=modal.querySelector('[data-caption]');document.querySelectorAll('[data-full]').forEach(b=>b.addEventListener('click',()=>{image.src=b.dataset.full;image.alt=b.dataset.caption;caption.textContent=b.dataset.caption;modal.showModal();}));modal.querySelector('button').addEventListener('click',()=>modal.close());modal.addEventListener('click',e=>{if(e.target===modal)modal.close();});}
document.querySelectorAll('[data-share]').forEach(button=>button.addEventListener('click',async()=>{const url=button.dataset.url||location.href.split('?')[0],status=document.getElementById('share-status');try{if(navigator.share){await navigator.share({title:'Adden Villas — project presentation',url});if(status)status.textContent='';}else{await navigator.clipboard.writeText(url);if(status)status.textContent='Link copied. Paste it into your conversation.';}}catch(e){if(e.name!=='AbortError'&&status)status.textContent='Copy the page address from your browser to share it.';}}));
