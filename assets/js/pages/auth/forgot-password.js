/* Forgot password. Prototype: there is no email, so a known address goes straight to choosing a new password (Reset password page). */
const FP=form({id:'fp',v:{email:LS.get('bcg.lastEmail')||''},fields:[{k:'email',l:'Email address',ph:'you@example.com',ac:'username'}],
  last:()=>nextStep(),accept:()=>nextStep()});
function nextStep(){const e=normEmail(FP.v.email);if(!isEmail(e))return fmBad(FP,'email','Enter the email address of your account.');
  if(!DB.userByEmail(e))return fmBad(FP,'email','There is no account with this email.');
  location.href=href('reset',{e})}
start({id:'forgot',bare:true,auth:true,access:'public',title:'Forgot password',focus:()=>'#fp-email',
  view:()=>authCard({title:'Forgot your password?',lead:'Enter your email to choose a new password.',body:formHtml(FP)+auBtn('Continue','Ctrl+A'),
    foot:`<a href="${href('login')}">Back to sign in</a>`}),
  keys:()=>[{k:'Enter',l:'Next'},{k:'Ctrl+A',l:'Continue',a:nextStep},escKey()],back:()=>go('login')});
