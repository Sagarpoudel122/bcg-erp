/* Shared parts of the HRM screens: status tags, month movement, print preview, salary detail layout */
const stTag=st=>{const c={Approved:'ok',Paid:'ok',Pending:'warn',Rejected:'bad'}[st];return st?`<span class="tag ${c||''}">${esc(st)}</span>`:''};
const attTag=r=>{const t=STAT[r.st];return r.st==='A'?`<span class="tag bad">${t}</span>`:r.st==='L'?`<span class="tag warn">${t}${r.type?' · '+esc(r.type):''}</span>`:r.st==='P'?`<span class="tag ok">${t}</span>`:`<span class="muted">${t}</span>`};
// ← → change the month (only up to the month that is running now); returns true when it was a month key
function monthKey(e,state,after){const k=e.key;
  if(k!=='ArrowLeft'&&k!=='ArrowRight')return false;stop(e);
  state.m=Math.max(0,Math.min(CUR_M,state.m+(k==='ArrowRight'?1:-1)));if(state.sel!==undefined)state.sel=0;(after||render)();return true}
// Print preview, the same sheet as the Account reports
function hrSheet(title,meta,body){
  const m=$('#modal');m.hidden=false;$('#app').inert=true;
  m.innerHTML=`<div class="back" data-act="closeprint"></div><div class="sheet" role="dialog" aria-modal="true" aria-label="Print preview">
   <div class="sheet-bar"><b>Print preview</b><span class="muted" style="font-size:12.5px">The browser's print dialog opens here in the real app.</span><button class="ghost" data-act="closeprint">Close <kbd>Esc</kbd></button></div>
   <div class="paper">${printHead()}
    <h3>${esc(title.toUpperCase())}</h3><div class="pm"><span>${esc(meta)}</span><span>All amounts in NPR</span></div>${body}
    <div class="pf"><span>${printedBy()}</span><span>Page 1 of 1</span></div></div></div>`;
  m.querySelector('.sheet-bar .ghost').focus()}
const span=l=>l.from===l.to?bsShort(l.from):`${bsShort(l.from)} – ${bsShort(l.to)}`;

/* Salary detail for one employee and month, used on screen and in the print preview */
function slipHtml(eid,m){const e=emp(eid),r=payRec(eid,m);if(!e||!r)return'';
  const row=(a,b,cls='')=>`<tr class="${cls}"><td>${a}</td><td class="r num">${b}</td></tr>`;
  return `<div class="who"><div><span>Employee</span> ${esc(e.name)}</div><div><span>Code</span> ${esc(e.code)}</div><div><span>Designation</span> ${esc(e.desig)}</div><div><span>Month</span> ${mName(m)}</div></div>
   <table class="rep"><tbody>${row('Monthly salary',fmt(r.gross))}${row(`Unpaid days (${r.unpaid})`,r.ded?'- '+fmt(r.ded):fmt(0))}<tr class="net"><td>Net salary paid</td><td class="r num">${fmt(r.net)}</td></tr></tbody></table>
   <p class="words">${words(r.net)}</p>`}
