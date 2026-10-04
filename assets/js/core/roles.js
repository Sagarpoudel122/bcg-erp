/* Roles and what each one may do. The matrix is the default agreed in docs/proposed-answers.md (S5);
   the HRM rows and the Employee role (HRM self-service only) are prototype defaults, not decided yet.
   One Admin in each business is the Owner: only the Owner locks books, deletes the business or hands ownership on. */
const ROLES={admin:'Admin',accountant:'Accountant',manager:'Manager',sales:'Sales/Cashier',viewer:'Viewer',employee:'Employee'};
const ROLE_SUB={admin:'Everything, including users and setup',accountant:'Ledgers, all vouchers, cancel, reports',
  manager:'Ledgers, vouchers, reports, HRM, Business Tools',sales:'Contra, Payment, Receipt; own vouchers only',
  viewer:'Reports and lists, no changes',employee:'HRM only: own attendance, leave, salary'};
const ROLE_ORDER=Object.keys(ROLES);
// action -> roles that may do it
const PERM={
  'groups.view':'admin accountant manager viewer','groups.edit':'admin accountant',
  'ledger.view':'admin accountant manager sales viewer','ledger.create':'admin accountant manager','ledger.delete':'admin accountant',
  'v.contra':'admin accountant manager sales','v.payment':'admin accountant manager sales','v.receipt':'admin accountant manager sales',
  'v.journal':'admin accountant manager','v.alter':'admin accountant manager','v.cancel':'admin accountant',
  'reports':'admin accountant manager viewer','report.ledger':'admin accountant manager sales viewer','daybook':'admin accountant manager sales viewer',
  'audit':'admin','hrm.admin':'admin manager','tools':'admin manager sales',
  'setup.view':'admin accountant manager viewer','setup.edit':'admin','staff':'admin'};
const roleName=m=>!m?'':m.owner?'Owner':ROLES[m.role]||m.role;
// 'owner' = is the Owner; 'hrm.self' = is linked to an employee record (own attendance, leave, salary)
function canFor(m,a){if(!m)return false;if(a==='owner')return !!m.owner;if(a==='hrm.self')return !!m.emp;const r=PERM[a];return !!r&&r.split(' ').includes(m.role)}
const can=a=>canFor(CUR.member,a);
// The parts of the product a member can open (top bar, Alt+1 / 2 / 3) and the first screen they land on
const partsFor=m=>['acc','hrm','tools'].filter(p=>p==='acc'?!!m&&m.role!=='employee':p==='hrm'?canFor(m,'hrm.admin')||canFor(m,'hrm.self'):canFor(m,'tools'));
const myParts=()=>partsFor(CUR.member);
const landingFor=m=>({acc:'home',hrm:'hrhome',tools:'bthome'})[partsFor(m)[0]]||'account';
const ownOnly=()=>!!CUR.member&&CUR.member.role==='sales';   // Sales/Cashier sees only their own vouchers in the Day Book
