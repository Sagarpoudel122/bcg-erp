/* Approve Leave (Admin): the list of requests. Enter opens the detail, where the request is approved or rejected. */
const LH=S.hs.lv;
const leaveList=()=>S.leaves.slice().sort((a,b)=>(a.status==='Pending'?0:1)-(b.status==='Pending'?0:1)||b.from-a.from);
function vLeave(){const list=leaveList();LH.sel=Math.max(0,Math.min(LH.sel,list.length-1));
  const rows=list.map((l,i)=>`<tr class="${i===LH.sel?'sel':''}" data-i="${i}"><td>${esc((emp(l.emp)||{}).name)}</td><td>${l.type}</td><td class="num">${span(l)}</td><td class="r num">${l.days}</td><td>${esc(l.reason)}</td><td class="num">${bsShort(l.applied)}</td><td>${stTag(l.status)}</td></tr>`).join('');
  const pend=S.leaves.filter(l=>l.status==='Pending').length;
  return tp('Approve Leave',pend?`${pend} waiting`:'Nothing waiting',list.length?`<table><thead><tr><th>Employee</th><th>Type</th><th>Dates</th><th class="r">Days</th><th>Reason</th><th>Applied</th><th>Status</th></tr></thead><tbody>${rows}</tbody></table>`:'<p class="tp-note">No leave requests yet.</p>')}
const openLeave=()=>{const l=leaveList()[LH.sel];if(l)navigate('hrleavedet',{id:l.id})};
start({id:'hrleave',title:'Approve Leave',view:vLeave,state:LH,activate:openLeave,
  keys:()=>[{k:'↑ ↓',l:'Move'},{k:'Enter',l:'View and process',a:openLeave},{gap:1},escKey()],
  key(e){if(listNav(e,LH,S.leaves.length,render))return true;if(e.key==='Enter'){stop(e);openLeave();return true}return false}});
