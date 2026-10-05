/* Business Registration: every field is required (marked with a red *) except Phone.
   Whoever registers becomes the Owner. Everything else (logo, colours, numbering, ...) is in Business Setup, where this page leads. */
const BR=form({id:'br',v:{name:'',type:'',address:'',phone:'',email:'',books:'2083-04-01',pan:'',vat:false},accept:()=>registerBiz(),last:()=>registerBiz(),
  fields:[{k:'name',l:'Business name',req:1,ph:'English or नेपाली'},
    {k:'type',l:'Business type',req:1,type:'pick',items:()=>bizTypeItems().filter(t=>t.v),title:'Business Type',ph:'Select the type'},
    {k:'address',l:'Address',req:1},{k:'phone',l:'Phone',ph:'Optional'},{k:'email',l:'Business email',req:1,ph:'you@example.com'},
    {k:'books',l:'Books start date (BS)',req:1,ph:'yyyy-mm-dd',help:'The first day you keep books in BCG ERP. Example: 2083-04-01 (1 Shrawan 2083).',check:booksProblem},
    {k:'pan',l:'PAN',req:1,ph:'9 digits',check:panProblem},
    {k:'vat',l:'VAT registered',req:1,type:'yn',help:'Click, or press Space, to switch Yes / No.'}]});
function registerBiz(){const v=BR.v;
  if(!v.name.trim())return fmBad(BR,'name','Enter the business name.');
  if(!v.type)return fmBad(BR,'type','Select the business type.');
  if(!v.address.trim())return fmBad(BR,'address','Enter the address.');
  if(v.phone.trim()&&!isPhone(v.phone))return fmBad(BR,'phone','Enter the phone number with digits only, or leave it empty.');
  if(!v.email.trim())return fmBad(BR,'email','Enter the business email.');
  if(!isEmail(v.email))return fmBad(BR,'email','Enter a valid email address.');
  let m=booksProblem(v.books);if(m)return fmBad(BR,'books',m);
  if(!v.pan.trim())return fmBad(BR,'pan','Enter the PAN (9 digits).');
  m=panProblem(v.pan);if(m)return fmBad(BR,'pan',m);
  const go2=()=>{const b=DB.createBusiness(CUR.user.id,{...v,pan:v.pan.trim(),books:v.books.trim()});DB.useBiz(b.id);
    flash(`${b.name} is registered and you are its Owner. Add the rest now or later.`);location.href=href('setup')};
  const twin=panTwin(v.pan.trim());
  if(twin){ask(`PAN ${v.pan.trim()} is already used by ${dot(twin.name)} Register this business with the same PAN anyway?`,go2);return}
  go2()}
const hasOthers=()=>DB.bizList(CUR.user.id).length||DB.invitesFor(CUR.user.email).length;
start({id:'bizreg',bare:true,auth:true,access:'user',title:'Business Registration',
  view:()=>authCard({step:2,title:'Register your business',lead:'Fields marked <span class="req">*</span> are required. You become the Owner, and you can change everything later in Business Setup.',
    body:formHtml(BR)+auBtn('Register business','Ctrl+A'),foot:hasOthers()?`<a href="${href('selbiz')}">Cancel</a>`:''}),
  focus:()=>'#br-name',
  keys:()=>[{k:'Enter',l:'Next field'},{k:'Backspace',l:'Previous field'},{k:'Ctrl+A',l:'Register',a:registerBiz},{gap:1},{k:'Alt+Q',l:'Log out',a:logOut},
    ...(hasOthers()?[escKey()]:[])],
  back(){if(hasOthers())go('selbiz')}});
