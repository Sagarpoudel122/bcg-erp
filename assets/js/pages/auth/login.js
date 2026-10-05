/* Sign in. After signing in: one business opens straight away, several are listed (Select Business), none means registering one. */
const LG=form({id:'lg',v:{email:LS.get('bcg.lastEmail')||'',pw:''},
  fields:[{k:'email',l:'Email address',ph:'you@example.com',ac:'username'},{k:'pw',l:'Password',type:'password',ac:'current-password',toggle:true}],
  last:()=>signIn(),accept:()=>signIn()});
function signIn(){const v=LG.v,email=normEmail(v.email);
  if(!isEmail(email))return fmBad(LG,'email','Enter the email address you signed up with.');
  if(!v.pw)return fmBad(LG,'pw','Enter your password.');
  const r=DB.login(email,v.pw);
  if(!r.ok){LG.v.pw='';render();return fmBad(LG,r.field||'pw',r.msg)}
  LS.set('bcg.lastEmail',email);location.href=afterSignIn(r.user.id,param('next'))}
start({id:'login',bare:true,auth:true,access:'guest',title:'Sign in',
  view:()=>authCard({title:'Sign in',lead:'Welcome back. Enter your email and password.',
    body:formHtml(LG)+auBtn('Sign in','Ctrl+A')+`<p class="au-row"><a href="${href('forgot')}">Forgot password?</a></p>`,
    foot:`New to BCG ERP? <a href="${href('signup')}">Create an account</a>`}),
  focus:()=>LG.v.email?'#lg-pw':'#lg-email',
  keys:()=>[{k:'Enter',l:'Next field'},{k:'Ctrl+A',l:'Sign in',a:signIn},{gap:1},{k:'Alt+N',l:'Create account',a:()=>go('signup')},{k:'Alt+F',l:'Forgot password',a:()=>go('forgot')}]});
