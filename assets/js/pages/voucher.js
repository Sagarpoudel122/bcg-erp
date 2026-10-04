/* Voucher entry page (contra, payment, receipt, journal) */
/* Voucher entry. The same script serves contra.html, payment.html, receipt.html and journal.html;
   the page says which one in <body data-page="...">. Every voucher starts as plain Dr/Cr lines (Ctrl+H = Account layout). */
const TYPE=document.body.dataset.page;
// Where the cursor starts on a voucher: the Dr/Cr cell of the first line (the Account field in Account layout, which has no Dr/Cr cell)
const firstField=type=>draft(type).mode==='single'?'#L0-lid':'#L0-side';
// Which ledgers a line may use. Account layout: the Account is cash/bank; Contra particulars are cash/bank, Payment/Receipt particulars are not.
function lineRule(type,i){const single=draft(type).mode==='single';
  if(single)return i===0?isCash:(type==='contra'?isCash:l=>!isCash(l));
  return type==='contra'?isCash:type==='journal'?l=>!isCash(l):()=>true}
function ledgerItems(type,i){const vis=S.ledgers.filter(visible);const ok=lineRule(type,i);const out=[];
  for(const g of GROUPS)for(const l of vis)if(l.group===g.n&&ok(l))out.push({v:l.id,label:l.name,sub:g.sys?'System':gname(g.n),code:S.q.q3?l.code:''});return out}
// Put a ledger on a voucher line. In the Account layout the Account line has no amount, so focus moves on to the first particular.
function setLineLedger(i,lid){const d=draft(S.view),ln=d.lines[i],single=d.mode==='single',next=single&&i===0?'#L1-lid':`#L${i}-amt`;
  if(ln.lid===lid){focusEl(next);return}
  ln.lid=lid;ln.inst={open:false,type:'Cheque',no:'',date:''};initAlloc(d,ln);
  if(!single&&!cents(ln.amt)){const{dr,cr}=totals(d);const gap=ln.side==='Dr'?cr-dr:dr-cr;if(gap>0){ln.amt=(gap/100).toFixed(2);if(ln.alloc.length===1)ln.alloc[0].amt=ln.amt}}
  render(next)}
function setSide(i,side){const d=draft(S.view),ln=d.lines[i];if(ln.side===side)return;ln.side=side;initAlloc(d,ln);
  const t=$(`#L${i}-side`);t.value=side;t.closest('.line').dataset.side=side;refreshLive()}
function lidEnter(t,i){const d=draft(S.view),ln=d.lines[i],val=t.value.trim();
  if(!val){ln.lid='';ln.alloc=[];
    if(i>=2&&!cents(ln.amt)){d.lines.splice(i,1);if(d.mode==='single'){render();finishLines()}else render('#narr');return}
    say('Pick a ledger. Ctrl+A accepts when the voucher is complete.','bad');return}
  if(ln.lid&&led(ln.lid).name===val){moveFocus(t,1);return}
  say(`No ledger called "${val}".`,'bad')}
const dateHint=s=>s<=LOCK?'<span class="bad">Locked period</span>':s<BOOKS?'<span class="bad">Before the books begin</span>':s>TODAY?'<span class="warn">Future date</span>':'';
function refreshLive(){const d=draft(S.view);sync(d);const t=$('#totals');if(t)t.innerHTML=totalsHtml(d);const a=$('#acctamt');if(a)a.textContent=fmtIn(d.lines[0].amt)}
function toggleMode(){const d=draft(S.view);if(!ACC[S.view])return;
  if(d.mode==='single'){d.mode='double';render(firstField(S.view));say('Dr/Cr mode. Ctrl+H goes back to the Account layout.');return}
  if(!fitSingle(d)){say('These lines do not fit the Account layout (for example a TDS line on the same side as the bank). Stay in Dr/Cr mode.','bad');return}
  fitMode(d);sync(d);render(firstField(S.view));say('Account layout.')}
// End of the particulars in the Account layout: ask for cheque details of the Account if it is a bank, then go to Narration.
function finishLines(){const d=draft(S.view),acc=d.lines[0],l=acc.lid&&led(acc.lid);sync(d);
  if(l&&isBankish(l)&&!acc.inst.no&&!acc.inst.done){acc.inst.done=true;openPanel('inst',0,()=>focusEl('#narr'));return}
  focusEl('#narr')}
function commitDate(t,quiet){const d=draft(S.view),r=parseDate(t.value,d.date);
  if(!r){const s0=serial(d.date.m,d.date.d);t.value=document.activeElement===t?isoText(s0):bsText(s0);if(!quiet)say(DATE_HELP,'bad');return false}
  d.date={m:r.m,d:r.d};const s=serial(r.m,r.d);t.value=bsText(s);const h=$('#dhint');if(h)h.innerHTML=dateHint(s);return true}
/* ---------- Voucher ---------- */
function vVoucher(type){
  const d=draft(type),T=TYPES[type],ev=d.editingId&&S.vouchers.find(v=>v.id===d.editingId),single=d.mode==='single';sync(d);
  const no=ev?vno(type,ev.seq,ev.pre):vno(type,S.counters[type]+1),s=serial(d.date.m,d.date.d);
  const acc=single?d.lines[0]:null,accSub=acc&&acc.lid?lineSub(acc):'';
  return tp(ev?'Accounting Voucher Alteration':'Accounting Voucher Creation',COMPANY,`
  <div class="tp-info"><span class="vt">${T.name}</span><span class="no">No. ${no}</span>
   <span class="date"><span class="hint" id="dhint">${dateHint(s)}</span><label class="sr" for="vdate">Date</label><input id="vdate" class="in" data-nav data-date data-f="vdate" aria-label="Voucher date, BS, yyyy-mm-dd" placeholder="yyyy-mm-dd" value="${bsText(s)}" autocomplete="off"></span></div>
  ${single?`<div class="acct"><label class="lbl" for="L0-lid">Account</label>
    <input id="L0-lid" class="in lid" data-nav data-pick data-f="line" data-k="lid" data-i="0" aria-label="Account" placeholder="Cash or bank" value="${acc.lid?esc(led(acc.lid).name):''}" autocomplete="off">
    <span class="acctamt num" id="acctamt" aria-label="Account total">${fmtIn(acc.amt)}</span>${accSub?`<div class="sub">${esc(accSub)}</div>`:''}</div>`:''}
  <div class="lines ${single?'single':''}" role="group" aria-label="Voucher lines"><div class="lh"><span></span><span>Particulars</span><span class="r">Amount</span></div>${d.lines.map((ln,i)=>single&&i===0?'':lineHtml(d,ln,i)).join('')}</div>
  <div class="totals" id="totals">${totalsHtml(d)}</div>
  <div class="narr"><label class="lbl" for="narr">Narration</label><input id="narr" class="in" data-nav data-f="narr" value="${esc(d.narr)}" autocomplete="off"></div>`)}
function lineSub(ln){const p=[];const t=ln.inst;if(t&&t.no)p.push(`${t.type} ${t.no}${t.date?', '+t.date:''}`);
  for(const a of ln.alloc)if(cents(a.amt))p.push(`${TL[a.t]}${a.ref?' '+a.ref:''} ${fmt(cents(a.amt))}`);return p.join(' · ')}
function lineHtml(d,ln,i){const l=ln.lid?led(ln.lid):null,sub=l?lineSub(ln):'',single=d.mode==='single';
  return `<div class="line ${single?'single':''}" ${single?'':`data-side="${ln.side}"`}>
   ${single?'':`<input id="L${i}-side" class="in side" data-nav data-f="line" data-k="side" data-i="${i}" readonly aria-label="Dr or Cr, line ${i+1}" value="${ln.side}">`}
   <input id="L${i}-lid" class="in lid" data-nav data-pick data-f="line" data-k="lid" data-i="${i}" aria-label="Ledger, line ${i+1}" placeholder="Ledger" value="${l?esc(l.name):''}" autocomplete="off">
   <input id="L${i}-amt" class="in amt" data-nav data-amt data-f="line" data-k="amt" data-i="${i}" inputmode="decimal" aria-label="Amount, line ${i+1}" placeholder="0.00" value="${fmtIn(ln.amt)}" autocomplete="off">
   ${sub?`<div class="sub">${esc(sub)}</div>`:''}</div>`}
function totalsHtml(d){const{dr,cr}=totals(d);const ok=dr===cr&&dr>0;
  if(d.mode==='single')return `<span>Total <b class="num">${fmt(d.lines.slice(1).reduce((a,l)=>a+cents(l.amt),0))}</b></span>`;
  return `<span>Dr <b class="num dr">${fmt(dr)}</b></span><span>Cr <b class="num cr">${fmt(cr)}</b></span>${ok?'<span class="okc">✓</span>':dr||cr?`<span class="badc">Difference ${fmt(Math.abs(dr-cr))}</span>`:''}`}
function addLine(){const d=draft(S.view);
  if(d.mode==='single'){d.lines.push(blankLine(ACC[d.type]==='Dr'?'Cr':'Dr'));render(`#L${d.lines.length-1}-lid`);return}
  const last=d.lines[d.lines.length-1];const{dr,cr}=totals(d);
  const ln=blankLine(dr>cr?'Cr':dr<cr?'Dr':(last?last.side:'Dr'));if(dr!==cr)ln.amt=(Math.abs(dr-cr)/100).toFixed(2);
  d.lines.push(ln);render(`#L${d.lines.length-1}-lid`)}
function delLine(){const d=draft(S.view),single=d.mode==='single';const i=Math.min(S.cur,d.lines.length-1);
  if(single&&i===0){say('The Account line cannot be deleted. Pick another ledger instead.','bad');return}
  d.lines.splice(i,1);if(single?d.lines.length<2:!d.lines.length)d.lines.push(blankLine(single?(ACC[d.type]==='Dr'?'Cr':'Dr'):'Dr'));render(`#L${Math.min(i,d.lines.length-1)}-lid`)}
function afterAmount(i,stage){const type=S.view,d=draft(type),ln=d.lines[i],l=led(ln.lid);
  if(stage<1&&isBankish(l)&&type!=='journal'&&!ln.inst.no&&!ln.inst.done){ln.inst.done=true;openPanel('inst',i,()=>afterAmount(i,1));return}
  if(stage<2&&l.billwise&&cents(ln.amt)>0){openPanel('alloc',i,()=>afterAmount(i,2));return}
  nextLine(i)}
function nextLine(i){const d=draft(S.view);
  if(i<d.lines.length-1){focusEl(`#L${i+1}-lid`);return}
  if(d.mode==='single'){addLine();return}
  const{dr,cr}=totals(d);if(dr===cr&&dr>0){focusEl('#narr');return}addLine()}
function nextExample(){const type=S.view,d=draft(type);if(d.editingId)return;const n=EX[type].length;const i=S.exi[type]==null?0:S.exi[type]+1;
  if(i>=n){S.exi[type]=null;S.drafts[type]=blank(type);render(firstField(type));say('Blank voucher.');return}
  S.exi[type]=i;const miss=loadExample(type,i);render(firstField(type));
  say(`Example ${i+1} of ${n}: ${EX[type][i].label}.`+(miss.length?` ${miss.join(', ')} is not available. See Prototype options.`:''),miss.length?'warn':'')}
function badTarget(d,c){const last=d.lines.length-1;
  if(c.t==='Date')return'#vdate';
  if(c.t==='Lines'){const i=d.lines.findIndex(l=>(l.lid||cents(l.amt))&&(!l.lid||cents(l.amt)<=0));return`#L${i>=0?i:last}-${i>=0&&d.lines[i].lid?'amt':'lid'}`}
  if(c.t==='Dr = Cr')return`#L${last}-amt`;
  if(c.t==='Bill details'){const i=d.lines.findIndex(l=>l.lid&&led(l.lid).billwise);return`#L${Math.max(0,i)}-amt`}
  const i=d.lines.findIndex(l=>l.lid);return`#L${Math.max(0,i)}-lid`}
function trySave(){const type=S.view;if(!TYPES[type])return;const d=draft(type);
  const t=document.activeElement;if(t&&t.dataset&&t.dataset.f==='vdate')commitDate(t,true);
  sync(d);const bad=checks(d).find(c=>c.st==='bad');
  if(bad){say(bad.m,'bad');const tg=badTarget(d,bad);focusEl($(tg)?tg:firstField(type));return}
  save()}
function save(){const type=S.view,d=draft(type);
  sync(d);const lines=clone(d.lines.filter(l=>l.lid&&cents(l.amt)>0)).sort((a,b)=>(a.side==='Dr'?0:1)-(b.side==='Dr'?0:1));const date=serial(d.date.m,d.date.d);
  if(d.editingId){const v=S.vouchers.find(x=>x.id===d.editingId);const old=fmt(v.lines.filter(l=>l.side==='Dr').reduce((a,l)=>a+cents(l.amt),0));
    Object.assign(v,{date,lines,narr:d.narr});const nw=fmt(lines.filter(l=>l.side==='Dr').reduce((a,l)=>a+cents(l.amt),0));
    audit('Edited',v,old!==nw?`Amount ${old} → ${nw}`:'Details changed');S.drafts[type]=blank(type);S.db.date=v.date;flash(`${vno(type,v.seq,v.pre)} updated.`);navigate('daybook');return}
  const seq=++S.counters[type];const v={id:'v'+(++S.vid),type,seq,date,lines,narr:d.narr,status:'Active',by:USER,uid:UID,pre:TYPES[type].prefix};S.vouchers.push(v);audit('Created',v);
  S.lastVid=v.id;S.drafts[type]=blank(type);S.drafts[type].date={...d.date};S.exi[type]=null;sanitize();
  render(firstField(type));say(`Saved as ${vno(type,seq)}.`,'ok')}
/* ---------- popups: bill details, cheque details, new ledger ---------- */
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
function panelInst(){const ln=draft(S.view).lines[P.i],l=led(ln.lid),k=`data-nav data-f="inst" data-i="${P.i}"`;
  return `<h2>Cheque or transfer · ${esc(l.name)}</h2><div class="phead"><span>Optional. Esc skips.</span></div>
   <div class="prow i"><input class="in" ${k} data-pick data-k="type" aria-label="Instrument type" value="${esc(ln.inst.type)}" autocomplete="off">
   <input class="in" ${k} data-k="no" aria-label="Instrument number" placeholder="Number" value="${esc(ln.inst.no)}" autocomplete="off">
   <input class="in" ${k} data-k="date" aria-label="Instrument date" placeholder="Date, e.g. 20 Asoj" value="${esc(ln.inst.date)}" autocomplete="off"></div>`}
/* Create a ledger without leaving the voucher (Alt+C). Name and group only; the opening balance starts at zero. */
function newLedgerHere(){const type=S.view;if(!TYPES[type])return;const d=draft(type),i=Math.min(S.cur,d.lines.length-1),t=document.activeElement;
  const typed=t&&t.dataset&&t.dataset.k==='lid'&&t.value!==curVal(t)?t.value.trim():'';
  const def={contra:'Bank Accounts',payment:'Indirect Expenses',receipt:'Sundry Debtors',journal:'Indirect Expenses'}[type];
  S.nl={name:typed,code:'',group:d.mode==='single'&&i===0?'Bank Accounts':def,i};openPanel('newledger',i,restoreFocus)}
function panelNewLedger(){const n=S.nl,k='data-nav data-f="nl"';
  return `<h2>Ledger Creation</h2><div class="f"><label for="nl-name">Name</label><input id="nl-name" class="in" ${k} data-k="name" placeholder="English or नेपाली" value="${esc(n.name)}" autocomplete="off"></div>
   ${S.q.q3?`<div class="f"><label for="nl-code">Short code</label><input id="nl-code" class="in" ${k} data-k="code" value="${esc(n.code)}" autocomplete="off"></div>`:''}
   <div class="f"><label for="nl-group">Under</label><input id="nl-group" class="in" ${k} data-pick data-k="group" value="${esc(gname(n.group))}" autocomplete="off"></div>
   <p class="pfoot">Opening balance starts at zero. Enter next · Ctrl+A create · Esc cancel</p>`}
function createNewLedger(){const n=S.nl,name=n.name.trim();
  if(!name){say('Give the ledger a name.','bad');focusEl('#nl-name');return}
  if(S.ledgers.some(l=>l.name.toLowerCase()===name.toLowerCase())){say(`A ledger called "${name}" already exists.`,'bad');focusEl('#nl-name');return}
  const kind=GM[n.group].kind,id='l'+Date.now();
  S.ledgers.push(L(id,name,n.group,{code:(n.code||'').trim(),billwise:kind==='debtor'||kind==='creditor',creditDays:kind==='debtor'?30:kind==='creditor'?45:0}));
  const i=n.i;P.then=null;closePanel();setLineLedger(i,id);say(`Ledger "${name}" created and selected.`,'ok')}
/* ---------- registrations ---------- */
FIELD.vdate={date:()=>serial(draft(S.view).date.m,draft(S.view).date.d),enter:t=>{if(commitDate(t))moveFocus(t,1)},blur:t=>commitDate(t,true)};
FIELD.narr={enter:()=>ask('Accept?',trySave),input:t=>{draft(S.view).narr=t.value}};
FIELD.line={
  focus:t=>{S.cur=+t.dataset.i},
  key(e,t){const k=e.key;if(t.dataset.k!=='side')return;const l=k.toLowerCase(),i=+t.dataset.i;
    if(l==='d'||l==='c'){stop(e);setSide(i,l==='d'?'Dr':'Cr');moveFocus(t,1)}
    else if(k==='ArrowUp'||k==='ArrowDown'||k===' '){stop(e);setSide(i,draft(S.view).lines[i].side==='Dr'?'Cr':'Dr')}},
  enter(t){const k=t.dataset.k,i=+t.dataset.i;
    if(k==='side'){moveFocus(t,1);return}
    if(k==='lid')return lidEnter(t,i);
    if(k==='amt'){commitAmt(t);const ln=draft(S.view).lines[i];
      if(!ln.lid){say('Pick a ledger first.','bad');moveFocus(t,-1);return}
      if(!(cents(ln.amt)>0)){say('Type an amount.','bad');return}
      say('');afterAmount(i,0)}},
  input(t){if(t.dataset.k!=='amt')return;const ln=draft(S.view).lines[+t.dataset.i];ln.amt=t.value;if(ln.alloc.length===1)ln.alloc[0].amt=t.value;refreshLive()},
  amt(t,raw){const ln=draft(S.view).lines[+t.dataset.i];if(!ln)return;ln.amt=raw;if(ln.alloc.length===1)ln.alloc[0].amt=raw;refreshLive()}};
FIELD.alloc={
  input(t){const j=+t.dataset.j,ln=draft(S.view).lines[+t.dataset.i],a=ln.alloc[j];a[t.dataset.k]=t.value;refreshAlloc(ln,j)},
  amt(t,raw){const j=+t.dataset.j,ln=draft(S.view).lines[+t.dataset.i];if(ln&&ln.alloc[j]){ln.alloc[j].amt=raw;refreshAlloc(ln,j)}}};
FIELD.inst={input(t){draft(S.view).lines[+t.dataset.i].inst[t.dataset.k]=t.value}};
FIELD.nl={input(t){S.nl[t.dataset.k]=t.value}};

PICK.line={
  source:t=>ledgerItems(S.view,+t.dataset.i),
  cur:t=>{const l=draft(S.view).lines[+t.dataset.i];return l.lid?led(l.lid).name:''},
  title:()=>'List of Ledgers',
  commit:(t,it)=>setLineLedger(+t.dataset.i,it.v)};
PICK.nl={
  source(){const type=S.view,single=draft(type).mode==='single';
    const ok=type==='contra'||(single&&S.nl.i===0)?g=>GM[g.v].cash:type==='journal'||single?g=>!GM[g.v].cash:()=>true;return groupItems().filter(ok)},
  cur:t=>t.dataset.k==='group'?gname(S.nl.group):S.nl[t.dataset.k],
  title:()=>'List of Groups',
  commit:(t,it)=>{S.nl.group=it.v;createNewLedger()}};
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
PICK.inst={
  source:()=>['Cheque','Bank transfer','Other'].map(x=>({v:x,label:x})),
  cur:t=>draft(S.view).lines[+t.dataset.i].inst.type,
  title:()=>'Transaction Type',
  commit:(t,it)=>{draft(S.view).lines[+t.dataset.i].inst.type=it.v;moveFocus(t,1)}};

PANELS.alloc={view:panelAlloc,
  last(){const d=draft(S.view),ln=d.lines[P.i];const sum=ln.alloc.reduce((a,b)=>a+cents(b.amt),0),c=cents(ln.amt);
    const pr=allocProblem(ln);if(pr){say(pr.m,'bad');focusEl(pr.id);return}
    if(sum<c){ln.alloc.push({t:'On Account',ref:'',amt:((c-sum)/100).toFixed(2),days:led(ln.lid).creditDays});drawPanel();focusEl(`#a${ln.alloc.length-1}-t`);return}
    if(sum>c){say('The bills add up to more than the line amount.','bad');return}
    closePanel()},
  del(j){const ln=draft(S.view).lines[P.i];if(ln.alloc.length>1){ln.alloc.splice(j,1);drawPanel();focusEl(`#a${Math.min(j,ln.alloc.length-1)}-t`)}}};
PANELS.inst={view:panelInst,close(p){const ln=draft(S.view).lines[p.i];ln.inst.open=!!ln.inst.no}};
PANELS.newledger={view:panelNewLedger,last:createNewLedger,accept:createNewLedger};

start({
  id:TYPE,title:TYPES[TYPE].name+' Voucher',view:()=>vVoucher(TYPE),focus:()=>firstField(TYPE),
  keys(){const v=TYPE,d=draft(v);const r=[{k:'F2',l:'Date',a:()=>focusEl('#vdate')},
    ...Object.keys(TYPES).filter(canSee).map(t=>({k:TYPES[t].key,l:TYPES[t].name,on:t===v,a:()=>go(t)})),{gap:1},
    {k:'Enter',l:'Next field'},{k:'Backspace',l:'Previous field'},{gap:1},
    ...(can('ledger.create')?[{k:'Alt+C',l:'Create ledger',a:newLedgerHere}]:[]),{k:'Alt+L',l:'Add line',a:addLine},{k:'Ctrl+D',l:'Delete line',a:delLine}];
    if(ACC[v])r.push({k:'Ctrl+H',l:d.mode==='single'?'Dr/Cr mode':'Account mode',a:toggleMode});
    if(!d.editingId)r.push({k:'Ctrl+E',l:'Try an example',a:nextExample});
    if(S.lastVid)r.push({k:'Alt+P',l:'Print last saved',a:()=>openPrint(S.lastVid)});
    r.push({gap:1},{k:'Ctrl+A',l:'Accept',a:trySave},escKey());return r},
  back(){const v=TYPE,d=draft(v);const leave=()=>{if(d.editingId){S.drafts[v]=blank(v);go('daybook')}else focusSidebar()};
    if(d.editingId||d.narr||d.lines.some(l=>l.lid||cents(l.amt)))ask(d.editingId?'Leave without saving the changes?':'Discard this voucher?',()=>{S.drafts[v]=blank(v);leave()});
    else leave()},
  ready(){const d=draft(TYPE);
    if(d.editingId){const v=S.vouchers.find(x=>x.id===d.editingId);say(`Altering ${vno(TYPE,v.seq,v.pre)}. The number stays the same and the change is logged.`)}
    else say(TYPES[TYPE].rule)}});
