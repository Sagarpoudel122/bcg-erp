/* Balance Sheet page */
function vBS(){ITEMS=[];const B=balances(S.rep.to),L=[],A=[];
  for(const g of GTREE.top){if(GM[g].sys)continue;const t=gTotal(g,B);if(!t)continue;
    if(GM[g].nat==='L')L.push({name:gname(g),amt:-t,drill:{group:g}});else if(GM[g].nat==='A')A.push({name:gname(g),amt:t,drill:{group:g}})}
  const{prof,open}=plResult(B),res=open+prof;   // profit carried into Profit & Loss A/c, as in Tally
  if(res>0)L.push({name:'Profit & Loss A/c',amt:res,drill:{view:'pl'}});else if(res<0)A.push({name:'Profit & Loss A/c',amt:-res,drill:{view:'pl'}});
  const tl=L.reduce((a,x)=>a+x.amt,0),ta=A.reduce((a,x)=>a+x.amt,0),diff=tl-ta;
  if(diff>0)A.push({name:'Difference in Opening Balances',amt:diff,cls:'diffrow'});else if(diff<0)L.push({name:'Difference in Opening Balances',amt:-diff,cls:'diffrow'});
  const t=Math.max(tl,ta);
  return tp('Balance Sheet',COMPANY,repHead()+sideTable('Liabilities','Assets',[{L,R:A,lt:t,rt:t}]))}
start(reportPage({id:'bs',title:'Balance Sheet',view:vBS}));
