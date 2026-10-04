/* Audit log page */
/* ---------- Audit log ---------- */
function vAudit(){const rows=S.audit.slice().reverse().map(a=>`<tr><td class="num">${esc(a.time)}</td><td>${esc(a.user)}</td><td>${esc(a.action)}</td><td class="num">${esc(a.no)}</td><td>${esc(a.detail)}</td></tr>`).join('');
  return tp('Audit Log',COMPANY,rows?`<table><thead><tr><th>Time</th><th>User</th><th>Action</th><th>Voucher</th><th>Detail</th></tr></thead><tbody>${rows}</tbody></table>`:'<p class="tp-note">Nothing yet. Vouchers, business setup and user changes appear here.</p>')}
start({id:'audit',title:'Audit Log',view:vAudit});
