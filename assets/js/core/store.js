/* State. S is the one place every screen reads and writes. The part listed in Store.keys is saved in the browser,
   so vouchers, ledgers and drafts survive when you move from one page to another. */

const S={
 view:'payment',lastType:'payment',vid:0,groups:[],gren:{},
 q:{q1:true,q3:true,q4:true,q5:true,q6:'A',q7:true,q8:true,r2:true},
 counters:{contra:0,payment:0,receipt:0,journal:0,sales:0,purchase:0,salesret:0,purchret:0},items:[],
 vouchers:[],audit:[],drafts:{},flash:null,confirmCancel:null,delMsg:null,lfMsg:null,focus:null,
 ledgers:[
  L('cash','Cash','Cash-in-Hand',{def:true}),
  L('pl','Profit & Loss A/c','Primary',{def:true,side:'Dr'}),
  L('vat','VAT','Duties & Taxes',{def:true,extra:{taxType:'VAT',rate:'13'}}),
  L('tdsp','TDS Payable','Duties & Taxes',{def:true,extra:{taxType:'TDS',rate:''}}),
  L('sales','Sales','Sales Accounts',{def:true,q4:true}),
  L('purchase','Purchase','Purchase Accounts',{def:true,q4:true}),
 ],
};
Object.assign(S,{view:'home',sb:true,nav:0,ask:null,msg:null,lastVid:null,cur:0,
  db:{sel:0,date:TODAY,all:false,list:[]},ll:{sel:0,list:[]},ol:{sel:0},rail:[],lfMsg:null});
Object.assign(S,{rep:{sel:0,to:TODAY},rstack:[],gs:{group:''},lr:{ledger:'',bills:false}});
/* ---------- Ledger form ---------- */
function blankLF(){return{name:'',code:'',group:'Sundry Debtors',pan:'',phone:'',address:'',opening:'',side:'Dr',billwise:true,creditDays:'30',creditLimit:'',bank:'',acno:'',branch:'',odLimit:'',taxType:'VAT',rate:'',bills:[{ref:'',m:1,d:1,amt:''}]}}
S.lf=blankLF();

/* Saved in the browser (localStorage, see core/db.js). Two records per business, so businesses never mix:
   bcg.biz.<business>          the business's data, shared by everyone in it (Store.keys)
   bcg.ui.<business>.<user>    where this user left the screens: drafts, Day Book position, menu part (Store.ui) */
const Store={
  keys:['ledgers','vouchers','audit','counters','vid','q','groups','gren','items'],
  ui:['lastVid','drafts','lf','db','rep','rstack','dash'],
  ready:false,   // nothing is saved until the page has loaded its business: a page that redirects at start must not overwrite the data
  dataKey:()=>CUR.biz?'bcg.biz.'+CUR.biz.id:null,
  uiKey:()=>CUR.biz&&CUR.user?`bcg.ui.${CUR.biz.id}.${CUR.user.id}`:null,
  // false when the business has no saved data yet (the caller then starts it empty)
  load(){const k=this.dataKey();if(!k)return false;const b=LS.get(k),u=LS.get(this.uiKey());
    if(u)for(const x of this.ui)if(x in u)S[x]=u[x];
    S.db=Object.assign({sel:0,date:TODAY,all:false},S.db,{list:[]});
    this.ready=true;if(!b)return false;
    for(const x of this.keys)if(x in b)S[x]=b[x];
    if(S.q.r2===undefined)S.q.r2=true;   // saved before the R2 switch existed
    for(const t in TYPES)if(S.counters[t]===undefined)S.counters[t]=0;   // saved before the invoice vouchers existed
    if(!S.items)S.items=[];
    return true},
  save(){if(!this.ready)return;const b={},u={};for(const k of this.keys)b[k]=S[k];for(const k of this.ui)u[k]=S[k];
    if(u.db)u.db={sel:u.db.sel,date:u.db.date,all:u.db.all};LS.set(this.dataKey(),b);LS.set(this.uiKey(),u)}
};
window.addEventListener('pagehide',()=>Store.save());

// Every business starts with the default ledgers only (Cash, Profit & Loss, VAT, TDS Payable, Sales, Purchase): no vouchers, no employees
function freshBusiness(){
  Object.assign(S,{vouchers:[],audit:[],counters:{contra:0,payment:0,receipt:0,journal:0,sales:0,purchase:0,salesret:0,purchret:0},items:[],vid:0,drafts:{},groups:[],gren:{},emps:[],leaves:[],att:{},pay:{}});
  const v=led('vat');if(v)v.extra.rate=CUR.biz.vatRate||'13'}
