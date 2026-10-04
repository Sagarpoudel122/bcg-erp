/* Choose a new password from the emailed link (?t=<token>). It also lifts a lock and signs the account out everywhere. */
const RP=form({id:'rp',v:{pw:'',pw2:''},accept:()=>doReset(),
  fields:[{k:'pw',l:'New password',type:'password',ac:'new-password',hint:PW_HINT},
    {k:'pw2',l:'New password again',type:'password',ac:'new-password'}]});
let RT={why:'',user:null};
function doReset(){const v=RP.v,u=RT.user;
  const pp=pwProblem(v.pw);if(pp)return fmBad(RP,'pw',pp);
  if(v.pw!==v.pw2)return fmBad(RP,'pw2','The two passwords are not the same.');
  const r=DB.resetPassword(param('t'),v.pw);if(!r.user){RT.why=r.why;render();return}
  LS.set('bcg.lastEmail',u.email);flash('Password changed. Sign in with the new password.');location.href=href('login')}
start({id:'reset',bare:true,access:'public',title:'Reset password',
  view:()=>RT.why?tp('Reset password','BCG ERP',`<p class="tp-note">${esc(RT.why)} Ask for a new link (Alt+F).</p>`):tp('Choose a new password',RT.user.email,formHtml(RP)),
  focus:()=>RT.why?null:'#rp-pw',
  init(){const x=DB.token(param('t')||'','reset');if(x.why){RT.why=x.why;return}RT.user=DB.user(x.r.user);if(!RT.user)RT.why='This account no longer exists.'},
  keys:()=>[...(RT.why?[{k:'Alt+F',l:'Forgot password',a:()=>go('forgot')}]:[{k:'Enter',l:'Next field'},{k:'Ctrl+A',l:'Save password',a:doReset}]),
    {gap:1},{k:'Alt+M',l:'Mailbox',a:()=>go('mailbox')},escKey()],back:()=>go('login')});
