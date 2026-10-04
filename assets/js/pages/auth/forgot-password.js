/* Forgot password: sends a reset link (1 hour). The answer is the same whether or not the email has an account. */
const FP=form({id:'fp',v:{email:LS.get('bcg.lastEmail')||''},fields:[{k:'email',l:'Email',ph:'you@example.com',ac:'username'}],
  last:()=>sendReset(),accept:()=>sendReset()});
let FP_SENT='';
function sendReset(){const e=normEmail(FP.v.email);if(!isEmail(e))return fmBad(FP,'email','Type the email address of your account.');
  DB.requestReset(e);FP_SENT=e;render()}
function vForgot(){
  if(FP_SENT)return tp('Check your email','BCG ERP',`<p class="tp-note">If there is an account for <b>${esc(FP_SENT)}</b>, we sent it a link to choose a new password. It works for 1 hour.</p>`);
  return tp('Forgot password','BCG ERP',formHtml(FP))}
start({id:'forgot',bare:true,access:'public',title:'Forgot password',view:vForgot,focus:()=>FP_SENT?null:'#fp-email',
  keys:()=>[...(FP_SENT?[]:[{k:'Enter',l:'Send link',a:sendReset}]),{gap:1},{k:'Alt+M',l:'Mailbox',a:()=>go('mailbox')},escKey()],back:()=>go('login')});
