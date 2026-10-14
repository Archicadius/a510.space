document.querySelectorAll('.cmp').forEach(el=>{
 let dragging=false,x=0,y=0,gesture=null;
 const set=p=>{p=Math.max(0,Math.min(100,p));el.style.setProperty('--p',p+'%');el.setAttribute('aria-valuenow',Math.round(p));el.dataset.edge=p===0?'after':p===100?'before':'';};
 const at=e=>{const r=el.getBoundingClientRect();set((e.clientX-r.left)/r.width*100);};set(50);
 el.addEventListener('pointerdown',e=>{if(e.button&&e.pointerType!=='touch')return;dragging=true;x=e.clientX;y=e.clientY;gesture=e.pointerType==='touch'?null:'horizontal';if(gesture)at(e);el.setPointerCapture(e.pointerId);});
 el.addEventListener('pointermove',e=>{if(!dragging)return;if(!gesture){const dx=Math.abs(e.clientX-x),dy=Math.abs(e.clientY-y);if(Math.max(dx,dy)<7)return;gesture=dx>dy?'horizontal':'vertical';}if(gesture==='horizontal')at(e);});
 ['pointerup','pointercancel','lostpointercapture'].forEach(name=>el.addEventListener(name,()=>dragging=false));
 el.addEventListener('keydown',e=>{let p=Number(el.getAttribute('aria-valuenow'));if(e.key==='Home')p=0;else if(e.key==='End')p=100;else if(e.key==='ArrowLeft')p-=5;else if(e.key==='ArrowRight')p+=5;else return;e.preventDefault();set(p);});
});
