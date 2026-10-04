/* Business Registration: only what is required to start (name, address, phone, books-beginning date) plus a few optional fields.
   Whoever registers becomes the Owner. Everything else (logo, colours, numbering, ...) is in Business Setup, where this page leads. */
const BR=form({id:'br',v:{name:'',type:'',address:'',phone:'',email:'',books:'2083-04-01',pan:'',vat:false},accept:()=>registerBiz(),
  fields:[{k:'name',l:'Business name',ph:'English or नेपाली'},{k:'type',l:'Business type',type:'pick',items:bizTypeItems,title:'Business Type'},
    {k:'address',l:'Address'},{k:'phone',l:'Phone'},{k:'email',l:'Business email',ph:'Optional'},
    {k:'books',l:'Books beginning from (BS)',ph:'yyyy-mm-dd',hint:'The first day you keep books in BCG ERP, for example 2083-04-01 (1 Shrawan 2083).',check:booksProblem},
    {k:'pan',l:'PAN',ph:'Optional, 9 digits',check:panProblem},{k:'vat',l:'VAT registered',type:'yn'}]});
function registerBiz(){const v=BR.v;
  if(!v.name.trim())return fmBad(BR,'name','Type the business name.');
  if(!v.address.trim())return fmBad(BR,'address','Type the address.');
  if(!isPhone(v.phone))return fmBad(BR,'phone','Type the phone number.');
  if(v.email.trim()&&!isEmail(v.email))return fmBad(BR,'email','Type a valid email address, or leave it empty.');
  let m=booksProblem(v.books);if(m)return fmBad(BR,'books',m);
  m=panProblem(v.pan);if(m)return fmBad(BR,'pan',m);
  if(v.vat&&!v.pan.trim())return fmBad(BR,'pan','A VAT registered business needs its PAN (the VAT number is the PAN).');
  const go2=()=>{const b=DB.createBusiness(CUR.user.id,{...v,pan:v.pan.trim(),books:v.books.trim()});DB.useBiz(b.id);
    flash(`${b.name} is registered and you are its Owner. Add the rest now or later.`);location.href=href('setup')};
  const twin=panTwin(v.pan.trim());
  if(twin){ask(`PAN ${v.pan.trim()} is already used by ${dot(twin.name)} Register this business with the same PAN anyway?`,go2);return}
  ask(`Register ${v.name.trim()}?`,go2)}
start({id:'bizreg',bare:true,access:'user',title:'Business Registration',view:()=>tp('Business Registration',CUR.user.name,formHtml(BR)),focus:()=>'#br-name',
  keys:()=>[{k:'Enter',l:'Next field'},{k:'Backspace',l:'Previous field'},{k:'Ctrl+A',l:'Register',a:registerBiz},{gap:1},{k:'Alt+Q',l:'Log out',a:logOut},
    ...(DB.bizList(CUR.user.id).length||DB.invitesFor(CUR.user.email).length?[escKey()]:[])],
  back(){if(DB.bizList(CUR.user.id).length||DB.invitesFor(CUR.user.email).length)go('selbiz')}});
