/* The prototype's "server", kept in the browser: localStorage is the database (key bcg.db).
   Tables: users, businesses, members (who works in which business, with which role), invites, tokens (one-time links:
   verify email, reset password), mails (every email the app sends; read them on the Mailbox page), sessions, logins.
   Each business's own data (ledgers, vouchers, HRM) is kept apart under bcg.biz.<id> by core/store.js.
   Prototype only: the real app does all of this in Django (JWT sign-in, PBKDF2 password hashes, emails through Amazon SES). */

/* ---------- storage ---------- */
const LS={
  get(k){try{const r=localStorage.getItem(k);if(r!==null)return JSON.parse(r)}catch(e){}const m=LS.wn();return k in m?m[k]:null},
  set(k,v){try{localStorage.setItem(k,JSON.stringify(v));return}catch(e){}const m=LS.wn();m[k]=v;LS.wnSave(m)},
  del(k){try{localStorage.removeItem(k)}catch(e){}const m=LS.wn();if(k in m){delete m[k];LS.wnSave(m)}},
  keys(){const out=[];try{for(let i=0;i<localStorage.length;i++)out.push(localStorage.key(i))}catch(e){}return out.concat(Object.keys(LS.wn()))},
  // Fallback when the browser blocks localStorage for files opened from disk: the tab's window.name carries the data between pages
  wn(){try{if(window.name.indexOf('bcg2:')===0)return JSON.parse(window.name.slice(5))}catch(e){}return{}},
  wnSave(m){try{window.name='bcg2:'+JSON.stringify(m)}catch(e){}}};
// A message for the next page, for example "Email verified" on the sign-in page
const flash=(text,kind='ok')=>LS.set('bcg.flash',{text,kind});
function takeFlash(){const f=LS.get('bcg.flash');if(f)LS.del('bcg.flash');return f}

/* ---------- small helpers ---------- */
const SAMPLE_PW='Sample@123';   // the password of every sample user (see README)
const DAY=864e5,now=()=>Date.now();
const normEmail=e=>String(e||'').trim().toLowerCase();
const isEmail=e=>/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(e||'').trim());
const isPhone=p=>/^[0-9+\-\s()]{6,20}$/.test(String(p||'').trim());
// Not secure, only so passwords are not stored as typed (cyrb53 with the user id as salt)
function hashPw(pw,salt){let h1=0xdeadbeef,h2=0x41c6ce57;const s=salt+':'+pw;
  for(let i=0;i<s.length;i++){const c=s.charCodeAt(i);h1=Math.imul(h1^c,2654435761);h2=Math.imul(h2^c,1597334677)}
  h1=Math.imul(h1^(h1>>>16),2246822507)^Math.imul(h2^(h2>>>13),3266489909);h2=Math.imul(h2^(h2>>>16),2246822507)^Math.imul(h1^(h1>>>13),3266489909);
  return(4294967296*(2097151&h2)+(h1>>>0)).toString(36)}
function newToken(){const a=new Uint8Array(16);try{crypto.getRandomValues(a)}catch(e){for(let i=0;i<16;i++)a[i]=Math.random()*256|0}return[...a].map(x=>x.toString(16).padStart(2,'0')).join('')}
function ago(t){const s=Math.round((now()-t)/1000);if(s<60)return'just now';const m=Math.round(s/60);if(m<60)return`${m} min ago`;
  const h=Math.round(m/60);if(h<24)return`${h} hour${h>1?'s':''} ago`;const d=Math.round(h/24);return`${d} day${d>1?'s':''} ago`}
function leftText(t){const ms=t-now();if(ms<=0)return'';const h=Math.ceil(ms/36e5);return h<48?`${h} hour${h>1?'s':''}`:`${Math.ceil(ms/DAY)} days`}
// Password rules (as Django's validators): at least 8 characters, not only digits, not a common password, not like the name or email
const COMMON_PW=['password','password1','password123','12345678','123456789','1234567890','qwerty123','qwertyuiop','iloveyou','admin123','welcome1','welcome123','nepal123','kathmandu','abc12345','11111111','00000000','letmein1'];
// Django's UserAttributeSimilarityValidator: the password is compared with the whole name / email and with each word of it;
// it is too similar when difflib's quick_ratio is 0.7 or more. A short word against a much longer password is skipped.
function quickRatio(a,b){const n={};for(const c of b)n[c]=(n[c]||0)+1;let m=0;for(const c of a)if(n[c]>0){n[c]--;m++}return a.length+b.length?2*m/(a.length+b.length):1}
function similarPart(pw,attrs){const p=String(pw).toLowerCase();
  for(const[what,v]of attrs){const low=String(v||'').toLowerCase().trim();if(!low)continue;
    for(const part of [...low.split(/\W+/),low]){if(!part)continue;
      if(p.length>=10*part.length&&part.length<0.35*p.length)continue;
      if(quickRatio(p,part)>=0.7)return{what,part}}}
  return null}
function pwProblem(pw,email,name){pw=String(pw||'');
  if(pw.length<8)return'The password needs at least 8 characters.';
  if(/^\d+$/.test(pw))return'The password cannot be only numbers.';
  if(COMMON_PW.includes(pw.toLowerCase()))return'This password is too common. Pick another one.';
  const like=similarPart(pw,[['name',name],['email',email]]);
  if(like)return`The password is too much like your ${like.what} ("${like.part}"). Pick one that cannot be guessed from it.`;
  return''}

/* ---------- the database ---------- */
const DB={
  KEY:'bcg.db',d:null,
  load(){let d=LS.get(this.KEY);if(!d||d.v!==2)d=seedDB();this.d=d;this.purge();this.save()},
  save(){LS.set(this.KEY,this.d)},
  nid(p){return p+(++this.d.seq)},
  user:id=>DB.d.users.find(u=>u.id===id)||null,
  userByEmail:e=>DB.d.users.find(u=>u.email===normEmail(e))||null,
  biz:id=>DB.d.businesses.find(b=>b.id===id)||null,
  member:(uid,bid)=>DB.d.members.find(m=>m.user===uid&&m.biz===bid)||null,
  membersOf:bid=>DB.d.members.filter(m=>m.biz===bid),
  owner(bid){const m=DB.d.members.find(m=>m.biz===bid&&m.owner&&m.status==='Active');return m?DB.user(m.user):null},
  // The businesses a user can open: an active membership in a business that is not deleted
  bizList:uid=>DB.d.members.filter(m=>m.user===uid&&m.status==='Active').map(m=>({m,b:DB.biz(m.biz)})).filter(x=>x.b&&!x.b.deleted),
  // Deleted businesses this user owns, still inside the 30 days they can be restored
  deletedList:uid=>DB.d.members.filter(m=>m.user===uid&&m.owner).map(m=>({m,b:DB.biz(m.biz)})).filter(x=>x.b&&x.b.deleted),

  /* emails: kept in the Mailbox page instead of being sent */
  mail(to,subject,body,link){this.d.mails.push({id:this.nid('mail'),to:normEmail(to),subject,body,link:link||null,at:now(),read:false})},

  /* accounts */
  createUser({name,email,phone,pw,verified}){const id=this.nid('u');
    const u={id,name:name.trim(),email:normEmail(email),phone:String(phone||'').trim(),pw:hashPw(pw,id),verified:!!verified,created:now(),failed:0,lockUntil:0,date:'BS'};
    this.d.users.push(u);this.save();return u},
  oneTime(kind,uid,ms){const t={token:newToken(),kind,user:uid,expires:now()+ms,used:false};this.d.tokens.push(t);return t.token},
  // The link of a token if it can still be used, otherwise why not
  token(t,kind){const r=this.d.tokens.find(x=>x.token===t&&x.kind===kind);
    if(!r)return{why:'This link is not valid. Check that you opened the whole link from the email.'};
    if(r.used)return{why:'This link was already used.',r};
    if(r.expires<now())return{why:'This link has expired.',r};return{r}},
  sendVerify(u){const t=this.oneTime('verify',u.id,DAY);
    this.mail(u.email,'Verify your email for BCG ERP',[`Hi ${u.name},`,'Confirm that this is your email address to finish creating your BCG ERP account. The link works for 24 hours.'],{label:'Verify email',href:`verify-email.html?t=${t}`});this.save()},
  verifyEmail(t){const x=this.token(t,'verify');if(!x.r||x.why)return x;x.r.used=true;const u=this.user(x.r.user);if(u)u.verified=true;this.save();return{user:u}},
  // Sign in. Five wrong passwords in a row lock the account for 15 minutes.
  login(email,pw){const u=this.userByEmail(email),log=(ok,why)=>{this.d.logins.push({user:u?u.id:'',email:normEmail(email),at:now(),ok,why});this.d.logins=this.d.logins.slice(-300)};
    const fail=(msg,o={})=>{log(false,o.why||msg);this.save();return Object.assign({ok:false,msg},o)};
    if(!u)return fail('The email or password is wrong.',{field:'pw',why:'Unknown email'});
    if(u.lockUntil>now())return fail(`Too many wrong passwords. Try again in ${Math.ceil((u.lockUntil-now())/6e4)} min, or reset the password (Alt+F).`,{why:'Locked'});
    if(u.pw!==hashPw(pw,u.id)){u.failed=(u.failed||0)+1;
      if(u.failed>=5){u.failed=0;u.lockUntil=now()+15*6e4;return fail('Five wrong passwords: the account is locked for 15 minutes. You can reset the password (Alt+F).',{why:'Wrong password, locked'})}
      return fail(`The email or password is wrong. ${5-u.failed} more ${5-u.failed===1?'try':'tries'} before a 15-minute lock.`,{field:'pw',why:'Wrong password'})}
    if(!u.verified)return fail('Verify your email first.',{unverified:true,user:u,why:'Email not verified'});
    u.failed=0;u.lockUntil=0;log(true,'');this.startSession(u.id);return{ok:true,user:u}},
  requestReset(email){const u=this.userByEmail(email);if(!u)return;const t=this.oneTime('reset',u.id,36e5);
    this.mail(u.email,'Reset your BCG ERP password',[`Hi ${u.name},`,'Someone asked to reset the password of your BCG ERP account. The link works for 1 hour. If it was not you, ignore this email: your password stays the same.'],{label:'Reset password',href:`reset-password.html?t=${t}`});this.save()},
  setPassword(u,pw){u.pw=hashPw(pw,u.id);u.failed=0;u.lockUntil=0;
    this.mail(u.email,'Your BCG ERP password was changed',[`Hi ${u.name},`,'The password of your BCG ERP account was just changed and you were signed out on your other devices. If it was not you, reset the password now and tell your Owner.'])},
  resetPassword(t,pw){const x=this.token(t,'reset');if(!x.r||x.why)return x;x.r.used=true;const u=this.user(x.r.user);
    this.setPassword(u,pw);u.verified=true;this.d.sessions=this.d.sessions.filter(s=>s.user!==u.id);this.save();return{user:u}},

  /* sessions: one per browser sign-in; the token is kept in localStorage (bcg.session). They end after 7 days without use. */
  startSession(uid,biz){const s={token:newToken(),user:uid,biz:biz||'',at:now(),seen:now(),agent:navigator.userAgent.includes('Edg')?'Edge':navigator.userAgent.includes('Firefox')?'Firefox':navigator.userAgent.includes('Chrome')?'Chrome':'Browser'};
    this.d.sessions.push(s);LS.set('bcg.session',s.token);this.save();return s},
  session(){const t=LS.get('bcg.session');if(!t)return null;const s=this.d.sessions.find(x=>x.token===t);
    if(!s||!this.user(s.user)){LS.del('bcg.session');return null}
    if(now()-s.seen>7*DAY){this.d.sessions=this.d.sessions.filter(x=>x!==s);LS.del('bcg.session');this.save();return null}
    s.seen=now();return s},
  endSession(){const t=LS.get('bcg.session');this.d.sessions=this.d.sessions.filter(x=>x.token!==t);LS.del('bcg.session');this.save()},
  endAll(uid,keepCurrent){const t=LS.get('bcg.session');this.d.sessions=this.d.sessions.filter(x=>x.user!==uid||(keepCurrent&&x.token===t));if(!keepCurrent)LS.del('bcg.session');this.save()},
  useBiz(bid){const s=this.session();if(s){s.biz=bid||'';this.save()}},

  /* businesses */
  createBusiness(uid,f){const id=this.nid('b');
    const b={id,name:f.name.trim(),type:f.type||'',address:f.address.trim(),phone:f.phone.trim(),email:normEmail(f.email),pan:f.pan||'',vat:!!f.vat,vatRate:'13',
      books:f.books,logo:'',printLogo:true,c1:'',c2:'',prefix:{contra:'CTR',payment:'PMT',receipt:'RCT',journal:'JRN'},lockTo:null,created:now(),deleted:0};
    this.d.businesses.push(b);this.d.members.push({id:this.nid('m'),biz:id,user:uid,role:'admin',owner:true,emp:'',status:'Active',since:now()});this.save();return b},

  /* invitations: an email link, valid 7 days */
  inviteState(i){return i.status==='Pending'&&i.expires<now()?'Expired':i.status},
  invite({biz,email,name,role,emp,by}){const b=this.biz(biz),from=this.user(by);
    const i={id:this.nid('inv'),token:newToken(),biz,email:normEmail(email),name:(name||'').trim(),role,emp:emp||'',by,sent:now(),expires:now()+7*DAY,status:'Pending'};
    this.d.invites.push(i);this.inviteMail(i,b,from);this.save();return i},
  inviteMail(i,b,from){this.mail(i.email,`${from?from.name:'Someone'} invited you to ${b.name} on BCG ERP`,
    [`Hi${i.name?' '+i.name:''},`,`${from?from.name:'Someone'} invited you to join ${b.name} on BCG ERP as ${ROLES[i.role]}.`,'The invitation is valid for 7 days.'],{label:'Accept invitation',href:`accept-invite.html?t=${i.token}`})},
  resendInvite(i){i.token=newToken();i.sent=now();i.expires=now()+7*DAY;i.status='Pending';this.inviteMail(i,this.biz(i.biz),this.user(CUR.user?CUR.user.id:i.by));this.save()},
  // Why an email cannot be invited to a business ('' when it can)
  inviteProblem(bid,email){email=normEmail(email);if(!isEmail(email))return'Type a valid email address.';
    const u=this.userByEmail(email),m=u&&this.member(u.id,bid);
    if(m&&m.status==='Active')return`${u.name} is already a user of this business.`;
    if(m)return`${u.name} was deactivated. Select them in User Management and press R to reactivate.`;
    if(this.d.invites.some(i=>i.biz===bid&&i.email===email&&i.status==='Pending'))return'This email already has an invitation. Send it again from User Management (R).';
    return''},
  invitesFor:email=>DB.d.invites.filter(i=>i.email===normEmail(email)&&DB.inviteState(i)==='Pending'&&DB.biz(i.biz)&&!DB.biz(i.biz).deleted),
  acceptInvite(i,uid){let m=this.member(uid,i.biz);
    if(m)Object.assign(m,{role:i.role,emp:i.emp,status:'Active',since:now()});
    else{m={id:this.nid('m'),biz:i.biz,user:uid,role:i.role,owner:false,emp:i.emp,status:'Active',since:now()};this.d.members.push(m)}
    i.status='Accepted';i.accepted=now();this.save();bizAudit(i.biz,this.user(uid),'Joined',`Accepted the invitation as ${ROLES[i.role]}`);return m},

  // Deleted businesses are kept 30 days, then removed with all their data. Old one-time links are dropped.
  purge(){const gone=this.d.businesses.filter(b=>b.deleted&&now()-b.deleted>30*DAY).map(b=>b.id);
    if(gone.length){this.d.businesses=this.d.businesses.filter(b=>!gone.includes(b.id));this.d.members=this.d.members.filter(m=>!gone.includes(m.biz));
      this.d.invites=this.d.invites.filter(i=>!gone.includes(i.biz));LS.keys().filter(k=>gone.some(id=>k==='bcg.biz.'+id||k.startsWith(`bcg.ui.${id}.`))).forEach(k=>LS.del(k))}
    this.d.tokens=this.d.tokens.filter(t=>now()-t.expires<30*DAY)}
};
// Write an entry into a business's audit log from a page that does not have the business open (for example accepting an invitation)
function bizAudit(bid,u,action,detail){const k='bcg.biz.'+bid,b=LS.get(k);if(!b)return;
  (b.audit=b.audit||[]).push({time:new Date().toLocaleTimeString([],{hour:'2-digit',minute:'2-digit',second:'2-digit'}),user:u?u.name:'',action,no:'',detail});LS.set(k,b)}
// Alt+R on the Options page: everything back to the sample data, signed out
function resetAll(){if(typeof Store!=='undefined')Store.ready=false;
  LS.keys().filter(k=>k.startsWith('bcg.')||k==='bcg-erp-prototype-v1').forEach(k=>LS.del(k));try{window.name=''}catch(e){}
  location.href='login.html'}

/* ---------- sample data, made the first time ---------- */
function seedDB(){
  const t=now(),d={v:2,seq:100,users:[],businesses:[],members:[],invites:[],tokens:[],mails:[],sessions:[],logins:[]};
  const U=(id,name,email,phone)=>d.users.push({id,name,email,phone,pw:hashPw(SAMPLE_PW,id),verified:true,created:t-60*DAY,failed:0,lockUntil:0,date:'BS'});
  U('u1','Sita Sharma','sita@sample.test','9851000001');U('u2','Hari Bhandari','hari@sample.test','9851000002');U('u3','Gita Shrestha','gita@sample.test','9851000003');
  U('u4','Ramesh Karki','ramesh@sample.test','9841000001');U('u5','Sunita Thapa','sunita@sample.test','9841000002');U('u6','Mohan Joshi','mohan@sample.test','9851000006');
  U('u7','Kiran Basnet','kiran@sample.test','9851000007');
  const B=(o)=>d.businesses.push(Object.assign({type:'Trading',email:'',pan:'',vat:false,vatRate:'13',books:'2083-04-01',logo:'',printLogo:true,c1:'',c2:'',
    prefix:{contra:'CTR',payment:'PMT',receipt:'RCT',journal:'JRN'},lockTo:null,created:t-60*DAY,deleted:0},o));
  // b1 keeps the sample ledgers, vouchers and employees the prototype always had; b2 starts empty
  B({id:'b1',sample:true,name:'Sample Traders Pvt. Ltd.',address:'Putalisadak, Kathmandu',phone:'01-4412345',email:'info@sample.test',pan:'600000000',vat:true,c1:'#0B5E57',c2:'#FFD966',lockTo:serial(0,31)});
  B({id:'b2',name:'Himal Hardware Suppliers',address:'Mahendrapul, Pokhara',phone:'061-520000',created:t-20*DAY});
  const M=(biz,user,role,o)=>d.members.push(Object.assign({id:'m'+(++d.seq),biz,user,role,owner:false,emp:'',status:'Active',since:t-50*DAY},o));
  M('b1','u1','admin',{owner:true});M('b1','u2','accountant');M('b1','u3','manager');M('b1','u4','sales',{emp:'e1'});M('b1','u5','employee',{emp:'e2'});
  M('b1','u6','viewer');M('b1','u7','sales',{status:'Inactive'});
  M('b2','u2','admin',{owner:true,since:t-20*DAY});M('b2','u1','accountant',{since:t-20*DAY});
  const I=(email,name,role,emp,daysAgo)=>{const i={id:'inv'+(++d.seq),token:newToken(),biz:'b1',email,name,role,emp,by:'u1',sent:t-daysAgo*DAY,expires:t+(7-daysAgo)*DAY,status:'Pending'};d.invites.push(i);
    d.mails.push({id:'mail'+(++d.seq),to:email,subject:'Sita Sharma invited you to Sample Traders Pvt. Ltd. on BCG ERP',
      body:[`Hi ${name},`,`Sita Sharma invited you to join Sample Traders Pvt. Ltd. on BCG ERP as ${({accountant:'Accountant',employee:'Employee'})[role]}.`,'The invitation is valid for 7 days.'],
      link:{label:'Accept invitation',href:`accept-invite.html?t=${i.token}`},at:i.sent,read:false})};
  I('bikash@sample.test','Bikash Gurung','employee','e3',9);   // expired: R on User Management sends it again
  I('anita@sample.test','Anita Rai','accountant','e4',2);       // waiting: open it from the Mailbox
  // Data saved by the earlier one-business prototype becomes Sample Traders' data
  const old=LS.get('bcg-erp-prototype-v1');if(old&&!LS.get('bcg.biz.b1'))LS.set('bcg.biz.b1',old);
  return d}

DB.load();
// Who is signed in on this browser and which business is open. Fixed for the life of a page (every screen is its own page).
// lost: the business the session points at but this user can no longer open (deactivated, or the business was deleted).
const CUR=(()=>{const s=DB.session();if(!s)return{};DB.save();const user=DB.user(s.user);
  const b=s.biz?DB.biz(s.biz):null,m=b?DB.member(user.id,b.id):null,ok=!!(b&&!b.deleted&&m&&m.status==='Active');
  return{session:s,user,biz:ok?b:null,member:ok?m:null,lost:s.biz&&!ok?(b?b.name:'that business'):''}})();
