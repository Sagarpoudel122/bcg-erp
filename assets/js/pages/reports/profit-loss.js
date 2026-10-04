/* Profit & Loss page */
/* ---------- Profit & Loss ---------- */
function vPL(){ITEMS=[];const B=balances(S.rep.to);
  const pur=gTotal('Purchase Accounts',B),dex=gTotal('Direct Expenses',B),sal=-gTotal('Sales Accounts',B),din=-gTotal('Direct Incomes',B),iex=gTotal('Indirect Expenses',B),iin=-gTotal('Indirect Incomes',B);
  const gp=sal+din-pur-dex,net=gp+iin-iex,add=(list,name,amt,g,cls)=>{if(amt)list.push({name,amt,drill:g?{group:g}:null,cls})};
  const L1=[],R1=[],L2=[],R2=[];
  add(L1,gname('Purchase Accounts'),pur,'Purchase Accounts');add(L1,gname('Direct Expenses'),dex,'Direct Expenses');if(gp>0)add(L1,'Gross Profit c/o',gp,null,'grp');
  add(R1,gname('Sales Accounts'),sal,'Sales Accounts');add(R1,gname('Direct Incomes'),din,'Direct Incomes');if(gp<0)add(R1,'Gross Loss c/o',-gp,null,'grp');
  if(gp<0)add(L2,'Gross Loss b/f',-gp,null,'grp');add(L2,gname('Indirect Expenses'),iex,'Indirect Expenses');if(net>0)add(L2,'Net Profit',net,null,'grp');
  if(gp>0)add(R2,'Gross Profit b/f',gp,null,'grp');add(R2,gname('Indirect Incomes'),iin,'Indirect Incomes');if(net<0)add(R2,'Net Loss',-net,null,'grp');
  const t1=Math.max(pur+dex,sal+din),t2=Math.max((gp<0?-gp:0)+iex+(net>0?net:0),(gp>0?gp:0)+iin+(net<0?-net:0));
  return tp('Profit & Loss A/c',COMPANY,repHead()+sideTable('Particulars','Particulars',[{L:L1,R:R1,lt:t1,rt:t1},{L:L2,R:R2,lt:t2,rt:t2}]))}
start(reportPage({id:'pl',title:'Profit & Loss A/c',view:vPL}));
