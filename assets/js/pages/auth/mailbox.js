/* Mailbox (prototype only): every email the app "sends" lands here instead of a real inbox, for every address.
   Open one with Enter, then Enter again follows its link (verify email, reset password, accept invitation). */
const MB={sel:0};
const mails=()=>DB.d.mails.slice().sort((a,b)=>b.at-a.at);
let MOPEN=null;
function vMail(){const L=mails();MB.sel=Math.max(0,Math.min(MB.sel,L.length-1));
  const rows=L.map((m,i)=>`<tr class="${i===MB.sel?'sel':''} ${m.read?'':'unread'}" data-i="${i}"><td>${esc(m.to)}</td><td>${esc(m.subject)}</td><td class="muted">${ago(m.at)}</td></tr>`).join('');
  return tp('Mailbox',`Prototype · ${L.length} email${L.length===1?'':'s'}`,L.length?`<table><thead><tr><th>To</th><th>Subject</th><th>Sent</th></tr></thead><tbody>${rows}</tbody></table>`
    :'<p class="tp-note">No emails yet. Sign-up, password and invitation emails appear here.</p>')}
function openMail(){const m=mails()[MB.sel];if(!m)return;m.read=true;DB.save();MOPEN=m;openPanel('mail',0,null)}
function followLink(){const m=MOPEN;P.then=null;closePanel();if(m&&m.link)location.href=m.link.href}
PANELS.mail={view:()=>{const m=MOPEN;return `<h2>${esc(m.subject)}</h2><div class="mail">
   <div class="mh"><span>From</span>BCG ERP &lt;no-reply@bcg-erp.test&gt;</div><div class="mh"><span>To</span>${esc(m.to)}</div><div class="mh"><span>Sent</span>${ago(m.at)}</div>
   <div class="mb">${m.body.map(p=>`<p>${esc(p)}</p>`).join('')}</div>
   ${m.link?`<input class="in mlink" data-nav data-f="mlink" readonly value="${esc(m.link.label)} →" aria-label="${esc(m.link.label)}" onclick="followLink()">`:''}</div>
   <p class="pfoot">${m.link?'Enter opens the link · ':''}Esc closes</p>`},
  last:followLink};
function mbBack(){if(document.referrer&&history.length>1)history.back();else location.href=href(CUR.user?(CUR.biz?landingFor(CUR.member):'selbiz'):'login')}
start({id:'mailbox',bare:true,access:'public',title:'Mailbox',view:vMail,state:MB,activate:openMail,
  keys:()=>[{k:'↑ ↓',l:'Move'},{k:'Enter',l:'Open',a:openMail},{gap:1},escKey()],
  key(e){if(listNav(e,MB,mails().length,render))return true;if(e.key==='Enter'){stop(e);openMail();return true}return false},
  back:mbBack});
