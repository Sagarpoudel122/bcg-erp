/* Detail popups (bill details, cheque details, new ledger, change period, Go To) */
/* One popup at a time. PANELS[kind] = { view() html, last() Enter on the last field, del(j) Ctrl+D on row j,
   accept() Ctrl+A, close(p) } registered by the page that owns the popup. */
let P=null;   // the open popup: {kind, i, then}
const PANELS={};
function openPanel(kind,i,then){P={kind,i,then};$('#app').inert=true;drawPanel(true)}
function drawPanel(first){const el=$('#panel');el.hidden=false;const raw=PANELS[P.kind].view(),h=raw.indexOf('</h2>')+5;
  const html=`<div class="pcard" role="dialog" aria-modal="true">${raw.slice(0,h)}<div class="pb">${raw.slice(h)}</div></div>`;quiet(()=>{el.innerHTML=html});
  if(first){const L=navInputs(el);if(L[0])focusEl(L[0])}}
function closePanel(){const p=P;P=null;pickClose();$('#panel').hidden=true;quiet(()=>{$('#panel').innerHTML=''});$('#app').inert=false;
  const h=PANELS[p.kind];if(h&&h.close)h.close(p);
  render();if(p.then)p.then()}
function panelLast(){const h=PANELS[P.kind];if(h&&h.last)h.last();else closePanel()}
function panelKey(e){const k=e.key,t=e.target,kn=keyName(e),h=PANELS[P.kind]||{};
  if(k==='Escape'){stop(e);closePanel();return}
  if(k==='Enter'&&t.dataset.f){stop(e);const L=navInputs($('#panel'));if(t===L[L.length-1])panelLast();else moveFocus(t,1);return}
  if(k==='Backspace'&&t.dataset.f&&goesBack(t)){stop(e);moveFocus(t,-1);return}
  if(kn==='Ctrl+D'){stop(e);const j=+t.dataset.j;if(h.del&&!isNaN(j))h.del(j);return}
  if(kn==='Ctrl+A'){stop(e);if(h.accept)h.accept();return}
  if(t.dataset.f==='fm')FIELD.fm.key(e,t)}   // Y / N and picture fields of a form inside a popup
