/* Ledger Report page (address ?l=ledger id&b=1 for pending bills) */
/* ---------- Ledger Vouchers (Ledger Report): running balance, pending bills ---------- */
const balTxt=b=>b?`${fmt(Math.abs(b))} ${b>0?'Dr':'Cr'}`:'0.00';
function vLR(){ITEMS=[];const l0=S.lr.ledger&&led(S.lr.ledger);
  const pick=`<div class="f lrsel"><label for="lr-ledger">Ledger</label><input id="lr-ledger" class="in" data-nav data-pick data-f="lr" data-k="ledger" placeholder="Pick a ledger" value="${l0?esc(l0.name):''}" autocomplete="off"></div>`;
  if(!l0)return tp('Ledger Vouchers',COMPANY,pick+'<p class="tp-note">Pick a ledger and press Enter.</p>');
  const head=repHead(l0.name);
  if(S.lr.bills){const bills=l0.billwise?pendingBills(l0.id):[];let tot=0;
    const rows=bills.map(b=>{tot+=b.rem;const od=b.due!=null&&S.rep.to>b.due?S.rep.to-b.due:0;return `<tr><td>${esc(b.ref)}</td><td>${b.due!=null?bsShort(b.due):'–'}</td><td class="r num">${fmt(b.rem)}</td><td class="r">${od?od+' days':''}</td></tr>`}).join('');
    return tp('Ledger Vouchers · Pending Bills',COMPANY,pick+head+(l0.billwise?(rows?`<table class="rep"><thead><tr><th>Bill</th><th>Due on</th><th class="r">Pending</th><th class="r">Overdue</th></tr></thead><tbody>${rows}<tr class="tot"><td colspan="2">Total pending</td><td class="r num">${fmt(tot)}</td><td></td></tr></tbody></table>`:'<p class="tp-note">No pending bills.</p>'):'<p class="tp-note">This ledger is not kept bill by bill.</p>'))}
  let bal=(l0.side==='Dr'?1:-1)*l0.opening,tdr=0,tcr=0;
  let rows=`<tr class="grp"><td></td><td>Opening Balance</td><td></td><td></td><td class="r num">${bal>0?fmt(bal):''}</td><td class="r num">${bal<0?fmt(-bal):''}</td><td class="r num">${balTxt(bal)}</td></tr>`;
  const vs=S.vouchers.filter(v=>v.status==='Active'&&v.date<=S.rep.to&&v.lines.some(x=>x.lid===l0.id)).sort((a,b)=>a.date-b.date||a.seq-b.seq);
  for(const v of vs){let dr=0,cr=0;for(const x of v.lines)if(x.lid===l0.id){if(x.side==='Dr')dr+=cents(x.amt);else cr+=cents(x.amt)}
    bal+=dr-cr;tdr+=dr;tcr+=cr;const oth=v.lines.filter(x=>x.lid!==l0.id),s=rowSel({voucher:v.id});
    rows+=`<tr class="${s}" data-i="${ITEMS.length-1}"><td class="num">${bsShort(v.date)}</td><td>${esc(led(oth[0].lid).name)}${oth.length>1?' …':''}</td><td>${TYPES[v.type].name}</td><td class="num">${vno(v.type,v.seq,v.pre)}</td><td class="r num">${dr?fmt(dr):''}</td><td class="r num">${cr?fmt(cr):''}</td><td class="r num">${balTxt(bal)}</td></tr>`}
  rows+=`<tr class="sub"><td></td><td>Current Total</td><td></td><td></td><td class="r num">${fmt(tdr)}</td><td class="r num">${fmt(tcr)}</td><td></td></tr>
   <tr class="tot"><td></td><td>Closing Balance</td><td></td><td></td><td class="r num">${bal>0?fmt(bal):''}</td><td class="r num">${bal<0?fmt(-bal):''}</td><td class="r num">${balTxt(bal)}</td></tr>`;
  return tp('Ledger Vouchers',COMPANY,pick+head+`<table class="rep"><thead><tr><th>Date</th><th>Particulars</th><th>Vch Type</th><th>Vch No.</th><th class="r">Debit</th><th class="r">Credit</th><th class="r">Balance</th></tr></thead><tbody>${rows}</tbody></table>`)}
PICK.lr={
  source:()=>S.ledgers.map(l=>({v:l.id,label:l.name,sub:gname(l.group),code:S.q.q3?l.code:''})),
  cur:()=>{const l=S.lr.ledger&&led(S.lr.ledger);return l?l.name:''},
  title:()=>'List of Ledgers',
  commit:(t,it)=>{S.lr={ledger:it.v,bills:false};S.rep.sel=0;render()}};
start(reportPage({id:'lr',title:'Ledger Vouchers',view:vLR,enter:'Alter voucher',
  focus:()=>S.lr.ledger?null:'#lr-ledger',
  init(){S.lr={ledger:param('l')||'',bills:param('b')==='1'}},
  extraKeys(){const l0=S.lr.ledger&&led(S.lr.ledger);
    return[{k:'L',l:'Another ledger',a:()=>focusEl('#lr-ledger')},
      ...(l0&&l0.billwise?[{k:'B',l:S.lr.bills?'Transactions':'Pending bills',a:()=>{S.lr.bills=!S.lr.bills;S.rep.sel=0;render()}}]:[])]}}));
