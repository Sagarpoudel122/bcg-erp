/* State. S is the one place every screen reads and writes. The part listed in Store.keys is saved in the browser,
   so vouchers, ledgers and drafts survive when you move from one page to another. */

const S={
 view:'payment',lastType:'payment',vid:0,groups:[],gren:{},
 q:{q1:true,q3:true,q4:true,q5:true,q6:'A',q7:true,q8:true,r2:true},
 counters:{contra:0,payment:0,receipt:0,journal:0},
 vouchers:[],audit:[],drafts:{},flash:null,confirmCancel:null,delMsg:null,lfMsg:null,focus:null,
 ledgers:[
  L('cash','Cash','Cash-in-Hand',{def:true,opening:2500000}),
  L('pl','Profit & Loss A/c','Primary',{def:true,side:'Dr'}),
  L('vat','VAT','Duties & Taxes',{def:true,extra:{taxType:'VAT',rate:'13'}}),
  L('tdsp','TDS Payable','Duties & Taxes',{def:true,extra:{taxType:'TDS',rate:''}}),
  L('sales','Sales','Sales Accounts',{def:true,q4:true}),
  L('purchase','Purchase','Purchase Accounts',{def:true,q4:true}),
  L('nic','NIC Asia Bank – Current A/c','Bank Accounts',{code:'NIC',opening:25000000,extra:{bank:'NIC Asia Bank',acno:'0123 4567 8901',branch:'Putalisadak'}}),
  L('nabilod','Nabil Bank OD A/c','Bank OD A/c',{q1:true,code:'NBOD',opening:8000000,side:'Cr',extra:{bank:'Nabil Bank',acno:'0456 7788 0011',odLimit:'5,00,000'}}),
  L('capital','Owner Capital','Capital Account',{opening:35000000}),
  L('furn','Furniture & Fixtures','Fixed Assets',{opening:12000000}),
  L('tdsr','TDS Receivable','Loans & Advances (Asset)'),
  L('ram','Ram Traders','Sundry Debtors',{code:'RAM',pan:'301234567',billwise:true,creditDays:30,creditLimit:10000000,opening:3000000,side:'Dr',
     bills:[{ref:'#12',s:serial(1,10),amt:1000000,due:serial(2,10)},{ref:'#15',s:serial(1,28),amt:2000000,due:serial(2,28)}]}),
  L('shyam','Shyam Suppliers','Sundry Creditors',{code:'SHY',pan:'609876543',billwise:true,creditDays:45,opening:1500000,side:'Cr',
     bills:[{ref:'#P-88',s:serial(1,5),amt:1500000,due:serial(2,20)}]}),
  L('rent','Rent','Indirect Expenses'),
  L('salary','Salary','Indirect Expenses'),
  L('bankchg','Bank Charges','Indirect Expenses'),
  L('dep','Depreciation','Indirect Expenses'),
 ],
};
Object.assign(S,{view:'home',sb:true,nav:0,ask:null,msg:null,exi:{},lastVid:null,cur:0,
  db:{sel:0,date:TODAY,all:false,list:[]},ll:{sel:0,list:[]},ol:{sel:0},rail:[],lfMsg:null});
Object.assign(S,{rep:{sel:0,to:TODAY},rstack:[],gs:{group:''},lr:{ledger:'',bills:false}});
/* ---------- Ledger form ---------- */
function blankLF(){return{name:'',code:'',group:'Sundry Debtors',pan:'',phone:'',address:'',opening:'',side:'Dr',billwise:true,creditDays:'30',creditLimit:'',bank:'',acno:'',branch:'',odLimit:'',taxType:'VAT',rate:'',bills:[{ref:'',m:1,d:1,amt:''}]}}
S.lf=blankLF();

/* Saved in the browser (localStorage, see core/db.js). Two records per business, so businesses never mix:
   bcg.biz.<business>          the business's data, shared by everyone in it (Store.keys)
   bcg.ui.<business>.<user>    where this user left the screens: drafts, Day Book position, menu part (Store.ui) */
const Store={
  keys:['ledgers','vouchers','audit','counters','vid','q','groups','gren'],
  ui:['lastVid','drafts','exi','lf','db','rep','rstack','dash'],
  ready:false,   // nothing is saved until the page has loaded its business: a page that redirects at start must not overwrite the data
  dataKey:()=>CUR.biz?'bcg.biz.'+CUR.biz.id:null,
  uiKey:()=>CUR.biz&&CUR.user?`bcg.ui.${CUR.biz.id}.${CUR.user.id}`:null,
  // false when the business has no saved data yet (the caller then fills in the sample or empty data)
  load(){const k=this.dataKey();if(!k)return false;const b=LS.get(k),u=LS.get(this.uiKey());
    if(u)for(const x of this.ui)if(x in u)S[x]=u[x];
    S.db=Object.assign({sel:0,date:TODAY,all:false},S.db,{list:[]});
    this.ready=true;if(!b)return false;
    for(const x of this.keys)if(x in b)S[x]=b[x];
    if(S.q.r2===undefined)S.q.r2=true;   // saved before the R2 switch existed
    return true},
  save(){if(!this.ready)return;const b={},u={};for(const k of this.keys)b[k]=S[k];for(const k of this.ui)u[k]=S[k];
    if(u.db)u.db={sel:u.db.sel,date:u.db.date,all:u.db.all};LS.set(this.dataKey(),b);LS.set(this.uiKey(),u)}
};
window.addEventListener('pagehide',()=>Store.save());

/* Sample vouchers, so the reports have figures to show. Built from the entry examples; they are ordinary vouchers (alter or cancel them in the Day Book). */
function seedVouchers(){const o=DB.owner(CUR.biz.id),by=o?`${o.name} (Owner)`:USER,uid=o?o.id:UID;
  [['payment',0],['payment',1],['receipt',0],['receipt',1],['journal',0],['journal',1],['contra',0]].forEach(([t,i])=>{const e=EX[t][i];
    const lines=e.lines.map(([side,lid,amt,o])=>{const ln=blankLine(side);ln.lid=lid;ln.amt=(+amt).toFixed(2);if(o&&o.inst)Object.assign(ln.inst,o.inst);ln.alloc=o&&o.alloc?clone(o.alloc):[];return ln})
      .sort((a,b)=>(a.side==='Dr'?0:1)-(b.side==='Dr'?0:1));
    const seq=++S.counters[t],v={id:'v'+(++S.vid),type:t,seq,date:serial(e.date[0],e.date[1]),lines,narr:e.narr,status:'Active',by,uid,pre:TYPES[t].prefix};S.vouchers.push(v);S.audit.push(auditRow('Created',v,null,by))})}
// A new business starts with the default ledgers only (Cash, Profit & Loss, VAT, TDS Payable, Sales, Purchase): no vouchers, no employees
function freshBusiness(){S.ledgers=S.ledgers.filter(l=>l.def).map(l=>Object.assign(l,{opening:0,bills:[]}));
  Object.assign(S,{vouchers:[],audit:[],counters:{contra:0,payment:0,receipt:0,journal:0},vid:0,drafts:{},groups:[],gren:{},emps:[],leaves:[],att:{},pay:{}});
  const v=led('vat');if(v)v.extra.rate=CUR.biz.vatRate||'13'}
