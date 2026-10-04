/* HRM gateway */
function vHrHome(){
  const e=meEmp();
  if(isAdmin()&&!e)return tp('Gateway of HRM',COMPANY,'<p class="tp-note">Create Employee, Approve Leave, Salary Spends. Pick one from the menu on the left. Alt+1 / 2 / 3 switch between Account, HRM and Business Tools.</p>');
  if(!e)return tp('Gateway of HRM',COMPANY,'<p class="tp-note">Your login is not linked to an employee record yet. Ask the Admin (User Management).</p>');
  const r=attOf(e.id,TODAY);
  const today=r.st==='P'?`Punched in at ${r.in}${r.out?', out at '+r.out:''}.`:r.st==='L'?'You are on leave today.':r.st==='H'?'Today is your weekly off.':'You have not punched in today.';
  return tp(`Hello, ${e.name}`,COMPANY,`<p class="tp-note">${esc(today)} Use the menu: Attendance, Leave, Salary${isAdmin()?', or the Admin screens':''}.</p>`)}
start({id:'hrhome',title:'Gateway of HRM',view:vHrHome,keys:()=>[]});
