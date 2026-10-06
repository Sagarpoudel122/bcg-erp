/* Item invoices: Sales, Purchase, Sales Return (Credit Note), Purchase Return (Debit Note), and the Item master.
   An invoice is saved as a normal voucher: its Dr/Cr lines are built from the items (buildLines), so Trial Balance, Ledger Report,
   Day Book and bill-wise pending work on it unchanged. The items themselves are kept on v.inv for printing, stock and alteration:
     v.inv = { ledger (Sales or Purchase ledger), party (ledger id), orig (voucher id of the invoice a return is against),
               edited (bill split was changed by hand), items:[{iid,qty,rate,disc,vat}] }
   Loaded on every page, like core/hrm.js, so the items travel with the rest of the saved state. */

const PARTY_SIDE={sales:'Dr',purchase:'Cr',salesret:'Cr',purchret:'Dr'};     // which side the customer / supplier is on
const STOCK_SIGN={purchase:1,salesret:1,sales:-1,purchret:-1};                // goods in (+) or out (-)
const ORIG={salesret:'sales',purchret:'purchase'};                            // what a return is against
const isOut=t=>STOCK_SIGN[t]<0;
const isBuy=t=>t==='purchase'||t==='purchret';
const UNITS=['Pcs','Kg','Gm','Ltr','Box','Bag','Pkt','Mtr','Set','Nos'];
Object.assign(S,{il:{sel:0,list:[]}});
/* ---------- items ---------- */
const item=id=>S.items.find(i=>i.id===id);
const qfmt=n=>String(+(+n||0).toFixed(3));                                    // quantities have up to 3 decimals: 2.5, 10, 0.125
const blankItem=()=>({name:'',code:'',unit:'Pcs',sell:'',buy:'',vat:String(CUR.biz&&CUR.biz.vatRate!=null?CUR.biz.vatRate:13),stock:true,openQty:'',editId:null});
S.itf=blankItem();
const itemUsed=iid=>S.vouchers.filter(v=>v.inv&&v.inv.items.some(r=>r.iid===iid));
// Quantity on hand: opening + goods in - goods out, from Active vouchers. exclude = a voucher being altered (its own rows do not count)
function stockOf(iid,exclude){const it=item(iid);if(!it||!it.stock)return 0;let q=+it.openQty||0;
  for(const v of S.vouchers){if(v.status!=='Active'||!v.inv||v.id===exclude)continue;
    for(const r of v.inv.items)if(r.iid===iid)q+=STOCK_SIGN[v.type]*(+r.qty||0)}
  return Math.round(q*1000)/1000}
/* ---------- the draft: what the entry page edits ---------- */
const blankRow=()=>({iid:'',qty:'',rate:'',disc:'',vat:''});
const defLedger=type=>{const root=isBuy(type)?'Purchase Accounts':'Sales Accounts',l=S.ledgers.find(x=>x.active&&under(x.group,root));return l?l.id:''};
// d.lines holds just the party's line (side, ledger, amount, bill split), so the bill popup and billCheck() work on it as on any voucher
function blankInv(type){return{type,mode:'inv',date:{m:2,d:15},billNo:'',narr:'',editingId:null,orig:'',sledger:defLedger(type),
  lines:[blankLine(PARTY_SIDE[type])],rows:[blankRow()]}}
function invDraftFrom(v){const b=bs(v.date),p=v.lines.find(l=>l.lid===v.inv.party&&l.side===PARTY_SIDE[v.type]);
  const ln=clone(p);ln.edited=!!v.inv.edited;
  return{type:v.type,mode:'inv',date:{m:b.m,d:b.d},billNo:v.billNo||'',narr:v.narr||'',editingId:v.id,orig:v.inv.orig||'',sledger:v.inv.ledger,lines:[ln],
    rows:v.inv.items.map(r=>({iid:r.iid,qty:qfmt(r.qty),rate:normAmt(r.rate),disc:r.disc?String(r.disc):'',vat:String(r.vat)})).concat([blankRow()])}}
const rowDone=r=>!!r.iid&&+r.qty>0;
/* ---------- the sums ---------- */
// Per row: base = qty x rate, less discount % = taxable, plus VAT % on that. Every figure is rounded to the paisa on its own row,
// so the posted lines always add up exactly.
function calcInv(d){const rows=[];let base=0,disc=0,tax=0,vat=0;
  for(const r of d.rows){if(!rowDone(r)){rows.push(null);continue}
    const b=Math.round(Math.round(+r.qty*1000)*cents(r.rate)/1000),dc=Math.round(b*Math.min(100,Math.max(0,+r.disc||0))/100),t=b-dc,v=Math.round(t*Math.max(0,+r.vat||0)/100);
    rows.push({base:b,disc:dc,taxable:t,vat:v,total:t+v});base+=b;disc+=dc;tax+=t;vat+=v}
  return{rows,base,disc,taxable:tax,vat,total:tax+vat}}
const vatLedger=()=>S.ledgers.find(l=>l.id==='vat')||S.ledgers.find(l=>l.extra&&l.extra.taxType==='VAT');
// The bill split of the party's line. Sales and Purchase make a New Ref; a return settles the original invoice (Against Ref), and any
// rest of it goes On Account. Once the user changes it in the bill popup (line.edited) it is left alone.
function autoAlloc(d){const ln=d.lines[0],l=ln.lid&&led(ln.lid);if(!l||!l.billwise){ln.alloc=[];return}
  if(ln.edited&&ln.alloc.length)return;
  const total=cents(ln.amt),days=l.creditDays;if(!total){ln.alloc=[];return}
  if(ORIG[d.type]){const o=d.orig&&S.vouchers.find(v=>v.id===d.orig),ref=o&&invRef(o),
      pend=ref&&pendingBills(ln.lid,d.editingId).find(b=>b.ref===ref),against=pend?Math.min(total,pend.rem):0;
    ln.alloc=[];if(against)ln.alloc.push({t:'Against',ref,amt:(against/100).toFixed(2),days});
    if(total>against)ln.alloc.push({t:'On Account',ref:'',amt:((total-against)/100).toFixed(2),days});return}
  const ev=d.editingId&&S.vouchers.find(v=>v.id===d.editingId);
  ln.alloc=[{t:'New',ref:d.type==='purchase'&&d.billNo.trim()?d.billNo.trim():vno(d.type,ev?ev.seq:S.counters[d.type]+1,ev&&ev.pre),amt:ln.amt,days}]}
// The reference an invoice's bill carries: its party line's New Ref
const invRef=v=>{const p=v.lines.find(l=>l.lid===v.inv.party),a=p&&p.alloc.find(x=>x.t==='New');return a?a.ref:vno(v.type,v.seq,v.pre)};
// Keep the party's amount and bill split in step with the rows
function syncInv(d){const c=calcInv(d);d.lines[0].amt=c.total?(c.total/100).toFixed(2):'';autoAlloc(d);return c}
// The Dr/Cr lines of the voucher
function buildLines(d){const c=calcInv(d),T=d.type,P=PARTY_SIDE[T],O=P==='Dr'?'Cr':'Dr',party=d.lines[0],vl=vatLedger();
  const out=[{side:P,lid:party.lid,amt:(c.total/100).toFixed(2),alloc:clone(party.alloc),inst:{open:false,type:'Cheque',no:'',date:''}}];
  if(c.taxable)out.push({side:O,lid:d.sledger,amt:(c.taxable/100).toFixed(2),alloc:[],inst:{open:false,type:'Cheque',no:'',date:''}});
  if(c.vat&&vl)out.push({side:O,lid:vl.id,amt:(c.vat/100).toFixed(2),alloc:[],inst:{open:false,type:'Cheque',no:'',date:''}});
  return out.sort((a,b)=>(a.side==='Dr'?0:1)-(b.side==='Dr'?0:1))}
/* ---------- which vouchers a return can be against, which parties and ledgers fit ---------- */
function origChoices(d){const lid=d.lines[0].lid;if(!lid||!ORIG[d.type])return[];
  return S.vouchers.filter(v=>v.status==='Active'&&v.type===ORIG[d.type]&&v.inv.party===lid).sort((a,b)=>b.date-a.date||b.seq-a.seq)}
const partyOk=(type,l)=>!!l&&l.active&&(isCash(l)||GM[l.group].kind===(isBuy(type)?'creditor':'debtor'));
const invLedgerOk=(type,l)=>!!l&&l.active&&under(l.group,isBuy(type)?'Purchase Accounts':'Sales Accounts');
// Quantity of each item already returned against an invoice (other than the return being altered)
function returned(orig,exceptVid){const m={};
  for(const v of S.vouchers){if(v.status!=='Active'||!v.inv||v.inv.orig!==orig||v.id===exceptVid)continue;for(const r of v.inv.items)m[r.iid]=(m[r.iid]||0)+(+r.qty||0)}
  return m}
// Rows of the original invoice, for a return to start from: what is left to return
function rowsFromOrig(d){const o=S.vouchers.find(v=>v.id===d.orig);if(!o)return[blankRow()];const done=returned(o.id,d.editingId),rows=[];
  for(const r of o.inv.items){const left=Math.round(((+r.qty||0)-(done[r.iid]||0))*1000)/1000;if(left>0)rows.push({iid:r.iid,qty:qfmt(left),rate:normAmt(r.rate),disc:r.disc?String(r.disc):'',vat:String(r.vat)})}
  return rows.concat([blankRow()])}
/* ---------- checks ---------- */
function invChecks(d){const out=[],T=TYPES[d.type],ln=d.lines[0],l=ln.lid&&led(ln.lid),c=calcInv(d);
  out.push(dateCheck(d));
  if(!l)out.push({t:'Party',st:'bad',m:`Pick the ${isBuy(d.type)?'supplier':'customer'}.`});
  else if(!partyOk(d.type,l))out.push({t:'Party',st:'bad',m:`${l.name} is not a ${isBuy(d.type)?'supplier (Sundry Creditors)':'customer (Sundry Debtors)'}, cash or bank ledger.`});
  else out.push({t:'Party',st:'ok',m:l.name});
  const lg=led(d.sledger);
  if(!invLedgerOk(d.type,lg))out.push({t:'Ledger',st:'bad',m:`Pick the ${isBuy(d.type)?'Purchase':'Sales'} ledger.`});
  const bad=d.rows.findIndex(r=>(r.iid||+r.qty>0)&&!rowDone(r));
  if(bad>=0)out.push({t:'Items',st:'bad',m:`Row ${bad+1} needs an item and a quantity.`});
  else if(!c.rows.some(Boolean))out.push({t:'Items',st:'bad',m:'Add at least one item.'});
  else out.push({t:'Items',st:'ok',m:`${c.rows.filter(Boolean).length} item row${c.rows.filter(Boolean).length===1?'':'s'}.`});
  const dis=d.rows.findIndex(r=>rowDone(r)&&(+r.disc<0||+r.disc>100||+r.vat<0||+r.vat>100||cents(r.rate)<0));
  if(dis>=0)out.push({t:'Items',st:'bad',m:`Row ${dis+1}: discount and VAT must be between 0 and 100, and the rate cannot be negative.`});
  if(c.rows.some(Boolean)&&!c.total)out.push({t:'Total',st:'bad',m:'The invoice total is zero. Give the items a rate.'});
  if(c.vat&&!vatLedger())out.push({t:'VAT',st:'bad',m:'There is no VAT ledger (under Duties & Taxes) to post the VAT to.'});
  if(ORIG[d.type]&&d.orig){const o=S.vouchers.find(v=>v.id===d.orig),done=o?returned(o.id,d.editingId):{},have={};
    if(o)for(const r of o.inv.items)have[r.iid]=(+r.qty||0)-(done[r.iid]||0);
    const sum={};for(const r of d.rows)if(rowDone(r))sum[r.iid]=(sum[r.iid]||0)+ +r.qty;
    for(const iid in sum){const n=item(iid)&&item(iid).name;
      if(have[iid]===undefined){out.push({t:'Return',st:'bad',m:`${n} is not on ${vno(o.type,o.seq,o.pre)}.`});break}
      if(sum[iid]-have[iid]>0.0005){out.push({t:'Return',st:'bad',m:`${n}: only ${qfmt(have[iid])} left to return against ${vno(o.type,o.seq,o.pre)}.`});break}}}
  out.push(billCheck(d));
  // Going below zero stock is allowed (stock may be received later) but flagged
  if(isOut(d.type)){const need={};for(const r of d.rows)if(rowDone(r))need[r.iid]=(need[r.iid]||0)+ +r.qty;
    for(const iid in need){const it=item(iid);if(it&&it.stock&&stockOf(iid,d.editingId)-need[iid]<-0.0005){out.push({t:'Stock',st:'warn',m:`${it.name}: only ${qfmt(stockOf(iid,d.editingId))} ${it.unit} in stock.`});break}}}
  return out}
/* ---------- save ---------- */
// Create the voucher (or, for an invoice being altered, change it in place: the number stays). Returns the voucher.
function commitInvoice(d){const c=syncInv(d),lines=buildLines(d),date=serial(d.date.m,d.date.d),ln=d.lines[0];
  const inv={ledger:d.sledger,party:ln.lid,orig:d.orig||'',edited:!!ln.edited,
    items:d.rows.filter(rowDone).map(r=>({iid:r.iid,qty:+r.qty,rate:normAmt(r.rate)||'0.00',disc:+r.disc||0,vat:+r.vat||0}))};
  if(d.editingId){const v=S.vouchers.find(x=>x.id===d.editingId),old=cents(v.lines.find(l=>l.lid===v.inv.party).amt);
    Object.assign(v,{date,lines,inv,narr:d.narr,billNo:d.billNo||''});
    audit('Edited',v,old!==c.total?`Amount ${fmt(old)} → ${fmt(c.total)}`:'Details changed');return v}
  const seq=++S.counters[d.type],v={id:'v'+(++S.vid),type:d.type,seq,date,lines,inv,narr:d.narr,billNo:d.billNo||'',status:'Active',by:USER,uid:UID,pre:TYPES[d.type].prefix,createdAt:Date.now()};
  S.vouchers.push(v);audit('Created',v,`${TYPES[d.type].name} ${fmt(c.total)}`);return v}
// Total of a saved invoice (what the party owes or is owed)
const invTotal=v=>cents(v.lines.find(l=>l.lid===v.inv.party&&l.side===PARTY_SIDE[v.type]).amt);
