/* Choose a new password for the account named in the address (?e=<email>, set by Forgot password; prototype: no emailed link).
   It also lifts a lock and signs the account out everywhere. */
const RP=form({id:'rp',v:{pw:'',pw2:''},accept:()=>doReset(),last:()=>doReset(),
  fields:[{k:'pw',l:'New password',type:'password',ac:'new-password',toggle:true,help:PW_HINT},
    {k:'pw2',l:'Confirm password',type:'password',ac:'new-password',toggle:true}]});
let RT=null;
function doReset(){const v=RP.v;
  const pp=pwProblem(v.pw);if(pp)return fmBad(RP,'pw',pp);
  if(v.pw!==v.pw2)return fmBad(RP,'pw2','The two passwords are not the same.');
  DB.resetPassword(RT,v.pw);LS.set('bcg.lastEmail',RT.email);flash('Password changed. Sign in with the new password.');location.href=href('login')}
start({id:'reset',bare:true,auth:true,access:'public',title:'Reset password',
  view:()=>RT?authCard({title:'Choose a new password',lead:`For <b>${esc(RT.email)}</b>.`,body:formHtml(RP)+auBtn('Save password','Ctrl+A'),foot:`<a href="${href('login')}">Back to sign in</a>`})
    :authCard({title:'Reset password',lead:'This account was not found. Start again from Forgot password.',body:`<a class="au-btn" href="${href('forgot')}">Forgot password</a>`}),
  focus:()=>RT?'#rp-pw':null,
  init(){RT=DB.userByEmail(param('e')||'')},
  keys:()=>RT?[{k:'Enter',l:'Next field'},{k:'Ctrl+A',l:'Save password',a:doReset},escKey()]:[{k:'Alt+F',l:'Forgot password',a:()=>go('forgot')},escKey()],back:()=>go('login')});
