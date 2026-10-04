/* HRM data and calculations: employees, attendance, leave, salary. Amounts are paisa integers, like the rest of the app.
   Loaded on every page so the saved data always travels with the rest of the state. */

/* ---------- Parts of the product, users, calendar helpers ---------- */
const MODNAME={acc:'Account',hrm:'HRM',tools:'Business Tools'};
const GATE={acc:'home',hrm:'hrhome',tools:'bthome'};          // the first screen of each part
const wday=s=>(s+5)%7;                                          // 0 = Sunday ... 6 = Saturday. Shrawan 1 2083 is a Friday.
const isOff=s=>wday(s)===6;                                     // Saturday is the weekly off
const DAYN=['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
const mName=m=>`${MONTHS[m]} ${bsYear(m)}`;
const mFirst=m=>serial(m,1), mLast=m=>serial(m,MDAYS[m]);
const CUR_M=bs(TODAY).m;                                        // the month that is running now
const LEAVE_TYPES={Annual:18,Sick:12,Casual:6,Unpaid:0};        // days per year; Unpaid has no limit and is deducted from salary
const hm=min=>String(Math.floor(min/60)).padStart(2,'0')+':'+String(min%60).padStart(2,'0');
const toMin=t=>{const p=String(t||'').split(':');return p.length===2?+p[0]*60+ +p[1]:null};

/* ---------- State (saved with the rest in Store) ---------- */
function E(id,name,desig,join,salary,phone){return{id,code:'E-'+id.slice(1).padStart(3,'0'),name,desig,join,basic:salary*100,phone,active:true}}   // basic = the monthly salary
Object.assign(S,{
  mod:'acc',
  emps:[],leaves:[],att:{},pay:{},
  hs:{emp:{sel:0},lv:{sel:0},sal:{sel:0,m:Math.max(0,CUR_M-1)},my:{sel:0,m:CUR_M},myl:{sel:0},myp:{sel:0}}});
Store.keys.push('emps','leaves','att','pay');Store.ui.push('mod');   // hs (screen positions) is not saved: pages hold references to it
S.q.h1=true;
// A saved state from before HRM existed has no H1 switch: it starts on
const _load=Store.load.bind(Store);
Store.load=function(){const r=_load();if(S.q.h1===undefined)S.q.h1=true;return r};

/* ---------- Lookups ---------- */
const emp=id=>S.emps.find(e=>e.id===id);
// The signed-in member (core/db.js): HR admin by role, and their own employee record when they are linked to one
const isAdmin=()=>can('hrm.admin');
const myEmpId=()=>CUR.member&&CUR.member.emp&&emp(CUR.member.emp)?CUR.member.emp:'';
const meEmp=()=>emp(myEmpId());
const userLabel=()=>CUR.user?`${CUR.user.name} · ${roleName(CUR.member)||'No business'}`:'';
const activeEmps=()=>S.emps.filter(e=>e.active);

/* ---------- Leave ---------- */
const leaveDays=(from,to)=>{let n=0;for(let s=from;s<=to;s++)if(!isOff(s))n++;return n};
const leaveOn=(eid,s)=>isOff(s)?null:S.leaves.find(l=>l.emp===eid&&l.status==='Approved'&&s>=l.from&&s<=l.to)||null;
const leaveUsed=(eid,type,statuses=['Approved'])=>S.leaves.filter(l=>l.emp===eid&&l.type===type&&statuses.includes(l.status)).reduce((a,l)=>a+l.days,0);
const leaveLeft=(eid,type,statuses)=>LEAVE_TYPES[type]-leaveUsed(eid,type,statuses);
let lvSeq=0;
function addLeave(eid,type,from,to,reason,status){const l={id:'lv'+(++lvSeq)+'_'+Date.now(),emp:eid,type,from,to,days:leaveDays(from,to),reason,status:status||'Pending',applied:TODAY};S.leaves.push(l);return l}

/* ---------- Attendance ---------- */
// What an employee's day looks like: leave first, then what was marked, then weekly off, then (for past days) absent
// Joining date (yyyy-mm-dd in BS) as a day number of this sample year; -1 when before the year starts
function joinSerial(e){const j=String(e.join).match(/^(\d{4})-(\d{2})-(\d{2})$/);if(!j)return -1;const y=+j[1],mn=+j[2],d=+j[3];
  if(y<2083||(y===2083&&mn<4))return -1;const m=mn>=4?mn-4:mn+8;return y>2084||(y===2084&&mn>=4)?1e6:serial(m,d)}
function attOf(eid,s){
  const e=emp(eid);if(e&&s<joinSerial(e))return{st:'N'};
  const lv=leaveOn(eid,s);if(lv)return{st:'L',type:lv.type,unpaid:lv.type==='Unpaid'};
  const r=(S.att[eid]||{})[s];if(r)return r;
  if(isOff(s))return{st:'H'};
  return s<TODAY?{st:'A'}:{st:''}}
function hoursText(r){if(!r||!r.in||!r.out)return'';const m=toMin(r.out)-toMin(r.in);return m>0?`${Math.floor(m/60)}:${String(m%60).padStart(2,'0')}`:''}
const STAT={P:'Present',A:'Absent',L:'On leave',H:'Weekly off',N:'Not joined','':'—'};
const nowHM=()=>{const t=new Date();return hm(t.getHours()*60+t.getMinutes())};

/* ---------- Salary ---------- */
// One month of one employee. Unpaid days (absent, not yet joined, or unpaid leave) are deducted at salary / days in the month.
function calcPay(e,m){
  let unpaid=0;for(let s=mFirst(m);s<=Math.min(mLast(m),TODAY);s++){const a=attOf(e.id,s);if(a.st==='A'||a.st==='N'||(a.st==='L'&&a.unpaid))unpaid++}
  const gross=e.basic,ded=Math.round(gross/MDAYS[m]*unpaid);
  return{gross,unpaid,ded,net:gross-ded}}
const payRec=(eid,m)=>(S.pay[m]||{})[eid]||null;
const monthPaid=m=>!!S.pay[m]&&Object.values(S.pay[m]).length>0;
// What the Salary Spends screen shows: the saved figures once paid, otherwise a live calculation
function salaryRows(m){
  if(monthPaid(m))return Object.keys(S.pay[m]).map(id=>({e:emp(id),...S.pay[m][id]})).filter(r=>r.e);
  return activeEmps().map(e=>({e,...calcPay(e,m),status:''}))}
const sumRows=(rows,k)=>rows.reduce((a,r)=>a+r[k],0);
// Paying a month saves the figures and (switch H1) posts one Payment voucher in Account: Dr Salary, Cr bank for the total.
// Only when the business has those two ledgers (ids 'salary' and 'nic'); a new business has neither, so it only marks the month paid.
const postsSalary=()=>S.q.h1!==false&&!!led('salary')&&!!led('nic');
function payMonth(m){
  const rows=salaryRows(m);let no='';
  S.pay[m]={};rows.forEach(r=>{S.pay[m][r.e.id]={gross:r.gross,unpaid:r.unpaid,ded:r.ded,net:r.net,status:'Paid'}});
  if(postsSalary()){
    const net=sumRows(rows,'net'),ln=(side,lid)=>{const l=blankLine(side);l.lid=lid;l.amt=(net/100).toFixed(2);return l};
    const seq=++S.counters.payment,v={id:'v'+(++S.vid),type:'payment',seq,date:TODAY,lines:[ln('Dr','salary'),ln('Cr','nic')],narr:`Salary for ${mName(m)} (HRM)`,status:'Active',by:USER,uid:UID,pre:TYPES.payment.prefix};
    S.vouchers.push(v);audit('Created',v,`Salary for ${mName(m)} from HRM`);no=vno('payment',seq);Object.values(S.pay[m]).forEach(r=>r.voucher=no)}
  return no}
