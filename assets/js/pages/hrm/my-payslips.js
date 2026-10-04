/* Salary (Employee): one row per paid month, Enter opens the detail */
const QH=S.hs.myp;
const myPays=()=>{const out=[];for(let m=CUR_M;m>=0;m--){const r=payRec(myEmpId(),m);if(r)out.push({m,...r})}return out};
function vMyPays(){const list=myPays();QH.sel=Math.max(0,Math.min(QH.sel,list.length-1));
  const body=list.map((r,i)=>`<tr class="${i===QH.sel?'sel':''}" data-i="${i}"><td>${mName(r.m)}</td><td class="r num">${fmt(r.gross)}</td><td class="r num">${r.ded?fmt(r.ded):''}</td><td class="r num">${fmt(r.net)}</td><td>${stTag(r.status)}</td></tr>`).join('');
  return tp('Salary',meEmp().name,list.length?`<table><thead><tr><th>Month</th><th class="r">Salary</th><th class="r">Deduction</th><th class="r">Received</th><th>Status</th></tr></thead><tbody>${body}</tbody></table>`:'<p class="tp-note">No salary paid yet. Each month appears here once it is paid.</p>')}
const openMyPay=()=>{const r=myPays()[QH.sel];if(r)navigate('hrslip',{e:myEmpId(),m:r.m,from:'me'})};
start({id:'hrmypay',title:'Salary',view:vMyPays,state:QH,activate:openMyPay,
  keys:()=>[{k:'↑ ↓',l:'Move'},{k:'Enter',l:'Detail',a:openMyPay},{gap:1},escKey()],
  key(e){if(listNav(e,QH,myPays().length,render))return true;if(e.key==='Enter'){stop(e);openMyPay();return true}return false}});
