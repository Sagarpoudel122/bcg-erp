/* Voucher model: ledgers, drafts, bills, checks, layout mode, audit, option sanitising */
const led=id=>S.ledgers.find(l=>l.id===id);
const visible=l=>l&&l.active&&(!l.q1||S.q.q1)&&(!l.q4||S.q.q4);
const isCash=l=>!!(GM[l.group]&&GM[l.group].cash);
const isBankish=l=>l.group==='Bank Accounts'||l.group==='Bank OD A/c';
const vno=(type,seq,pre)=>{const p=pre||TYPES[type].prefix,n=String(seq).padStart(4,'0');return S.q.q6==='A'?`${p}-2083/84-${n}`:`${p}/2083-84/${n}`};
const blankLine=side=>({side,lid:'',amt:'',alloc:[],inst:{open:false,type:'Cheque',no:'',date:''}});
// Every voucher starts as plain Dr/Cr lines (mode 'double'). For Contra, Payment and Receipt, Ctrl+H switches to the Tally
// "Account on top" layout (mode 'single'): the cash/bank Account first, then the particulars. Journal is always Dr/Cr.
const ACC={contra:'Cr',payment:'Cr',receipt:'Dr'};
const blank=(type,mode)=>{mode=mode||'double';const a=ACC[type];
  return{type,mode,date:{m:2,d:15},lines:mode==='single'?[blankLine(a),blankLine(a==='Dr'?'Cr':'Dr')]:[blankLine('Dr'),blankLine('Cr')],narr:'',billNo:'',editingId:null}};
const draft=type=>S.drafts[type]||(S.drafts[type]=blank(type));
/* ---------- Bills ---------- */
function openingBills(l){
  if(!l.billwise||!l.opening) return [];
  if(S.q.q5&&l.bills.length) return l.bills.map(b=>({ref:b.ref,due:b.due,amt:b.amt,rem:b.amt}));
  return [{ref:'Opening balance',due:null,amt:l.opening,rem:l.opening}];
}
function pendingBills(lid,excludeVid){
  const l=led(lid);if(!l)return[];
  const bills=openingBills(l);
  for(const v of S.vouchers){ if(v.status!=='Active'||v.id===excludeVid)continue;
    for(const ln of v.lines){ if(ln.lid!==lid)continue;
      for(const a of ln.alloc){ if(a.t==='New')bills.push({ref:a.ref,due:v.date+(+a.days||0),amt:cents(a.amt),rem:cents(a.amt)});
        if(a.t==='Against'){const b=bills.find(b=>b.ref===a.ref);if(b)b.rem-=cents(a.amt)} } } }
  return bills.filter(b=>b.rem>0);
}
function initAlloc(d,ln){
  const l=led(ln.lid);if(!l||!l.billwise){ln.alloc=[];return}
  const pend=pendingBills(l.id,d.editingId);const kind=GM[l.group].kind;
  const settling=(kind==='debtor'&&ln.side==='Cr')||(kind==='creditor'&&ln.side==='Dr');
  ln.alloc=settling&&pend.length?[{t:'Against',ref:pend[0].ref,amt:ln.amt}]:[{t:'New',ref:'',amt:ln.amt,days:l.creditDays}];
}
/* ---------- Checks ---------- */
function totals(d){let dr=0,cr=0;for(const l of d.lines){const c=cents(l.amt);if(l.side==='Dr')dr+=c;else cr+=c}return{dr,cr}}
function checks(d){
  const out=[];const T=TYPES[d.type];const s=serial(d.date.m,d.date.d);
  if(s<=LOCK)out.push({t:'Date',st:'bad',m:`Books are locked up to ${bsText(LOCK)}. Pick ${isoText(LOCK+1)} or later, or ask the Owner to unlock.`});
  else if(s<BOOKS)out.push({t:'Date',st:'bad',m:`The books of this business begin on ${bsText(BOOKS)}. Pick that day or later.`});
  else if(s>TODAY)out.push({t:'Date',st:'warn',m:'Future date. Allowed with this warning, for example for a post-dated cheque.'});
  else out.push({t:'Date',st:'ok',m:`${bsText(s)} is in an open period.`});
  const filled=d.lines.filter(l=>l.lid||cents(l.amt));
  const inc=d.lines.findIndex(l=>(l.lid||cents(l.amt))&&(!l.lid||cents(l.amt)<=0));
  if(inc>=0)out.push({t:'Lines',st:'bad',m:`Line ${inc+1} needs both a ledger and an amount.`});
  else if(filled.length<2)out.push({t:'Lines',st:'bad',m:'Add at least two lines.'});
  else out.push({t:'Lines',st:'ok',m:`${filled.length} lines filled (limit 500).`});
  const {dr,cr}=totals(d);
  if(dr===cr&&dr>0)out.push({t:'Dr = Cr',st:'ok',m:`Both sides are ${fmt(dr)}.`});
  else out.push({t:'Dr = Cr',st:'bad',m:`Dr ${fmt(dr)}, Cr ${fmt(cr)}. Difference ${fmt(Math.abs(dr-cr))}.`});
  out.push(ruleCheck(d,d.lines.filter(l=>l.lid)));
  out.push(billCheck(d));
  return out;
}
function ruleCheck(d,ls){
  const T=TYPES[d.type];const t=`${T.name} rules`;
  const nm=l=>led(l.lid).name;
  const cDr=ls.filter(l=>l.side==='Dr'&&isCash(led(l.lid))),cCr=ls.filter(l=>l.side==='Cr'&&isCash(led(l.lid)));
  const nDr=ls.filter(l=>l.side==='Dr'&&!isCash(led(l.lid))),nCr=ls.filter(l=>l.side==='Cr'&&!isCash(led(l.lid)));
  if(!ls.length)return{t,st:'na',m:'Pick ledgers first.'};
  if(d.type==='contra'){
    if(nDr.length||nCr.length)return{t,st:'bad',m:`${nm((nDr[0]||nCr[0]))} is not cash or bank.`};
    if(!cDr.length||!cCr.length)return{t,st:'bad',m:'Money must leave one cash/bank ledger (Cr) and arrive in another (Dr).'};
    return{t,st:'ok',m:'Only cash and bank ledgers.'};
  }
  if(d.type==='journal'){
    if(cDr.length||cCr.length)return{t,st:'bad',m:`${nm(cDr[0]||cCr[0])} is cash/bank. Use Payment, Receipt or Contra.`};
    return{t,st:'ok',m:'No cash or bank ledgers.'};
  }
  const pay=d.type==='payment';
  const mustSide=pay?cCr:cDr, wrongCash=pay?cDr:cCr, otherSame=pay?nCr:nDr, otherMain=pay?nDr:nCr;
  const S1=pay?'Cr':'Dr',S2=pay?'Dr':'Cr';
  if(!mustSide.length)return{t,st:'bad',m:`A ${T.name} needs Cash or Bank on the ${S1} side (the money ${pay?'going out':'coming in'}).`};
  if(wrongCash.length)return{t,st:'bad',m:`${nm(wrongCash[0])} is on the ${S2} side. Money ${pay?'coming into':'leaving'} cash/bank belongs in a ${pay?'Receipt':'Payment'}, or a Contra.`};
  if(!S.q.q7&&otherSame.length)return{t,st:'bad',m:`Old draft rule: only Cash/Bank may be on the ${S1} side, so ${nm(otherSame[0])} is blocked. Turn on Q7 to allow TDS lines.`};
  if(!otherMain.length)return{t,st:'bad',m:`Add the ${pay?'expense, supplier or other ledger paid for':'customer, income or other ledger received from'} on the ${S2} side.`};
  return{t,st:'ok',m:`Cash/Bank on the ${S1} side.`+(otherSame.length?` ${otherSame.map(nm).join(', ')} on the ${S1} side is allowed by Q7.`:'')};
}
function billCheck(d){
  const t='Bill details';const ls=d.lines.filter(l=>l.lid&&led(l.lid).billwise);
  if(!ls.length)return{t,st:'na',m:'No bill-wise ledgers in this voucher.'};
  for(const ln of ls){const l=led(ln.lid);const sum=ln.alloc.reduce((a,b)=>a+cents(b.amt),0);
    if(sum!==cents(ln.amt))return{t,st:'bad',m:`${l.name}: bills add up to ${fmt(sum)} but the line is ${fmt(cents(ln.amt))}.`};
    const pend=pendingBills(l.id,d.editingId);
    for(const a of ln.alloc){
      if(a.t==='Against'){if(!a.ref)return{t,st:'bad',m:`${l.name}: pick which bill is being settled.`};
        const b=pend.find(b=>b.ref===a.ref);if(!b)return{t,st:'bad',m:`${l.name}: bill ${a.ref} has nothing pending.`};
        if(cents(a.amt)>b.rem)return{t,st:'bad',m:`${l.name}: bill ${a.ref} has only ${fmt(b.rem)} pending.`};}
      if(a.t==='New'&&!String(a.ref).trim())return{t,st:'bad',m:`${l.name}: give the new bill a number.`};
    }}
  return{t,st:'ok',m:'Bill amounts match their lines.'};
}
// Account layout: the Account line has no amount of its own, it is always the sum of the particulars.
function sync(d){if(d.mode!=='single')return;const s=d.lines.slice(1).reduce((a,l)=>a+cents(l.amt),0);d.lines[0].amt=s?(s/100).toFixed(2):''}
function fitSingle(d){const a=ACC[d.type];if(!a)return false;const p=a==='Dr'?'Cr':'Dr';
  const acc=d.lines.filter(l=>l.side===a),parts=d.lines.filter(l=>l.side===p);
  if(acc.length!==1||!parts.length)return false;
  if(acc[0].lid&&!isCash(led(acc[0].lid)))return false;
  return !parts.some(l=>l.lid&&(d.type==='contra'?!isCash(led(l.lid)):isCash(led(l.lid))))}
// Pick the layout a voucher fits: Account on top when it can, otherwise plain Dr/Cr lines (for example TDS on the bank's side).
function fitMode(d){if(fitSingle(d)){const acc=d.lines.find(l=>l.side===ACC[d.type]);d.lines=[acc,...d.lines.filter(l=>l!==acc)];d.mode='single'}else d.mode='double'}
const clock=()=>new Date().toLocaleTimeString([],{hour:'2-digit',minute:'2-digit',second:'2-digit'});
const auditRow=(action,v,detail,by)=>({time:clock(),user:by||USER,action,no:vno(v.type,v.seq,v.pre),detail:detail||`${TYPES[v.type].name} dated ${bsShort(v.date)}`});
function audit(action,v,detail){S.audit.push(auditRow(action,v,detail))}
// Changes that are not about a voucher: business setup, users and roles
function auditNote(action,detail){S.audit.push({time:clock(),user:USER,action,no:'',detail})}
function sanitize(){
  for(const t in S.drafts)for(const ln of S.drafts[t].lines)if(ln.lid&&!visible(led(ln.lid))){ln.lid='';ln.alloc=[]}
  for(const t in S.drafts)for(const ln of S.drafts[t].lines)if(ln.lid&&led(ln.lid).billwise)for(const a of ln.alloc)if(a.t==='Against'&&!pendingBills(ln.lid,S.drafts[t].editingId).some(b=>b.ref===a.ref))a.ref='';
  if(!S.q.q1&&GM[S.lf.group].q1)S.lf.group='Sundry Debtors'}
