/* Salary Spends (Admin): what each month's salary costs, and paying it */
const SH=S.hs.sal;
function vSal(){const rows=salaryRows(SH.m),paid=monthPaid(SH.m);SH.sel=Math.max(0,Math.min(SH.sel,rows.length-1));
  const body=rows.map((r,i)=>`<tr class="${i===SH.sel?'sel':''}" data-i="${i}"><td>${esc(r.e.name)}</td><td class="r num">${fmt(r.gross)}</td><td class="r num">${r.unpaid||''}</td><td class="r num">${r.ded?fmt(r.ded):''}</td><td class="r num">${fmt(r.net)}</td></tr>`).join('');
  const tot=`<tr class="tot"><td>Total</td><td class="r num">${fmt(sumRows(rows,'gross'))}</td><td></td><td class="r num">${fmt(sumRows(rows,'ded'))}</td><td class="r num">${fmt(sumRows(rows,'net'))}</td></tr>`;
  const note=paid?'':SH.m>=CUR_M?`${MONTHS[SH.m]} is still running. It can be paid after the month ends.`:'Not paid yet. Press Y to pay this month.';
  return tp('Salary Spends',`${mName(SH.m)} · ${paid?'Paid':'Not paid'}`,`<table class="rep"><thead><tr><th>Employee</th><th class="r">Salary</th><th class="r">Unpaid days</th><th class="r">Deduction</th><th class="r">To pay</th></tr></thead><tbody>${body}${tot}</tbody></table>${note?`<p class="tp-note">${note}</p>`:''}`)}
function doPay(){
  if(monthPaid(SH.m)){say(`${mName(SH.m)} is already paid.`,'bad');return}
  if(SH.m>=CUR_M){say(`${mName(SH.m)} is still running. Pay a month after it ends.`,'bad');return}
  const net=sumRows(salaryRows(SH.m),'net');
  ask(`Pay salary for ${mName(SH.m)}? Total ${fmt(net)}.${postsSalary()?' A Payment voucher is posted in Account (bank: NIC Asia).':''}`,()=>{
    const no=payMonth(SH.m);render();say(no?`Salary paid. Payment voucher ${no} posted in Account.`:'Salary marked as paid.','ok')})}
const openSlip=()=>{const r=salaryRows(SH.m)[SH.sel];if(!r)return;if(!monthPaid(SH.m)){say('Detail is available once the month is paid (Y).','bad');return}navigate('hrslip',{e:r.e.id,m:SH.m})};
start({id:'hrsal',title:'Salary Spends',view:vSal,state:SH,activate:openSlip,
  keys:()=>[{k:'↑ ↓',l:'Move'},{k:'Enter',l:'Salary detail',a:openSlip},{gap:1},{k:'Y',l:'Pay month',a:doPay},{gap:1},{k:'← →',l:'Month'},{gap:1},escKey()],
  key(e){if(monthKey(e,SH))return true;if(listNav(e,SH,salaryRows(SH.m).length,render))return true;if(e.key==='Enter'){stop(e);openSlip();return true}return false}});
