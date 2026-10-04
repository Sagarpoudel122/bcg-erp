/* Create an account (open self sign-up: question B1 is still open). The email must be verified before signing in. */
const PW_HINT='At least 8 characters, not only numbers, not like your name or email.';
const SU=form({id:'su',v:{name:'',email:'',phone:'',pw:'',pw2:''},accept:()=>signUp(),
  fields:[{k:'name',l:'Full name',ph:'Your own name; the business comes next'},{k:'email',l:'Email',ph:'you@example.com',ac:'username'},{k:'phone',l:'Mobile',ph:'Optional'},
    {k:'pw',l:'Password',type:'password',ac:'new-password',hint:PW_HINT},{k:'pw2',l:'Password again',type:'password',ac:'new-password'}]});
function signUp(){const v=SU.v,email=normEmail(v.email);
  if(!v.name.trim())return fmBad(SU,'name','Type your name.');
  if(!isEmail(email))return fmBad(SU,'email','Type a valid email address.');
  const ex=DB.userByEmail(email);
  if(ex&&!ex.verified){ask('This email is signed up but not verified yet. Send the verification link again?',()=>{DB.sendVerify(ex);LS.set('bcg.pendingEmail',email);go('verify')});return}
  if(ex){ask('There is already an account with this email. Go to Sign in?',()=>{LS.set('bcg.lastEmail',email);go('login')});return}
  if(v.phone.trim()&&!isPhone(v.phone))return fmBad(SU,'phone','Type the mobile number with digits only, or leave it empty.');
  const pp=pwProblem(v.pw,email,v.name);if(pp)return fmBad(SU,'pw',pp);
  if(v.pw!==v.pw2)return fmBad(SU,'pw2','The two passwords are not the same.');
  const u=DB.createUser({name:v.name,email,phone:v.phone,pw:v.pw});DB.sendVerify(u);LS.set('bcg.pendingEmail',email);go('verify')}
start({id:'signup',bare:true,access:'guest',title:'Create account',view:()=>tp('Create your account','BCG ERP',formHtml(SU)),focus:()=>'#su-name',
  keys:()=>[{k:'Enter',l:'Next field'},{k:'Backspace',l:'Previous field'},{k:'Ctrl+A',l:'Create account',a:signUp},{gap:1},{k:'Alt+M',l:'Mailbox',a:()=>go('mailbox')},escKey()],
  back:()=>go('login')});
