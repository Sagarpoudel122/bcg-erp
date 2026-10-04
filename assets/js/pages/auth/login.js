/* Sign in. After signing in: one business opens straight away, several are listed (Select Business), none means registering one.
   Prototype only: Alt+U signs in as one of the sample users (they all share the password in core/db.js). */
const LG=form({id:'lg',v:{email:LS.get('bcg.lastEmail')||'',pw:''},
  fields:[{k:'email',l:'Email',ph:'you@example.com',ac:'username'},{k:'pw',l:'Password',type:'password',ac:'current-password'}],
  last:()=>signIn(),accept:()=>signIn()});
function signIn(){const v=LG.v,email=normEmail(v.email);
  if(!isEmail(email))return fmBad(LG,'email','Type the email address you signed up with.');
  if(!v.pw)return fmBad(LG,'pw','Type your password.');
  const r=DB.login(email,v.pw);
  if(!r.ok){LG.v.pw='';render();
    if(r.unverified){ask(`${email} is not verified yet: open the link in the email we sent. Send the link again?`,()=>{DB.sendVerify(r.user);LS.set('bcg.pendingEmail',email);go('verify')});return}
    return fmBad(LG,r.field||'pw',r.msg)}
  LS.set('bcg.lastEmail',email);location.href=afterSignIn(r.user.id,param('next'))}
/* Sample users (prototype) */
function sampleSub(u){const l=DB.bizList(u.id);return l.length?l.map(x=>`${roleName(x.m)} · ${x.b.name}`).join(', '):DB.d.members.some(m=>m.user===u.id)?'Deactivated':'No business yet'}
PANELS.sample={view:()=>`<h2>Sign in as a sample user</h2><div class="f"><label for="smp">User</label><input id="smp" class="in" data-nav data-pick data-f="smp" placeholder="Type to search" autocomplete="off"></div><p class="pfoot">Prototype only · Enter signs in · Esc cancel</p>`};
PICK.smp={source:()=>DB.d.users.filter(u=>u.email.endsWith('@sample.test')).map(u=>({v:u.id,label:u.name,sub:sampleSub(u)})),title:()=>'Sample users',
  commit:(t,it)=>{P.then=null;closePanel();const u=DB.user(it.v);LG.v.email=u.email;LG.v.pw=SAMPLE_PW;signIn()}};
start({id:'login',bare:true,access:'guest',title:'Sign in',view:()=>tp('Sign in','BCG ERP',formHtml(LG)),focus:()=>LG.v.email?'#lg-pw':'#lg-email',
  keys:()=>[{k:'Enter',l:'Next field'},{k:'Ctrl+A',l:'Sign in',a:signIn},{gap:1},{k:'Alt+N',l:'Create account',a:()=>go('signup')},{k:'Alt+F',l:'Forgot password',a:()=>go('forgot')},
    {gap:1},{k:'Alt+U',l:'Sample user',a:()=>openPanel('sample',0,restoreFocus)},{k:'Alt+M',l:'Mailbox',a:()=>go('mailbox')}]});
