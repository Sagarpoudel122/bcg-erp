/* Attendance (Employee): punch in, punch out, and the record of the month */
const MH=S.hs.my;
function vMyAtt(){const e=meEmp(),t=attOf(e.id,TODAY);
  const now=t.st==='P'?`Punched in at ${t.in}${t.out?` · punched out at ${t.out} · ${hoursText(t)} hours`:''}`:t.st==='L'?'On leave today':t.st==='H'?'Weekly off today':'Not punched in yet';
  let rows='';for(let s=Math.min(mLast(MH.m),TODAY);s>=mFirst(MH.m);s--){const r=attOf(e.id,s),b=bs(s);
    if(r.st==='N')continue;
    rows+=`<tr class="${r.st==='H'?'off':''}"><td class="num">${bsShort(s)}</td><td>${DAYN[wday(s)]}</td><td class="num">${r.in||''}</td><td class="num">${r.out||''}</td><td class="num">${hoursText(r)}</td><td>${attTag(r)}</td></tr>`}
  return tp('Attendance',mName(MH.m),`<p class="hr-sub"><span>Today <b>${bsText(TODAY)}</b></span><span>${esc(now)}</span></p>
   <table><thead><tr><th>Date</th><th>Day</th><th>Punch in</th><th>Punch out</th><th>Hours</th><th>Status</th></tr></thead><tbody>${rows}</tbody></table>`)}
function punchIn(){const e=meEmp(),t=attOf(e.id,TODAY);
  if(t.st==='L'){say('You are on approved leave today.','bad');return}
  if(t.st==='P'&&t.in){say(`You already punched in at ${t.in}.`,'bad');return}
  (S.att[e.id]=S.att[e.id]||{})[TODAY]={st:'P',in:nowHM(),out:''};MH.m=CUR_M;render();say(`Punched in at ${S.att[e.id][TODAY].in}.`,'ok')}
function punchOut(){const e=meEmp(),r=(S.att[e.id]||{})[TODAY];
  if(!r||!r.in){say('Punch in first.','bad');return}
  if(r.out){say(`You already punched out at ${r.out}.`,'bad');return}
  r.out=nowHM();render();say(`Punched out at ${r.out}.`,'ok')}
start({id:'hrmyatt',title:'Attendance',view:vMyAtt,
  keys:()=>[{k:'I',l:'Punch in',a:punchIn},{k:'O',l:'Punch out',a:punchOut},{gap:1},{k:'← →',l:'Month'},{gap:1},escKey()],
  key:e=>monthKey(e,MH)});
