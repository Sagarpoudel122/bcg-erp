/* Input fields. Each page registers the fields it owns in FIELD, keyed by data-f */
/* FIELD[data-f value] = { key(e,t) extra keys, enter(t), input(t), amt(t,raw) after an amount is formatted,
   focus(t), blur(t), date(t) the date shown on focus for fields with data-date }. Every member is optional.
   This file holds the generic parts: Enter / Backspace, amount formatting and the focus listeners. */
const FIELD={};
// Backspace goes to the previous field when this one is empty, read-only, or a list field whose chosen value is untouched
function goesBack(t){return t.readOnly||t.value===''||(t.dataset.pick!==undefined&&t.value===curVal(t)&&t.selectionStart===0&&t.selectionEnd===t.value.length)}
function fieldKey(e,t){const k=e.key,h=FIELD[t.dataset.f]||{};
  if(k==='Enter'){stop(e);if(h.enter)h.enter(t);return}
  if(k==='Backspace'&&goesBack(t)){stop(e);moveFocus(t,-1);return}
  if(h.key)h.key(e,t)}
function onField(t){const h=FIELD[t.dataset.f];if(h&&h.input)h.input(t)}
function commitAmt(t){const h=FIELD[t.dataset.f],raw=normAmt(t.value);t.value=fmtIn(t.value);if(h&&h.amt)h.amt(t,raw)}

document.addEventListener('focusin',e=>{const t=e.target;if(t.tagName!=='INPUT')return;
  if(S.sb&&view().contains(t)){S.sb=false;drawSide();drawKeys()}
  const h=FIELD[t.dataset.f];if(h&&h.focus)h.focus(t);
  if(t.dataset.date!==undefined&&h&&h.date){t.value=isoText(h.date(t));t.select()}   // dates are edited as yyyy-mm-dd
  if(t.dataset.pick!==undefined&&PK.input!==t)pickShow(t);else if(t.dataset.pick===undefined&&PK.input)pickClose()});
document.addEventListener('focusout',e=>{const t=e.target;if(QUIET||t.tagName!=='INPUT'||!t.isConnected)return;
  if(t.dataset.amt!==undefined)commitAmt(t);
  const h=FIELD[t.dataset.f];if(h&&h.blur)h.blur(t);
  if(t.dataset.pick!==undefined){if(PK.input===t)pickClose();t.value=curVal(t)}});
document.addEventListener('input',e=>{const t=e.target;if(!t.dataset||!t.dataset.f)return;
  if(t.dataset.pick!==undefined){if(PK.input!==t)pickShow(t,true);else{PK.items=pickFilter(PK.all,t.value);PK.idx=0;pickDraw()}return}
  onField(t)});
