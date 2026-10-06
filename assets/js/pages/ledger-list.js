/* List of ledgers page */
/* ---------- Ledger list ---------- */
function vLedgers(){
  const ls=S.ledgers.filter(l=>(!l.q1||S.q.q1)&&(!l.q4||S.q.q4));const ordered=[];for(const g of GROUPS)for(const l of ls)if(l.group===g.n)ordered.push(l);
  S.ll.list=ordered;S.ll.sel=Math.max(0,Math.min(S.ll.sel,ordered.length-1));
  let dr=0,cr=0;for(const l of ls)if(l.active){if(l.side==='Dr')dr+=l.opening;else cr+=l.opening}const diff=dr-cr;
  let html='',cur='';
  ordered.forEach((l,i)=>{if(l.group!==cur){cur=l.group;html+=`<div class="gh">${esc(GM[cur].sys?'System':gname(cur))}</div>`}
    const used=S.vouchers.filter(v=>v.lines.some(x=>x.lid===l.id)).length;
    html+=`<div class="row lrow ${i===S.ll.sel?'sel':''} ${l.active?'':'off'}" data-i="${i}"><div class="nm"><span>${esc(l.name)}</span>${S.q.q3&&l.code?`<span class="tag num">${esc(l.code)}</span>`:''}${l.billwise?'<span class="tag">Bill-wise</span>':''}${!l.active?'<span class="tag warn">Inactive</span>':''}${used?`<span class="tag">Used ×${used}</span>`:''}</div><span class="num muted">${l.opening?fmt(l.opening)+' '+l.side:''}</span></div>`});
  return tp('List of Ledgers',diff===0?'Opening balances tally':`Difference in opening balances ${fmt(Math.abs(diff))} ${diff>0?'Dr':'Cr'}`,html)}
function delLedger(){const l=S.ll.list[S.ll.sel];if(!l)return;
  if(!l.active){say(`${l.name} is already inactive. Press R to reactivate it.`,'bad');return}
  const used=S.vouchers.filter(v=>v.lines.some(x=>x.lid===l.id));
  const deact=()=>{l.active=false;sanitize();render();say(`${l.name} deactivated.`,'ok')};
  if(l.def&&(l.id==='cash'||l.id==='pl')){say(`${l.name} is a system ledger and can't be deleted.`,'bad');return}
  if(used.length){ask(`${l.name} is used in ${used.map(v=>vno(v.type,v.seq,v.pre)).join(', ')}, so it can't be deleted. Deactivate it instead?`,deact);return}
  if(l.opening||l.bills.length){ask(`${l.name} has an opening balance, so it can't be deleted. Deactivate it instead?`,deact);return}
  ask(`Delete ${l.name}? It has never been used.`,()=>{S.ledgers=S.ledgers.filter(x=>x.id!==l.id);render();say(`${l.name} deleted.`,'ok')})}
function reactLedger(){const l=S.ll.list[S.ll.sel];if(!l)return;if(l.active){say(`${l.name} is already active.`,'');return}l.active=true;render();say(`${l.name} is active again.`,'ok')}
start({
  id:'ledgers',title:'List of Ledgers',view:vLedgers,state:S.ll,
  keys:()=>[{k:'↑ ↓',l:'Move'},...(can('ledger.create')?[{k:'N',l:'Create ledger',a:()=>go('ledger')}]:[]),...(can('ledger.delete')?[{k:'Delete',kd:'Del',l:'Delete',a:delLedger},{k:'R',l:'Reactivate',a:reactLedger}]:[]),{gap:1},escKey()],
  key:e=>listNav(e,S.ll,S.ll.list.length,render)});
