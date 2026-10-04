/* Cash Flow Statement page */
/* ---------- Cash Flow Statement (direct method) ---------- */
// Cash and bank lines are classified by the group of the other ledger on the same voucher. Moves between cash/bank ledgers (Contra) are left out.
// The class comes from the group (R3, proposed; custom groups inherit their parent's): Operating, Investing or Financing.
const cfCat=g=>{const c=GM[g]&&GM[g].cf;return c==='Investing'||c==='Financing'?c:'Operating'};
function vCF(){ITEMS=[];const to=S.rep.to,cashL=S.ledgers.filter(isCash),ids=new Set(cashL.map(l=>l.id));
  const op=cashL.reduce((a,l)=>a+(l.side==='Dr'?1:-1)*l.opening,0),acc={Operating:{},Investing:{},Financing:{}};
  for(const v of S.vouchers){if(v.status!=='Active'||v.date>to||!v.lines.some(l=>ids.has(l.lid)))continue;
    for(const ln of v.lines){if(ids.has(ln.lid))continue;const l=led(ln.lid),c=cents(ln.amt)*(ln.side==='Cr'?1:-1);
      const k=cfCat(l.group),g=acc[k][l.group]=acc[k][l.group]||{i:0,o:0};if(c>0)g.i+=c;else g.o-=c}}
  const two=(name,i,o,drill,cls='',ind=0)=>{const s=rowSel(drill);return `<tr class="${cls} ${s}" ${drill?`data-i="${ITEMS.length-1}"`:''}><td style="padding-left:${10+ind*18}px">${esc(name)}</td><td class="r num">${i?fmt(i):''}</td><td class="r num">${o?fmt(o):''}</td></tr>`};
  const signed=(name,c,cls)=>two(name,c>=0?c:0,c<0?-c:0,null,cls);
  let rows=signed('Opening Balance (Cash and Bank)',op,'grp'),net=0;
  for(const cat of['Operating','Investing','Financing']){let ti=0,to2=0,r='';
    for(const g of Object.keys(acc[cat])){const{i,o}=acc[cat][g];if(!i&&!o)continue;r+=two(gname(g),i,o,{group:g},'ldg',1);ti+=i;to2+=o}
    if(!r)continue;rows+=`<tr class="grp"><td colspan="3">${cat} Activities</td></tr>${r}${signed(`Net Cash from ${cat} Activities`,ti-to2,'sub')}`;net+=ti-to2}
  rows+=signed('Net Increase / (Decrease) in Cash and Bank',net,'grp');
  const cl=op+net,totalI=Math.max(cl,0);
  rows+=`<tr class="tot"><td>Closing Balance (Cash and Bank)</td><td class="r num">${cl>=0?fmt(cl):''}</td><td class="r num">${cl<0?fmt(-cl):''}</td></tr>`;
  return tp('Cash Flow Statement',COMPANY,repHead()+`<table class="rep"><thead><tr><th>Particulars</th><th class="r">Inflow</th><th class="r">Outflow</th></tr></thead><tbody>${rows}</tbody></table>`)}
start(reportPage({id:'cf',title:'Cash Flow Statement',view:vCF}));
