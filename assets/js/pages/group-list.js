/* List of Groups (chart of accounts): the predefined groups (R1, proposed tree, needs accountant review) and this business's
   custom sub-groups, indented under their parent. Enter alters, N creates, Delete removes a custom group with no ledgers or sub-groups (R4). */
const GL={sel:0,list:[]};
const NATURE={A:'Asset',L:'Liability',I:'Income',E:'Expense'};
const cfText=c=>c==='Cash'?'Cash itself':c;
const depth=id=>{let d=0;for(let g=GM[id];g&&g.parent;g=GM[g.parent])d++;return d};
const ledgersIn=id=>S.ledgers.filter(l=>l.group===id).length;
function vGroups(){const L=GL.list=GROUPS.filter(g=>!g.sys&&(!g.q1||S.q.q1));GL.sel=Math.max(0,Math.min(GL.sel,L.length-1));
  let sec='',rows='';
  L.forEach((g,i)=>{const s=g.nat==='A'||g.nat==='L'?'Balance Sheet':'Profit & Loss';if(s!==sec){sec=s;rows+=`<tr class="gsec"><td colspan="4">${s}</td></tr>`}
    const n=ledgersIn(g.n),renamed=!g.custom&&gname(g.n)!==g.n;
    rows+=`<tr class="${i===GL.sel?'sel':''}" data-i="${i}"><td style="padding-left:${10+depth(g.n)*22}px">${esc(gname(g.n))}${g.custom?' <span class="tag">Custom</span>':renamed?` <span class="muted">(${esc(g.n)})</span>`:''}</td>
      <td>${NATURE[g.nat]}</td><td>${cfText(g.cf)}</td><td class="r num">${n||''}</td></tr>`});
  return tp('List of Groups',COMPANY,`<table><thead><tr><th>Group</th><th>Nature</th><th>Cash flow</th><th class="r">Ledgers</th></tr></thead><tbody>${rows}</tbody></table>`)}
// Enter: alter (Admin, Accountant); Manager and Viewer open the group's figures instead
function openGroup(){const g=GL.list[GL.sel];if(!g)return;
  if(can('groups.edit'))navigate('group',{g:g.n});else if(can('reports'))navigate('gsum',{g:g.n})}
function delGroup(){const g=GL.list[GL.sel];if(!g||!can('groups.edit'))return;
  if(!g.custom)return say(`${gname(g.n)} is a predefined group and cannot be deleted.${S.q.r2?' You can rename it (Enter).':''}`,'bad');
  const n=ledgersIn(g.n),k=gKids(g.n).length;
  if(n)return say(`${gname(g.n)} has ${n} ledger${n>1?'s':''}. Move them to another group first.`,'bad');
  if(k)return say(`${gname(g.n)} has ${k} sub-group${k>1?'s':''}. Delete or move them first.`,'bad');
  ask(`Delete the group ${gname(g.n)}?`,()=>{const name=gname(g.n);S.groups=S.groups.filter(c=>c.id!==g.n);rebuildGroups();auditNote('Group deleted',name);render();say(`${name} deleted.`,'ok')})}
start({id:'groups',title:'List of Groups',view:vGroups,state:GL,activate:openGroup,
  keys:()=>[{k:'↑ ↓',l:'Move'},...(can('groups.edit')?[{k:'Enter',l:'Alter',a:openGroup},{k:'N',l:'Create group',a:()=>navigate('group')},{k:'Delete',kd:'Del',l:'Delete',a:delGroup}]
    :can('reports')?[{k:'Enter',l:'Group figures',a:openGroup}]:[]),{gap:1},escKey()],
  key(e){if(listNav(e,GL,GL.list.length,render))return true;if(e.key==='Enter'){stop(e);openGroup();return true}return false}});
