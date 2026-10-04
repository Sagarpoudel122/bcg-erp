/* Fixed data: groups, voucher types, bill labels. The signed-in user and open business come from core/db.js. */
// Who is working (shown in the audit log, on vouchers and on prints) and in which business
let USER=CUR.user?`${CUR.user.name} (${roleName(CUR.member)||'no business'})`:'';
const UID=CUR.user?CUR.user.id:'';
let COMPANY=CUR.biz?CUR.biz.name:'BCG ERP';
if(CUR.biz){LOCK=CUR.biz.lockTo==null?-1:CUR.biz.lockTo;const b=bsIsoSerial(CUR.biz.books);BOOKS=b==null||b<0?0:b}
// BS or AD dates on screen, a per-user setting (My Account)
function setDateMode(ad){AD_MODE=ad;DATE_HELP=ad?'Type the date as yyyy-mm-dd inside FY 2083/84 (17 Jul 2026 to 16 Jul 2027), for example 2026-10-01.':'Type the date as yyyy-mm-dd inside FY 2083/84, for example 2083-06-15.'}
setDateMode(!!CUR.user&&CUR.user.date==='AD');
/* ---------- Groups ---------- */
const GROUPS=[
 {n:'Capital Account',nat:'L'},{n:'Reserves & Surplus',p:1,nat:'L'},
 {n:'Loans (Liability)',nat:'L'},{n:'Bank OD A/c',p:1,nat:'L',cash:1,q1:1,kind:'od'},{n:'Secured Loans',p:1,nat:'L',q1:1},{n:'Unsecured Loans',p:1,nat:'L',q1:1},
 {n:'Current Liabilities',nat:'L'},{n:'Sundry Creditors',p:1,nat:'L',kind:'creditor'},{n:'Duties & Taxes',p:1,nat:'L',kind:'tax'},{n:'Provisions',p:1,nat:'L'},
 {n:'Fixed Assets',nat:'A'},{n:'Investments',nat:'A'},
 {n:'Current Assets',nat:'A'},{n:'Bank Accounts',p:1,nat:'A',cash:1,kind:'bank'},{n:'Cash-in-Hand',p:1,nat:'A',cash:1},{n:'Sundry Debtors',p:1,nat:'A',kind:'debtor'},{n:'Loans & Advances (Asset)',p:1,nat:'A'},{n:'Deposits (Asset)',p:1,nat:'A'},
 {n:'Suspense A/c',nat:'A'},
 {n:'Sales Accounts',nat:'I'},{n:'Direct Incomes',nat:'I'},{n:'Indirect Incomes',nat:'I'},
 {n:'Purchase Accounts',nat:'E'},{n:'Direct Expenses',nat:'E'},{n:'Indirect Expenses',nat:'E'},
 {n:'Primary',nat:'L',sys:1}];
// Cash-flow class of the predefined groups (R3, proposed); a custom group takes its parent's. 'Cash' = the cash itself.
const CF_OF={'Capital Account':'Financing','Reserves & Surplus':'Financing','Loans (Liability)':'Financing','Secured Loans':'Financing','Unsecured Loans':'Financing',
  'Fixed Assets':'Investing','Investments':'Investing','Bank OD A/c':'Cash','Bank Accounts':'Cash','Cash-in-Hand':'Cash'};
// Every predefined group knows its parent ('p' = under the top-level group listed before it). The id of a predefined group is its name.
{let top=null;for(const g of GROUPS){g.parent=g.p?top:null;if(!g.p)top=g.n;g.cf=CF_OF[g.n]||(g.parent&&CF_OF[g.parent])||'Operating'}}
const BASE_GROUPS=GROUPS.slice();
// GROUPS / GM hold the predefined groups plus the open business's custom sub-groups, in tree order (rebuildGroups in core/balances.js)
const GM=Object.fromEntries(GROUPS.map(g=>[g.n,g]));
/* ---------- State ---------- */
function L(id,name,group,o={}){return Object.assign({id,name,group,code:'',pan:'',phone:'',opening:0,side:GM[group].nat==='A'||GM[group].nat==='E'?'Dr':'Cr',billwise:false,creditDays:0,creditLimit:0,bills:[],active:true,def:false,extra:{}},o)}
const TYPES={
 contra:{name:'Contra',key:'F4',prefix:'CTR',sketch:4,rule:'Moves money between cash and bank. Only Cash, Bank and Bank OD ledgers can be used.'},
 payment:{name:'Payment',key:'F5',prefix:'PMT',sketch:5,rule:'Money going out. Cash or Bank goes on the Cr side.'},
 receipt:{name:'Receipt',key:'F6',prefix:'RCT',sketch:6,rule:'Money coming in. Cash or Bank goes on the Dr side.'},
 journal:{name:'Journal',key:'F7',prefix:'JRN',sketch:7,rule:'Adjustments with no cash or bank: credit purchases, depreciation, corrections.'}};
// Voucher number prefixes are set per business in Business Setup. A saved voucher keeps the prefix it was saved with.
if(CUR.biz&&CUR.biz.prefix)for(const t in TYPES)TYPES[t].prefix=CUR.biz.prefix[t]||TYPES[t].prefix;
const TL={New:'New Ref',Against:'Against Ref',Advance:'Advance','On Account':'On Account'};
