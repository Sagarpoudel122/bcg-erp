/* Create / alter Employee (Admin). Open with ?e=<id> to alter. */
const blankEF=()=>({name:'',desig:'',join:'',phone:'',basic:'',email:''});
let EF=blankEF(),EF_ID=null;
const EFIELDS=[{k:'name',l:'Name',ph:'English or नेपाली'},{k:'desig',l:'Designation'},{k:'join',l:'Joining date (BS)',ph:'yyyy-mm-dd, e.g. 2083-04-01'},{k:'phone',l:'Phone'},{k:'basic',l:'Monthly salary',amt:1},
  {k:'email',l:'Login email',ph:'Optional: invites them to log in',newOnly:1}];   // a new employee can get an Employee login straight away
function vEmpForm(){
  const rows=EFIELDS.filter(F=>!(F.newOnly&&EF_ID)).map(F=>`<div class="f"><label for="ef-${F.k}">${F.l}</label><input id="ef-${F.k}" class="in ${F.amt?'amt':''}" data-nav data-f="ef" data-k="${F.k}" ${F.amt?'data-amt inputmode="decimal"':''} placeholder="${esc(F.ph||'')}" value="${esc(F.amt?fmtIn(EF[F.k]):EF[F.k])}" autocomplete="off"></div>`).join('');
  return tp(EF_ID?'Employee Alteration':'Employee Creation',EF_ID?emp(EF_ID).code:`${activeEmps().length} employees so far`,rows)}
function efEnter(t){const L=navInputs(view());
  if(t.dataset.k==='name'&&!t.value.trim()){say('Give the employee a name.','bad');return}
  if(t===L[L.length-1]){ask('Accept?',saveEmp);return}moveFocus(t,1)}
function saveEmp(){const f=EF,name=f.name.trim(),bad=(m,id)=>{say(m,'bad');if(id)focusEl(id)};
  const t=document.activeElement;if(t&&t.dataset&&t.dataset.amt!==undefined)commitAmt(t);
  if(!name)return bad('Give the employee a name.','#ef-name');
  if(S.emps.some(e=>e.id!==EF_ID&&e.name.toLowerCase()===name.toLowerCase()))return bad(`An employee called "${name}" already exists.`,'#ef-name');
  const j=f.join.trim().match(/^(\d{4})-(\d{2})-(\d{2})$/);if(!j||+j[2]<1||+j[2]>12||+j[3]<1||+j[3]>32)return bad('Type the joining date as yyyy-mm-dd in BS, for example 2083-04-01.','#ef-join');
  if(!cents(f.basic))return bad('Enter the monthly salary.','#ef-basic');
  const email=normEmail(f.email);if(!EF_ID&&email){const pr=DB.inviteProblem(CUR.biz.id,email);if(pr)return bad(pr,'#ef-email')}
  const data={name,desig:f.desig.trim(),join:f.join.trim(),phone:f.phone.trim(),basic:cents(f.basic)};
  if(EF_ID){Object.assign(emp(EF_ID),data);flash(`${name} updated. A new salary applies to months not yet paid.`);navigate('hremps');return}
  const id='e'+Date.now();S.emps.push({id,code:'E-'+String(S.emps.length+1).padStart(3,'0'),active:true,name,desig:f.desig.trim(),join:f.join.trim(),phone:f.phone.trim(),basic:cents(f.basic)});
  if(email){DB.invite({biz:CUR.biz.id,email,name,role:'employee',emp:id,by:UID});auditNote('Invited',`${email} as Employee (${name})`)}
  EF=blankEF();render('#ef-name');say(email?`Saved. ${name} is added and an invitation to log in went to ${email}.`:`Saved. ${name} is added. Give them a login from User Management.`,'ok')}
FIELD.ef={enter:efEnter,input:t=>{EF[t.dataset.k]=t.value},amt:(t,raw)=>{EF[t.dataset.k]=raw}};
start({id:'hrempform',title:'Employee',view:vEmpForm,focus:()=>'#ef-name',
  init(){const e=param('e')&&emp(param('e'));EF_ID=e?e.id:null;EF=e?{name:e.name,desig:e.desig,join:e.join,phone:e.phone,basic:(e.basic/100).toFixed(2)}:blankEF()},
  keys:()=>[{k:'Enter',l:'Next field'},{k:'Backspace',l:'Previous field'},{gap:1},{k:'Ctrl+A',l:'Accept',a:saveEmp},escKey()],
  back(){if(EF_ID)navigate('hremps');else if(EF.name||EF.basic)ask('Discard this employee?',()=>{EF=blankEF();focusSidebar()});else focusSidebar()}});
