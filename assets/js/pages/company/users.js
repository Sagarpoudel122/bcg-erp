/* User Management (Admin): who can open this business and with which role. N invites by email (valid 7 days), Enter changes
   the role, D deactivates (their vouchers stay theirs), R reactivates, and the Owner can hand ownership to another Admin (Alt+O).
   A user can also be linked to an employee record, which gives them the HRM "Me" screens. Prototype: emails land in the Mailbox. */
const UH={sel:0,list:[]};
const BID=CUR.biz?CUR.biz.id:'';
function uRows(){const ms=DB.membersOf(BID).map(m=>({k:'m',m,u:DB.user(m.user)})).filter(r=>r.u),ord=r=>(r.m.owner?0:10)+ROLE_ORDER.indexOf(r.m.role);
  return[...ms.filter(r=>r.m.status==='Active').sort((a,b)=>ord(a)-ord(b)||a.u.name.localeCompare(b.u.name)),
    ...DB.d.invites.filter(i=>i.biz===BID&&i.status==='Pending').sort((a,b)=>b.sent-a.sent).map(i=>({k:'i',i})),
    ...ms.filter(r=>r.m.status!=='Active')]}
const empName=id=>{const e=id&&emp(id);return e?e.name:''};
function vUsers(){const L=UH.list=uRows();UH.sel=Math.max(0,Math.min(UH.sel,L.length-1));
  const tr=(r,i)=>{const sel=i===UH.sel?'sel':'';
    if(r.k==='i')return `<tr class="${sel}" data-i="${i}"><td>${esc(r.i.name||'—')}</td><td>${esc(r.i.email)}</td><td>${esc(ROLES[r.i.role])}</td><td>${esc(empName(r.i.emp))}</td>
      <td>${DB.inviteState(r.i)==='Expired'?'<span class="tag bad">Invitation expired</span>':`<span class="tag warn">Invited · ${leftText(r.i.expires)} left</span>`}</td></tr>`;
    const m=r.m,off=m.status!=='Active';
    return `<tr class="${sel} ${off?'off':''}" data-i="${i}"><td>${esc(r.u.name)}${m.user===UID?' <span class="tag">You</span>':''}</td><td>${esc(r.u.email)}</td><td>${esc(roleName(m))}</td><td>${esc(empName(m.emp))}</td>
      <td>${off?'<span class="tag bad">Deactivated</span>':'<span class="tag ok">Active</span>'}</td></tr>`};
  return tp('User Management',COMPANY,`<table><thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Employee (HRM)</th><th>Status</th></tr></thead><tbody>${L.map(tr).join('')}</tbody></table>`)}
/* ---------- invite / change role (popup) ---------- */
let UF_M=null;   // the member whose role is being changed; null = inviting someone new
function empItems(){const taken=new Set([...DB.membersOf(BID).filter(m=>m.status==='Active'&&m!==UF_M).map(m=>m.emp),
    ...DB.d.invites.filter(i=>i.biz===BID&&i.status==='Pending').map(i=>i.emp)].filter(Boolean));
  return[{v:'',label:'None',sub:'Not linked to HRM'},...S.emps.filter(e=>!taken.has(e.id)).map(e=>({v:e.id,label:e.name,sub:`${e.code} · ${e.desig}`}))]}
const UF=form({id:'uf',v:{email:'',name:'',role:'accountant',emp:''},fields:[
  {k:'email',l:'Email',ph:'name@example.com',when:()=>!UF_M},{k:'name',l:'Name',ph:'Optional',when:()=>!UF_M},
  {k:'role',l:'Role',type:'pick',title:'Roles',items:()=>ROLE_ORDER.map(r=>({v:r,label:ROLES[r],sub:ROLE_SUB[r]}))},
  {k:'emp',l:'Employee (HRM)',type:'pick',title:'Link to an employee',items:empItems}]});
function ufSave(){const v=UF.v;
  if(v.role==='employee'&&!v.emp)return fmBad(UF,'emp','An Employee login must be linked to an employee record. Create the employee in HRM first.');
  if(UF_M){const m=UF_M,u=DB.user(m.user),was=roleName(m);m.role=v.role;m.emp=v.emp;DB.save();
    auditNote('Role changed',`${u.name}: ${was} → ${roleName(m)}${m.emp?' · employee '+empName(m.emp):''}`);P.then=null;closePanel();say(`${u.name} is now ${roleName(m)}.`,'ok');return}
  const email=normEmail(v.email),pr=DB.inviteProblem(BID,email);if(pr)return fmBad(UF,'email',pr);
  DB.invite({biz:BID,email,name:v.name.trim()||empName(v.emp),role:v.role,emp:v.emp,by:UID});auditNote('Invited',`${email} as ${ROLES[v.role]}`);
  P.then=null;closePanel();UH.sel=UH.list.findIndex(r=>r.k==='i'&&r.i.email===email);render();say(`Invitation sent to ${email}. It works for 7 days.`,'ok')}
PANELS.uf={view:()=>`<h2>${UF_M?'Change role · '+esc(DB.user(UF_M.user).name):'Invite a user'}</h2>${formHtml(UF)}<p class="pfoot">Enter next · Ctrl+A ${UF_M?'save':'send invitation'} · Esc cancel</p>`,
  last:ufSave,accept:ufSave};
function inviteUser(){UF_M=null;UF.v={email:'',name:'',role:'accountant',emp:''};openPanel('uf',0,null)}
function alterUser(){const r=UH.list[UH.sel];if(!r)return;
  if(r.k==='i'){say(`${r.i.email} has not accepted yet. R sends the invitation again, D cancels it.`);return}
  const m=r.m;if(m.status!=='Active')return say(`${r.u.name} is deactivated. Press R to reactivate first.`,'bad');
  if(m.owner)return say('The Owner is always an Admin. Hand ownership to another Admin first (Alt+O).','bad');
  if(m.user===UID)return say('You cannot change your own role.','bad');
  UF_M=m;UF.v={email:r.u.email,name:r.u.name,role:m.role,emp:m.emp||''};openPanel('uf',0,null)}
/* ---------- deactivate, reactivate, invitations, ownership ---------- */
function deactivate(){const r=UH.list[UH.sel];if(!r)return;
  if(r.k==='i'){ask(`Cancel the invitation to ${r.i.email}? The link in the email stops working.`,()=>{r.i.status='Cancelled';DB.save();auditNote('Invitation cancelled',r.i.email);render();say('Invitation cancelled.','ok')});return}
  const m=r.m;if(m.status!=='Active')return say(`${r.u.name} is already deactivated.`,'bad');
  if(m.user===UID)return say('You cannot deactivate yourself.','bad');
  if(m.owner)return say('The Owner cannot be deactivated. Hand ownership on first (Alt+O).','bad');
  ask(`Deactivate ${r.u.name}? They can no longer open ${dot(COMPANY)} Their vouchers stay, still shown as theirs.`,()=>{
    m.status='Inactive';m.off=now();DB.save();auditNote('Deactivated',`${r.u.name} (${roleName(m)})`);render();say(`${r.u.name} is deactivated.`,'ok')})}
function reactivate(){const r=UH.list[UH.sel];if(!r)return;
  if(r.k==='i'){DB.resendInvite(r.i);auditNote('Invitation sent again',r.i.email);render();say(`Invitation sent again to ${r.i.email}. It works for 7 days.`,'ok');return}
  const m=r.m;if(m.status==='Active')return say(`${r.u.name} is already active.`,'bad');
  ask(`Reactivate ${r.u.name} as ${roleName(m)}?`,()=>{
    if(m.emp&&DB.membersOf(BID).some(x=>x!==m&&x.status==='Active'&&x.emp===m.emp))m.emp='';   // that employee record is linked to someone else now
    m.status='Active';delete m.off;DB.save();auditNote('Reactivated',r.u.name);render();say(`${r.u.name} can open ${COMPANY} again.`,'ok')})}
function makeOwner(){const r=UH.list[UH.sel];if(!r||!can('owner'))return;
  if(r.k!=='m'||r.m.status!=='Active'||r.m.role!=='admin')return say('Pick an active Admin. Make them Admin first if needed (Enter).','bad');
  if(r.m.user===UID)return say('You are already the Owner.','bad');
  ask(`Make ${r.u.name} the Owner of ${COMPANY}? You stay an Admin. Only the Owner can lock books, delete the business or hand ownership on.`,()=>{
    auditNote('Ownership handed over',`${CUR.user.name} → ${r.u.name}`);CUR.member.owner=false;r.m.owner=true;
    DB.mail(r.u.email,`You are now the Owner of ${COMPANY}`,[`Hi ${r.u.name},`,`${CUR.user.name} made you the Owner of ${COMPANY} on BCG ERP.`]);DB.save();
    USER=`${CUR.user.name} (${roleName(CUR.member)})`;render();say(`${r.u.name} is now the Owner.`,'ok')})}
start({id:'users',title:'User Management',view:vUsers,state:UH,activate:alterUser,
  keys:()=>{const r=UH.list[UH.sel],inv=r&&r.k==='i';
    return[{k:'↑ ↓',l:'Move'},{k:'N',l:'Invite user',a:inviteUser},{k:'Enter',l:'Change role',a:alterUser},
      {k:'D',l:inv?'Cancel invitation':'Deactivate',a:deactivate},{k:'R',l:inv?'Send again':'Reactivate',a:reactivate},
      ...(can('owner')?[{k:'Alt+O',l:'Make Owner',a:makeOwner}]:[]),{gap:1},{k:'Alt+M',l:'Mailbox',a:()=>go('mailbox')},{gap:1},escKey()]},
  key(e){if(listNav(e,UH,UH.list.length,render))return true;if(e.key==='Enter'){stop(e);alterUser();return true}return false}});
