/* Calculator (Alt+C with the cursor in an Amount field), like Tally's. Type a sum, Enter puts the result in the field, Esc leaves it alone. */
/* It is its own small box at the right of the screen, not a popup of the panel system, so it also opens above the Bill details popup. */
const CALC={open:false,t:null,last:null};
// + - * / ( ) with unary minus; commas are ignored. Returns a number, or null when the text is not a sum.
function calcEval(src){const s=String(src).replace(/,/g,'').replace(/[x×]/gi,'*').replace(/÷/g,'/').replace(/\s+/g,'');let i=0;
  const num=()=>{const m=/^\d*\.?\d+|^\d+\./.exec(s.slice(i));if(!m)return null;i+=m[0].length;return parseFloat(m[0])};
  function factor(){const c=s[i];
    if(c==='-'||c==='+'){i++;const v=factor();return v==null?null:c==='-'?-v:v}
    if(c==='('){i++;const v=expr();if(v==null||s[i]!==')')return null;i++;return v}
    return num()}
  function term(){let v=factor();while(v!=null&&(s[i]==='*'||s[i]==='/')){const o=s[i++],r=factor();if(r==null||(o==='/'&&r===0))return null;v=o==='*'?v*r:v/r}return v}
  function expr(){let v=term();while(v!=null&&(s[i]==='+'||s[i]==='-')){const o=s[i++],r=term();if(r==null)return null;v=o==='+'?v+r:v-r}return v}
  if(!s)return null;const v=expr();return v!=null&&i===s.length&&isFinite(v)?v:null}
const calcCents=src=>{const v=calcEval(src);return v==null?null:Math.round(v*100)}
document.addEventListener('focusin',e=>{const t=e.target;if(t.tagName==='INPUT'&&t.dataset.amt!==undefined)CALC.last=t});
function calcShow(){const c=calcCents($('#calc-in').value),el=$('#calc-out');
  el.textContent=c==null?'':'= '+fmt(c);el.className='calc-out num'+(c!=null&&c<=0?' bad':'')}
function openCalc(t){if(CALC.open)return;CALC.open=true;CALC.t=t;
  let box=$('#calc');if(!box){box=document.createElement('div');box.id='calc';box.className='calc';box.setAttribute('role','dialog');box.setAttribute('aria-label','Calculator');document.body.appendChild(box)}
  box.hidden=false;
  box.innerHTML=`<div class="ct">Calculator</div><div class="cb"><input id="calc-in" class="in num" aria-label="Calculation" placeholder="e.g. 1500+250*2" autocomplete="off" value="${esc(normAmt(t.value))}"><div id="calc-out" class="calc-out num"></div><p class="pfoot">+ − * / ( ) · Enter use result · Esc cancel</p></div>`;
  const inp=$('#calc-in');inp.addEventListener('input',calcShow);calcShow();inp.focus();inp.setSelectionRange(inp.value.length,inp.value.length)}
function closeCalc(){if(!CALC.open)return;const t=CALC.t;CALC.open=false;CALC.t=null;const box=$('#calc');box.hidden=true;box.innerHTML='';
  if(t&&t.isConnected)focusEl(t)}
function calcKey(e){const k=e.key;
  if(k==='Escape'||keyName(e)==='Alt+C'){stop(e);closeCalc();return}
  if(k==='Enter'){stop(e);const c=calcCents($('#calc-in').value);
    if(c==null){say('That is not a sum the calculator can work out.','bad');return}
    if(c<=0){say('An amount must be more than zero.','bad');return}
    const t=CALC.t;closeCalc();
    if(t&&t.isConnected){t.value=(c/100).toFixed(2);t.dispatchEvent(new Event('input',{bubbles:true}));commitAmt(t)}}}
// From the key rail (mouse): the calculator opens for the Amount field that last had the cursor
function calcFromRail(){const t=CALC.last;if(t&&t.isConnected)openCalc(t);else say('Put the cursor in an Amount field first.')}
