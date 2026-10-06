/* Create / alter item page. /pages/item-create.html opens a blank form; item-create.html?id=... alters that item (from the Item list). */
function itfFields(){const f=S.itf,F=[{k:'name',l:'Name',ph:'English or नेपाली'}];
  if(S.q.q3)F.push({k:'code',l:'Short code',ph:'For quick search'});
  F.push({k:'unit',l:'Unit',pick:1},{k:'sell',l:'Sale rate',amt:1},{k:'buy',l:'Purchase rate',amt:1},{k:'vat',l:'VAT %',ph:'0 if exempt'},{k:'stock',l:'Maintain stock',yn:1});
  if(f.stock)F.push({k:'openQty',l:'Opening quantity',ph:'Quantity in hand today'});
  return F}
function vItem(){
  const rows=itfFields().map(F=>{const v=F.yn?(S.itf.stock?'Yes':'No'):F.amt?fmtIn(S.itf[F.k]):S.itf[F.k];
    return `<div class="f"><label for="itf-${F.k}">${F.l}</label><input id="itf-${F.k}" class="in ${F.amt?'amt':''}" data-nav data-f="itf" data-k="${F.k}" ${F.pick?'data-pick':''} ${F.amt?'data-amt inputmode="decimal"':''} ${F.yn?'readonly data-yn':''} placeholder="${esc(F.ph||'')}" value="${esc(v)}" autocomplete="off"></div>`}).join('');
  return tp(S.itf.editId?'Item Alteration':'Item Creation',COMPANY,rows)}
function itfEnter(t){const k=t.dataset.k,L=navInputs(view());
  if(k==='name'&&!t.value.trim()){say('Give the item a name.','bad');return}
  if(t===L[L.length-1]){ask('Accept?',saveItem);return}
  moveFocus(t,1)}
function saveItem(){const f=S.itf,name=f.name.trim();const bad=(m,id)=>{say(m,'bad');if(id)focusEl(id)};
  const t=document.activeElement;if(t&&t.dataset&&t.dataset.amt!==undefined)commitAmt(t);
  if(!name)return bad('Give the item a name.','#itf-name');
  if(S.items.some(i=>i.id!==f.editId&&i.name.toLowerCase()===name.toLowerCase()))return bad(`An item called "${name}" already exists. Names must be unique (capital letters don't count).`,'#itf-name');
  if(!/^\d{1,3}(\.\d+)?$/.test(String(f.vat).trim())||+f.vat>100)return bad('VAT % must be a number from 0 to 100 (0 if the item is exempt).','#itf-vat');
  if(f.stock&&f.openQty!==''&&!(+f.openQty>=0))return bad('Opening quantity must be a number, 0 or more.','#itf-openQty');
  const rec={name,code:f.code.trim(),unit:f.unit,sell:normAmt(f.sell),buy:normAmt(f.buy),vat:String(+f.vat),stock:!!f.stock,openQty:f.stock&&f.openQty!==''?String(+f.openQty):''};
  if(f.editId){const it=item(f.editId);
    if(!rec.stock&&it.stock&&itemUsed(it.id).length)return bad(`${it.name} is used in vouchers, so it must keep its stock.`,'#itf-stock');
    Object.assign(it,rec);auditNote('Item altered',name);S.itf=blankItem();flash(`Item "${name}" updated.`);navigate('items');return}
  S.items.push(Object.assign({id:'i'+Date.now(),active:true},rec));auditNote('Item created',name);
  S.itf=blankItem();render('#itf-name');say(`Saved. "${name}" is ready to use in Sales and Purchase.`,'ok')}
FIELD.itf={
  enter:itfEnter,
  key(e,t){if(t.dataset.yn===undefined)return;const l=e.key.toLowerCase();
    if(l==='y'||l==='n'||e.key===' '){stop(e);S.itf.stock=l==='y'?true:l==='n'?false:!S.itf.stock;render('#itf-stock')}},
  input:t=>{S.itf[t.dataset.k]=t.value},
  amt:(t,raw)=>{S.itf[t.dataset.k]=raw}};
PICK.itf={source:()=>UNITS.map(u=>({v:u,label:u})),cur:t=>S.itf.unit,title:()=>'Unit',commit(t,it){S.itf.unit=it.v;moveFocus(t,1)}};
start({
  id:'item',title:'Item Creation',view:vItem,focus:()=>'#itf-name',
  init(){const id=param('id');
    if(id){const it=item(id);if(!it){location.replace(href('items'));return false}
      if(S.itf.editId!==id)S.itf={name:it.name,code:it.code||'',unit:it.unit,sell:it.sell||'',buy:it.buy||'',vat:it.vat,stock:it.stock,openQty:it.openQty||'',editId:id}}
    else if(S.itf.editId)S.itf=blankItem()},
  keys:()=>[{k:'Enter',l:'Next field'},{k:'Backspace',l:'Previous field'},{gap:1},{k:'Ctrl+A',l:'Accept',a:saveItem},escKey()],
  back(){const f=S.itf;
    if(f.editId)ask('Leave without saving the changes?',()=>{S.itf=blankItem();go('items')});
    else if(f.name||f.sell||f.buy||f.openQty)ask('Discard this item?',()=>{S.itf=blankItem();focusSidebar()});else focusSidebar()}});
