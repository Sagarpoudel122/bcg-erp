/* Group Summary page (drill-down from a report; address ?g=Group name) */
/* ---------- Group Summary (drill-down from any report) ---------- */
function vGsum(){ITEMS=[];const B=balances(S.rep.to),g=S.gs.group;let dr=0,cr=0,rows='';
  for(const k of gKids(g)){const t=gTotal(k,B);if(!t)continue;rows+=drRow(gname(k),t,{group:k},'grp');t>0?dr+=t:cr-=t}
  for(const l of S.ledgers.filter(x=>x.group===g)){const t=B[l.id].cl;if(!t)continue;rows+=drRow(l.name,t,{ledger:l.id},'ldg',1);t>0?dr+=t:cr-=t}
  return tp('Group Summary',COMPANY,repHead(gname(g))+drTable(rows,dr,cr))}
start(reportPage({id:'gsum',title:'Group Summary',view:vGsum,init(){S.gs={group:param('g')||''}}}));
