/* Shared parts of every report: rows, tables, drill-down, period, page factory */
/* =====================================================================
   Reports (Tally style). All figures are computed live from the opening balances and the active vouchers up to the period end.
   Enter drills down (group > subgroup > ledger > voucher), Esc goes back up, F2 changes the period, Alt+P prints, Alt+E exports.
   Opening/Closing stock lines are not shown (no inventory in the MVP).
   ===================================================================== */
let ITEMS=[];   // the rows of the open report that Enter can drill into, in the order ↑ ↓ visit them
/* ---------- shared bits ---------- */
function rowSel(drill){if(!drill)return'';ITEMS.push(drill);return ITEMS.length-1===S.rep.sel?'sel':''}
const repHead=sub=>`<div class="rp-head"><b class="co">${esc(COMPANY)}</b>${sub?`<b class="sub">${esc(sub)}</b>`:''}<span class="per">${periodText()}</span></div>`;
// one row of a Debit | Credit table; c is a signed amount (Dr positive)
function drRow(name,c,drill,cls='',indent=0){const s=rowSel(drill);
  return `<tr class="${cls} ${s}" ${drill?`data-i="${ITEMS.length-1}"`:''}><td style="padding-left:${10+indent*18}px">${esc(name)}</td><td class="r num">${c>0?fmt(c):''}</td><td class="r num">${c<0?fmt(-c):''}</td></tr>`}
const totRow=(dr,cr,label='Grand Total')=>`<tr class="tot"><td>${label}</td><td class="r num">${dr?fmt(dr):''}</td><td class="r num">${cr?fmt(cr):''}</td></tr>`;
const drTable=(rows,dr,cr)=>rows?`<table class="rep"><thead><tr><th>Particulars</th><th class="r">Debit</th><th class="r">Credit</th></tr></thead><tbody>${rows}${totRow(dr,cr)}</tbody></table>`:'<p class="tp-note">Nothing to show for this period.</p>';
// two-sided sheet (Balance Sheet, Profit & Loss): sections of {L,R,lt,rt}. ↑ ↓ visits the left column first, then the right.
function sideTable(hl,hr,secs){let body='';
  const cells=(it,idx)=>{if(!it)return'<td></td><td></td>';const c=idx>=0&&idx===S.rep.sel?'sel':'',a=idx>=0?`data-i="${idx}"`:'';
    return `<td class="${c} ${it.cls||''}" ${a}>${esc(it.name)}</td><td class="r num ${c}" ${a}>${fmt(it.amt)}</td>`};
  for(const s of secs){const reg=list=>list.map(it=>it&&it.drill?ITEMS.push(it.drill)-1:-1),iL=reg(s.L),iR=reg(s.R),n=Math.max(s.L.length,s.R.length);
    for(let i=0;i<n;i++)body+=`<tr>${cells(s.L[i],iL[i])}<td class="sp"></td>${cells(s.R[i],iR[i])}</tr>`;
    body+=`<tr class="tot"><td>Total</td><td class="r num">${fmt(s.lt)}</td><td class="sp"></td><td>Total</td><td class="r num">${fmt(s.rt)}</td></tr>`}
  return `<table class="rep two"><thead><tr><th colspan="2">${hl}</th><th class="sp"></th><th colspan="2">${hr}</th></tr></thead><tbody>${body}</tbody></table>`}
/* Drill-down: Enter on a row opens the next report as its own page. The path back is kept in S.rstack so Esc returns to the row you came from. */
const repUrl=()=>href(S.view,S.view==='gsum'?{g:S.gs.group}:S.view==='lr'?{l:S.lr.ledger,b:S.lr.bills?'1':'0'}:null);
function drill(it){if(!it)return;
  if(it.voucher){editVoucher(S.vouchers.find(x=>x.id===it.voucher));return}
  S.rstack.push({url:repUrl(),sel:S.rep.sel});
  if(it.group)navigate('gsum',{g:it.group});else if(it.ledger)navigate('lr',{l:it.ledger});else if(it.view)navigate(it.view)}
function repBack(){pickClose();const s=S.rstack.pop();if(!s){focusSidebar();return}S.rep.selNext=s.sel;Store.save();location.href=s.url}
function openPeriod(){if(P||S.ask)return;openPanel('period',0,null)}
function panelPeriod(){return `<h2>Change Period</h2><div class="f"><label>From</label><span class="num">${bsText(FROM)}</span></div><div class="f"><label for="pd-to">To</label><input id="pd-to" class="in" data-nav data-date data-f="period" aria-label="Period end, yyyy-mm-dd" placeholder="yyyy-mm-dd" value="${bsText(S.rep.to)}" autocomplete="off"></div><p class="pfoot">Type yyyy-mm-dd, like 2083-05-10 · Enter apply · Esc cancel</p>`}
function applyPeriod(){const t=$('#pd-to'),r=parseDate(t.value,bs(S.rep.to));
  if(!r){say(DATE_HELP.replace('2083-06-15','2083-05-10'),'bad');return}
  S.rep.to=serial(r.m,r.d);S.rep.sel=0;P.then=null;closePanel()}
FIELD.period={date:()=>S.rep.to};
PANELS.period={view:panelPeriod,last:applyPeriod};

/* Every report page is built with reportPage(): same keys, same list movement, same Esc. */
function reportPage(o){
  return {
    id:o.id,title:o.title,view:o.view,state:S.rep,focus:o.focus,
    init(){S.rep.sel=S.rep.selNext||0;S.rep.selNext=0;if(o.init)o.init()},
    back:repBack,
    keys(){const r=[{k:'↑ ↓',l:'Move'},{k:'Enter',l:o.enter||'Drill down'},{gap:1},{k:'F2',l:'Period',a:openPeriod}];
      if(o.extraKeys)r.push(...o.extraKeys());
      r.push({gap:1},{k:'Alt+P',l:'Print',a:printReport},{k:'Alt+E',l:'Export',a:exportReport},{gap:1},escKey());return r},
    key(e){if(e.target.tagName==='INPUT')return false;if(listNav(e,S.rep,ITEMS.length,render))return true;
      if(e.key==='Enter'){stop(e);drill(ITEMS[S.rep.sel]);return true}return false}};
}
