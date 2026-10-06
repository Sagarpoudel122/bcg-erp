/* Page navigation, menu structure, Go To */
/* Moving between pages. Every screen is its own HTML file; ROUTES maps a screen id to its file. */
const ROUTES={home:'home.html',ledger:'ledger-create.html',ledgers:'ledger-list.html',group:'group-form.html',groups:'group-list.html',
  contra:'contra.html',payment:'payment.html',receipt:'receipt.html',journal:'journal.html',sales:'sales.html',purchase:'purchase.html',salesret:'sales-return.html',purchret:'purchase-return.html',item:'item-create.html',items:'item-list.html',
  tb:'trial-balance.html',bs:'balance-sheet.html',pl:'profit-loss.html',cf:'cash-flow.html',gsum:'group-summary.html',lr:'ledger-report.html',
  daybook:'day-book.html',audit:'audit-log.html',options:'options.html',
  hrhome:'hr-home.html',hremps:'hr-employees.html',hrempform:'hr-employee-form.html',hrleave:'hr-leave.html',hrleavedet:'hr-leave-detail.html',hrsal:'hr-salary.html',hrslip:'hr-payslip.html',
  hrmyatt:'hr-my-attendance.html',hrmyleave:'hr-my-leave.html',hrmypay:'hr-my-payslips.html',bthome:'bt-home.html',
  // signing in and businesses (no menu) ...
  login:'login.html',signup:'signup.html',forgot:'forgot-password.html',reset:'reset-password.html',
  selbiz:'select-business.html',bizreg:'business-register.html',
  // ... and the company screens inside the app
  setup:'business-setup.html',users:'users.html',account:'my-account.html'};
const href=(v,q)=>ROUTES[v]+(q?'?'+new URLSearchParams(q):'');
function navigate(v,q){Store.save();location.href=href(v,q)}
// Only page names of this prototype are followed after sign-in (?next=), never other addresses
const safeNext=n=>!!n&&/^[a-z0-9-]+\.html(\?[^#]*)?$/.test(n)&&Object.values(ROUTES).includes(n.split('?')[0]);
// Open a screen from the menu or a shortcut. Leaving a voucher that is being altered drops the alteration.
function go(v){
  if(TYPES[S.view]&&S.view!==v&&draft(S.view).editingId)S.drafts[S.view]=blank(S.view);
  S.rstack=[];S.rep.selNext=0;navigate(v)}
// Open a saved voucher in its entry page for alteration (from the Day Book or a report).
// Someone who may not alter vouchers (Sales/Cashier, Viewer) sees the voucher as a print preview instead.
function editVoucher(v){v=v||S.db.list[S.db.sel];if(!v)return;
  if(!can('v.alter')||!canSee(v.type)){openPrint(v.id);return}
  if(v.status==='Cancelled'){say(`${vno(v.type,v.seq,v.pre)} is cancelled and cannot be altered.`,'bad');return}
  if(v.date<=LOCK){say(`${vno(v.type,v.seq,v.pre)} is in a locked period (up to ${bsText(LOCK)}). Only the Owner can unlock it.`,'bad');return}
  const b=bs(v.date);S.drafts[v.type]=TYPES[v.type].inv?invDraftFrom(v):{type:v.type,date:{m:b.m,d:b.d},lines:clone(v.lines),narr:v.narr,billNo:v.billNo||'',editingId:v.id,mode:'double'};
  S.rstack=[];navigate(v.type)}
// Sidebar: a normal website menu. Esc from any screen puts the cursor here; arrows + Enter (or a letter) open an item.
// The product has three parts (Account, HRM, Business Tools); the menu shows the part you are in, and only what your role may open.
const MENU={
 acc:[{l:'Dashboard',go:'home'},{l:'Day Book',go:'daybook'},
  // Create and List are one entry: open the list, N creates. The Create screens stay in Go To (goto:true = not in the side menu).
  {sec:'Masters'},{l:'Groups',go:'groups'},{l:'Ledgers',go:'ledgers'},{l:'Items / Stock',go:'items'},
  {l:'Create Group',go:'group',goto:true},{l:'Create Ledger',go:'ledger',goto:true},{l:'Create Item',go:'item',goto:true},
  {sec:'Vouchers'},...Object.keys(TYPES).map(t=>({l:TYPES[t].name,go:t,kd:TYPES[t].key})),
  {sec:'Reports'},{l:'Trial Balance',go:'tb'},{l:'Balance Sheet',go:'bs'},{l:'Profit & Loss',go:'pl'},{l:'Cash Flow',go:'cf'},{l:'Ledger Report',go:'lr'},
  {l:'Audit log',go:'audit'}],
 hrm:[{sec:'Admin'},{l:'Create Employee',go:'hrempform'},{l:'Employee List',go:'hremps'},{l:'Approve Leave',go:'hrleave'},{l:'Salary Spends',go:'hrsal'},
  {sec:'Me'},{l:'Attendance',go:'hrmyatt'},{l:'Leave',go:'hrmyleave'},{l:'Salary',go:'hrmypay'}],
 tools:[{sec:'Business Tools'},{l:'Tools',go:'bthome'}]};
// Company and Prototype screens are not in the side menu: they are in the user menu of the top bar (Alt+M) and in Go To
const TAIL=[{sec:'Company'},{l:'Business Setup',go:'setup'},{l:'User Management',go:'users'},{l:'My Account',go:'account'},
  {sec:'Prototype'},{l:'Options',go:'options'}];
const GATES=Object.values(GATE);
const isGate=id=>GATES.includes(id);
// Which part a screen belongs to (company and prototype screens belong to none: they keep the part you were in)
const modOf=id=>['options','setup','users','account'].includes(id)?null:id.startsWith('hr')?'hrm':id.startsWith('bt')?'tools':'acc';
// What each screen needs (core/roles.js). 'acc' / 'hrm' = any access to that part. Screens not listed are open to everyone signed in.
const SCREEN={home:'acc',ledger:'ledger.create',ledgers:'ledger.view',group:'groups.edit',groups:'groups.view',contra:'v.contra',payment:'v.payment',receipt:'v.receipt',journal:'v.journal',sales:'v.sales',purchase:'v.purchase',salesret:'v.salesret',purchret:'v.purchret',item:'item.create',items:'item.view',
  tb:'reports',bs:'reports',pl:'reports',cf:'reports',gsum:'reports',lr:'report.ledger',daybook:'daybook',audit:'audit',
  hrhome:'hrm',hremps:'hrm.admin',hrempform:'hrm.admin',hrleave:'hrm.admin',hrleavedet:'hrm.admin',hrsal:'hrm.admin',hrslip:'hrm',
  hrmyatt:'hrm.self',hrmyleave:'hrm.self',hrmypay:'hrm.self',bthome:'tools',setup:'setup.view',users:'staff'};
const canSee=id=>{const p=SCREEN[id];if(!p)return true;return p==='acc'||p==='hrm'?myParts().includes(p):can(p)};
const tagSec=list=>{let sec='';return list.map(x=>{if(x.sec){sec=x.sec;return x}return{...x,secName:sec}})};
// Keep the items this user may open, and the headings that still have items under them
const allowed=list=>list.filter(x=>x.sec||canSee(x.go)).filter((x,i,a)=>!x.sec||(a[i+1]&&!a[i+1].sec));
let NAV=[],NAVALL=[];
function buildNav(){
  NAV=tagSec(allowed((MENU[S.mod]||[]).filter(x=>!x.goto))).map(x=>x.sec?{...x,l:x.sec}:x);rebuildNavI();
  // Go To searches every screen this user may open, in every part (also the Create screens and the Company screens)
  NAVALL=[];myParts().forEach(p=>tagSec(allowed(MENU[p])).filter(x=>!x.sec).forEach(x=>NAVALL.push({...x,part:MODNAME[p]})));
  tagSec(allowed(TAIL)).filter(x=>!x.sec).forEach(x=>NAVALL.push({...x,part:x.secName}))}
/* Sections of the side menu fold shut and open (click the heading; ← / → or Enter on it). What is folded is remembered per user (S.fold).
   A screen's own section is opened when the screen opens, so the item you are on is always in sight. */
const FOLD0=['Masters','Reports'];   // folded until the user opens them
Object.assign(S,{fold:{}});Store.ui.push('fold');
const menuOf=v=>({ledger:'ledgers',group:'groups',item:'items'})[v]||v;   // the menu item a Create screen belongs to
const secFolded=n=>!!n&&(n in S.fold?S.fold[n]:FOLD0.includes(n));
let NAVI=[];
function rebuildNavI(){NAVI=NAV.filter(x=>x.sec||!secFolded(x.secName))}   // what the keyboard can visit
function openCurSec(){const x=NAV.find(y=>y.go===menuOf(S.view));if(x&&secFolded(x.secName))S.fold[x.secName]=false;rebuildNavI()}
function toggleSec(n){S.fold[n]=!secFolded(n);rebuildNavI();drawSide();drawKeys()}
// The user menu in the top bar: the Company and Prototype screens this user may open
const userMenuItems=()=>tagSec(allowed(TAIL));
const GKEYS={F4:'contra',F5:'payment',F6:'receipt',F7:'journal',F8:'sales',F9:'purchase','Ctrl+F8':'salesret','Ctrl+F9':'purchret'};
function restoreFocus(){if(S.sb)return;const f=PAGE.focus&&PAGE.focus();if(f)focusEl(f)}
/* Go To (Alt+G): type a screen name, Enter opens it */
function openGoto(){if(P||S.ask)return;openPanel('goto',0,restoreFocus)}
PANELS.goto={view:()=>`<h2>Go To</h2><div class="f"><label for="goto">Screen</label><input id="goto" class="in" data-nav data-pick data-f="goto" data-k="screen" placeholder="Type to search" autocomplete="off"></div><p class="pfoot">Type, then Enter · Esc cancel</p>`};
PICK.goto={source:()=>NAVALL.map(x=>({v:x.go,label:x.l,sub:x.part+(x.secName&&x.secName!==x.part?' · '+x.secName:'')})),title:()=>'Go To',commit:(t,it)=>{P.then=null;closePanel();go(it.v)}};
/* Part switcher (top bar, Alt+1 / 2 / 3), change business (Alt+B), log out (Alt+Q) */
function goMod(m){if(!myParts().includes(m))return;go(GATE[m])}
const logOut=()=>ask('Log out of BCG ERP on this browser?',()=>{Store.save();Store.ready=false;DB.endSession();flash('You are logged out.');location.href=ROUTES.login});
