/* Leave Detail (Admin): everything needed to decide one request, then Approve or Reject with a remark. Open with ?id=<leave id>. */
let LV=null;
const DEC={ok:true,remark:''};
const dayName=s=>`${bsText(s)} · ${DAYN[wday(s)]}`;
const row=(a,b)=>`<div class="f"><label>${a}</label><span>${b}</span></div>`;
// Salary the employee would lose for the working days of this request (used for Unpaid leave)
function lossFor(e,l){let c=0;for(let s=l.from;s<=l.to;s++)if(!isOff(s))c+=Math.round(e.basic/MDAYS[bs(s).m]);return c}
function attStats(eid){const n={P:0,A:0,L:0};for(let s=0;s<TODAY;s++){const r=attOf(eid,s);if(n[r.st]!==undefined)n[r.st]++}return n}
function vLeaveDet(){
  if(!LV)return tp('Leave Request','','<p class="tp-note">This request was not found.</p>');
  const l=LV,e=emp(l.emp)||{name:'?',desig:'',code:'',basic:0},pend=l.status==='Pending';
  const ent=LEAVE_TYPES[l.type],used=leaveUsed(l.emp,l.type),wait=leaveUsed(l.emp,l.type,['Pending'])-(pend?l.days:0),left=ent-used;
  const warn=[];
  if(l.type!=='Unpaid'&&pend&&left<l.days)warn.push(`Only ${left} day(s) of ${l.type} leave left, this request needs ${l.days}. It cannot be approved.`);
  if(l.from<TODAY)warn.push('The leave starts before today.');
  const away=S.leaves.filter(x=>x.id!==l.id&&x.emp!==l.emp&&['Approved','Pending'].includes(x.status)&&x.from<=l.to&&x.to>=l.from);
  if(away.some(x=>x.status==='Approved'))warn.push(`${away.filter(x=>x.status==='Approved').length} other employee(s) are already on approved leave on these days.`);
  const bal=ent?`${row('Yearly entitlement',`${ent} days`)}${row('Already taken (approved)',`${used} days`)}${row('Other requests waiting',`${wait} days`)}${row('This request',`${l.days} days`)}${row(pend?'Left if approved':'Left now',`<b class="${left-(pend?l.days:0)<0?'badt':''}">${left-(pend?l.days:0)} days</b>`)}`
    :`${row('Limit','None, but the days are not paid')}${row('Salary lost (estimate)',`<b>${fmt(lossFor(e,l))}</b> for ${l.days} working day(s)`)}`;
  const st=attStats(l.emp),hist=S.leaves.filter(x=>x.emp===l.emp&&x.id!==l.id).sort((a,b)=>b.from-a.from);
  const awayRows=away.map(x=>`<tr><td>${esc((emp(x.emp)||{}).name)}</td><td>${x.type}</td><td class="num">${span(x)}</td><td>${stTag(x.status)}</td></tr>`).join('');
  const histRows=hist.map(x=>`<tr><td>${x.type}</td><td class="num">${span(x)}</td><td class="r num">${x.days}</td><td>${esc(x.reason)}</td><td>${stTag(x.status)}</td></tr>`).join('');
  return tp('Leave Request',`${e.name} · ${l.status}`,`${warn.length?`<div class="ld-warn">${warn.map(w=>`<p>${esc(w)}</p>`).join('')}</div>`:''}
   <h4 class="ld-h">Request</h4>
   ${row('Employee',`${esc(e.name)} <span class="muted">${esc(e.code)} · ${esc(e.desig)}</span>`)}
   ${row('Leave type',l.type)}${row('From',dayName(l.from))}${row('To',dayName(l.to))}${row('Working days',`<b>${l.days}</b> <span class="muted">(Saturdays are not counted)</span>`)}
   ${row('Reason',esc(l.reason))}${row('Applied on',bsText(l.applied))}
   ${l.status!=='Pending'?`${row('Decision',`${stTag(l.status)} ${l.by?'by '+esc(l.by):''} ${l.decided!==undefined?'on '+bsText(l.decided):''}`)}${l.remark?row('Remark',esc(l.remark)):''}`:''}
   <h4 class="ld-h">${l.type} leave balance</h4>${bal}
   <h4 class="ld-h">Attendance this year</h4>${row('Present',`${st.P} days`)}${row('Absent',`${st.A} days`)}${row('On leave',`${st.L} days`)}
   <h4 class="ld-h">Others away on these days</h4>${away.length?`<table><tbody>${awayRows}</tbody></table>`:'<p class="tp-note">Nobody else has leave on these days.</p>'}
   <h4 class="ld-h">${esc(e.name)}'s other leave this year</h4>${hist.length?`<table><thead><tr><th>Type</th><th>Dates</th><th class="r">Days</th><th>Reason</th><th>Status</th></tr></thead><tbody>${histRows}</tbody></table>`:'<p class="tp-note">No other leave.</p>'}`)}
/* ---------- Approve / Reject (popup with a remark) ---------- */
function openDecide(ok){const l=LV;if(!l)return;
  if(l.status!=='Pending'){say(`This request is already ${l.status.toLowerCase()}.`,'bad');return}
  if(ok&&l.type!=='Unpaid'&&leaveLeft(l.emp,l.type)<l.days){say(`${emp(l.emp).name} has only ${leaveLeft(l.emp,l.type)} day(s) of ${l.type} leave left, so this cannot be approved.`,'bad');return}
  DEC.ok=ok;DEC.remark='';openPanel('lvdec',0,null)}
PANELS.lvdec={view:()=>`<h2>${DEC.ok?'Approve':'Reject'} Leave</h2><div class="f"><label for="dc-remark">Remark${DEC.ok?' (optional)':''}</label><input id="dc-remark" class="in" data-nav data-f="lvdec" placeholder="${DEC.ok?'Shown to the employee':'Why is it rejected?'}" value="${esc(DEC.remark)}" autocomplete="off"></div>
  <p class="pfoot">${esc(emp(LV.emp).name)} · ${LV.type} · ${span(LV)} · Enter ${DEC.ok?'approve':'reject'} · Esc cancel</p>`,last:decide,accept:decide};
FIELD.lvdec={input:t=>{DEC.remark=t.value}};
function decide(){const r=$('#dc-remark');if(r)DEC.remark=r.value;
  if(!DEC.ok&&!DEC.remark.trim()){say('Write a short reason for rejecting.','bad');return}
  Object.assign(LV,{status:DEC.ok?'Approved':'Rejected',remark:DEC.remark.trim(),by:CUR.user.name,decided:TODAY});
  P.then=null;closePanel();say(`${emp(LV.emp).name}: ${LV.type} leave ${LV.status.toLowerCase()}.`,'ok')}
start({id:'hrleavedet',title:'Leave Request',view:vLeaveDet,back:()=>navigate('hrleave'),
  init(){LV=S.leaves.find(l=>l.id===param('id'))||null},
  keys:()=>[{k:'A',l:'Approve',a:()=>openDecide(true)},{k:'R',l:'Reject',a:()=>openDecide(false)},{gap:1},escKey()]});
