/* Verify email. Without ?t= it says where the link went; with ?t=<token> (the link in the email) it verifies and goes to Sign in. */
let VR={why:'',user:null};
const pendingEmail=()=>LS.get('bcg.pendingEmail')||'';
function vVerify(){
  if(VR.why)return tp('Verify email','BCG ERP',`<p class="tp-note">${esc(VR.why)}</p>`);
  return tp('Check your email','BCG ERP',`<p class="tp-note">We sent a link to <b>${esc(pendingEmail())}</b>. Open it to finish creating your account. It works for 24 hours.</p>`)}
function resend(){const u=VR.user||DB.userByEmail(pendingEmail());
  if(!u){say('There is no account waiting for verification here. Create an account first.','bad');return}
  if(u.verified){say('This email is already verified. Press Esc and sign in.','bad');return}
  DB.sendVerify(u);LS.set('bcg.pendingEmail',u.email);VR={why:'',user:u};render();say('A new link is in the Mailbox.','ok')}
start({id:'verify',bare:true,access:'public',title:'Verify email',view:vVerify,
  init(){const t=param('t');if(!t)return;const r=DB.verifyEmail(t);
    if(r.user){LS.set('bcg.lastEmail',r.user.email);LS.del('bcg.pendingEmail');flash('Email verified. Sign in to continue.');location.replace(href('login'));return false}
    VR={why:r.why,user:r.r?DB.user(r.r.user):null}},
  keys:()=>[{k:'R',l:'Send the link again',a:resend},{k:'Alt+M',l:'Mailbox',a:()=>go('mailbox')},{gap:1},escKey()],back:()=>go('login')});
