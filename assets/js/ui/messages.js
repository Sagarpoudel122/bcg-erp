/* Messages: success toast, warning popup, Yes/No question popup, status-bar hint */
// Messages: 'ok' = small toast top right, 'bad' / 'warn' = popup that must be dismissed, anything else = hint in the status bar.
function say(text,kind=''){
  if(text&&kind==='ok'){S.msg=null;drawStatus();toast(text);return}
  if(text&&(kind==='bad'||kind==='warn')){alertBox(text,kind);return}
  S.msg=text?{text,kind}:null;drawStatus()}
function toast(text){const box=$('#toasts'),el=document.createElement('div');el.className='toast';
  el.innerHTML=`<span class="tick" aria-hidden="true">✓</span><span>${esc(text)}</span>`;box.appendChild(el);
  while(box.children.length>3)box.firstChild.remove();
  requestAnimationFrame(()=>el.classList.add('in'));
  const gone=()=>{el.classList.remove('in');setTimeout(()=>el.remove(),200)};el.onclick=gone;setTimeout(gone,3200)}
const AL={open:false,pending:null,back:null,was:null,ask:false};
// The popup opens a tick later, so the caller can finish moving focus first; closing puts the cursor back where it was.
// kind: 'bad' / 'warn' = message with OK, 'ask' = Yes / No question.
function alertBox(text,kind){AL.pending={text,kind};if(AL.open)showAlert();else queueMicrotask(()=>{if(AL.pending)showAlert()})}
function showAlert(){const{text,kind}=AL.pending;AL.pending=null;const el=$('#alert'),q=kind==='ask';
  if(!AL.open){AL.back=document.activeElement;AL.was={app:$('#app').inert,panel:$('#panel').inert,modal:$('#modal').inert}}
  if(!q)S.ask=null;AL.ask=q;
  el.hidden=false;
  el.innerHTML=`<div class="acard ${kind}" role="alertdialog" aria-modal="true" aria-labelledby="al-t" aria-describedby="al-m"><div class="ah"><span class="ico" aria-hidden="true">${q?'?':'!'}</span><b id="al-t">${q?'Confirm':kind==='warn'?'Warning':'Please check'}</b></div><p id="al-m">${esc(text)}</p>
   <div class="af">${q?'<button class="abtn ghost" data-act="no">No <kbd>N</kbd></button><button class="abtn" data-act="yes">Yes <kbd>Y</kbd></button>':'<button class="abtn" data-act="closealert">OK</button>'}</div></div>`;
  quiet(()=>{pickClose();el.querySelector('.abtn:last-child').focus()});   // moving focus away must not reset what was typed in the field
  $('#app').inert=true;$('#panel').inert=true;$('#modal').inert=true;AL.open=true}
function closeAlert(){if(!AL.open)return;const b=AL.back,w=AL.was;AL.open=false;AL.ask=false;
  const el=$('#alert');el.hidden=true;el.innerHTML='';$('#app').inert=w.app;$('#panel').inert=w.panel;$('#modal').inert=w.modal;
  if(b&&b!==document.body&&b.isConnected){focusEl(b);if(b.dataset&&b.dataset.pick!==undefined&&b.value!==curVal(b))pickShow(b,true)}
  else if(b&&b!==document.body&&!S.sb){if(P){const L=navInputs($('#panel'));if(L[0])focusEl(L[0])}else restoreFocus()}}
function drawStatus(){const el=$('#status'),m=S.msg;el.className=m?m.kind:'';el.textContent=m?m.text:''}
// Yes / No questions are a popup too. The popup closes (cursor goes back) before the chosen action runs.
function ask(text,yes,no){S.ask={text,yes,no};alertBox(text,'ask')}
function answer(y){const a=S.ask;if(!a)return;S.ask=null;closeAlert();const f=y?a.yes:a.no;if(f)f()}
