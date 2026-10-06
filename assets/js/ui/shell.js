/* The shell: draws the menu, key rail and status bar around a page, and routes every key press.
   A page is an object handed to start():
     id        screen id (matches NAV)            title     shown in print headings
     view()    html of the screen                 focus()   selector of the first field, or null
     keys()    key-rail entries (Esc is added with escKey())
     key(e)    screen keys such as arrows in lists; return true when handled
     back()    what Esc does (default: move to the menu)
     init()    before the first draw (read the page address; false = stop, it moved on)    ready()  after the first draw
     state     list state ({sel}) so a mouse click can select a row; activate() runs on that click
     bare      true for the sign-in and business pages: no menu, the panel in the middle
     auth      true for the sign-in / create account / business registration pages: the usual titled panel (authCard in ui/form.js)
               with a few website touches (buttons and links in the panel, mistakes shown inside it, header with a Log out link)
     access    'public' (no sign-in needed), 'guest' (public, and a signed-in user is sent on), 'user' (signed in, no business needed);
               by default a page needs a signed-in user with an open business who may see the screen (SCREEN in ui/nav.js) */
let PAGE=null;
const escKey=()=>({k:'Escape',kd:'Esc',l:'Back',a:back});

function render(focus){
  pickClose();
  const html=PAGE.view();
  quiet(()=>{view().innerHTML=html});
  drawTop();drawSide();drawKeys();drawStatus();
  if(focus)focusEl(focus);
  const sel=view().querySelector('.sel');if(sel&&!focus)sel.scrollIntoView({block:'nearest'});
}
/* ---------- top bar: the parts of the product this user may open, the business (Alt+B), the user (My Account) ---------- */
function drawTop(){const t=document.querySelector('.top');if(!t)return;UM.open=false;
  if(PAGE.auth){t.innerHTML=`<a class="brand" href="../index.html">BCG ERP</a>${CUR.user?`<span class="who">${esc(CUR.user.email)}</span><button type="button" class="link" data-act="logout">Log out</button>`:''}`;return}
  if(PAGE.bare){t.innerHTML=`<b>BCG ERP</b>${CUR.user?`<span class="user" style="margin-left:auto">${esc(CUR.user.email)}</span>`:''}`;return}
  const parts=myParts(),tab=m=>`<button tabindex="-1" data-act="mod" data-m="${m}" class="${S.mod===m?'on':''}" ${S.mod===m?'aria-current="true"':''}>${MODNAME[m]}<kbd>Alt+${['acc','hrm','tools'].indexOf(m)+1}</kbd></button>`;
  const mods=parts.length>1?`<nav class="mods" aria-label="Parts">${parts.map(tab).join('')}</nav>`:'';
  const logo=CUR.biz.logo?`<img class="logo" src="${esc(CUR.biz.logo)}" alt="">`:'';
  t.innerHTML=`<b>BCG ERP</b>${mods}<button tabindex="-1" class="co" data-act="biz" title="Change business (Alt+B)">${logo}${esc(COMPANY)}</button><span class="fy">FY 2083/84 · ${bsText(TODAY)}</span><span class="umw"><button tabindex="-1" class="user" data-act="umenu" aria-haspopup="menu" aria-expanded="false" title="Company and account (Alt+M)">${esc(userLabel())} <span class="chev">▾</span></button><div class="umenu" id="umenu" role="menu" hidden>${umenuHtml()}</div></span>`}
/* ---------- user menu (top bar, Alt+M): Business Setup, Users, My Account, Options, change business, log out ---------- */
const UM={open:false};
function umenuHtml(){return userMenuItems().map(x=>x.sec?`<h4>${esc(x.sec)}</h4>`:`<button tabindex="-1" role="menuitem" data-act="ugo" data-go="${x.go}" class="${x.go===S.view?'on':''}">${esc(x.l)}</button>`).join('')
  +`<hr><button tabindex="-1" role="menuitem" data-act="biz">Change business<kbd>Alt+B</kbd></button><button tabindex="-1" role="menuitem" data-act="logout">Log out<kbd>Alt+Q</kbd></button>`}
function openUserMenu(on){const m=$('#umenu');if(!m)return;UM.open=on;m.hidden=!on;const b=$('.top .user');if(b)b.setAttribute('aria-expanded',on);
  if(on){const f=m.querySelector('button');if(f)f.focus()}}
const toggleUserMenu=()=>{if(!PAGE.bare)openUserMenu(!UM.open)};
function umKey(e){const k=e.key,L=[...document.querySelectorAll('#umenu button')],i=L.indexOf(document.activeElement);
  if(k==='Escape'){stop(e);openUserMenu(false);restoreFocus();return true}
  if(k==='ArrowDown'||k==='ArrowUp'){stop(e);L[(i+(k==='ArrowDown'?1:-1)+L.length)%L.length].focus();return true}
  if(k==='Enter'||k===' '){stop(e);if(L[i])L[i].click();return true}
  return false}
/* ---------- sidebar ---------- */
let sideSeen=false;   // the open screen's own item is brought into view once, when the page opens
// Section headings are buttons that fold their items (class "folded" hides them; the phone-width menu is one row and ignores folding)
function drawSide(){rebuildNavI();
  const find=`<button tabindex="-1" class="find" data-act="goto"><span>Search…</span><kbd>Alt+G</kbd></button>`,cur=menuOf(S.view);
  $('#side').innerHTML=find+NAV.map(x=>{const i=NAVI.indexOf(x),hot=S.sb&&i>=0&&i===S.nav?'hot':'';
    if(x.sec){const open=!secFolded(x.sec);
      return`<button tabindex="-1" class="sec ${hot}" data-act="sec" data-s="${esc(x.sec)}" aria-expanded="${open}"><span class="chev">${open?'▾':'▸'}</span>${esc(x.sec)}</button>`}
    return`<button tabindex="-1" data-act="nav" data-go="${x.go}" class="${x.go===cur?'on':''} ${hot} ${i<0?'folded':''}" ${x.go===cur?'aria-current="page"':''}><span>${esc(x.l)}</span>${x.kd?`<kbd>${x.kd}</kbd>`:''}</button>`}).join('');
  const el=$(S.sb?'#side .hot':'#side .on');if(el&&(S.sb||!sideSeen)){sideShow(el);sideSeen=true}}
// Scroll the menu (never the page) just enough to show item el, with its heading when it is the first under one.
// The status bar is fixed over the bottom of the screen, so the part of the menu behind it does not count as shown.
function sideShow(el){const box=$('#side'),b=box.getBoundingClientRect(),r=el.getBoundingClientRect(),m=18;   // m = the menu's top padding, so the first item scrolls right back to the top
  const h=el.previousElementSibling,top=(h&&h.classList.contains('sec')&&h.offsetHeight?h:el).getBoundingClientRect().top;
  const st=$('#status'),bottom=Math.min(b.bottom,innerHeight,st?st.getBoundingClientRect().top:Infinity);
  if(top<b.top+m)box.scrollTop-=b.top+m-top;else if(r.bottom>bottom-m)box.scrollTop+=r.bottom-bottom+m;
  if(r.left<b.left)box.scrollLeft-=b.left-r.left;else if(r.right>b.right)box.scrollLeft+=r.right-b.right}   // phone width: the menu is one row
function focusSidebar(){pickClose();if(document.activeElement&&document.activeElement.blur)document.activeElement.blur();
  rebuildNavI();const i=NAVI.findIndex(x=>x.go===menuOf(S.view));S.nav=i>=0?i:0;S.sb=true;S.msg=null;drawSide();drawKeys();drawStatus()}
function leaveSidebar(){S.sb=false;render(PAGE.focus?PAGE.focus():null)}
// ↑ ↓ move, Enter opens an item or folds a heading, ← goes up to the heading (and folds it), → opens a folded heading (or goes into the screen)
function sbKey(e){const k=e.key,n=NAVI.length,cur=NAVI[S.nav]||{};
  if(k==='ArrowDown'||k==='ArrowUp'){stop(e);S.nav=(S.nav+(k==='ArrowDown'?1:-1)+n)%n;drawSide();return true}
  if(k==='Enter'||(k===' '&&cur.sec)){stop(e);if(cur.sec)toggleSec(cur.sec);else go(cur.go);return true}
  if(k==='ArrowLeft'){stop(e);
    if(cur.sec){if(!secFolded(cur.sec))toggleSec(cur.sec)}
    else{const h=NAVI.findIndex(x=>x.sec&&x.sec===cur.secName);if(h>=0){S.nav=h;drawSide()}}
    return true}
  if(k==='ArrowRight'&&cur.sec&&secFolded(cur.sec)){stop(e);toggleSec(cur.sec);return true}
  if(k==='Escape'||k==='ArrowRight'){stop(e);if(!isGate(S.view)||PAGE.state)leaveSidebar();return true}   // a gateway with something to select (Dashboard) can be entered
  if(k.length===1&&!e.ctrlKey&&!e.altKey){const l=k.toLowerCase();
    for(let j=1;j<=n;j++){const i=(S.nav+j)%n;if(NAVI[i].l[0].toLowerCase()===l){stop(e);S.nav=i;drawSide();return true}}}
  return false}
function back(){pickClose();if(PAGE.back)PAGE.back();else if(!PAGE.bare)focusSidebar()}
/* ---------- key rail (also the shortcut table) ---------- */
function keysFor(){   // every screen in the app also gets Alt+G (Go To), Alt+B (change business) and Alt+Q (log out) just above Esc
  const r=keysBase();if(PAGE.bare)return r;const i=r.findIndex(x=>x.k==='Escape');
  r.splice(i<0?r.length:i,0,{k:'Alt+G',l:'Go To',a:openGoto},{k:'Alt+B',l:'Business',a:()=>go('selbiz')},{k:'Alt+Q',l:'Log out',a:logOut});return r}
function keysBase(){
  if(S.sb)return[{k:'↑ ↓',l:'Move'},{k:'Enter',l:'Open / fold'},{k:'← →',l:'Fold / open section'},{k:'Letter',l:'Jump to item'},...(!isGate(S.view)||PAGE.state?[{gap:1},{k:'Escape',kd:'Esc',l:isGate(S.view)?'Into the screen':'Back to screen',a:leaveSidebar}]:[]),
    ...(Object.keys(TYPES).some(canSee)?[{gap:1},...Object.keys(TYPES).filter(canSee).map(t=>({k:TYPES[t].key,l:TYPES[t].name,a:()=>go(t)}))]:[])];
  return PAGE.keys?PAGE.keys():[escKey()]}
function drawKeys(){const r=S.rail=keysFor();
  $('#keys').innerHTML=r.map((x,i)=>x.gap?'<div class="gap"></div>':`<button tabindex="-1" data-act="key" data-i="${i}" class="${x.on?'on':''}" ${x.a?'':'disabled'}><kbd>${esc(x.kd||x.k)}</kbd>${esc(x.l)}</button>`).join('')}

/* ---------- key router ---------- */
document.addEventListener('keydown',onKey,true);
/* The app owns the keyboard: the browser's own shortcuts (print, bookmark, find, reload, history, menus, F1-F11) are blocked.
   Left alone on purpose: copy/paste/cut/undo/redo, zoom, and developer tools (F12, Ctrl+Shift+I/J/C/R).
   Keys the browser reserves (Ctrl+T, Ctrl+N, Ctrl+W, Alt+F4) cannot be blocked by any web page. */
function isBrowserKey(e){const k=e.key;
  if(/^F([1-9]|1[01])$/.test(k))return true;
  if(e.ctrlKey&&e.altKey)return false;
  if(e.altKey&&k!=='Alt')return true;
  if(e.ctrlKey&&!e.shiftKey)return k.length===1?!'cvxzy+-=0'.includes(k.toLowerCase()):(k==='Tab'||k==='PageUp'||k==='PageDown');
  if(e.ctrlKey&&e.shiftKey&&k.length===1)return !'ijcr'.includes(k.toLowerCase());
  if(k==='Backspace'&&!/^(INPUT|TEXTAREA)$/.test(e.target.tagName))return true;
  return false}
document.addEventListener('contextmenu',e=>{if(!/^(INPUT|TEXTAREA)$/.test(e.target.tagName))e.preventDefault()});
function onKey(e){
  const k=e.key;if(['Shift','Control','Alt','Meta'].includes(k))return;
  if(isBrowserKey(e))e.preventDefault();
  if(AL.open){stop(e);if(e.repeat)return;
    if(AL.ask){if(k==='y'||k==='Y'||k==='Enter')answer(true);else if(k==='n'||k==='N'||k==='Escape')answer(false)}
    else if(k==='Enter'||k==='Escape'||k===' ')closeAlert();
    return}
  if(k==='Tab'&&!e.ctrlKey&&!e.altKey){stop(e);if(UM.open)openUserMenu(false);tabStep(e.shiftKey,CALC.open?$('#calc'):document);return}   // Tab never leaves the page (ui/dom.js)
  if(!$('#modal').hidden){if(k==='Escape'||k==='Enter'){stop(e);closePrint()}return}
  if(CALC.open){calcKey(e);return}   // the calculator (ui/calc.js) takes every key; typing passes through to its field
  if(UM.open){if(umKey(e))return;openUserMenu(false)}   // the user menu takes ↑ ↓ Enter Esc; any other key closes it and goes on
  const t=e.target;
  if(PK.input&&t===PK.input&&pickKey(e))return;
  const kn=keyName(e);
  if(kn==='Alt+C'&&t.dataset&&t.dataset.amt!==undefined){stop(e);openCalc(t);return}   // Alt+C in an Amount field: calculator (elsewhere it stays "Create ledger")
  if(P){panelKey(e);return}
  if(!PAGE.bare){
    if(GKEYS[kn]&&canSee(GKEYS[kn])){stop(e);go(GKEYS[kn]);return}
    if(kn==='Alt+G'){stop(e);openGoto();return}
    if(kn==='Alt+B'){stop(e);go('selbiz');return}
    if(kn==='Alt+Q'){stop(e);logOut();return}
    if(kn==='Alt+M'){stop(e);toggleUserMenu();return}
    if(/^Alt\+[123]$/.test(kn)){stop(e);goMod(['acc','hrm','tools'][+kn.slice(-1)-1]);return}}
  if(S.sb){sbKey(e);return}
  if(PAGE.key&&PAGE.key(e))return;
  const hit=S.rail.find(x=>x.a&&x.k===kn);if(hit&&!(t.tagName==='INPUT'&&kn.length===1)){stop(e);hit.a();return}   // plain letters are text when typing in a field
  if(t.dataset&&t.dataset.f&&FIELD[t.dataset.f])fieldKey(e,t)}
function listNav(e,state,n,after){const k=e.key;
  if(k==='ArrowDown'||k==='ArrowUp'||k==='Home'||k==='End'){stop(e);if(n){state.sel=k==='Home'?0:k==='End'?n-1:Math.max(0,Math.min(n-1,state.sel+(k==='ArrowDown'?1:-1)));after()}return true}
  return false}

/* ---------- mouse (optional) ---------- */
document.addEventListener('mousedown',e=>{const it=e.target.closest('#pick .it');if(it){e.preventDefault();pickCommit(PK.items[+it.dataset.i])}});
document.addEventListener('click',e=>{
  if(UM.open&&!e.target.closest('.umw'))openUserMenu(false);
  const b=e.target.closest('[data-act]');
  if(b){const a=b.dataset.act;
    if(a==='key'){const x=S.rail[+b.dataset.i];if(x&&x.a)x.a()}
    else if(a==='nav'||a==='ugo')go(b.dataset.go);else if(a==='sec')toggleSec(b.dataset.s);else if(a==='goto')openGoto();else if(a==='umenu')toggleUserMenu();else if(a==='mod')goMod(b.dataset.m);else if(a==='biz')go('selbiz');else if(a==='account')go('account');
    else if(a==='rk'){const x=S.rail.find(r=>r.k===b.dataset.key);if(x&&x.a)x.a()}   // a button on an auth card runs the key-rail entry of that name
    else if(a==='logout')logOut();else if(a==='pwtoggle'){const i=b.parentElement.querySelector('input');i.type=i.type==='password'?'text':'password';b.textContent=i.type==='password'?'Show':'Hide'}
    else if(a==='yes')answer(true);else if(a==='no')answer(false);else if(a==='closeprint')closePrint();else if(a==='closealert')closeAlert();return}
  const row=e.target.closest('main .row[data-i],main tr[data-i],main td[data-i],main .dt[data-i]');
  if(row&&PAGE.state){S.sb=false;PAGE.state.sel=+row.dataset.i;if(PAGE.activate)PAGE.activate();else render()}});
// Coming back with the browser's back button must show current data
window.addEventListener('pageshow',e=>{if(e.persisted)location.reload()});

/* ---------- start-up: every page file ends with start(page) ---------- */
// Where a page sends you instead of opening: to sign in, to pick a business, or (for a screen your role may not open) to your first screen
function gate(page){const here=location.pathname.split('/').pop()+location.search;
  if(page.access==='guest'&&CUR.user)return afterSignIn(CUR.user.id,param('next'));
  if(page.access==='public'||page.access==='guest')return null;
  if(!CUR.user)return href('login',{next:here});
  if(page.access==='user')return null;
  if(!CUR.biz)return href('selbiz',{next:here});
  if(!canSee(page.id))return href(landingFor(CUR.member));
  return null}
// After signing in: one business opens straight away, several are listed, none means registering one (or accepting an invitation)
function afterSignIn(uid,next){const list=DB.bizList(uid),u=DB.user(uid);next=safeNext(next)?next:'';
  if(list.length===1){DB.useBiz(list[0].b.id);return next||href(landingFor(list[0].m))}
  if(!list.length&&!DB.invitesFor(u.email).length&&!DB.deletedList(uid).length)return href('bizreg');
  return href('selbiz',next?{next}:null)}
function start(page){
  PAGE=page;
  const to=gate(page);if(to){location.replace(to);return}
  document.body.classList.toggle('bare',!!page.bare);document.body.classList.toggle('auth',!!page.auth);
  if(!page.bare){
    if(!Store.load())freshBusiness()
    rebuildGroups();if(!GM[S.lf.group])S.lf.group='Sundry Debtors';   // custom groups of this business; a draft may point at a deleted one
    const parts=myParts(),part=modOf(page.id);S.mod=part&&parts.includes(part)?part:parts.includes(S.mod)?S.mod:parts[0];buildNav()}
  S.view=page.id;S.sb=!page.bare&&isGate(page.id);S.msg=null;S.ask=null;
  if(!page.bare)openCurSec();
  if(page.init&&page.init()===false)return;   // init() returns false when it sends you to another page
  render(S.sb?null:(page.focus?page.focus():null));
  if(page.ready)page.ready();
  const f=takeFlash();if(f)say(f.text,f.kind);
}
