/* Type-to-search list (like Tally's List of Ledgers). Each page registers its lists in PICK, keyed by data-f */
/* PICK[data-f value] = { source(t) the items {v,label,sub,code}, cur(t) the chosen value's text, title(t), commit(t,item) }. */
const PICK={};
/* ---------- type-to-search list ---------- */
const PK={input:null,all:[],items:[],idx:0};
function groupItems(){return GROUPS.filter(g=>!g.sys&&(!g.q1||S.q.q1)).map(g=>({v:g.n,label:gname(g.n),sub:g.parent?gname(g.parent):''}))}
const pickSource=t=>{const h=PICK[t.dataset.f];return h?h.source(t):[]};
const curVal=t=>{const h=PICK[t.dataset.f];return h&&h.cur?h.cur(t):t.value};
const pickTitle=t=>{const h=PICK[t.dataset.f];return h&&h.title?h.title(t):'Transaction Type'};
function pickFilter(all,q){q=q.trim().toLowerCase();if(!q)return all;
  const sc=it=>{const l=it.label.toLowerCase(),c=(it.code||'').toLowerCase();return l.startsWith(q)||(c&&c.startsWith(q))?0:l.includes(q)||(it.sub||'').toLowerCase().includes(q)?1:2};
  return all.filter(it=>sc(it)<2).sort((a,b)=>sc(a)-sc(b))}
function pickShow(t,typed){PK.input=t;PK.all=pickSource(t);PK.moved=false;
  if(typed){PK.items=pickFilter(PK.all,t.value);PK.idx=0}
  else{PK.items=PK.all;const cv=curVal(t);PK.idx=Math.max(0,PK.items.findIndex(x=>x.label===cv))}
  pickDraw()}
function pickClose(){PK.input=null;const p=$('#pick');if(p)p.hidden=true}
function pickDraw(){const p=$('#pick'),t=PK.input;if(!t){p.hidden=true;return}
  const r=t.getBoundingClientRect();p.hidden=false;p.style.left=Math.max(8,Math.min(r.left,innerWidth-300))+'px';p.style.minWidth=Math.max(r.width,260)+'px';
  const below=innerHeight-r.bottom-56,above=r.top-12;
  if(below<180&&above>below){p.style.top='auto';p.style.bottom=(innerHeight-r.top+2)+'px';p.style.maxHeight=Math.min(300,above)+'px'}
  else{p.style.bottom='auto';p.style.top=(r.bottom+2)+'px';p.style.maxHeight=Math.min(300,Math.max(120,below))+'px'}
  p.innerHTML=`<div class="pt">${pickTitle(t)}</div>`+(PK.items.length?PK.items.map((it,i)=>`<div class="it ${i===PK.idx?'sel':''}" role="option" data-i="${i}">${esc(it.label)}${it.sub?`<small>${esc(it.sub)}</small>`:''}</div>`).join(''):'<div class="none">No match</div>');
  const s=p.querySelector('.sel');if(s)s.scrollIntoView({block:'nearest'});
  t.setAttribute('role','combobox');t.setAttribute('aria-expanded','true')}
function pickKey(e){const t=PK.input,k=e.key;
  if(k==='ArrowDown'||k==='ArrowUp'){stop(e);PK.moved=true;if(PK.items.length){PK.idx=(PK.idx+(k==='ArrowDown'?1:-1)+PK.items.length)%PK.items.length;pickDraw()}return true}
  if(k==='Escape'){if(t.value===curVal(t)){pickClose();return false}stop(e);t.value=curVal(t);pickShow(t);return true}
  // Enter on an untouched, empty extra line (3rd line onward) means "no more lines"; everywhere else it picks the highlighted item
  if(k==='Enter'){if(t.dataset.k==='lid'&&t.value.trim()===''&&+t.dataset.i>=2&&!PK.moved)return false;stop(e);
    if(PK.items.length)pickCommit(PK.items[PK.idx]);else say(`Nothing matches "${t.value}".`,'bad');return true}
  return false}
function pickCommit(it){const t=PK.input;if(!t)return;pickClose();t.value=it.label;say('');const h=PICK[t.dataset.f];if(h)h.commit(t,it)}
