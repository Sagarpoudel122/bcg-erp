/* Trial Balance page */
/* ---------- Trial Balance ---------- */
function vTB(){ITEMS=[];const B=balances(S.rep.to);let dr=0,cr=0,rows='';
  for(const g of GTREE.top){const t=gTotal(g,B);if(!t)continue;rows+=drRow(gname(g),t,{group:g},'grp');if(t>0)dr+=t;else cr-=t}
  const net=dr-cr;   // opening balances that do not tally show as a line, like Tally
  if(net){rows+=drRow('Difference in Opening Balances',-net,null,'diffrow');if(net>0)cr+=net;else dr-=net}
  return tp('Trial Balance',COMPANY,repHead()+drTable(rows,dr,cr))}
start(reportPage({id:'tb',title:'Trial Balance',view:vTB}));
