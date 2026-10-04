/* Print preview of a voucher or of the open report */
// The heading of every print: the open business's name, address, PAN and phone (Business Setup), with the logo when it is set to print
function printHead(){const b=CUR.biz||{},bits=[b.address,b.pan?'PAN '+b.pan:'',b.phone].filter(Boolean).map(esc).join(' · ');
  return `<div class="ph">${b.logo&&b.printLogo!==false?`<img class="plogo" src="${esc(b.logo)}" alt="">`:''}<b>${esc(COMPANY)}</b><span>${bits}</span></div>`}
const printedBy=()=>`Printed by ${esc(USER)} on ${bsText(TODAY)}`;
function openPrint(id){
  const v=S.vouchers.find(x=>x.id===id);if(!v)return;const can=v.status==='Cancelled';
  const tot=v.lines.filter(l=>l.side==='Dr').reduce((a,l)=>a+cents(l.amt),0);
  const rows=v.lines.map(l=>{const L_=led(l.lid);const sub=[];
    if(l.inst&&l.inst.open&&l.inst.no)sub.push(`${l.inst.type} ${l.inst.no}${l.inst.date?', '+l.inst.date:''}`);
    for(const a of l.alloc)sub.push(`${a.t==='New'?'New Ref':a.t==='Against'?'Against Ref':a.t} ${a.ref||''} ${fmt(cents(a.amt))}`.replace(/\s+/g,' '));
    return `<tr><td>${l.side==='Cr'?'&nbsp;&nbsp;&nbsp;&nbsp;':''}${esc(L_.name)}${sub.length?`<div class="sub">${sub.map(esc).join(' · ')}</div>`:''}</td><td class="r num">${l.side==='Dr'?fmt(cents(l.amt)):''}</td><td class="r num">${l.side==='Cr'?fmt(cents(l.amt)):''}</td></tr>`}).join('');
  const m=$('#modal');m.hidden=false;$('#app').inert=true;
  m.innerHTML=`<div class="back" data-act="closeprint"></div><div class="sheet" role="dialog" aria-modal="true" aria-label="Print preview">
   <div class="sheet-bar"><b>Print preview</b><span class="muted" style="font-size:12.5px">The browser's print dialog opens here in the real app.</span><button class="ghost" data-act="closeprint">Close <kbd>Esc</kbd></button></div>
   <div class="paper">
    ${printHead()}
    <h3>${TYPES[v.type].name.toUpperCase()} VOUCHER</h3>
    <div class="pm"><span>No: ${vno(v.type,v.seq,v.pre)}</span><span>Date: ${bsText(v.date)} (BS)</span></div>
    ${can?'<div class="stamp">CANCELLED</div>':''}
    <table><thead><tr><th>Particulars</th><th class="r">Debit (NPR)</th><th class="r">Credit (NPR)</th></tr></thead><tbody>${rows}
    <tr class="tot"><td>Total</td><td class="r num">${fmt(tot)}</td><td class="r num">${fmt(tot)}</td></tr></tbody></table>
    ${v.narr?`<p><b>Narration:</b> ${esc(v.narr)}</p>`:''}
    ${S.q.q8?`<p class="words">${words(tot)}</p><div class="sig"><div>Prepared by</div><div>Checked by</div><div>Approved by</div><div>Received by</div></div>`:'<div class="off">Amount in words and signature lines are hidden (Q8 off)</div>'}
    <div class="pf"><span>${printedBy()}</span><span>Page 1 of 1</span></div>
   </div></div>`;
  m.querySelector('.sheet-bar .ghost').focus();
}
function closePrint(){const m=$('#modal');m.hidden=true;m.innerHTML='';$('#app').inert=false}
function printReport(){const clone=view().querySelector('.tp-body').cloneNode(true);
  clone.querySelectorAll('.sel').forEach(e=>e.classList.remove('sel'));clone.querySelectorAll('.lrsel,.rp-head .co,.rp-head .per').forEach(e=>e.remove());
  const m=$('#modal');m.hidden=false;$('#app').inert=true;
  m.innerHTML=`<div class="back" data-act="closeprint"></div><div class="sheet" role="dialog" aria-modal="true" aria-label="Print preview">
   <div class="sheet-bar"><b>Print preview</b><span class="muted" style="font-size:12.5px">The browser's print dialog opens here in the real app.</span><button class="ghost" data-act="closeprint">Close <kbd>Esc</kbd></button></div>
   <div class="paper">${printHead()}
    <h3>${esc(PAGE.title.toUpperCase())}</h3><div class="pm"><span>${periodText()}</span><span>All amounts in NPR</span></div>${clone.innerHTML}
    <div class="pf"><span>${printedBy()}</span><span>Page 1 of 1</span></div></div></div>`;
  m.querySelector('.sheet-bar .ghost').focus()}
function exportReport(){say('Export to PDF or Excel downloads here in the real app.')}
