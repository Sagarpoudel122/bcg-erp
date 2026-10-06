/* Item invoice entry: Sales, Purchase, Sales Return (Credit Note), Purchase Return (Debit Note).
   The same script serves sales.html, purchase.html, sales-return.html and purchase-return.html; <body data-page="..."> says which.
   The draft, the sums, the posting and the checks live in core/invoice.js; this file is the screen, the keys and the pickers.
   Keys: Enter next field, Backspace previous, an empty Item ends the rows, Ctrl+B bill details, Ctrl+A accept. */
const TYPE=document.body.dataset.page,BUY=isBuy(TYPE);
const START=()=>BUY&&!draft(TYPE).editingId?'#vbill':'#iparty';
const origRow=(d,iid)=>{const o=d.orig&&S.vouchers.find(v=>v.id===d.orig);return o?o.inv.items.find(r=>r.iid===iid):null};
// There is always one empty row at the bottom to type the next item into
function ensureBlank(d){const last=d.rows[d.rows.length-1];if(!last||last.iid||last.qty)d.rows.push(blankRow())}
const partySub=(ln,B)=>{const l=led(ln.lid),c=B[ln.lid]?B[ln.lid].cl:0,p=[`Cur Bal: ${fmt(Math.abs(c))}${c>0?' Dr':c<0?' Cr':''}`];
  if(l.pan)p.push('PAN '+l.pan);if(l.billwise&&l.creditDays)p.push(`${l.creditDays} days credit`);
  for(const a of ln.alloc)if(cents(a.amt))p.push(`${TL[a.t]}${a.ref?' '+a.ref:''} ${fmt(cents(a.amt))}`);return p.join(' · ')};
function rowSub(d,r){const it=r.iid&&item(r.iid);if(!it)return'';if(!it.stock)return'Service: no stock kept';
  const have=stockOf(it.id,d.editingId),need=d.rows.reduce((a,x)=>a+(x.iid===it.id&&+x.qty>0?+x.qty:0),0),short=isOut(d.type)&&need-have>0.0005;
  return `In stock: ${qfmt(have)} ${esc(it.unit)}${short?` <span class="warn">· short by ${qfmt(need-have)}</span>`:''}`}
function totalsHtml(c){const tr=(l,v,cls)=>`<div class="tr ${cls||''}"><span>${l}</span><b>${v}</b></div>`;
  return tr('Sub total',fmt(c.base))+(c.disc?tr('Discount','− '+fmt(c.disc)):'')+(c.vat?tr('VAT',fmt(c.vat)):'')+tr('Total',fmt(c.total),'grand')+(c.total?`<div class="words">${words(c.total)}</div>`:'')}
function rowHtml(d,r,i,c){const it=r.iid&&item(r.iid),k=`data-nav data-f="row" data-i="${i}"`,x=c.rows[i],sub=rowSub(d,r);
  return `<div class="irow"><span class="sn">${i+1}</span>
   <input id="R${i}-iid" class="in" ${k} data-pick data-blank data-k="iid" aria-label="Item, row ${i+1}" placeholder="${i?'End of list':'Item'}" value="${it?esc(it.name):''}" autocomplete="off">
   <input id="R${i}-qty" class="in qty" ${k} data-k="qty" inputmode="decimal" aria-label="Quantity, row ${i+1}" placeholder="${it?esc(it.unit):'Qty'}" value="${esc(r.qty)}" autocomplete="off">
   <input id="R${i}-rate" class="in amt" ${k} data-amt data-k="rate" inputmode="decimal" aria-label="Rate, row ${i+1}" placeholder="Rate" value="${fmtIn(r.rate)}" autocomplete="off">
   <input id="R${i}-disc" class="in amt" ${k} data-k="disc" inputmode="decimal" aria-label="Discount %, row ${i+1}" placeholder="Disc %" value="${esc(r.disc)}" autocomplete="off">
   <input id="R${i}-vat" class="in amt" ${k} data-k="vat" inputmode="decimal" aria-label="VAT %, row ${i+1}" placeholder="VAT %" value="${esc(r.vat)}" autocomplete="off">
   <span class="ramt num" id="R${i}-amt">${x?fmt(x.taxable):''}</span>
   <div class="sub" id="R${i}-sub">${sub}</div></div>`}
/* ---------- the screen ---------- */
function vInvoice(){
  const d=draft(TYPE),T=TYPES[TYPE],ev=d.editingId&&S.vouchers.find(v=>v.id===d.editingId),c=syncInv(d);ensureBlank(d);
  const no=ev?vno(TYPE,ev.seq,ev.pre):vno(TYPE,S.counters[TYPE]+1),s=serial(d.date.m,d.date.d),B=balances(TODAY),ln=d.lines[0],party=ln.lid&&led(ln.lid),lg=led(d.sledger);
  const o=d.orig&&S.vouchers.find(v=>v.id===d.orig),fld=(id,l,v,extra,sub)=>`<div class="f"><label for="${id}">${l}</label><input id="${id}" class="in" data-nav data-pick data-f="${id}" aria-label="${l}" value="${esc(v)}" ${extra||''} autocomplete="off">${sub?`<div class="sub" id="${id}-sub">${esc(sub)}</div>`:''}</div>`;
  return tp(`${T.alt||'Invoice'} ${ev?'Alteration':'Creation'}`,COMPANY,`
  <div class="tp-info"><span class="vt">${T.name}</span><span class="no">No. ${no}</span>
   <span class="billno"><label for="vbill">${BUY?'Bill No.':'Ref. No.'}</label><input id="vbill" class="in" data-nav data-f="vbill" aria-label="${BUY?'Supplier bill number':'Reference number'}" placeholder="${BUY?'Supplier bill no.':'Optional'}" value="${esc(d.billNo||'')}" autocomplete="off"></span>
   <span class="date"><span class="hint" id="dhint">${dateHint(s)}</span><label class="sr" for="vdate">Date</label><input id="vdate" class="in" data-nav data-date data-f="vdate" aria-label="Date, BS, yyyy-mm-dd" placeholder="yyyy-mm-dd" value="${bsText(s)}" autocomplete="off"></span></div>
  <div class="ihead">
   ${fld('iparty',BUY?'Supplier A/c':'Customer A/c',party?party.name:'','placeholder="Name of the party"',party?partySub(ln,B):'')}
   ${fld('iledger',BUY?'Purchase ledger':'Sales ledger',lg?lg.name:'')}
   ${ORIG[TYPE]?fld('iorig','Against '+(BUY?'bill':'invoice'),o?`${vno(o.type,o.seq,o.pre)} · ${bsShort(o.date)}`:'','placeholder="Optional: fills the items"'):''}</div>
  <div class="ih"><span></span><span>Name of Item</span><span class="r">Quantity</span><span class="r">Rate</span><span class="r">Disc %</span><span class="r">VAT %</span><span class="r">Amount</span></div>
  <div class="irows" role="group" aria-label="Items">${d.rows.map((r,i)=>rowHtml(d,r,i,c)).join('')}</div>
  <div class="itot" id="itot">${totalsHtml(c)}</div>
  <div class="narr"><label class="lbl" for="narr">Narration</label><input id="narr" class="in" data-nav data-f="narr" value="${esc(d.narr)}" autocomplete="off"></div>`)}
// Typing: update the amounts, stock notes and totals without redrawing the screen
function refreshLive(){const d=draft(TYPE),c=syncInv(d);
  d.rows.forEach((r,i)=>{const a=$(`#R${i}-amt`),sb=$(`#R${i}-sub`);if(a)a.textContent=c.rows[i]?fmt(c.rows[i].taxable):'';if(sb)sb.innerHTML=rowSub(d,r)});
  const t=$('#itot');if(t)t.innerHTML=totalsHtml(c);
  const ps=$('#iparty-sub'),ln=d.lines[0];if(ps&&ln.lid)ps.textContent=partySub(ln,balances(TODAY))}
/* ---------- choosing the party, the ledger, the original invoice, the items ---------- */
function setParty(lid){const d=draft(TYPE),ln=d.lines[0];if(ln.lid!==lid){ln.lid=lid;ln.edited=false;ln.alloc=[];ln.inst={open:false,type:'Cheque',no:'',date:''};
    const o=d.orig&&S.vouchers.find(v=>v.id===d.orig);if(o&&o.inv.party!==lid)d.orig=''}
  render('#iledger')}
function setOrig(v){const d=draft(TYPE),o=v&&S.vouchers.find(x=>x.id===v);d.orig=v;d.lines[0].edited=false;
  if(!o){render(`#R0-iid`);return}
  const fill=()=>{d.rows=rowsFromOrig(d);render('#R0-qty')};
  if(d.rows.some(rowDone)){render();ask(`Replace the items with the items of ${vno(o.type,o.seq,o.pre)}?`,fill)}else fill()}
function pickItem(i,iid){const d=draft(TYPE),r=d.rows[i],it=item(iid),o=origRow(d,iid);
  if(r.iid!==iid){r.iid=iid;r.rate=o?normAmt(o.rate):normAmt(BUY?it.buy:it.sell);r.vat=o?String(o.vat):it.vat;r.disc=o&&o.disc?String(o.disc):''}
  ensureBlank(d);render(`#R${i}-qty`)}
function rowEnter(t){const k=t.dataset.k,i=+t.dataset.i,r=draft(TYPE).rows[i];
  if(k==='iid'){if(!t.value.trim()){focusEl('#narr');return}moveFocus(t,1);return}
  if(k==='qty'&&!(+r.qty>0)){say('Type a quantity.','bad');return}
  if(k==='disc'&&(+r.disc<0||+r.disc>100)){say('Discount is a percentage from 0 to 100.','bad');return}
  if(k==='vat'&&(+r.vat<0||+r.vat>100)){say('VAT is a percentage from 0 to 100.','bad');return}
  say('');moveFocus(t,1)}
function addRow(){const d=draft(TYPE);if(d.rows[d.rows.length-1].iid)d.rows.push(blankRow());render(`#R${d.rows.length-1}-iid`)}
function delRow(){const d=draft(TYPE),i=Math.min(S.cur,d.rows.length-1);if(d.rows.length===1&&!d.rows[0].iid){say('Nothing to delete.');return}
  d.rows.splice(i,1);ensureBlank(d);render(`#R${Math.min(i,d.rows.length-1)}-iid`)}
function billDetails(){const d=draft(TYPE),ln=d.lines[0],l=ln.lid&&led(ln.lid);syncInv(d);
  if(!l){say(`Pick the ${BUY?'supplier':'customer'} first.`,'bad');return}
  if(!l.billwise){say(`${l.name} is not kept bill by bill, so there are no bill details.`);return}
  if(!cents(ln.amt)){say('Add the items first.','bad');return}
  const before=JSON.stringify(ln.alloc);
  openPanel('alloc',0,()=>{const x=draft(TYPE).lines[0];if(JSON.stringify(x.alloc)!==before)x.edited=true;render()})}
/* ---------- Alt+C: create the party or the item without leaving the invoice ---------- */
function createHere(){const t=document.activeElement;if(!t||!t.dataset)return;
  const typed=t.value!==curVal(t)?t.value.trim():'';
  if(t.dataset.f==='iparty'){if(!can('ledger.create'))return;
    S.nl={name:typed,code:'',group:BUY?'Sundry Creditors':'Sundry Debtors',ok:g=>GM[g.v].kind===(BUY?'creditor':'debtor'),done:setParty};openPanel('newledger',0,()=>focusEl('#iparty'))}
  else if(t.dataset.f==='row'&&t.dataset.k==='iid'){if(!can('item.create'))return;const i=+t.dataset.i;
    S.ni={name:typed,unit:'Pcs',rate:'',vat:blankItem().vat,i};openPanel('newitem',i,()=>focusEl(`#R${i}-iid`))}
  else say('Alt+C creates a ledger in the Party field and an item in the Item field.')}
function panelNewItem(){const n=S.ni,k='data-nav data-f="ni"';
  return `<h2>Item Creation</h2><div class="f"><label for="ni-name">Name</label><input id="ni-name" class="in" ${k} data-k="name" placeholder="English or नेपाली" value="${esc(n.name)}" autocomplete="off"></div>
   <div class="f"><label for="ni-unit">Unit</label><input id="ni-unit" class="in" ${k} data-pick data-k="unit" value="${esc(n.unit)}" autocomplete="off"></div>
   <div class="f"><label for="ni-rate">${BUY?'Purchase':'Sale'} rate</label><input id="ni-rate" class="in amt" ${k} data-amt data-k="rate" inputmode="decimal" value="${fmtIn(n.rate)}" autocomplete="off"></div>
   <div class="f"><label for="ni-vat">VAT %</label><input id="ni-vat" class="in" ${k} data-k="vat" placeholder="0 if exempt" value="${esc(n.vat)}" autocomplete="off"></div>
   <p class="pfoot">Other details can be added later in Create › Item. Enter next · Ctrl+A create · Esc cancel</p>`}
function createNewItem(){const n=S.ni,name=n.name.trim();
  if(!name){say('Give the item a name.','bad');focusEl('#ni-name');return}
  if(S.items.some(i=>i.name.toLowerCase()===name.toLowerCase())){say(`An item called "${name}" already exists.`,'bad');focusEl('#ni-name');return}
  if(!/^\d{1,3}(\.\d+)?$/.test(String(n.vat).trim())||+n.vat>100){say('VAT % must be a number from 0 to 100.','bad');focusEl('#ni-vat');return}
  const id='i'+Date.now(),r=normAmt(n.rate);
  S.items.push({id,name,code:'',unit:n.unit,sell:BUY?'':r,buy:BUY?r:'',vat:String(+n.vat),stock:true,openQty:'',active:true});auditNote('Item created',name);
  P.then=null;closePanel();pickItem(n.i,id);say(`Item "${name}" created and selected.`,'ok')}
/* ---------- accept ---------- */
function badTarget(d,c){
  if(c.t==='Date')return'#vdate';if(c.t==='Party')return'#iparty';if(c.t==='Ledger')return'#iledger';
  if(c.t==='Items'){const i=d.rows.findIndex(r=>(r.iid||+r.qty>0)&&!rowDone(r));return i>=0?`#R${i}-${d.rows[i].iid?'qty':'iid'}`:'#R0-iid'}
  if(c.t==='Return')return'#iorig';
  return'#R0-iid'}
function trySave(){const d=draft(TYPE),t=document.activeElement;if(t&&t.dataset&&t.dataset.f==='vdate')commitDate(t,true);
  syncInv(d);const cs=invChecks(d),bad=cs.find(c=>c.st==='bad');
  if(bad){say(bad.m,'bad');if(bad.t==='Bill details'){billDetails();return}const tg=badTarget(d,bad);focusEl($(tg)?tg:START());return}
  const w=cs.find(c=>c.st==='warn'&&c.t==='Stock');
  if(w){ask(`${w.m} Save anyway?`,save);return}
  save()}
function save(){const d=draft(TYPE),v=commitInvoice(d),no=vno(TYPE,v.seq,v.pre);
  if(d.editingId){S.drafts[TYPE]=blank(TYPE);S.db.date=v.date;flash(`${no} updated.`);navigate('daybook');return}
  S.lastVid=v.id;S.drafts[TYPE]=blank(TYPE);S.drafts[TYPE].date={...d.date};sanitize();
  render(START());say(`Saved as ${no}.`,'ok')}
/* ---------- registrations ---------- */
FIELD.vbill={enter:t=>{draft(TYPE).billNo=t.value.trim();moveFocus(t,1)},input:t=>{const d=draft(TYPE);d.billNo=t.value;if(TYPE==='purchase')refreshLive()}};
FIELD.narr={enter:()=>ask('Accept?',trySave),input:t=>{draft(TYPE).narr=t.value}};
FIELD.iparty={enter:t=>moveFocus(t,1)};FIELD.iledger={enter:t=>moveFocus(t,1)};FIELD.iorig={enter:t=>moveFocus(t,1)};
FIELD.row={
  focus:t=>{S.cur=+t.dataset.i},
  enter:rowEnter,
  input(t){const k=t.dataset.k;if(k==='iid')return;draft(TYPE).rows[+t.dataset.i][k]=t.value;refreshLive()},
  amt(t,raw){draft(TYPE).rows[+t.dataset.i].rate=raw;refreshLive()}};
FIELD.ni={input:t=>{S.ni[t.dataset.k]=t.value},amt:(t,raw)=>{S.ni.rate=raw}};
PICK.iparty={
  source:()=>S.ledgers.filter(l=>partyOk(TYPE,l)&&(visible(l)||isCash(l))).map(l=>({v:l.id,label:l.name,sub:gname(l.group),code:S.q.q3?l.code:''})),
  cur:()=>{const l=draft(TYPE).lines[0].lid;return l?led(l).name:''},
  title:()=>'List of Ledgers',commit:(t,it)=>setParty(it.v)};
PICK.iledger={
  source:()=>S.ledgers.filter(l=>invLedgerOk(TYPE,l)).map(l=>({v:l.id,label:l.name,sub:gname(l.group)})),
  cur:()=>{const l=led(draft(TYPE).sledger);return l?l.name:''},
  title:()=>'List of Ledgers',commit:(t,it)=>{draft(TYPE).sledger=it.v;moveFocus(t,1)}};
PICK.iorig={
  source(){const d=draft(TYPE),L=origChoices(d).map(v=>({v:v.id,label:`${vno(v.type,v.seq,v.pre)} · ${bsShort(v.date)}`,sub:fmt(invTotal(v))}));
    return[...L,{v:'',label:'None (not against an invoice)'}]},
  cur:()=>{const d=draft(TYPE),o=d.orig&&S.vouchers.find(v=>v.id===d.orig);return o?`${vno(o.type,o.seq,o.pre)} · ${bsShort(o.date)}`:''},
  title:()=>BUY?'Purchase Bills':'Sales Invoices',commit:(t,it)=>setOrig(it.v)};
PICK.row={
  source(){return S.items.filter(i=>i.active).sort((a,b)=>a.name.localeCompare(b.name)).map(i=>({v:i.id,label:i.name,code:S.q.q3?i.code:'',
    sub:`${fmt(cents(BUY?i.buy:i.sell))} · ${i.stock?qfmt(stockOf(i.id))+' '+i.unit:'Service'}`}))},
  cur:t=>{const r=draft(TYPE).rows[+t.dataset.i];return r&&r.iid?item(r.iid).name:''},
  title:()=>'List of Items',commit:(t,it)=>pickItem(+t.dataset.i,it.v)};
PICK.ni={source:()=>UNITS.map(u=>({v:u,label:u})),cur:()=>S.ni.unit,title:()=>'Unit',commit:(t,it)=>{S.ni.unit=it.v;moveFocus(t,1)}};
PANELS.newitem={view:panelNewItem,last:createNewItem,accept:createNewItem};

start({
  id:TYPE,title:TYPES[TYPE].name+' Voucher',view:vInvoice,focus:START,
  keys(){const v=TYPE,d=draft(v),r=[{k:'F2',l:'Date',a:()=>focusEl('#vdate')},
    ...Object.keys(TYPES).filter(canSee).map(t=>({k:TYPES[t].key,l:TYPES[t].name,on:t===v,a:()=>go(t)})),{gap:1},
    {k:'Enter',l:'Next field'},{k:'Backspace',l:'Previous field'},{gap:1},
    ...(can('ledger.create')||can('item.create')?[{k:'Alt+C',l:'Create ledger / item',a:createHere}]:[]),{k:'Alt+C',kd:'Alt+C (Rate)',l:'Calculator',a:calcFromRail},
    {k:'Alt+L',l:'Add row',a:addRow},{k:'Ctrl+D',l:'Delete row',a:delRow},{k:'Ctrl+B',l:'Bill details',a:billDetails}];
    if(S.lastVid)r.push({k:'Alt+P',l:'Print last saved',a:()=>openPrint(S.lastVid)});
    r.push({gap:1},{k:'Ctrl+A',l:'Accept',a:trySave},escKey());return r},
  back(){const v=TYPE,d=draft(v);const leave=()=>{if(d.editingId){S.drafts[v]=blank(v);go('daybook')}else focusSidebar()};
    if(d.editingId||d.narr||d.lines[0].lid||d.rows.some(r=>r.iid||r.qty))ask(d.editingId?'Leave without saving the changes?':'Discard this voucher?',()=>{S.drafts[v]=blank(v);leave()});
    else leave()},
  ready(){const d=draft(TYPE);
    if(d.editingId){const v=S.vouchers.find(x=>x.id===d.editingId);say(`Altering ${vno(TYPE,v.seq,v.pre)}. The number stays the same and the change is logged.`)}
    else say(TYPES[TYPE].rule)}});
