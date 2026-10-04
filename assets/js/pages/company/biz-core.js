/* Business fields shared by Business Registration and Business Setup */
const BIZ_TYPES=['Trading','Service','Manufacturing','Other'];
const bizTypeItems=()=>[{v:'',label:'Not set'},...BIZ_TYPES.map(t=>({v:t,label:t}))];
const panProblem=v=>String(v||'').trim()&&!/^\d{9}$/.test(String(v).trim())?'PAN must be exactly 9 digits.':'';
const hexProblem=v=>String(v||'').trim()&&!validHex(String(v).trim())?'Type the colour as # and 6 hex digits, for example #0B5E57.':'';
const rateProblem=v=>{const n=+v;return v===''||isNaN(n)||n<=0||n>=100?'Type the VAT rate as a number, for example 13.':''};
// The first day of the books, always typed in BS (it can be in an earlier year)
function booksProblem(v){const s=bsIsoSerial(v);if(s==null)return'Type the date as yyyy-mm-dd in BS, for example 2083-04-01 (1 Shrawan 2083).';
  if(s>TODAY)return'The books cannot begin after today.';return''}
// The optional details still missing (B7: nothing is locked, this only shows what is left; the Dashboard and Business Setup use it)
const setupMissing=b=>[!b.type&&'business type',!b.email&&'email',!b.pan&&'PAN',!b.logo&&'logo',!(validHex(b.c1)&&validHex(b.c2))&&'brand colours'].filter(Boolean);
// Another of my businesses with the same PAN (allowed, with a warning: PAN is not unique on the platform)
const panTwin=(pan,except)=>pan?DB.bizList(UID||CUR.user.id).map(x=>x.b).find(b=>b.pan===pan&&b.id!==except):null;
