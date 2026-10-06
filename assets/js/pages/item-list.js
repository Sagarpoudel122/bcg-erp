/* List of items, with the quantity in hand (the prototype's simple stock list) */
function vItems(){
  const L=S.il.list=[...S.items].sort((a,b)=>a.name.localeCompare(b.name));S.il.sel=Math.max(0,Math.min(S.il.sel,L.length-1));
  const rows=L.map((it,i)=>{const used=itemUsed(it.id).length,q=stockOf(it.id);
    return `<tr class="${i===S.il.sel?'sel':''} ${it.active?'':'off'}" data-i="${i}"><td>${esc(it.name)}${S.q.q3&&it.code?` <span class="tag num">${esc(it.code)}</span>`:''}${it.stock?'':' <span class="tag">Service</span>'}${!it.active?' <span class="tag warn">Inactive</span>':''}${used?` <span class="tag">Used ×${used}</span>`:''}</td>
     <td>${esc(it.unit)}</td><td class="r num">${it.sell?fmt(cents(it.sell)):''}</td><td class="r num">${it.buy?fmt(cents(it.buy)):''}</td><td class="r num">${it.vat}%</td>
     <td class="r num ${it.stock&&q<0?'bad':''}">${it.stock?qfmt(q):'–'}</td></tr>`}).join('');
  return tp('List of Items',L.length?`${L.length} item${L.length===1?'':'s'}`:'',
    L.length?`<table><thead><tr><th>Name</th><th>Unit</th><th class="r">Sale rate</th><th class="r">Purchase rate</th><th class="r">VAT</th><th class="r">Qty in hand</th></tr></thead><tbody>${rows}</tbody></table>`
    :`<p class="tp-note">No items yet.${can('item.create')?' Press N to create one.':''}</p>`)}
function alterItem(){const it=S.il.list[S.il.sel];if(!it)return;if(!can('item.create')){say('You may look at items but not change them.','bad');return}navigate('item',{id:it.id})}
function delItem(){const it=S.il.list[S.il.sel];if(!it)return;
  if(!it.active){say(`${it.name} is already inactive. Press R to reactivate it.`,'bad');return}
  const used=itemUsed(it.id),deact=()=>{it.active=false;render();say(`${it.name} deactivated. It no longer shows in Sales and Purchase.`,'ok')};
  if(used.length){ask(`${it.name} is used in ${used.map(v=>vno(v.type,v.seq,v.pre)).join(', ')}, so it can't be deleted. Deactivate it instead?`,deact);return}
  if(+it.openQty){ask(`${it.name} has an opening quantity, so it can't be deleted. Deactivate it instead?`,deact);return}
  ask(`Delete ${it.name}? It has never been used.`,()=>{S.items=S.items.filter(x=>x.id!==it.id);auditNote('Item deleted',it.name);render();say(`${it.name} deleted.`,'ok')})}
function reactItem(){const it=S.il.list[S.il.sel];if(!it)return;if(it.active){say(`${it.name} is already active.`,'');return}it.active=true;render();say(`${it.name} is active again.`,'ok')}
start({
  id:'items',title:'List of Items',view:vItems,state:S.il,activate:alterItem,
  keys:()=>[{k:'↑ ↓',l:'Move'},...(can('item.create')?[{k:'Enter',l:'Alter',a:alterItem},{k:'N',l:'New item',a:()=>go('item')},{k:'Delete',kd:'Del',l:'Delete',a:delItem},{k:'R',l:'Reactivate',a:reactItem}]:[]),{gap:1},escKey()],
  key(e){if(listNav(e,S.il,S.il.list.length,render))return true;if(e.key==='Enter'){stop(e);alterItem();return true}return false}});
