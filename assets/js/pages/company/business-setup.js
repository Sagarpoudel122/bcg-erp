/* Business Setup: the business profile and branding (the same record Business Tools uses as Business Information), tax,
   books (financial year, books-beginning date, period lock) and voucher numbering. Admin changes it; Accountant, Manager
   and Viewer can only look. Only the Owner locks books or deletes the business. Nothing here blocks using the app (B7). */
const BZ=CUR.biz;
const canEdit=()=>can('setup.edit');
const notEdit=()=>!canEdit();
const SV=()=>({name:BZ.name,type:BZ.type||'',address:BZ.address,phone:BZ.phone,email:BZ.email||'',logo:BZ.logo||'',printLogo:BZ.printLogo!==false,c1:BZ.c1||'',c2:BZ.c2||'',
  pan:BZ.pan||'',vat:!!BZ.vat,vatRate:BZ.vatRate||'13',fy:'1 Shrawan to end of Ashadh · FY 2083/84',books:BZ.books,lock:BZ.lockTo==null?'':isoText(BZ.lockTo),
  contra:BZ.prefix.contra,payment:BZ.prefix.payment,receipt:BZ.prefix.receipt,journal:BZ.prefix.journal});
function lockProblem(v){v=String(v||'').trim();if(!v)return'';const r=parseDate(v,{m:0,d:1});if(!r)return DATE_HELP+' Leave it empty to unlock.';
  if(serial(r.m,r.d)>TODAY)return'Books can be locked up to today at the latest.';return''}
const pfxProblem=v=>/^[A-Z0-9]{1,6}$/.test(String(v||'').trim().toUpperCase())?'':'A prefix is 1 to 6 letters or digits, for example PMT.';
const ST=form({id:'st',v:{},accept:()=>saveSetup(),fields:[
  {sec:'Business',k:'name',l:'Business name',ro:notEdit},{k:'type',l:'Business type',type:'pick',items:bizTypeItems,title:'Business Type',ro:notEdit},
  {k:'address',l:'Address',ro:notEdit},{k:'phone',l:'Phone',ro:notEdit},{k:'email',l:'Business email',ph:'Optional',ro:notEdit},
  {sec:'Branding',k:'logo',l:'Logo',type:'file',ph:'Space: choose a picture',hint:'Space chooses a picture (PNG, JPG or SVG, up to 2 MB). Delete removes it.',ro:notEdit},
  {k:'printLogo',l:'Logo on prints',type:'yn',ro:notEdit,when:()=>!!ST.v.logo},
  {k:'c1',l:'Brand colour 1',type:'color',ph:'#RRGGBB',ro:notEdit,check:hexProblem},{k:'c2',l:'Brand colour 2',type:'color',ph:'#RRGGBB',ro:notEdit,check:hexProblem},
  {sec:'Tax',k:'pan',l:'PAN',ph:'Optional, 9 digits',ro:notEdit,check:panProblem},{k:'vat',l:'VAT registered',type:'yn',ro:notEdit,change:()=>{}},
  {k:'vatRate',l:'VAT rate %',ro:notEdit,when:()=>ST.v.vat,check:rateProblem},
  {sec:'Books',k:'fy',l:'Financial year',type:'ro'},
  {k:'books',l:'Books beginning from (BS)',ph:'yyyy-mm-dd',ro:notEdit,check:booksProblem},
  {k:'lock',l:'Lock books up to',ph:'Not locked',ro:()=>!can('owner'),check:lockProblem,hint:'Owner only. Vouchers up to this day cannot be made, altered or cancelled. Empty = not locked.'},
  {sec:'Voucher numbering',k:'contra',l:'Contra prefix',ro:notEdit,check:pfxProblem},{k:'payment',l:'Payment prefix',ro:notEdit,check:pfxProblem},
  {k:'receipt',l:'Receipt prefix',ro:notEdit,check:pfxProblem},{k:'journal',l:'Journal prefix',ro:notEdit,check:pfxProblem}]});
// How much of the optional information is filled in (B7: nothing is locked, the % only shows what is missing)
const setupPct=()=>Math.round((5-setupMissing(BZ).length)/5*100)
const LABEL={name:'name',type:'type',address:'address',phone:'phone',email:'email',logo:'logo',printLogo:'logo on prints',c1:'brand colour 1',c2:'brand colour 2',
  pan:'PAN',vat:'VAT registered',vatRate:'VAT rate',books:'books beginning',contra:'Contra prefix',payment:'Payment prefix',receipt:'Receipt prefix',journal:'Journal prefix'};
function saveSetup(){if(!canEdit()){say('Only an Admin can change the business setup.','bad');return}
  const v=ST.v,t=k=>String(v[k]||'').trim();
  if(!t('name'))return fmBad(ST,'name','Type the business name.');
  if(!t('address'))return fmBad(ST,'address','Type the address.');
  if(t('phone')&&!isPhone(v.phone))return fmBad(ST,'phone','Type the phone number with digits only, or leave it empty.');
  if(t('email')&&!isEmail(v.email))return fmBad(ST,'email','Type a valid email address, or leave it empty.');
  for(const k of ['c1','c2','pan']){const m=(k==='pan'?panProblem:hexProblem)(v[k]);if(m)return fmBad(ST,k,m)}
  if(v.vat&&!t('pan'))return fmBad(ST,'pan','A VAT registered business needs its PAN (the VAT number is the PAN).');
  if(v.vat&&rateProblem(t('vatRate')))return fmBad(ST,'vatRate',rateProblem(t('vatRate')));
  let m=booksProblem(t('books'));if(m)return fmBad(ST,'books',m);
  const bk=Math.max(0,bsIsoSerial(t('books'))),early=S.vouchers.filter(x=>x.status==='Active'&&x.date<bk).length;
  if(early)return fmBad(ST,'books',`${early} voucher${early>1?'s are':' is'} dated before ${bsText(bk)}. Pick an earlier day, or cancel those vouchers first.`);
  if(can('owner')){m=lockProblem(v.lock);if(m)return fmBad(ST,'lock',m)}
  const pf={};for(const k of Object.keys(TYPES)){m=pfxProblem(v[k]);if(m)return fmBad(ST,k,m);pf[k]=t(k).toUpperCase()}
  if(new Set(Object.values(pf)).size<4)return fmBad(ST,'journal','Each voucher type needs its own prefix.');
  const old=SV(),neu={...v,name:t('name'),c1:t('c1'),c2:t('c2'),address:t('address'),phone:t('phone'),email:normEmail(v.email),pan:t('pan'),vatRate:t('vatRate')||'13',books:t('books'),...pf};
  const changed=Object.keys(LABEL).filter(k=>String(old[k])!==String(neu[k])).map(k=>LABEL[k]);
  Object.assign(BZ,{name:neu.name,type:neu.type,address:neu.address,phone:neu.phone,email:neu.email,logo:neu.logo,printLogo:!!neu.printLogo,c1:t('c1'),c2:t('c2'),
    pan:neu.pan,vat:!!neu.vat,vatRate:neu.vatRate,books:neu.books,prefix:pf});
  if(changed.length)auditNote('Business setup','Changed: '+changed.join(', '));
  if(can('owner')){const r=t('lock')?parseDate(t('lock'),{m:0,d:1}):null,to=r?serial(r.m,r.d):null;
    if(to!==BZ.lockTo){BZ.lockTo=to;auditNote(to==null?'Books unlocked':'Books locked',to==null?'No period is locked':`Up to ${bsText(to)}`);changed.push('lock')}}
  DB.save();
  // the rest of this page follows the new values straight away
  COMPANY=BZ.name;LOCK=BZ.lockTo==null?-1:BZ.lockTo;BOOKS=bk;for(const k in TYPES)TYPES[k].prefix=pf[k];const vl=led('vat');if(vl)vl.extra.rate=BZ.vatRate;
  ST.v=SV();render('#st-name');say(changed.length?'Business setup saved.':'Nothing was changed.',changed.length?'ok':'')}
function delBiz(){if(!can('owner'))return;
  ask(`Delete ${BZ.name}? Nobody can open it any more. You can restore it from Select Business for 30 days; after that it is removed for good with all its data.`,()=>{
    BZ.deleted=now();DB.save();auditNote('Business deleted','Can be restored for 30 days');Store.save();Store.ready=false;DB.useBiz('');
    flash(`${BZ.name} is deleted. You can restore it here for 30 days.`);location.href=href('selbiz')})}
const dirty=()=>JSON.stringify(ST.v)!==JSON.stringify(SV());
start({id:'setup',title:'Business Setup',init(){ST.v=SV()},view:()=>tp('Business Setup',canEdit()?`${setupPct()}% complete`:'View only',formHtml(ST)),focus:()=>'#st-name',
  keys:()=>[{k:'Enter',l:'Next field'},{k:'Backspace',l:'Previous field'},...(canEdit()?[{gap:1},{k:'Ctrl+A',l:'Accept',a:saveSetup}]:[]),
    ...(can('owner')?[{gap:1},{k:'Alt+D',l:'Delete business',a:delBiz}]:[]),{gap:1},escKey()],
  back(){if(canEdit()&&dirty())ask('Leave without saving the changes?',()=>{ST.v=SV();focusSidebar()});else focusSidebar()}});
