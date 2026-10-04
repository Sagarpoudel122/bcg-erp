/* Amounts: paisa integers, Nepali digit grouping, words */
/* ---------- Money ---------- */
const cents=x=>{const n=parseFloat(String(x??'').replace(/,/g,''));return isFinite(n)?Math.round(n*100):0};
function fmt(c){const neg=c<0;c=Math.abs(c);let i=String(Math.floor(c/100)),f=String(c%100).padStart(2,'0');let last=i.slice(-3),rest=i.slice(0,-3);if(rest)last=','+last;rest=rest.replace(/\B(?=(\d{2})+(?!\d))/g,',');return (neg?'-':'')+rest+last+'.'+f}
function words(c){
  const a=['','One','Two','Three','Four','Five','Six','Seven','Eight','Nine','Ten','Eleven','Twelve','Thirteen','Fourteen','Fifteen','Sixteen','Seventeen','Eighteen','Nineteen'];
  const b=['','','Twenty','Thirty','Forty','Fifty','Sixty','Seventy','Eighty','Ninety'];
  const two=x=>x<20?a[x]:b[Math.floor(x/10)]+(x%10?' '+a[x%10]:'');
  const three=x=>x>=100?a[Math.floor(x/100)]+' Hundred'+(x%100?' '+two(x%100):''):two(x);
  let r=Math.floor(c/100);const p=c%100;const parts=[];
  const cr=Math.floor(r/1e7);r%=1e7;const lk=Math.floor(r/1e5);r%=1e5;const th=Math.floor(r/1000);r%=1000;
  if(cr)parts.push(three(cr)+' Crore');if(lk)parts.push(two(lk)+' Lakh');if(th)parts.push(two(th)+' Thousand');if(r)parts.push(three(r));
  return 'Rupees '+(parts.join(' ')||'Zero')+(p?' and '+two(p)+' Paisa':'')+' Only';
}
const fmtIn=raw=>{const c=cents(raw);return c>0?fmt(c):''};
const normAmt=raw=>{const c=cents(raw);return c>0?(c/100).toFixed(2):''};
