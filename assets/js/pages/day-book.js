/* Day Book page */
/* ---------- Day Book ---------- */
function vDay(){const D=S.db;
  D.list=[...S.vouchers].filter(v=>(D.all||v.date===D.date)&&(!ownOnly()||v.uid===UID)).sort((a,b)=>(b.createdAt||0)-(a.createdAt||0)||+b.id.slice(1)-+a.id.slice(1));   // newest created first
  D.sel=Math.max(0,Math.min(D.sel,D.list.length-1));
  const rows=D.list.map((v,i)=>{const dr=v.lines.filter(l=>l.side==='Dr').reduce((a,l)=>a+cents(l.amt),0);
    const drl=v.lines.filter(l=>l.side==='Dr'),crl=v.lines.filter(l=>l.side==='Cr');const can=v.status==='Cancelled';
    return `<tr class="${can?'cancelled':''} ${i===D.sel?'sel':''}" data-i="${i}"><td class="num">${bsShort(v.date)}</td>
     <td><span class="strike">${esc(led(drl[0].lid).name)}${drl.length>1?' …':''} <span class="muted">to</span> ${esc(led(crl[0].lid).name)}${crl.length>1?' …':''}</span>${v.billNo?`<br><small class="muted">Bill No. ${esc(v.billNo)}</small>`:''}${v.narr?`<br><small class="muted">${esc(v.narr)}</small>`:''}</td>
     <td>${TYPES[v.type].name}</td><td class="num">${vno(v.type,v.seq,v.pre)}</td>
     <td class="r num">${can?'0.00':fmt(dr)}</td><td>${can?'<span class="tag warn">Cancelled</span>':''}</td></tr>`}).join('');
  return tp(ownOnly()?'Day Book · My vouchers':'Day Book',D.all?'All days':bsText(D.date),
   D.list.length?`<table><thead><tr><th>Date</th><th>Particulars</th><th>Vch Type</th><th>Vch No.</th><th class="r">Amount</th><th></th></tr></thead><tbody>${rows}</tbody></table>`:`<p class="tp-note">No vouchers ${D.all?'yet':'on this day. Press A for all days, or ← → to change the day'}.</p>`)}
function cancelVoucher(){const v=S.db.list[S.db.sel];if(!v)return;
  if(v.status==='Cancelled'){say('Already cancelled.','bad');return}
  if(v.date<=LOCK){say(`${vno(v.type,v.seq,v.pre)} is in a locked period (up to ${bsText(LOCK)}).`,'bad');return}
  ask(`Cancel ${vno(v.type,v.seq,v.pre)}? It stays in the Day Book marked Cancelled and keeps its number.`,()=>{
    v.status='Cancelled';audit('Cancelled',v,'Amount now 0. Number kept.');render();say(`${vno(v.type,v.seq,v.pre)} cancelled.`,'ok')})}
start({
  id:'daybook',title:'Day Book',view:vDay,state:S.db,
  keys:()=>[{k:'↑ ↓',l:'Move'},{k:'Enter',l:can('v.alter')?'Alter voucher':'View voucher',a:()=>editVoucher()},...(can('v.cancel')?[{k:'Alt+X',l:'Cancel voucher',a:cancelVoucher}]:[]),
    {k:'Alt+P',l:'Print',a:()=>{const x=S.db.list[S.db.sel];if(x)openPrint(x.id)}},{gap:1},{k:'← →',l:'Day'},{k:'A',l:S.db.all?'One day':'All days',a:()=>{S.db.all=!S.db.all;S.db.sel=0;render()}},{gap:1},escKey()],
  key(e){const k=e.key;if(listNav(e,S.db,S.db.list.length,render))return true;
    if(k==='Enter'){stop(e);editVoucher();return true}
    if((k==='ArrowLeft'||k==='ArrowRight')&&!S.db.all){stop(e);S.db.date=Math.max(0,S.db.date+(k==='ArrowRight'?1:-1));S.db.sel=0;render();return true}
    return false}});
