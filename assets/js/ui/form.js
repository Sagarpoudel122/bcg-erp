/* Simple Tally-style forms, used by the sign-in, business and user screens.
   A page describes a form once:  const F=form({id, v:{...values}, fields:[...], accept(), last()})
   Field: {k, l (label), ph (placeholder), type, sec (heading shown above), when() shown only when true, ro() read-only when true,
           items() for pick lists ({v,label,sub}), title (list title), hint (shown in the status bar while the field has the cursor),
           check(value) a message when the value is wrong (checked on Enter), change() after a list pick or Y/N change (the form is redrawn)}
   Also: req (a red * after the label, for a required field), help (a line shown under the field), toggle (password field with a Show / Hide button).
   Types: 'text' (default), 'password', 'pick', 'yn' (Y / N / Space), 'color' (#RRGGBB with a swatch), 'file' (picture: Space choose, Delete remove), 'ro'.
   Enter moves to the next field; Enter on the last one calls last() (default: "Accept?" then accept()). Ctrl+A is the page's accept key. */
const FORMS={};
function form(o){FORMS[o.id]=o;return o}
const fmOf=t=>FORMS[t.dataset.form];
const fdef=t=>{const fm=fmOf(t);return fm&&fm.fields.find(f=>f.k===t.dataset.k)};
const fmRO=f=>f.type==='ro'||!!(f.ro&&f.ro());
const validHex=v=>/^#[0-9a-f]{6}$/i.test(String(v||''));
function pickLabel(f,v){const it=f.items().find(x=>x.v===v);return it?it.label:''}
function formHtml(fm){
  return fm.fields.filter(f=>!f.when||f.when()).map(f=>{
    const id=`${fm.id}-${f.k}`,v=fm.v[f.k],ro=fmRO(f);
    const shown=f.type==='yn'?(v?'Yes':'No'):f.type==='pick'?pickLabel(f,v):f.type==='file'?(v?'Picture added':''):(v??'');
    const extra=f.type==='color'?`<span class="swatch" id="${id}-sw" style="background:${validHex(v)?v:'transparent'}"></span>`
      :f.type==='file'&&v?`<img class="logo-prev" src="${esc(v)}" alt="">`:'';
    const tg=f.toggle&&f.type==='password'?'<button type="button" class="pw-toggle" tabindex="-1" data-act="pwtoggle" aria-label="Show or hide the password">Show</button>':'';
    return `${f.sec?`<h4 class="fsec">${esc(f.sec)}</h4>`:''}<div class="f"><label for="${id}">${esc(f.l)}${f.req?'<span class="req" aria-hidden="true">*</span>':''}</label><div class="fin${tg?' pw':''}">`+
      `<input id="${id}" class="in" type="${f.type==='password'?'password':'text'}" data-nav data-f="fm" data-form="${fm.id}" data-k="${f.k}" ${f.req?'aria-required="true"':''} ${f.type==='pick'&&!ro?'data-pick':''} ${ro||f.type==='yn'||f.type==='file'?'readonly':''} placeholder="${esc(ro?'':f.ph||'')}" value="${esc(shown)}" autocomplete="${f.ac||'off'}">${extra}${tg}</div>${f.help?`<div class="fhelp">${esc(f.help)}</div>`:''}</div>`}).join('')}
const fmLast=fm=>fm.last?fm.last():ask('Accept?',fm.accept);
// Redraw the form (fields may appear or go away) and put the cursor back on the same field, or on the next one
function fmRedraw(t,move){const id=t.id,inP=!!t.closest('#panel');if(inP)drawPanel();else render();
  const root=inP?$('#panel'):view(),el=document.getElementById(id);if(!el)return;if(!move){focusEl(el);return}
  const L=navInputs(root),n=L[L.indexOf(el)+1];if(n)focusEl(n);else if(inP)panelLast();else fmLast(fmOf(el))}
// Put the cursor on a field and say what is wrong with it
function fmBad(fm,k,msg){say(msg,'bad');const el=document.getElementById(`${fm.id}-${k}`);if(el)focusEl(el);return false}
function chooseFile(t,fm,f){const inp=document.createElement('input');inp.type='file';inp.accept='image/png,image/jpeg,image/webp,image/svg+xml';
  inp.onchange=()=>{const file=inp.files[0];if(!file)return;if(file.size>2*1024*1024){say('The picture is larger than 2 MB. Pick a smaller one.','bad');return}
    const r=new FileReader();r.onload=()=>{const img=new Image();
      img.onload=()=>{const sc=Math.min(1,240/Math.max(img.width,img.height)),c=document.createElement('canvas');   // kept small: it is saved in localStorage
        c.width=Math.max(1,Math.round(img.width*sc));c.height=Math.max(1,Math.round(img.height*sc));c.getContext('2d').drawImage(img,0,0,c.width,c.height);
        fm.v[f.k]=c.toDataURL('image/png');fmRedraw(document.getElementById(t.id)||t,false);say('Picture added. Ctrl+A saves it.')};
      img.onerror=()=>say('That file is not a picture that can be read.','bad');img.src=r.result};
    r.readAsDataURL(file)};
  inp.click()}
FIELD.fm={
  focus(t){const f=fdef(t);if(f&&f.hint&&!fmRO(f))say(f.hint)},
  blur(t){const f=fdef(t);if(f&&f.hint&&S.msg&&S.msg.text===f.hint)say('')},
  enter(t){const fm=fmOf(t),f=fdef(t);
    if(f.check&&!fmRO(f)){const m=f.check(fm.v[f.k]);if(m){say(m,'bad');return}}
    if(!moveFocus(t,1))fmLast(fm)},
  key(e,t){const f=fdef(t),fm=fmOf(t);if(!f||fmRO(f))return;const k=e.key,l=k.toLowerCase();
    if(f.type==='yn'&&(l==='y'||l==='n'||k===' ')){stop(e);fm.v[f.k]=l==='y'?true:l==='n'?false:!fm.v[f.k];if(f.change){f.change();fmRedraw(t,false)}else t.value=fm.v[f.k]?'Yes':'No';return}
    if(f.type==='file'&&k===' '){stop(e);chooseFile(t,fm,f);return}
    if(f.type==='file'&&k==='Delete'){stop(e);fm.v[f.k]='';fmRedraw(t,false)}},
  input(t){const f=fdef(t);if(!f)return;fmOf(t).v[f.k]=t.value;
    if(f.type==='color'){const sw=document.getElementById(t.id+'-sw');if(sw)sw.style.background=validHex(t.value)?t.value:'transparent'}}};
PICK.fm={source:t=>fdef(t).items(),cur:t=>pickLabel(fdef(t),fmOf(t).v[t.dataset.k]),title:t=>{const f=fdef(t);return f.title||f.l},
  commit(t,it){const fm=fmOf(t),f=fdef(t);fm.v[f.k]=it.v;if(f.change){f.change();fmRedraw(t,true);return}
    if(!moveFocus(t,1)){if(P)panelLast();else fmLast(fm)}}};

/* Sign-in style pages (page.auth): the app's titled panel with a few website touches. title and right (the text on the right of the title strip) are plain text; lead, body and foot are
   HTML (escape what you put in them); step (1 or 2) shows "Step n of 2" in the title strip. */
function authCard({title,right,lead,body,foot,step}){
  return `<section class="tp au"><header class="tp-bar"><b>${esc(title)}</b><span>${esc(right||(step?`Step ${step} of 2`:'BCG ERP'))}</span></header><div class="tp-body">`+
    `${lead?`<p class="au-lead">${lead}</p>`:''}<div id="amsg" class="amsg" role="alert" hidden></div>${body||''}${foot?`<p class="au-foot">${foot}</p>`:''}</div></section>`}
// A button on the card. key = the name of the key-rail entry it runs (Ctrl+A is the page's accept key)
const auBtn=(label,key,ghost)=>`<button type="button" class="au-btn${ghost?' ghost':''}" data-act="rk" data-key="${esc(key)}">${esc(label)}</button>`;
// A Yes / No field can also be clicked on these pages
document.addEventListener('click',e=>{if(!document.body.classList.contains('auth'))return;const t=e.target.closest('input[data-form]');if(!t)return;
  const f=fdef(t);if(f&&f.type==='yn'&&!fmRO(f)){const fm=fmOf(t);fm.v[f.k]=!fm.v[f.k];if(f.change){f.change();fmRedraw(t,false)}else t.value=fm.v[f.k]?'Yes':'No'}});
