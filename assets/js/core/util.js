/* Small helpers */
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const clone=o=>JSON.parse(JSON.stringify(o));
const $=s=>document.querySelector(s);
const param=k=>new URLSearchParams(location.search).get(k);   // ?name=value from the page address
const dot=s=>/[.!?]$/.test(s)?s:s+'.';   // end a sentence that may already end with a full stop ("Pvt. Ltd.")
