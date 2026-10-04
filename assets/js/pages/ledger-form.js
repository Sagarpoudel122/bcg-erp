/* Create ledger page */
function lfFields(){const f=S.lf,kind=GM[f.group].kind;const F=[{k:'name',l:'Name',ph:'English or नेपाली'},{k:'group',l:'Under',pick:1}];
  if(S.q.q3)F.push({k:'code',l:'Short code',ph:'For quick search'});
  if(kind==='debtor')F.push({k:'creditDays',l:'Credit period (days)'},{k:'creditLimit',l:'Credit limit',amt:1});
  if(kind==='creditor')F.push({k:'creditDays',l:'Credit period (days)'});
  if(kind==='bank')F.push({k:'bank',l:'Bank name'},{k:'acno',l:'Account number'},{k:'branch',l:'Branch'});
  if(kind==='od'){F.push({k:'bank',l:'Bank name'},{k:'acno',l:'Account number'});if(S.q.q3)F.push({k:'odLimit',l:'OD limit (reference)'})}
  if(kind==='tax')F.push({k:'taxType',l:'Tax type',pick:1},{k:'rate',l:'Rate % (reference)'});
  F.push({k:'pan',l:'PAN',ph:'9 digits, optional'},{k:'phone',l:'Phone'},{k:'address',l:'Address'},{k:'opening',l:'Opening balance',amt:1},{k:'side',l:'Dr / Cr',pick:1});
  if(kind==='debtor'||kind==='creditor'||S.q.q3)F.push({k:'billwise',l:'Maintain bill-by-bill',yn:1});
  return F}
function vLedger(){
  const rows=lfFields().map(F=>{const v=F.yn?(S.lf.billwise?'Yes':'No'):F.amt?fmtIn(S.lf[F.k]):F.k==='group'?gname(S.lf.group):S.lf[F.k];
    return `<div class="f"><label for="lf-${F.k}">${F.l}</label><input id="lf-${F.k}" class="in ${F.amt?'amt':''}" data-nav data-f="lf" data-k="${F.k}" ${F.pick?'data-pick':''} ${F.amt?'data-amt inputmode="decimal"':''} ${F.yn?'readonly data-yn':''} placeholder="${esc(F.ph||'')}" value="${esc(v)}" autocomplete="off"></div>`}).join('');
  return tp('Ledger Creation',COMPANY,rows)}
function lfEnter(t){const k=t.dataset.k,L=navInputs(view());
  if(k==='name'&&!t.value.trim()){say('Give the ledger a name.','bad');return}
  if(t===L[L.length-1]){const f=S.lf;
    if(f.billwise&&cents(f.opening)>0&&S.q.q5){if(f.bills.length===1&&!f.bills[0].amt)f.bills[0].amt=normAmt(f.opening);openPanel('lfbills',0,()=>ask('Accept?',saveLedger))}
    else ask('Accept?',saveLedger);return}
  moveFocus(t,1)}
function saveLedger(){const f=S.lf,name=f.name.trim();const bad=(m,id)=>{say(m,'bad');if(id)focusEl(id)};
  const t=document.activeElement;if(t&&t.dataset&&t.dataset.amt!==undefined)commitAmt(t);
  if(!name)return bad('Give the ledger a name.','#lf-name');
  if(S.ledgers.some(l=>l.name.toLowerCase()===name.toLowerCase()))return bad(`A ledger called "${name}" already exists. Names must be unique (capital letters don't count).`,'#lf-name');
  if(f.pan&&!/^\d{9}$/.test(f.pan))return bad('PAN must be exactly 9 digits.','#lf-pan');
  const op=cents(f.opening);let bills=[];
  if(f.billwise&&op>0&&S.q.q5){
    if(lfBillsSum()!==op){say(`The bills add up to ${fmt(lfBillsSum())} but the opening balance is ${fmt(op)}.`,'bad');openPanel('lfbills',0,()=>{});return}
    if(f.bills.some(b=>!b.ref.trim())){say('Every opening bill needs a bill number.','bad');openPanel('lfbills',0,()=>{});return}
    bills=f.bills.map(b=>({ref:b.ref.trim(),s:serial(b.m,b.d),amt:cents(b.amt),due:serial(b.m,b.d)+(+f.creditDays||0)}))}
  const id='l'+Date.now();
  S.ledgers.push(L(id,name,f.group,{code:f.code.trim(),pan:f.pan,phone:f.phone,opening:op,side:f.side,billwise:!!f.billwise,creditDays:+f.creditDays||0,bills,extra:{bank:f.bank,acno:f.acno,branch:f.branch,odLimit:f.odLimit,taxType:f.taxType,rate:f.rate}}));
  S.lf=blankLF();render('#lf-name');say(`Saved. "${name}" is ready to use in vouchers.`,'ok')}
/* ---------- opening balance in bills (popup) ---------- */
function lfBillsSum(){return S.lf.bills.reduce((a,b)=>a+cents(b.amt),0)}
function lfBillsSumHtml(){const s=lfBillsSum(),o=cents(S.lf.opening);return `<b class="${s===o?'okt':'badt'}">${fmt(s)} of ${fmt(o)}</b>`}
function panelLfBills(){const f=S.lf;
  const rows=f.bills.map((b,j)=>{const k=`data-nav data-f="lfbill" data-j="${j}"`;
    return `<div class="prow b"><input id="b${j}-ref" class="in" ${k} data-k="ref" aria-label="Bill number" placeholder="Bill no., e.g. #12" value="${esc(b.ref)}" autocomplete="off">
     <input id="b${j}-date" class="in" ${k} data-k="date" aria-label="Bill date" value="${b.d} ${MONTHS[b.m]}" autocomplete="off">
     <input id="b${j}-amt" class="in amt" ${k} data-amt data-k="amt" inputmode="decimal" aria-label="Bill amount" value="${fmtIn(b.amt)}" autocomplete="off">
     <div class="due">due <b id="lfdue${j}">${bsShort(serial(b.m,b.d)+(+f.creditDays||0))}</b></div></div>`}).join('');
  return `<h2>Opening balance in bills · ${esc(f.name||'new ledger')}</h2><div class="phead"><span>Opening <b>${fmt(cents(f.opening))}</b></span><span>Split <span id="lfsum">${lfBillsSumHtml()}</span></span></div>${rows}<p class="pfoot">Enter next · Ctrl+D remove row · Esc done</p>`}
function refreshLfBills(){const el=$('#lfsum');if(el)el.innerHTML=lfBillsSumHtml();S.lf.bills.forEach((b,j)=>{const d=$(`#lfdue${j}`);if(d)d.textContent=bsShort(serial(b.m,b.d)+(+S.lf.creditDays||0))})}
function commitBillDate(t){const b=S.lf.bills[+t.dataset.j];if(!b)return;const r=parseDate(t.value,{m:b.m,d:b.d});if(r){b.m=r.m;b.d=r.d}t.value=`${b.d} ${MONTHS[b.m]}`;refreshLfBills()}
FIELD.lf={
  enter:lfEnter,
  key(e,t){if(t.dataset.yn===undefined)return;const l=e.key.toLowerCase();
    if(l==='y'||l==='n'||e.key===' '){stop(e);S.lf.billwise=l==='y'?true:l==='n'?false:!S.lf.billwise;t.value=S.lf.billwise?'Yes':'No'}},
  input:t=>{S.lf[t.dataset.k]=t.value},
  amt:(t,raw)=>{S.lf[t.dataset.k]=raw}};
FIELD.lfbill={
  input(t){const b=S.lf.bills[+t.dataset.j],k=t.dataset.k;if(k==='ref')b.ref=t.value;if(k==='amt'){b.amt=t.value;refreshLfBills()}},
  amt(t,raw){S.lf.bills[+t.dataset.j].amt=raw;refreshLfBills()},
  blur(t){if(t.dataset.k==='date')commitBillDate(t)}};
PICK.lf={
  source(t){const k=t.dataset.k;
    if(k==='group')return groupItems();
    if(k==='side')return[{v:'Dr',label:'Dr'},{v:'Cr',label:'Cr'}];
    return['VAT','TDS','Other'].map(x=>({v:x,label:x}))},
  cur:t=>t.dataset.k==='group'?gname(S.lf.group):S.lf[t.dataset.k],
  title:t=>t.dataset.k==='group'?'List of Groups':t.dataset.k==='side'?'Dr / Cr':'Tax Type',
  commit(t,it){const k=t.dataset.k;
    if(k==='group'){S.lf.group=it.v;const g=GM[it.v];S.lf.side=g.nat==='A'||g.nat==='E'?'Dr':'Cr';S.lf.billwise=g.kind==='debtor'||g.kind==='creditor';
      S.lf.creditDays=g.kind==='debtor'?'30':g.kind==='creditor'?'45':'';render();const L=navInputs(view());focusEl(L[L.findIndex(x=>x.id==='lf-group')+1]);return}
    S.lf[k]=it.v;moveFocus(t,1)}};
PANELS.lfbills={view:panelLfBills,
  last(){const f=S.lf,s=lfBillsSum(),o=cents(f.opening);
    if(s<o){f.bills.push({ref:'',m:1,d:1,amt:((o-s)/100).toFixed(2)});drawPanel();focusEl(`#b${f.bills.length-1}-ref`);return}
    if(s>o){say('The bills add up to more than the opening balance.','bad');return}
    closePanel()},
  del(j){if(S.lf.bills.length>1){S.lf.bills.splice(j,1);drawPanel();focusEl(`#b${Math.min(j,S.lf.bills.length-1)}-ref`)}}};

start({
  id:'ledger',title:'Ledger Creation',view:vLedger,focus:()=>'#lf-name',
  keys:()=>[{k:'Enter',l:'Next field'},{k:'Backspace',l:'Previous field'},{gap:1},{k:'Ctrl+A',l:'Accept',a:saveLedger},escKey()],
  back(){const f=S.lf;if(f.name||f.opening)ask('Discard this ledger?',()=>{S.lf=blankLF();focusSidebar()});else focusSidebar()}});
