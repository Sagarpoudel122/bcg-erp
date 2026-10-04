/* Report numbers: group tree, closing balances, profit and loss result */
const FROM=serial(0,1);
const periodText=()=>`${bsText(FROM)} to ${bsText(S.rep.to)}`;
/* ---------- groups ---------- */
// The name shown for a group: a custom group's own name, or a predefined group's name as renamed by the business (R2)
const gname=g=>{const x=GM[g];return !x?g:x.sys?'Profit & Loss A/c':x.label||g};
const GTREE={top:[],kids:{}};
const gKids=n=>GTREE.kids[n]||[];
// Is group id inside root (the group itself or any group under it)?
const under=(id,root)=>{for(let g=GM[id];g;g=g.parent?GM[g.parent]:null)if(g.n===root)return true;return false};
// Predefined groups + this business's custom sub-groups (S.groups: {id,name,parent}). A custom group takes nature, cash flow,
// ledger kind (debtor, bank, ...) from its parent. Call after the business's data is loaded and after any group change.
function rebuildGroups(){const custom=S.groups||[];
  GROUPS.length=0;for(const k in GM)delete GM[k];GTREE.top.length=0;for(const k in GTREE.kids)delete GTREE.kids[k];
  const walk=g=>{GROUPS.push(g);GM[g.n]=g;if(g.parent)(GTREE.kids[g.parent]=GTREE.kids[g.parent]||[]).push(g.n);else GTREE.top.push(g.n);
    g.label=g.custom?(custom.find(c=>c.id===g.n)||{}).name:(S.gren&&S.gren[g.n])||g.n;
    BASE_GROUPS.filter(x=>x.parent===g.n).forEach(walk);
    custom.filter(c=>c.parent===g.n).forEach(c=>walk({n:c.id,custom:true,parent:g.n,nat:g.nat,cash:g.cash,kind:g.kind,q1:g.q1,cf:g.cf}))};
  BASE_GROUPS.filter(g=>!g.parent).forEach(walk)}
rebuildGroups();
/* ---------- numbers ---------- */
function balances(to){const m={};for(const l of S.ledgers)m[l.id]={op:(l.side==='Dr'?1:-1)*l.opening,dr:0,cr:0};
  for(const v of S.vouchers){if(v.status!=='Active'||v.date>to)continue;for(const ln of v.lines){const c=cents(ln.amt);if(ln.side==='Dr')m[ln.lid].dr+=c;else m[ln.lid].cr+=c}}
  for(const id in m)m[id].cl=m[id].op+m[id].dr-m[id].cr;return m}   // cl: closing balance, Dr positive, Cr negative
function gTotal(n,B){let t=S.ledgers.filter(l=>l.group===n).reduce((a,l)=>a+B[l.id].cl,0);for(const k of gKids(n))t+=gTotal(k,B);return t}
const gHas=n=>S.ledgers.some(l=>l.group===n)||gKids(n).some(gHas);
/* ---------- Balance Sheet ---------- */
function plResult(B){let prof=0;for(const g of GTREE.top)if(GM[g].nat==='I'||GM[g].nat==='E')prof-=gTotal(g,B);return{prof,open:-B.pl.cl}}
