/* The prototype's "server", kept in the browser: localStorage is the database (key bcg.db).
   Tables: users, businesses, members (who works in which business, with which role), invites, sessions, logins.
   There are no emails in this prototype: no email verification, no reset links, no invitation emails (an invited person signs in
   with the invited address and accepts the invitation on Select Business).
   Each business's own data (ledgers, vouchers, HRM) is kept apart under bcg.biz.<id> by core/store.js.
   Prototype only: the real app does all of this in Django (JWT sign-in, PBKDF2 password hashes). */

/* ---------- storage ---------- */
const LS={
  get(k){try{const r=localStorage.getItem(k);if(r!==null)return JSON.parse(r)}catch(e){}const m=LS.wn();return k in m?m[k]:null},
  set(k,v){try{localStorage.setItem(k,JSON.stringify(v));return}catch(e){}const m=LS.wn();m[k]=v;LS.wnSave(m)},
  del(k){try{localStorage.removeItem(k)}catch(e){}const m=LS.wn();if(k in m){delete m[k];LS.wnSave(m)}},
  keys(){const out=[];try{for(let i=0;i<localStorage.length;i++)out.push(localStorage.key(i))}catch(e){}return out.concat(Object.keys(LS.wn()))},
  // Fallback when the browser blocks localStorage for files opened from disk: the tab's window.name carries the data between pages
  wn(){try{if(window.name.indexOf('bcg2:')===0)return JSON.parse(window.name.slice(5))}catch(e){}return{}},
  wnSave(m){try{window.name='bcg2:'+JSON.stringify(m)}catch(e){}}};
// A message for the next page, for example "Password changed" on the sign-in page
const flash=(text,kind='ok')=>LS.set('bcg.flash',{text,kind});
function takeFlash(){const f=LS.get('bcg.flash');if(f)LS.del('bcg.flash');return f}

/* ---------- small helpers ---------- */
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
// Password rule: at least 8 characters, nothing else
const PW_HINT='At least 8 characters.';
const pwProblem=pw=>String(pw||'').length<8?'The password needs at least 8 characters.':'';

/* ---------- the database ---------- */
const DB={
  KEY:'bcg.db',d:null,
  load(){let d=LS.get(this.KEY);if(!d||(d.v!==2&&d.v!==DB_VERSION))d=emptyDB();else if(d.v===2)d=dropSamples(d);delete d.mails;delete d.tokens;this.d=d;this.purge();this.save()},
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

  /* accounts */
  createUser({name,email,phone,pw}){const id=this.nid('u');
    const u={id,name:name.trim(),email:normEmail(email),phone:String(phone||'').trim(),pw:hashPw(pw,id),created:now(),failed:0,lockUntil:0,date:'BS'};
    this.d.users.push(u);this.save();return u},
  // Sign in. Five wrong passwords in a row lock the account for 15 minutes.
  login(email,pw){const u=this.userByEmail(email),log=(ok,why)=>{this.d.logins.push({user:u?u.id:'',email:normEmail(email),at:now(),ok,why});this.d.logins=this.d.logins.slice(-300)};
    const fail=(msg,o={})=>{log(false,o.why||msg);this.save();return Object.assign({ok:false,msg},o)};
    if(!u)return fail('The email or password is wrong.',{field:'pw',why:'Unknown email'});
    if(u.lockUntil>now())return fail(`Too many wrong passwords. Try again in ${Math.ceil((u.lockUntil-now())/6e4)} min, or reset the password (Alt+F).`,{why:'Locked'});
    if(u.pw!==hashPw(pw,u.id)){u.failed=(u.failed||0)+1;
      if(u.failed>=5){u.failed=0;u.lockUntil=now()+15*6e4;return fail('Five wrong passwords: the account is locked for 15 minutes. You can reset the password (Alt+F).',{why:'Wrong password, locked'})}
      return fail(`The email or password is wrong. ${5-u.failed} more ${5-u.failed===1?'try':'tries'} before a 15-minute lock.`,{field:'pw',why:'Wrong password'})}
    u.failed=0;u.lockUntil=0;log(true,'');this.startSession(u.id);return{ok:true,user:u}},
  setPassword(u,pw){u.pw=hashPw(pw,u.id);u.failed=0;u.lockUntil=0},
  // Forgot password (prototype: no email, the page goes straight to choosing a new one). Lifts a lock and signs the account out everywhere.
  resetPassword(u,pw){this.setPassword(u,pw);this.d.sessions=this.d.sessions.filter(s=>s.user!==u.id);this.save()},

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

  /* invitations: valid 7 days; the invited address sees them on Select Business after signing in */
  inviteState(i){return i.status==='Pending'&&i.expires<now()?'Expired':i.status},
  invite({biz,email,name,role,emp,by}){
    const i={id:this.nid('inv'),biz,email:normEmail(email),name:(name||'').trim(),role,emp:emp||'',by,sent:now(),expires:now()+7*DAY,status:'Pending'};
    this.d.invites.push(i);this.save();return i},
  resendInvite(i){i.sent=now();i.expires=now()+7*DAY;i.status='Pending';this.save()},
  // Why an email cannot be invited to a business ('' when it can)
  inviteProblem(bid,email){email=normEmail(email);if(!isEmail(email))return'Type a valid email address.';
    const u=this.userByEmail(email),m=u&&this.member(u.id,bid);
    if(m&&m.status==='Active')return`${u.name} is already a user of this business.`;
    if(m)return`${u.name} was deactivated. Select them in User Management and press R to reactivate.`;
    if(this.d.invites.some(i=>i.biz===bid&&i.email===email&&i.status==='Pending'))return'This email already has an invitation. Renew it from User Management (R).';
    return''},
  invitesFor:email=>DB.d.invites.filter(i=>i.email===normEmail(email)&&DB.inviteState(i)==='Pending'&&DB.biz(i.biz)&&!DB.biz(i.biz).deleted),
  acceptInvite(i,uid){let m=this.member(uid,i.biz);
    if(m)Object.assign(m,{role:i.role,emp:i.emp,status:'Active',since:now()});
    else{m={id:this.nid('m'),biz:i.biz,user:uid,role:i.role,owner:false,emp:i.emp,status:'Active',since:now()};this.d.members.push(m)}
    i.status='Accepted';i.accepted=now();this.save();bizAudit(i.biz,this.user(uid),'Joined',`Accepted the invitation as ${ROLES[i.role]}`);return m},

  // Deleted businesses are kept 30 days, then removed with all their data.
  purge(){const gone=this.d.businesses.filter(b=>b.deleted&&now()-b.deleted>30*DAY).map(b=>b.id);
    if(gone.length){this.d.businesses=this.d.businesses.filter(b=>!gone.includes(b.id));this.d.members=this.d.members.filter(m=>!gone.includes(m.biz));
      this.d.invites=this.d.invites.filter(i=>!gone.includes(i.biz));LS.keys().filter(k=>gone.some(id=>k==='bcg.biz.'+id||k.startsWith(`bcg.ui.${id}.`))).forEach(k=>LS.del(k))}}
};
// Write an entry into a business's audit log from a page that does not have the business open (for example accepting an invitation)
function bizAudit(bid,u,action,detail){const k='bcg.biz.'+bid,b=LS.get(k);if(!b)return;
  (b.audit=b.audit||[]).push({time:new Date().toLocaleTimeString([],{hour:'2-digit',minute:'2-digit',second:'2-digit'}),user:u?u.name:'',action,no:'',detail});LS.set(k,b)}
// Alt+R on the Options page: everything erased (no users, no businesses), signed out
function resetAll(){if(typeof Store!=='undefined')Store.ready=false;
  LS.keys().filter(k=>k.startsWith('bcg.')||k==='bcg-erp-prototype-v1').forEach(k=>LS.del(k));try{window.name=''}catch(e){}
  location.href='login.html'}

/* ---------- the first time: nothing in it ---------- */
// No users or businesses. The first person creates an account (Create account), then registers a business.
const DB_VERSION=3;
const emptyDB=()=>({v:DB_VERSION,seq:100,users:[],businesses:[],members:[],invites:[],sessions:[],logins:[]});
// A browser that still holds the earlier sample data (version 2: the @sample.test users and the businesses b1 and b2) loses only those
// records. Accounts and businesses made by hand stay.
function dropSamples(d){
  const us=new Set(d.users.filter(u=>u.email.endsWith('@sample.test')).map(u=>u.id)),bs=new Set(['b1','b2']);
  d.users=d.users.filter(u=>!us.has(u.id));d.businesses=d.businesses.filter(b=>!bs.has(b.id));
  d.members=d.members.filter(m=>!us.has(m.user)&&!bs.has(m.biz));
  d.invites=d.invites.filter(i=>!bs.has(i.biz)&&!i.email.endsWith('@sample.test'));
  d.sessions=d.sessions.filter(s=>!us.has(s.user));d.logins=d.logins.filter(l=>!us.has(l.user));
  LS.keys().filter(k=>[...bs].some(id=>k==='bcg.biz.'+id||k.startsWith(`bcg.ui.${id}.`))).forEach(k=>LS.del(k));
  LS.del('bcg-erp-prototype-v1');d.v=DB_VERSION;return d}

DB.load();
// Who is signed in on this browser and which business is open. Fixed for the life of a page (every screen is its own page).
// lost: the business the session points at but this user can no longer open (deactivated, or the business was deleted).
const CUR=(()=>{const s=DB.session();if(!s)return{};DB.save();const user=DB.user(s.user);
  const b=s.biz?DB.biz(s.biz):null,m=b?DB.member(user.id,b.id):null,ok=!!(b&&!b.deleted&&m&&m.status==='Active');
  return{session:s,user,biz:ok?b:null,member:ok?m:null,lost:s.biz&&!ok?(b?b.name:'that business'):''}})();
