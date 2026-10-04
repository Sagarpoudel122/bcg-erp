/* Dashboard: the first screen of Account (mvp-plan §2.0). Figures come from ledger balances by group for the chosen period
   (default the running BS month; ← → or F2 change it). Sales/Cashier gets the limited view: no sales, purchase or expense
   figures (so no profit) and only their own vouchers. ↑ ↓ visits everything that opens something; Enter opens it.
   Not here yet: Upcoming Reminders (the Reminders screen comes later). Quick POS / Add Sales / Add Purchase stay hidden. */
let ACTS=[];   // what Enter does for each selectable thing, in ↑ ↓ order
let FLOW=[];   // the chart's buckets, for the hover tooltip
const reg=fn=>ACTS.push(fn)-1;
const selc=i=>i===S.dash.sel?'sel':'';
function dashRange(){const p=S.dash.per;
  return p<0?{from:0,to:mLast(CUR_M),label:'FY 2083/84 to date',days:false}:{from:mFirst(p),to:mLast(p),label:mName(p),days:true}}
// Net Dr movement of the ledgers under these groups, between two days
function moved(roots,from,to){let c=0;
  for(const v of S.vouchers){if(v.status!=='Active'||v.date<from||v.date>to)continue;
    for(const ln of v.lines){const l=led(ln.lid);if(l&&roots.some(r=>under(l.group,r)))c+=(ln.side==='Dr'?1:-1)*cents(ln.amt)}}
  return c}
// Money in (Dr) and out (Cr) of cash and bank, per day of the month or per month of the year. Moves between cash and bank are left out.
function flowBuckets(r){const cash=new Set(S.ledgers.filter(isCash).map(l=>l.id));
  const out=r.days?Array.from({length:MDAYS[S.dash.per]},(_,i)=>({s:r.from+i,label:String(i+1),tip:bsText(r.from+i),i:0,o:0}))
    :Array.from({length:CUR_M+1},(_,m)=>({label:MONTHS[m].slice(0,3),tip:mName(m),i:0,o:0}));
  for(const v of S.vouchers){if(v.status!=='Active'||v.date<r.from||v.date>r.to||v.lines.every(l=>cash.has(l.lid)))continue;
    const b=out[r.days?v.date-r.from:bs(v.date).m];if(!b)continue;
    for(const ln of v.lines)if(cash.has(ln.lid)){if(ln.side==='Dr')b.i+=cents(ln.amt);else b.o+=cents(ln.amt)}}
  return out}
const rupees=c=>fmt(c).slice(0,-3);   // axis labels: whole rupees, Nepali grouping
function niceMax(c){const r=Math.max(1,c/100),p=10**Math.floor(Math.log10(r)),m=[1,2,2.5,5,10].find(x=>x*p>=r);return m*p*100}
// Diverging columns on one zero line: money in above, money out below (validated pair, see assets/css/dash.css)
function flowChart(r){const B=FLOW=flowBuckets(r),tin=B.reduce((a,b)=>a+b.i,0),tout=B.reduce((a,b)=>a+b.o,0);
  const head=`<div class="fhead"><h4 class="fsec">Money in and out of Cash & Bank · ${esc(r.label)}</h4>
    <div class="key"><span><i class="kin"></i>Money in <b class="num">${fmt(tin)}</b></span><span><i class="kout"></i>Money out <b class="num">${fmt(tout)}</b></span></div></div>`;
  if(!tin&&!tout)return head+`<p class="tp-note">No money came in or went out of cash and bank in ${esc(r.label)}.</p>`;
  const W=860,H=210,L=70,T=12,Bt=24,mid=T+(H-T-Bt)/2,half=(H-T-Bt)/2,max=niceMax(Math.max(...B.map(b=>Math.max(b.i,b.o)))),n=B.length,slot=(W-L-6)/n,bw=Math.min(16,Math.max(4,slot*.55));
  const bar=(x,h,up)=>{if(h<.5)return'';const rr=Math.min(4,h,bw/2),y=up?mid-h:mid+h;
    return up?`<path class="bin" d="M${x},${mid}V${y+rr}Q${x},${y} ${x+rr},${y}H${x+bw-rr}Q${x+bw},${y} ${x+bw},${y+rr}V${mid}Z"/>`
      :`<path class="bout" d="M${x},${mid}V${y-rr}Q${x},${y} ${x+rr},${y}H${x+bw-rr}Q${x+bw},${y} ${x+bw},${y-rr}V${mid}Z"/>`};
  const every=n>12?5:1;let marks='',labels='';
  B.forEach((b,i)=>{const x=L+i*slot+(slot-bw)/2;marks+=bar(x,b.i/max*half,true)+bar(x,b.o/max*half,false)+`<rect class="hit" data-b="${i}" x="${L+i*slot}" y="${T}" width="${slot}" height="${H-T-Bt}"/>`;
    if(i===0||(i+1)%every===0)labels+=`<text x="${L+i*slot+slot/2}" y="${H-6}" text-anchor="middle">${b.label}</text>`});
  const grid=`<line x1="${L}" x2="${W}" y1="${T}" y2="${T}"/><line x1="${L}" x2="${W}" y1="${H-Bt}" y2="${H-Bt}"/>`,
    ylab=`<text x="${L-8}" y="${T+4}" text-anchor="end">${rupees(max)}</text><text x="${L-8}" y="${mid+4}" text-anchor="end">0</text><text x="${L-8}" y="${H-Bt+4}" text-anchor="end">${rupees(max)}</text>`;
  const table=`<table class="sr"><caption>Money in and out of cash and bank, ${esc(r.label)}</caption><thead><tr><th>${r.days?'Day':'Month'}</th><th>In</th><th>Out</th></tr></thead><tbody>${B.filter(b=>b.i||b.o).map(b=>`<tr><td>${esc(b.tip)}</td><td>${fmt(b.i)}</td><td>${fmt(b.o)}</td></tr>`).join('')}</tbody></table>`;
  return head+`<div class="flow"><svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Money in ${fmt(tin)} and out ${fmt(tout)} of cash and bank, ${esc(r.label)}">
    <g class="grid">${grid}</g><line class="zero" x1="${L}" x2="${W}" y1="${mid}" y2="${mid}"/><g class="axis">${ylab}${labels}</g>${marks}</svg><div class="flow-tip" hidden></div></div>${table}`}
function vDash(){ACTS=[];const r=dashRange(),asAt=Math.min(r.to,TODAY),B=balances(asAt),full=!ownOnly();
  const tile=(label,c,act,sub)=>{const i=act?reg(act):-1;return `<div class="dt ${i<0?'static':selc(i)}" ${i<0?'':`data-i="${i}"`}><span class="dl">${label}</span><b class="dv">${fmt(c)}</b>${sub?`<small>${sub}</small>`:''}</div>`};
  const toRep=(v,q)=>()=>{S.rstack=[{url:href('home',{back:1}),sel:0}];S.rep.to=asAt;S.rep.sel=0;navigate(v,q)};
  const rep=can('reports'),cashL=S.ledgers.filter(l=>isCash(l)&&visible(l)),cashTot=cashL.reduce((a,l)=>a+B[l.id].cl,0);
  let tiles=tile('To receive',gTotal('Sundry Debtors',B),rep&&toRep('gsum',{g:'Sundry Debtors'}),'as at '+bsShort(asAt))
    +tile('To give',-gTotal('Sundry Creditors',B),rep&&toRep('gsum',{g:'Sundry Creditors'}),'as at '+bsShort(asAt))
    +tile('Cash & Bank',cashTot,null,`${cashL.length} ledger${cashL.length===1?'':'s'}`);
  if(full)tiles+=tile('Sales',-moved(['Sales Accounts'],r.from,r.to),rep&&toRep('gsum',{g:'Sales Accounts'}),r.label)
    +tile('Purchase',moved(['Purchase Accounts'],r.from,r.to),rep&&toRep('gsum',{g:'Purchase Accounts'}),r.label)
    +tile('Expenses',moved(['Direct Expenses','Indirect Expenses'],r.from,r.to),rep&&toRep('pl'),r.label);
  // cash and bank, one row per ledger
  const lr=canSee('lr'),cashRows=cashL.map(l=>{const c=B[l.id].cl,i=lr?reg(toRep('lr',{l:l.id})):-1;
    return `<tr class="${selc(i)}" ${i<0?'':`data-i="${i}"`}><td>${esc(l.name)}</td><td class="r num">${fmt(Math.abs(c))}${c<0?' Cr':''}</td></tr>`}).join('');
  // the latest vouchers (Sales/Cashier: their own)
  const recent=S.vouchers.filter(v=>!ownOnly()||v.uid===UID).sort((a,b)=>b.date-a.date||+b.id.slice(1)-+a.id.slice(1)).slice(0,5);
  const vRows=recent.map(v=>{const i=reg(()=>editVoucher(v)),dr=v.lines.filter(l=>l.side==='Dr'),cr=v.lines.filter(l=>l.side==='Cr'),can0=v.status==='Cancelled';
    return `<tr class="${selc(i)} ${can0?'cancelled':''}" data-i="${i}"><td class="num">${bsShort(v.date)}</td><td><span class="strike">${esc(led(dr[0].lid).name)} <span class="muted">to</span> ${esc(led(cr[0].lid).name)}</span></td>
      <td class="num muted">${vno(v.type,v.seq,v.pre)}</td><td class="r num">${can0?'<span class="tag warn">Cancelled</span>':fmt(dr.reduce((a,l)=>a+cents(l.amt),0))}</td></tr>`}).join('');
  const vk=Object.keys(TYPES).filter(canSee).map(t=>TYPES[t].key),vkeys=vk.length>1?vk.slice(0,-1).join(', ')+' or '+vk.slice(-1):vk.join('');
  const dbi=canSee('daybook')?reg(()=>{S.db.all=true;S.db.sel=0;navigate('daybook')}):-1;
  // quick reports and, for the Admin, what Business Setup still lacks
  const chips=[['tb','Trial Balance'],['pl','Profit & Loss'],['bs','Balance Sheet'],['lr','Ledger Report']].filter(([v])=>canSee(v))
    .map(([v,l])=>{const i=reg(toRep(v));return `<span class="dt chip ${selc(i)}" data-i="${i}">${l}</span>`}).join('');
  const miss=setupMissing(CUR.biz),si=can('setup.edit')&&miss.length?reg(()=>go('setup')):-1;
  return tp('Dashboard',`${COMPANY} · ${r.label}`,`<div class="dtiles">${tiles}</div>${flowChart(r)}
   <div class="dcols"><div><h4 class="fsec">Cash & Bank</h4>${cashRows?`<table class="mini2"><tbody>${cashRows}</tbody></table>`:'<p class="tp-note">No cash or bank ledgers.</p>'}</div>
    <div><h4 class="fsec">Recent vouchers</h4>${vRows?`<table class="mini2"><tbody>${vRows}</tbody></table>`:`<p class="tp-note">No vouchers yet.${vkeys?` Press ${vkeys} to make one.`:''}</p>`}
     ${dbi>=0?`<div class="dlinks"><span class="dt chip ${selc(dbi)}" data-i="${dbi}">All vouchers · Day Book</span></div>`:''}</div></div>
   ${chips?`<h4 class="fsec">Reports</h4><div class="dlinks">${chips}</div>`:''}
   ${si>=0?`<div class="dlinks"><span class="dt chip note ${selc(si)}" data-i="${si}">Business Setup is missing ${esc(miss.join(', '))}</span></div>`:''}`)}
/* ---------- period: ← → a month, F2 pick one or the whole year ---------- */
const DPF=form({id:'dp',v:{per:0},fields:[{k:'per',l:'Period',type:'pick',title:'Period',
  items:()=>[...Array.from({length:CUR_M+1},(_,m)=>({v:CUR_M-m,label:mName(CUR_M-m),sub:CUR_M-m===CUR_M?'Running month':''})),{v:-1,label:'Financial year to date',sub:'FY 2083/84'}]}]});
const setPer=p=>{S.dash.per=p;S.dash.sel=0;render()};
PANELS.dper={view:()=>`<h2>Change Period</h2>${formHtml(DPF)}<p class="pfoot">Type or pick · Enter · Esc cancel</p>`,last(){P.then=null;closePanel();setPer(DPF.v.per)}};
const openPer=()=>{if(P||S.ask)return;DPF.v.per=S.dash.per;openPanel('dper',0,null)};
/* ---------- hover tooltip on the chart ---------- */
document.addEventListener('mousemove',e=>{const tip=$('.flow-tip');if(!tip)return;const h=e.target.closest&&e.target.closest('.flow [data-b]');
  if(!h){tip.hidden=true;return}const b=FLOW[+h.dataset.b],box=tip.parentElement.getBoundingClientRect();
  tip.innerHTML=`<b>${esc(b.tip)}</b><span><i class="kin"></i>In ${fmt(b.i)}</span><span><i class="kout"></i>Out ${fmt(b.o)}</span>`;tip.hidden=false;
  const x=e.clientX-box.left,w=tip.offsetWidth;tip.style.left=Math.max(0,Math.min(box.width-w,x-w/2))+'px';tip.style.top=Math.max(0,e.clientY-box.top-tip.offsetHeight-12)+'px'});
start({id:'home',title:'Dashboard',view:vDash,state:{get sel(){return S.dash.sel},set sel(v){S.dash.sel=v}},activate:()=>{render();const a=ACTS[S.dash.sel];if(a)a()},
  init(){S.dash=Object.assign({sel:0,per:CUR_M},S.dash);if(param('back'))S.sb=false},   // coming back from a report opens on the dashboard, not the menu
  keys:()=>[{k:'↑ ↓',l:'Move'},{k:'Enter',l:'Open',a:()=>{const a=ACTS[S.dash.sel];if(a)a()}},{gap:1},{k:'← →',l:'Month'},{k:'F2',l:'Period',a:openPer},
    ...(Object.keys(TYPES).some(canSee)?[{gap:1},...Object.keys(TYPES).filter(canSee).map(t=>({k:TYPES[t].key,l:TYPES[t].name,a:()=>go(t)}))]:[]),{gap:1},escKey()],
  key(e){const k=e.key;if(listNav(e,S.dash,ACTS.length,render))return true;
    if(k==='Enter'){stop(e);const a=ACTS[S.dash.sel];if(a)a();return true}
    if(k==='ArrowLeft'||k==='ArrowRight'){stop(e);const p=S.dash.per<0?CUR_M:S.dash.per;setPer(Math.max(0,Math.min(CUR_M,p+(k==='ArrowRight'?1:-1))));return true}
    return false}});
