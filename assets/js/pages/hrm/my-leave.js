/* My Leave (Employee): balances, my requests, apply for leave */
const YH=S.hs.myl;
const myLeaves=()=>S.leaves.filter(l=>l.emp===myEmpId()).sort((a,b)=>b.from-a.from);
function vMyLeave(){const e=meEmp(),list=myLeaves();YH.sel=Math.max(0,Math.min(YH.sel,list.length-1));
  const rows=list.map((l,i)=>`<tr class="${i===YH.sel?'sel':''}" data-i="${i}"><td>${l.type}</td><td class="num">${span(l)}</td><td class="r num">${l.days}</td><td>${esc(l.reason)}</td><td>${stTag(l.status)}</td><td class="muted">${esc(l.remark||'')}</td></tr>`).join('');
  return tp('Leave',e.name,`${list.length?`<table><thead><tr><th>Type</th><th>Dates</th><th class="r">Days</th><th>Reason</th><th>Status</th><th>Admin remark</th></tr></thead><tbody>${rows}</tbody></table>`:'<p class="tp-note">You have not asked for any leave yet. Press N to apply.</p>'}`)}
/* ---------- Apply for leave (popup) ---------- */
const blankLF2=()=>{let s=TODAY+1;while(isOff(s))s++;return{type:'Annual',from:s,to:s,reason:''}};
let LF=blankLF2();
function newLeave(){LF=blankLF2();openPanel('lvf',0,null)}
const lvDays=()=>`${leaveDays(LF.from,Math.max(LF.from,LF.to))} working day(s)`;
PANELS.lvf={view:()=>`<h2>Apply Leave</h2>
  <div class="f"><label for="lv-type">Type</label><input id="lv-type" class="in" data-nav data-pick data-f="lvf" data-k="type" value="${LF.type}" autocomplete="off"></div>
  <div class="f"><label for="lv-from">From</label><input id="lv-from" class="in" data-nav data-date data-f="lvf" data-k="from" placeholder="yyyy-mm-dd" value="${bsText(LF.from)}" autocomplete="off"></div>
  <div class="f"><label for="lv-to">To</label><input id="lv-to" class="in" data-nav data-date data-f="lvf" data-k="to" placeholder="yyyy-mm-dd" value="${bsText(LF.to)}" autocomplete="off"></div>
  <div class="f"><label for="lv-reason">Reason</label><input id="lv-reason" class="in" data-nav data-f="lvf" data-k="reason" value="${esc(LF.reason)}" autocomplete="off"></div>
  <p class="pfoot"><span id="lv-days">${lvDays()}</span> · Enter next · Ctrl+A send · Esc cancel</p>`,
  last:sendLeave,accept:sendLeave};
FIELD.lvf={date:t=>LF[t.dataset.k],input:t=>{if(t.dataset.k==='reason')LF.reason=t.value},
  blur(t){const k=t.dataset.k;if(k!=='from'&&k!=='to')return;const r=parseDate(t.value,bs(LF[k]));if(r)LF[k]=serial(r.m,r.d);t.value=bsText(LF[k]);const d=$('#lv-days');if(d)d.textContent=lvDays()}};
PICK.lvf={source:()=>Object.keys(LEAVE_TYPES).map(t=>({v:t,label:t,sub:LEAVE_TYPES[t]?`${leaveLeft(myEmpId(),t)} of ${LEAVE_TYPES[t]} days left`:'No pay for these days'})),
  cur:()=>LF.type,title:()=>'Leave Type',commit(t,it){LF.type=it.v;moveFocus(t,1)}};
function sendLeave(){const el=document.activeElement;if(el&&el.dataset&&el.dataset.date!==undefined)FIELD.lvf.blur(el);
  const r=$('#lv-reason');if(r)LF.reason=r.value;
  if(LF.to<LF.from){say('The end date is before the start date.','bad');return}
  const days=leaveDays(LF.from,LF.to);if(!days){say('Those dates are only weekly offs. Pick working days.','bad');return}
  if(!LF.reason.trim()){say('Write a short reason.','bad');return}
  if(S.leaves.some(l=>l.emp===myEmpId()&&['Pending','Approved'].includes(l.status)&&l.from<=LF.to&&l.to>=LF.from)){say('You already have a leave request on some of these days.','bad');return}
  const left=leaveLeft(myEmpId(),LF.type,['Approved','Pending']);
  if(LF.type!=='Unpaid'&&left<days){say(`You have only ${left} day(s) of ${LF.type} leave left (including requests waiting).`,'bad');return}
  addLeave(myEmpId(),LF.type,LF.from,LF.to,LF.reason.trim());P.then=null;closePanel();say('Leave request sent to the Admin.','ok')}
function cancelLeave(){const l=myLeaves()[YH.sel];if(!l)return;
  if(l.status!=='Pending'){say('Only a request that is still waiting can be cancelled.','bad');return}
  ask(`Cancel your ${l.type} leave request for ${span(l)}?`,()=>{S.leaves=S.leaves.filter(x=>x.id!==l.id);render();say('Request cancelled.','ok')})}
start({id:'hrmyleave',title:'Leave',view:vMyLeave,state:YH,
  keys:()=>[{k:'↑ ↓',l:'Move'},{k:'N',l:'Apply leave',a:newLeave},{k:'C',l:'Cancel request',a:cancelLeave},{gap:1},escKey()],
  key:e=>listNav(e,YH,myLeaves().length,render)});
