/* Accept an invitation (?t=<token>, the link in the invitation email). A new person creates their account here (the link proves
   the email, so no separate verification); someone with an account signs in. Either way they join the business with the role given. */
let IV=null,IVB=null,IVU=null,IV_WHY='';
const meIsInvitee=()=>!!(IVU&&CUR.user&&CUR.user.id===IVU.id);
const otherUser=()=>!!(CUR.user&&IV&&CUR.user.email!==IV.email);
const AI=form({id:'ai',v:{email:'',name:'',phone:'',pw:'',pw2:''},accept:()=>acceptIv(),last:()=>acceptIv(),
  fields:[{k:'email',l:'Email',type:'ro'},
    {k:'name',l:'Full name',ph:'English or नेपाली',when:()=>!IVU},{k:'phone',l:'Mobile',ph:'Optional',when:()=>!IVU},
    {k:'pw',l:'Choose a password',type:'password',ac:'new-password',when:()=>!meIsInvitee(),hint:PW_HINT},
    {k:'pw2',l:'Password again',type:'password',ac:'new-password',when:()=>!IVU}]});
function acceptIv(){const v=AI.v;let u=IVU;
  if(u&&!meIsInvitee()){if(!v.pw)return fmBad(AI,'pw','Type your password.');
    if(!u.verified){u.verified=true;DB.save()}   // the invitation link proves the email
    const r=DB.login(u.email,v.pw);if(!r.ok){AI.v.pw='';render();return fmBad(AI,'pw',r.msg)}}
  if(!u){if(!v.name.trim())return fmBad(AI,'name','Type your name.');
    if(v.phone.trim()&&!isPhone(v.phone))return fmBad(AI,'phone','Type the mobile number with digits only, or leave it empty.');
    const pp=pwProblem(v.pw);if(pp)return fmBad(AI,'pw',pp);
    if(v.pw!==v.pw2)return fmBad(AI,'pw2','The two passwords are not the same.');
    u=DB.createUser({name:v.name,email:IV.email,phone:v.phone,pw:v.pw,verified:true});DB.startSession(u.id)}
  const m=DB.acceptInvite(IV,u.id);DB.useBiz(IV.biz);flash(`Welcome to ${dot(IVB.name)} You are ${roleName(m)} here.`);location.href=href(landingFor(m))}
function vInvite(){
  if(IV_WHY)return tp('Invitation','BCG ERP',`<p class="tp-note">${esc(IV_WHY)}</p>`);
  const from=DB.user(IV.by),intro=`<p class="hr-sub"><span>${esc(from?from.name:'The Owner')} invited you as <b>${esc(ROLES[IV.role])}</b>.</span><span class="muted">${leftText(IV.expires)} left</span></p>`;
  if(otherUser())return tp(`Join ${IVB.name}`,ROLES[IV.role],intro+`<p class="tp-note">This invitation is for <b>${esc(IV.email)}</b>, but you are signed in as <b>${esc(CUR.user.email)}</b>. Log out first (Alt+Q).</p>`);
  return tp(`Join ${IVB.name}`,IVU?'Sign in to accept':'Create your account',intro+formHtml(AI))}
const ivLogout=()=>{DB.endSession();location.reload()};
start({id:'invite',bare:true,access:'public',title:'Invitation',view:vInvite,
  focus:()=>IV_WHY||otherUser()?null:meIsInvitee()?'#ai-email':IVU?'#ai-pw':'#ai-name',
  init(){IV=DB.d.invites.find(i=>i.token===param('t'))||null;IVB=IV&&DB.biz(IV.biz);
    if(!IV)IV_WHY='This invitation link is not valid. It may have been sent again with a new link: check the newest email.';
    else if(!IVB||IVB.deleted)IV_WHY='This business no longer exists.';
    else if(IV.status==='Accepted')IV_WHY='This invitation was already accepted. Sign in to open the business (Esc).';
    else if(IV.status==='Cancelled')IV_WHY='This invitation was cancelled. Ask the business Owner if you still need access.';
    else if(DB.inviteState(IV)==='Expired')IV_WHY=`This invitation has expired. Ask ${DB.user(IV.by)?DB.user(IV.by).name:'the Owner'} to send it again.`;
    if(IV_WHY)return;IVU=DB.userByEmail(IV.email);AI.v.email=IV.email;AI.v.name=IV.name||'';
    if(IVU)Object.assign(AI.fields.find(f=>f.k==='pw'),{l:'Password',ac:'current-password',hint:''})},   // an existing account signs in instead
  keys:()=>[...(IV_WHY||otherUser()?[]:[{k:'Enter',l:'Next field'},{k:'Ctrl+A',l:'Join',a:acceptIv}]),...(CUR.user?[{gap:1},{k:'Alt+Q',l:'Log out',a:ivLogout}]:[]),
    {gap:1},{k:'Alt+M',l:'Mailbox',a:()=>go('mailbox')},escKey()],
  back:()=>go(CUR.user?'selbiz':'login')});
