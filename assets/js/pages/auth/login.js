/* Sign in. After signing in: one business opens straight away, several are listed (Select Business), none means registering one. */
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
start({id:'login',bare:true,access:'guest',title:'Sign in',view:()=>tp('Sign in','BCG ERP',formHtml(LG)),focus:()=>LG.v.email?'#lg-pw':'#lg-email',
  keys:()=>[{k:'Enter',l:'Next field'},{k:'Ctrl+A',l:'Sign in',a:signIn},{gap:1},{k:'Alt+N',l:'Create account',a:()=>go('signup')},{k:'Alt+F',l:'Forgot password',a:()=>go('forgot')},
    {gap:1},{k:'Alt+M',l:'Mailbox',a:()=>go('mailbox')}]});
