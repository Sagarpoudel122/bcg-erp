/* The date field shared by the voucher and invoice pages: BS date shown as text, edited as yyyy-mm-dd, checked against the lock and books-begin dates.
   Works on draft(S.view).date, so any page whose draft has {m,d} uses it with an input marked data-f="vdate" data-date. */
const dateHint=s=>s<=LOCK?'<span class="bad">Locked period</span>':s<BOOKS?'<span class="bad">Before the books begin</span>':s>TODAY?'<span class="warn">Future date</span>':'';
function commitDate(t,quiet){const d=draft(S.view),r=parseDate(t.value,d.date);
  if(!r){const s0=serial(d.date.m,d.date.d);t.value=document.activeElement===t?isoText(s0):bsText(s0);if(!quiet)say(DATE_HELP,'bad');return false}
  d.date={m:r.m,d:r.d};const s=serial(r.m,r.d);t.value=bsText(s);const h=$('#dhint');if(h)h.innerHTML=dateHint(s);return true}
FIELD.vdate={date:()=>serial(draft(S.view).date.m,draft(S.view).date.d),enter:t=>{if(commitDate(t))moveFocus(t,1)},blur:t=>commitDate(t,true)};
