/* Bikram Sambat calendar for the sample FY 2083/84 and date text <-> date */
/* ---------- Calendar (simplified BS for FY 2083/84) ---------- */
const MONTHS=['Shrawan','Bhadra','Asoj','Kartik','Mangsir','Poush','Magh','Falgun','Chaitra','Baisakh','Jestha','Ashadh'];
const MDAYS=[31,31,31,30,29,30,29,30,30,31,32,31];
function serial(m,d){let s=0;for(let i=0;i<m;i++)s+=MDAYS[i];return s+d-1}
function bs(s){let y=0;while(s>=365){s-=365;y++}while(s<0){s+=365;y--}let m=0;while(s>=MDAYS[m]){s-=MDAYS[m];m++}return{m,d:s+1,y:2083+y+(m>=9?1:0)}}
const TODAY=serial(2,15);
// Set for the open business and the signed-in user in core/data.js:
// LOCK  books are locked up to this day (-1 = not locked), BOOKS  first day of the books in this FY,
// AD_MODE  the user shows dates in AD (My Account). Dates are always kept as BS day numbers.
let LOCK=-1,BOOKS=0,AD_MODE=false;
// The sample calendar starts 1 Shrawan 2083 on 17 July 2026
const AD0=Date.UTC(2026,6,17),ADM=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const adDate=s=>new Date(AD0+s*864e5);
const bsText=s=>{if(AD_MODE){const a=adDate(s);return `${a.getUTCDate()} ${ADM[a.getUTCMonth()]} ${a.getUTCFullYear()}`}const b=bs(s);return `${b.d} ${MONTHS[b.m]} ${b.y}`};
const bsShort=s=>{if(AD_MODE){const a=adDate(s);return `${a.getUTCDate()} ${ADM[a.getUTCMonth()]}`}const b=bs(s);return `${b.d} ${MONTHS[b.m]}`};
// Dates are typed as yyyy-mm-dd with the real BS month number (Baisakh = 01 ... Shrawan = 04 ... Asoj = 06 ... Chaitra = 12),
// or as an AD date (2026-10-01) when the user shows AD. The older short forms still work: "15" (day, same month) and "15 Asoj" / "15 Asoj 2083".
const bsMonthNo=m=>(m+3)%12+1, bsYear=m=>2083+(m>=9?1:0);
const isoText=s=>{if(AD_MODE)return adDate(s).toISOString().slice(0,10);const b=bs(s);return `${b.y}-${String(bsMonthNo(b.m)).padStart(2,'0')}-${String(b.d).padStart(2,'0')}`};
let DATE_HELP='Type the date as yyyy-mm-dd inside FY 2083/84, for example 2083-06-15.';
function parseDate(txt,cur){
  const iso=String(txt).trim().match(/^(\d{4})[-\/.\s](\d{1,2})[-\/.\s](\d{1,2})$/);
  if(iso&&(+iso[1]===2026||+iso[1]===2027)){const t=Date.UTC(+iso[1],+iso[2]-1,+iso[3]),a=new Date(t);   // an AD date
    if(a.getUTCMonth()!==+iso[2]-1)return null;const s=Math.round((t-AD0)/864e5);if(s<0||s>=365)return null;const b=bs(s);return{m:b.m,d:b.d}}
  if(iso){const mn=+iso[2],day=+iso[3];if(mn<1||mn>12)return null;const m=(mn+8)%12;
    return +iso[1]===bsYear(m)&&day>=1&&day<=MDAYS[m]?{m,d:day}:null}
  const p=String(txt).trim().toLowerCase().replace(/[\/\-.,]/g,' ').split(/\s+/).filter(Boolean);
  if(!p.length||!/^\d+$/.test(p[0]))return null;const day=+p[0];let m=cur.m;
  if(p[1]&&!/^\d{4}$/.test(p[1]))m=/^\d+$/.test(p[1])?+p[1]-1:MONTHS.findIndex(x=>x.toLowerCase().startsWith(p[1]));
  if(m<0||m>11||day<1||day>MDAYS[m])return null;return{m,d:day}}
// A BS date typed as yyyy-mm-dd in any year (for example a books-beginning date). Returns the day number in FY 2083/84,
// -1 when it is before the year, 1e6 when after it, null when it is not a date.
function bsIsoSerial(t){const j=String(t||'').trim().match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);if(!j)return null;
  const y=+j[1],mn=+j[2],d=+j[3];if(y<1970||mn<1||mn>12||d<1||d>32)return null;
  const key=y*100+mn;if(key<208304)return -1;if(key>208403)return 1e6;
  const m=(mn+8)%12;return d>MDAYS[m]?null:serial(m,d)}
