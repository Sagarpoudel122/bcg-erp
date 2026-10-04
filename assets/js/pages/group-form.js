/* Group Creation, or Group Alteration with ?g=<group>. A custom group goes under any group and takes its nature and cash-flow
   class from it. A predefined group can only be renamed (R2, proposed; switch R2 on the Options page), never moved or deleted. */
let GID=null;   // the group being altered; null = a new one
const NATURE_OF={A:'Asset (Balance Sheet)',L:'Liability (Balance Sheet)',I:'Income (Profit & Loss)',E:'Expense (Profit & Loss)'};
const CF_TEXT={Operating:'Operating activities',Investing:'Investing activities',Financing:'Financing activities',Cash:'Cash itself (not classified)'};
const isPre=()=>!!GID&&!GM[GID].custom;
// "Under" may not be the group itself or one of its own sub-groups
function underItems(){const own=GID?GROUPS.filter(g=>under(g.n,GID)).map(g=>g.n):[];
  const list=groupItems().filter(it=>!own.includes(it.v));return isPre()&&!GM[GID].parent?[{v:'',label:'Primary',sub:'Top level'},...list]:list}
function derive(){const g=GM[GF.v.parent]||GM[GID];GF.v.nat=g?NATURE_OF[g.nat]:'';GF.v.cf=g?CF_TEXT[g.cf]:''}
const GF=form({id:'gf',v:{},accept:()=>saveGroup(),fields:[
  {k:'name',l:'Name',ph:'English or नेपाली',ro:()=>isPre()&&!S.q.r2},
  {k:'parent',l:'Under',type:'pick',title:'List of Groups',items:underItems,ro:isPre,change:derive},
  {k:'nat',l:'Nature',type:'ro'},{k:'cf',l:'Cash flow',type:'ro'}]});
const blankGF=(parent='Indirect Expenses')=>{GF.v={name:'',parent};derive()};
function saveGroup(){const v=GF.v,name=String(v.name||'').trim();
  if(!name)return fmBad(GF,'name','Give the group a name.');
  if(GROUPS.some(g=>g.n!==GID&&!g.sys&&gname(g.n).toLowerCase()===name.toLowerCase()))return fmBad(GF,'name',`There is already a group called "${name}".`);
  if(isPre()){const old=gname(GID);if(name===old){navigate('groups');return}
    if(name===GID)delete S.gren[GID];else S.gren[GID]=name;rebuildGroups();auditNote('Group renamed',`${old} → ${name}`);flash(`Renamed to ${name}.`);navigate('groups');return}
  if(!GM[v.parent])return fmBad(GF,'parent','Pick the group this one goes under.');
  if(GID){const c=S.groups.find(x=>x.id===GID),old=gname(GID),moved=c.parent!==v.parent;Object.assign(c,{name,parent:v.parent});rebuildGroups();
    auditNote('Group altered',`${old}${old!==name?' → '+name:''}${moved?' · now under '+gname(v.parent):''}`);flash(`${name} updated.`);navigate('groups');return}
  S.groups.push({id:'cg'+Date.now(),name,parent:v.parent});rebuildGroups();auditNote('Group created',`${name} under ${gname(v.parent)}`);
  blankGF(v.parent);render('#gf-name');say(`Saved. ${name} is ready for ledgers.`,'ok')}
const gfDirty=()=>GID?GF.v.name!==gname(GID)||(!isPre()&&GF.v.parent!==GM[GID].parent):!!String(GF.v.name||'').trim();
start({id:'group',title:'Group',view:()=>tp(GID?'Group Alteration':'Group Creation',GID?(isPre()?'Predefined group':'Custom group'):COMPANY,formHtml(GF)),focus:()=>'#gf-name',
  init(){const g=param('g');GID=g&&GM[g]&&!GM[g].sys?g:null;if(GID){GF.v={name:gname(GID),parent:GM[GID].parent||''};derive()}else blankGF()},
  keys:()=>[{k:'Enter',l:'Next field'},{k:'Backspace',l:'Previous field'},{gap:1},{k:'Ctrl+A',l:'Accept',a:saveGroup},escKey()],
  back(){const leave=()=>GID?navigate('groups'):focusSidebar();if(gfDirty())ask(GID?'Leave without saving the changes?':'Discard this group?',()=>{blankGF();leave()});else leave()}});
