/* Create an account (open self sign-up: question B1 is still open). Name, email, password and the password again. There is no email
   verification: the account is ready at once, you are signed in and go on to register your business. Mobile can be added later in My Account. */
const SU=form({id:'su',v:{name:'',email:'',pw:'',pw2:''},accept:()=>signUp(),last:()=>signUp(),
  fields:[{k:'name',l:'Full name',ph:'Your name',ac:'name'},{k:'email',l:'Email address',ph:'you@example.com',ac:'username'},
    {k:'pw',l:'Password',type:'password',ac:'new-password',toggle:true,help:PW_HINT},
    {k:'pw2',l:'Confirm password',type:'password',ac:'new-password',toggle:true}]});
function signUp(){const v=SU.v,email=normEmail(v.email);
  if(!v.name.trim())return fmBad(SU,'name','Enter your name.');
  if(!isEmail(email))return fmBad(SU,'email','Enter a valid email address.');
  if(DB.userByEmail(email)){ask('There is already an account with this email. Go to Sign in?',()=>{LS.set('bcg.lastEmail',email);go('login')});return}
  const pp=pwProblem(v.pw);if(pp)return fmBad(SU,'pw',pp);
  if(v.pw!==v.pw2)return fmBad(SU,'pw2','The two passwords are not the same.');
  const u=DB.createUser({name:v.name,email,phone:'',pw:v.pw});DB.startSession(u.id);LS.set('bcg.lastEmail',email);
  location.href=afterSignIn(u.id,null)}   // no business yet: Business Registration (or Select Business when an invitation is waiting for this email)
start({id:'signup',bare:true,auth:true,access:'guest',title:'Create account',
  view:()=>authCard({step:1,title:'Create your account',lead:'It takes about a minute. Next you add your business.',
    body:formHtml(SU)+auBtn('Create account','Ctrl+A'),foot:`Already have an account? <a href="${href('login')}">Sign in</a>`}),
  focus:()=>'#su-name',
  keys:()=>[{k:'Enter',l:'Next field'},{k:'Backspace',l:'Previous field'},{k:'Ctrl+A',l:'Create account',a:signUp},{gap:1},escKey()],
  back:()=>go('login')});
