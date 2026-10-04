/* Prototype options page (the open questions as switches) and reset */
const QS=[
 {k:'q1',label:'Q1 · Bank OD & loan groups'},{k:'q3',label:'Q3 · Ledger extras (short code, bill-by-bill choice)'},
 {k:'q4',label:'Q4 · Sales & Purchase ledgers ready'},{k:'q5',label:'Q5 · Split opening balance into bills'},
 {k:'q6',ab:1,label:'Q6 · Number style (Space switches A / B)'},{k:'q7',label:'Q7 · TDS lines in Payment / Receipt'},
 {k:'q8',label:'Q8 · Words & signatures on print'},
 {k:'r2',label:'R2 · Predefined groups can be renamed'},
 {k:'h1',label:'H1 · Paying salary (HRM) posts a Payment voucher in Account'}];
/* ---------- Prototype options ---------- */
function vOptions(){return tp('Prototype Options','Open questions',
  QS.map((q,i)=>`<div class="row ${i===S.ol.sel?'sel':''}" data-i="${i}"><span class="box">${q.ab?S.q.q6:S.q[q.k]?'✓':''}</span><span>${esc(q.label)}</span></div>`).join(''))}
function toggleOpt(){const q=QS[S.ol.sel];if(q.ab)S.q.q6=S.q.q6==='A'?'B':'A';else S.q[q.k]=!S.q[q.k];sanitize();render()}
const resetData=()=>ask('Reset the whole prototype to its sample data? All users, businesses, vouchers, employees and emails made here are lost, and you are signed out.',resetAll);
start({
  id:'options',title:'Prototype Options',view:vOptions,state:S.ol,activate:toggleOpt,
  keys:()=>[{k:'↑ ↓',l:'Move'},{k:'Space',l:'Switch on / off',a:toggleOpt},{gap:1},{k:'Alt+R',l:'Reset data',a:resetData},{gap:1},escKey()],
  key(e){if(listNav(e,S.ol,QS.length,render))return true;if(e.key==='Enter'){stop(e);toggleOpt();return true}return false}});
