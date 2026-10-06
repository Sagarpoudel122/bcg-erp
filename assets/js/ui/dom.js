/* DOM helpers, focus movement, panel markup */
/* ---------- small helpers ---------- */
const stop=e=>{e.preventDefault();e.stopPropagation()};
const view=()=>$('#view');
const navInputs=root=>[...root.querySelectorAll('input[data-nav]')];
function focusEl(sel){const el=typeof sel==='string'?$(sel):sel;if(el){el.focus();if(el.tagName==='INPUT')el.select()}}
function moveFocus(from,dir){const root=from.closest('#panel')||view();const list=navInputs(root);const t=list[list.indexOf(from)+dir];if(t)focusEl(t);return !!t}
// Tab / Shift+Tab go round what can be reached on the page (an open popup makes the rest inert) and never out to the browser's address bar
const tabbables=root=>[...root.querySelectorAll('a[href],button,input,select,textarea,[tabindex]')].filter(el=>el.tabIndex>=0&&!el.disabled&&!el.closest('[inert],[hidden]')&&el.getClientRects().length);
function tabStep(back,root){const L=tabbables(root||document);if(!L.length)return;const i=L.indexOf(document.activeElement);
  focusEl(L[i<0?(back?L.length-1:0):(i+(back?-1:1)+L.length)%L.length])}
function keyName(e){let k=e.key;if(k===' ')k='Space';if(k.length===1)k=k.toUpperCase();return(e.ctrlKey?'Ctrl+':'')+(e.altKey?'Alt+':'')+k}
let QUIET=0;   // >0 while a screen or popup is being redrawn: the browser blurs the old field then, and that must not write into the new state
const quiet=fn=>{QUIET++;try{fn()}finally{QUIET--}};
const tp=(title,right,body)=>`<section class="tp"><header class="tp-bar"><b>${esc(title)}</b><span>${esc(right||'')}</span></header><div class="tp-body">${body}</div></section>`;
