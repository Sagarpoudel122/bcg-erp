/* Salary detail for one month: ?e=<employee>&m=<month index>. An Employee can only open their own. */
let SLIP={e:'',m:0};
const slipPrint=()=>hrSheet('Salary Slip',mName(SLIP.m),slipHtml(SLIP.e,SLIP.m));
function vSlip(){const e=emp(SLIP.e);
  if(!e||!payRec(SLIP.e,SLIP.m))return tp('Salary Detail','','<p class="tp-note">There is no paid salary for this month yet.</p>');
  return tp('Salary Detail',`${e.name} · ${mName(SLIP.m)}`,`<div class="slip">${slipHtml(SLIP.e,SLIP.m)}</div>`)}
const slipBack=()=>navigate(param('from')==='me'||!isAdmin()?'hrmypay':'hrsal');
start({id:'hrslip',title:'Salary Detail',view:vSlip,back:slipBack,
  init(){SLIP.e=isAdmin()&&param('e')?param('e'):myEmpId();SLIP.m=+param('m')||0},
  keys:()=>[{k:'Alt+P',l:'Print',a:slipPrint},{gap:1},escKey()]});
