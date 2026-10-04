/* Employee List (Admin): Enter alters an employee, N creates a new one */
const EH=S.hs.emp;
function vEmps(){EH.sel=Math.max(0,Math.min(EH.sel,S.emps.length-1));
  const rows=S.emps.map((e,i)=>`<tr class="${i===EH.sel?'sel':''}" data-i="${i}"><td class="num">${esc(e.code)}</td><td>${esc(e.name)}</td><td>${esc(e.desig)}</td><td class="num">${esc(e.join)}</td><td>${esc(e.phone)}</td><td class="r num">${fmt(e.basic)}</td><td>${loginTag(e)}</td></tr>`).join('');
  return tp('Employee List',`${S.emps.length} employees`,`<table><thead><tr><th>Code</th><th>Name</th><th>Designation</th><th>Joined (BS)</th><th>Phone</th><th class="r">Monthly salary</th><th>Login</th></tr></thead><tbody>${rows}</tbody></table>`)}
// Whether the employee can log in (a user of this business linked to them, see User Management)
function loginTag(e){const m=DB.membersOf(CUR.biz.id).find(m=>m.emp===e.id&&m.status==='Active');if(m)return `<span class="tag ok">${esc(roleName(m))}</span>`;
  const i=DB.d.invites.find(i=>i.biz===CUR.biz.id&&i.emp===e.id&&i.status==='Pending');return i?`<span class="tag warn">${DB.inviteState(i)==='Expired'?'Invite expired':'Invited'}</span>`:''}
const openEmp=()=>{const e=S.emps[EH.sel];if(e)navigate('hrempform',{e:e.id})};
start({id:'hremps',title:'Employee List',view:vEmps,state:EH,activate:openEmp,
  keys:()=>[{k:'↑ ↓',l:'Move'},{k:'Enter',l:'Alter employee',a:openEmp},{k:'N',l:'New employee',a:()=>navigate('hrempform')},{gap:1},escKey()],
  key(e){if(listNav(e,EH,S.emps.length,render))return true;if(e.key==='Enter'){stop(e);openEmp();return true}return false}});
