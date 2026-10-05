/* Select Business (like Tally's Select Company, Alt+B from anywhere): the businesses you belong to, invitations waiting for you,
   and businesses you deleted that can still be restored (30 days). Enter opens; N registers a new business. */
const SB={sel:0,list:[]};
function sbRows(){const uid=CUR.user.id;
  return[...DB.bizList(uid).sort((a,b)=>a.b.name.localeCompare(b.b.name)).map(x=>({k:'biz',...x})),
    ...DB.invitesFor(CUR.user.email).map(i=>({k:'inv',i,b:DB.biz(i.biz)})),
    ...DB.deletedList(uid).map(x=>({k:'del',...x}))]}
function vSel(){const L=SB.list=sbRows();SB.sel=Math.max(0,Math.min(SB.sel,L.length-1));
  const tr=(r,i)=>{const open=r.k==='biz'&&CUR.session.biz===r.b.id;
    const what=r.k==='biz'?esc(roleName(r.m)):r.k==='inv'?`${esc(ROLES[r.i.role])} <span class="tag ok">Invitation · ${leftText(r.i.expires)} left</span>`
      :`<span class="tag bad">Deleted · ${leftText(r.b.deleted+30*DAY)||'today'} left to restore</span>`;
    return `<tr class="${i===SB.sel?'sel':''} ${r.k==='del'?'off':''}" data-i="${i}"><td>${esc(r.b.name)}${open?' <span class="tag">Open now</span>':''}</td><td>${what}</td><td class="muted">${esc(r.b.address)}</td></tr>`};
  return authCard({title:'Select Business',right:CUR.user.name,lead:L.length?'Choose a business to open, or register a new one.':'',
    body:(L.length?`<table><thead><tr><th>Business</th><th>Your role</th><th>Address</th></tr></thead><tbody>${L.map(tr).join('')}</tbody></table>`
      :'<p class="au-lead">You are not in any business yet. Register yours, or ask an Owner to invite you.</p>')+auBtn('Register a new business','N')})}
function sbOpen(){const r=SB.list[SB.sel];if(!r)return;
  if(r.k==='biz'){DB.useBiz(r.b.id);const n=param('next');location.href=safeNext(n)?n:href(landingFor(r.m));return}
  if(r.k==='inv'){ask(`Join ${r.b.name} as ${ROLES[r.i.role]}?`,()=>{const m=DB.acceptInvite(r.i,CUR.user.id);DB.useBiz(r.b.id);flash(`Welcome to ${dot(r.b.name)} You are ${roleName(m)} here.`);location.href=href(landingFor(m))});return}
  ask(`Restore ${r.b.name}? It comes back with all its data and users.`,()=>{r.b.deleted=0;DB.save();bizAudit(r.b.id,CUR.user,'Restored','Business restored after it was deleted');render();say(`${r.b.name} is back.`,'ok')})}
const sbBack=()=>{if(CUR.biz)location.href=href(landingFor(CUR.member))};
start({id:'selbiz',bare:true,auth:true,access:'user',title:'Select Business',view:vSel,state:SB,activate:sbOpen,
  keys:()=>{const r=SB.list[SB.sel];return[{k:'↑ ↓',l:'Move'},{k:'Enter',l:!r?'Open':r.k==='inv'?'Accept invitation':r.k==='del'?'Restore':'Open',a:sbOpen},
    {k:'N',l:'Register business',a:()=>go('bizreg')},{gap:1},{k:'Alt+Q',l:'Log out',a:logOut},...(CUR.biz?[escKey()]:[])]},
  key(e){if(listNav(e,SB,SB.list.length,render))return true;if(e.key==='Enter'){stop(e);sbOpen();return true}return false},
  back:sbBack,
  ready(){if(CUR.lost){say(`You can no longer open ${dot(CUR.lost)} Ask its Owner if this is a mistake.`,'warn');DB.useBiz('')}}});
