/* Bill details popup: how a party's line is split into New Ref / Against Ref / Advance / On Account bills.
   Shared by the voucher pages (pages/voucher.js) and the invoice pages (pages/invoice.js): it works on draft(S.view).lines[P.i]. */
function allocSumHtml(ln){const sum=ln.alloc.reduce((a,b)=>a+cents(b.amt),0),c=cents(ln.amt);return `<b class="${sum===c&&c>0?'okt':'badt'}">${fmt(sum)} of ${fmt(c)}</b>`}
function panelAlloc(){const d=draft(S.view),ln=d.lines[P.i],l=led(ln.lid),s=serial(d.date.m,d.date.d);
  const rows=ln.alloc.map((a,j)=>{const k=`data-nav data-f="alloc" data-i="${P.i}" data-j="${j}"`;
    const ref=a.t==='Against'?`<input id="a${j}-ref" class="in" ${k} data-pick data-k="ref" aria-label="Bill" placeholder="Pick a bill" value="${esc(a.ref)}" autocomplete="off">`
      :a.t==='New'?`<input id="a${j}-ref" class="in" ${k} data-k="ref" aria-label="New bill number" placeholder="Bill no., e.g. #P-102" value="${esc(a.ref)}" autocomplete="off">`
      :`<span class="dash">${a.t==='Advance'?'Before the bill comes':'Not linked to a bill'}</span>`;
    return `<div class="prow a"><input id="a${j}-t" class="in" ${k} data-pick data-k="t" aria-label="Bill type" value="${TL[a.t]}" autocomplete="off">${ref}
      <input id="a${j}-amt" class="in amt" ${k} data-amt data-k="amt" inputmode="decimal" aria-label="Bill amount" value="${fmtIn(a.amt)}" autocomplete="off">
      ${a.t==='New'?`<div class="due">due in <input class="in" ${k} data-k="days" inputmode="numeric" aria-label="Credit days" value="${esc(a.days)}" autocomplete="off"> days → <b id="due${j}">${bsShort(s+(+a.days||0))}</b></div>`:''}</div>`}).join('');
  return `<h2>Bill details · ${esc(l.name)}</h2><div class="phead"><span>Line amount <b>${fmt(cents(ln.amt))}</b></span><span>Allocated <span id="asum">${allocSumHtml(ln)}</span></span></div>${rows}<p class="pfoot">Enter next · Ctrl+D remove row · Esc done</p>`}
function refreshAlloc(ln,j){const el=$('#asum');if(el)el.innerHTML=allocSumHtml(ln);const a=ln.alloc[j],due=$(`#due${j}`);
  if(a&&due){const d=draft(S.view);due.textContent=bsShort(serial(d.date.m,d.date.d)+(+a.days||0))}}
function allocProblem(ln){for(let j=0;j<ln.alloc.length;j++){const a=ln.alloc[j];
  if(a.t==='Against'&&!a.ref)return{j,m:'Pick which bill is being settled.',id:`#a${j}-ref`};
  if(a.t==='New'&&!String(a.ref).trim())return{j,m:'Give the new bill a number.',id:`#a${j}-ref`}}return null}
FIELD.alloc={
  input(t){const j=+t.dataset.j,ln=draft(S.view).lines[+t.dataset.i],a=ln.alloc[j];a[t.dataset.k]=t.value;refreshAlloc(ln,j)},
  amt(t,raw){const j=+t.dataset.j,ln=draft(S.view).lines[+t.dataset.i];if(ln&&ln.alloc[j]){ln.alloc[j].amt=raw;refreshAlloc(ln,j)}}};
PICK.alloc={
  source(t){const i=+t.dataset.i;
    if(t.dataset.k==='t')return Object.entries(TL).map(([v,label])=>({v,label}));
    const d=draft(S.view);return pendingBills(d.lines[i].lid,d.editingId).map(b=>({v:b.ref,label:b.ref,sub:fmt(b.rem)+' pending'}))},
  cur(t){const a=draft(S.view).lines[+t.dataset.i].alloc[+t.dataset.j];return t.dataset.k==='t'?TL[a.t]:a.ref},
  title:t=>t.dataset.k==='ref'?'Pending Bills':'Method of Adjustment',
  commit(t,it){const k=t.dataset.k,i=+t.dataset.i,j=+t.dataset.j,d=draft(S.view),ln=d.lines[i],a=ln.alloc[j];
    if(k==='t'){a.t=it.v;if(a.t!=='Against'&&a.t!=='New')a.ref='';
      if(a.t==='Against'){const p=pendingBills(ln.lid,d.editingId);a.ref=p[0]?p[0].ref:''}
      if(a.t==='New'&&a.days==null)a.days=led(ln.lid).creditDays;
      drawPanel();const L=navInputs($('#panel'));focusEl(L[L.findIndex(x=>x.id===`a${j}-t`)+1]);return}
    a.ref=it.v;moveFocus(t,1)}};
PANELS.alloc={view:panelAlloc,
  last(){const d=draft(S.view),ln=d.lines[P.i];const sum=ln.alloc.reduce((a,b)=>a+cents(b.amt),0),c=cents(ln.amt);
    const pr=allocProblem(ln);if(pr){say(pr.m,'bad');focusEl(pr.id);return}
    if(sum<c){ln.alloc.push({t:'On Account',ref:'',amt:((c-sum)/100).toFixed(2),days:led(ln.lid).creditDays});drawPanel();focusEl(`#a${ln.alloc.length-1}-t`);return}
    if(sum>c){say('The bills add up to more than the line amount.','bad');return}
    closePanel()},
  del(j){const ln=draft(S.view).lines[P.i];if(ln.alloc.length>1){ln.alloc.splice(j,1);drawPanel();focusEl(`#a${Math.min(j,ln.alloc.length-1)}-t`)}}};
