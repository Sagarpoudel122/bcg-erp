/* Create a ledger without leaving the entry screen (Alt+C). Name and group only; the opening balance starts at zero.
   The page that opens it sets S.nl = {name, code, group, ok (which groups may be picked), done(id) (what to do with the new ledger)}. */
function panelNewLedger(){const n=S.nl,k='data-nav data-f="nl"';
  return `<h2>Ledger Creation</h2><div class="f"><label for="nl-name">Name</label><input id="nl-name" class="in" ${k} data-k="name" placeholder="English or नेपाली" value="${esc(n.name)}" autocomplete="off"></div>
   ${S.q.q3?`<div class="f"><label for="nl-code">Short code</label><input id="nl-code" class="in" ${k} data-k="code" value="${esc(n.code)}" autocomplete="off"></div>`:''}
   <div class="f"><label for="nl-group">Under</label><input id="nl-group" class="in" ${k} data-pick data-k="group" value="${esc(gname(n.group))}" autocomplete="off"></div>
   <p class="pfoot">Opening balance starts at zero. Enter next · Ctrl+A create · Esc cancel</p>`}
function createNewLedger(){const n=S.nl,name=n.name.trim();
  if(!name){say('Give the ledger a name.','bad');focusEl('#nl-name');return}
  if(S.ledgers.some(l=>l.name.toLowerCase()===name.toLowerCase())){say(`A ledger called "${name}" already exists.`,'bad');focusEl('#nl-name');return}
  const kind=GM[n.group].kind,id='l'+Date.now();
  S.ledgers.push(L(id,name,n.group,{code:(n.code||'').trim(),billwise:kind==='debtor'||kind==='creditor',creditDays:kind==='debtor'?30:kind==='creditor'?45:0}));
  P.then=null;closePanel();n.done(id);say(`Ledger "${name}" created and selected.`,'ok')}
FIELD.nl={input(t){S.nl[t.dataset.k]=t.value}};
PICK.nl={
  source:()=>groupItems().filter(S.nl.ok||(()=>true)),
  cur:t=>t.dataset.k==='group'?gname(S.nl.group):S.nl[t.dataset.k],
  title:()=>'List of Groups',
  commit:(t,it)=>{S.nl.group=it.v;createNewLedger()}};
PANELS.newledger={view:panelNewLedger,last:createNewLedger,accept:createNewLedger};
