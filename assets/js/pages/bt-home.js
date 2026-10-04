/* Business Tools gateway. The list of tools is decided later. Business Information is the business profile and brand colours
   kept in Business Setup (the same record, B6); templates that need a missing field will be blocked (B7). Post Maker is planned. */
function vTools(){const b=CUR.biz,miss=[!b.logo&&'logo',!(validHex(b.c1)&&validHex(b.c2))&&'brand colours',!b.email&&'email'].filter(Boolean);
  const sw=c=>validHex(c)?`<span class="swatch sm" style="background:${c}"></span>`:'';
  const row=(n,d,tag,extra='')=>`<div class="tool-row"><span>${n}</span><span class="muted">${d}</span>${extra}<span class="tag" style="margin-left:auto">${tag}</span></div>`;
  return tp('Business Tools',COMPANY,`<p class="tp-note">A set of small utilities for the business. Which tools go in here is decided later.</p>
   <div style="margin-top:12px">${row('Business Information',miss.length?'Missing: '+miss.join(', '):'Name, address, phone, logo and brand colours are ready',canSee('setup')?'In Business Setup':'Ask the Admin',sw(b.c1)+sw(b.c2))}
   ${row('Post Maker','Make a Facebook post image from a template','Planned')}</div>`)}
start({id:'bthome',title:'Business Tools',view:vTools,keys:()=>[]});
