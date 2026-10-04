/* My Account: your name, mobile and how dates are shown (BS or AD), your password, and where you are signed in. */
const ME=CUR.user;
const AC=form({id:'ac',v:{},accept:()=>saveAcc(),fields:[
  {k:'name',l:'Name'},{k:'phone',l:'Mobile',ph:'Optional'},{k:'email',l:'Email',type:'ro'},
  {k:'date',l:'Show dates in',type:'pick',title:'Date display',items:()=>[{v:'BS',label:'Bikram Sambat (BS)',sub:'15 Asoj 2083'},{v:'AD',label:'Gregorian (AD)',sub:'1 Oct 2026'}]}]});
function saveAcc(){const v=AC.v;
  if(!v.name.trim())return fmBad(AC,'name','Type your name.');
  if(v.phone.trim()&&!isPhone(v.phone))return fmBad(AC,'phone','Type the mobile number with digits only, or leave it empty.');
  Object.assign(ME,{name:v.name.trim(),phone:v.phone.trim(),date:v.date});DB.save();
  setDateMode(ME.date==='AD');USER=`${ME.name} (${roleName(CUR.member)})`;render('#ac-name');say('Saved.','ok')}
/* ---------- change password (popup) ---------- */
const PWF=form({id:'pw',v:{old:'',pw:'',pw2:''},fields:[{k:'old',l:'Current password',type:'password',ac:'current-password'},
  {k:'pw',l:'New password',type:'password',ac:'new-password',hint:'At least 8 characters, not only numbers, not like your name or email.'},{k:'pw2',l:'New password again',type:'password',ac:'new-password'}]});
function savePw(){const v=PWF.v;
  if(ME.pw!==hashPw(v.old,ME.id))return fmBad(PWF,'old','The current password is wrong.');
  const pp=pwProblem(v.pw,ME.email,ME.name);if(pp)return fmBad(PWF,'pw',pp);
  if(v.pw===v.old)return fmBad(PWF,'pw','Pick a password different from the current one.');
  if(v.pw!==v.pw2)return fmBad(PWF,'pw2','The two new passwords are not the same.');
  DB.setPassword(ME,v.pw);DB.endAll(ME.id,true);P.then=null;closePanel();say('Password changed. Your other devices are signed out.','ok')}
PANELS.pw={view:()=>`<h2>Change password</h2>${formHtml(PWF)}<p class="pfoot">Enter next · Ctrl+A save · Esc cancel</p>`,last:savePw,accept:savePw};
const changePw=()=>{PWF.v={old:'',pw:'',pw2:''};openPanel('pw',0,restoreFocus)};
const logOutAll=()=>ask('Log out on every device and browser, this one too?',()=>{Store.save();Store.ready=false;DB.endAll(ME.id);flash('You are logged out on all devices.');location.href=href('login')});
function vAcc(){const n=DB.d.sessions.filter(s=>s.user===ME.id).length,log=DB.d.logins.filter(l=>l.user===ME.id).slice(-5).reverse();
  const rows=log.map(l=>`<tr><td class="muted">${ago(l.at)}</td><td>${l.ok?'<span class="tag ok">Signed in</span>':`<span class="tag bad">Failed</span> <span class="muted">${esc(l.why)}</span>`}</td></tr>`).join('');
  return tp('My Account',roleName(CUR.member)+' · '+COMPANY,formHtml(AC)+`<h4 class="fsec">Sign-ins · signed in on ${n} device${n===1?'':'s'} now</h4>`+(rows?`<table class="mini"><tbody>${rows}</tbody></table>`:''))}
start({id:'account',title:'My Account',view:vAcc,init(){AC.v={name:ME.name,phone:ME.phone||'',email:ME.email,date:ME.date||'BS'}},focus:()=>'#ac-name',
  keys:()=>[{k:'Enter',l:'Next field'},{k:'Backspace',l:'Previous field'},{k:'Ctrl+A',l:'Accept',a:saveAcc},{gap:1},{k:'Alt+W',l:'Change password',a:changePw},{k:'Alt+O',l:'Log out all devices',a:logOutAll},{gap:1},escKey()]});
