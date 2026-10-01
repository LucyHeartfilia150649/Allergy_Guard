// ===== หน้า assess =====
function buildChips() { const M = { sg1: SDB.nasal, sg2: SDB.skin, sg3: SDB.resp, sg4: SDB.gut }; for (const [id, arr] of Object.entries(M)) setH(id, arr.map(s => `<button class="chip" id="${s.id}" onclick="tog('${s.id}')"><span class="chip-box" id="cb_${s.id}"></span>${s.ic} ${s.l}</button>`).join('')); }

function tog(id) { if (sel.has(id)) { sel.delete(id); $(id).classList.remove('sel'); $('cb_' + id).textContent = ''; } else { sel.add(id); $(id).classList.add('sel'); $('cb_' + id).textContent = '✓'; } }

function setAS(n) { ['aS1', 'aS2', 'aS3'].forEach((id, i) => $(id).className = 'as' + (i + 1 === n ? ' on' : i + 1 < n ? ' dn' : '')); }

function aN(s) { if (s === 1 && !sel.size) { alert('กรุณาเลือกอาการอย่างน้อย 1 อาการ'); return; } hide('ap' + s); show('ap' + (s + 1)); setAS(s + 1); }

function aB(s) { hide('ap' + s); show('ap' + (s - 1)); setAS(s - 1); }

function resetA() { sel.clear(); document.querySelectorAll('.chip').forEach(b => b.classList.remove('sel')); document.querySelectorAll('.chip-box').forEach(c => c.textContent = '');['ap1', 'ap2', 'ap3'].forEach(p => $(p) && $(p).classList.add('hidden')); show('ap1'); hide('aRes'); setAS(1); }

function calcSc() {
  const syms = ALL.filter(s => sel.has(s.id)); const sc = Object.fromEntries(Object.keys(TY).map(t => [t, 0])); syms.forEach(s => Object.entries(s.w).forEach(([t, w]) => sc[t] += w));
  const fam = parseFloat(CU.fam) || 0; if (fam > 0) { sc.rhinitis += fam * 2; sc.asthma += fam * 1.5; sc.eczema += fam; }
  if (CU.pet === '1') { sc.rhinitis += 1.5; sc.asthma += 1; }
  const en = v('aEnv'); if (en === 'urban') { sc.dust += 2; sc.asthma += 1; }
  const se = v('aSeas'); if (se === 'spring' || se === 'rainy') { sc.pollen += 2; sc.rhinitis += 1; } if (se === 'night') sc.dust += 2;
  const sv = parseInt(v('aSev')) || 5; Object.keys(sc).forEach(t => sc[t] *= (0.6 + sv * .08));
  const mx = Math.max(...Object.values(sc), 1); const nm = {}; Object.keys(sc).forEach(t => nm[t] = Math.min(98, Math.max(2, Math.round(sc[t] / mx * 88 + Math.random() * 4)))); return nm;
}

function doAssess() {
  hide('ap2'); show('ap3'); setAS(3); show('aLoad'); hide('aRes');
  const msgs = ['กำลังประมวลผล...', 'เปรียบเทียบฐานข้อมูล...', 'ประเมินปัจจัยเสี่ยง...', 'กำลังสรุปผล...']; let mi = 0; const iv = setInterval(() => { mi = (mi + 1) % msgs.length; $('aLm').textContent = msgs[mi]; }, 750);
  const syms = ALL.filter(s => sel.has(s.id)); const sc = calcSc(); const sorted = Object.entries(sc).sort((a, b) => b[1] - a[1]); const t5 = sorted.slice(0, 5); const mv = t5[0][1]; const rsk = mv >= 65 ? 'hi' : mv >= 35 ? 'med' : 'lo';
  lSc = sc; lSym = syms; hist.push({ u: CU.email, dt: new Date().toLocaleDateString('th-TH'), r: rsk, topT: TY[t5[0][0]].n, syms: syms.map(s => s.l), sev: v('aSev') }); saveLS();
  setTimeout(() => { clearInterval(iv); hide('aLoad'); show('aRes'); renderRes(rsk, syms, t5); callAI(syms, t5, 'assess'); buildNotifs(); }, 2600);
}

function renderRes(rsk, syms, t5) {
  const RC = { hi: { cls: 'rhi-b', ic: '🚨', ti: 'ความเสี่ยงสูง — แนะนำพบแพทย์', ds: 'พบอาการหลายอย่างที่บ่งชี้โรคภูมิแพ้ ควรพบแพทย์ผู้เชี่ยวชาญโดยเร็ว' }, med: { cls: 'rmed-b', ic: '⚠️', ti: 'ความเสี่ยงปานกลาง — ควรติดตาม', ds: 'มีอาการบางส่วนสอดคล้องกับโรคภูมิแพ้ ติดตามและพบแพทย์หากแย่ลง' }, lo: { cls: 'rlo-b', ic: '✅', ti: 'ความเสี่ยงต่ำ', ds: 'อาการอาจเกิดจากสาเหตุอื่น ควรปรึกษาแพทย์หากยังกังวล' } }[rsk];
  setH('aRBan', `<div class="rban ${RC.cls}" style="margin-bottom:1rem"><span class="rb-ic">${RC.ic}</span><div><div class="rb-ti">${RC.ti}</div><div class="rb-ds">${RC.ds}</div></div></div>`);
  setH('aInfo', `<div class="sc"><div class="sc-ic" style="background:var(--tl)">🩺</div><div class="sc-l">อาการ</div><div class="sc-v">${syms.length}</div><div class="sc-s">รายการ</div></div><div class="sc"><div class="sc-ic" style="background:var(--al)">📊</div><div class="sc-l">ความรุนแรง</div><div class="sc-v">${v('aSev')}/10</div></div><div class="sc"><div class="sc-ic" style="background:var(--ol)">🔬</div><div class="sc-l">ประเภทน่าสงสัย</div><div class="sc-v">${t5.filter(([, vv]) => vv >= 30).length}</div><div class="sc-s">ประเภท</div></div>`);
  setH('aPbars', t5.map(([t, val]) => `<div class="pb-row"><span class="pb-nm">${TY[t].n}</span><div class="pb-bg"><div class="pb-fill" style="width:0%;background:${TY[t].c}" data-w="${val}"></div></div><span class="pb-pct">${val}%</span></div>`).join(''));
  setTimeout(() => document.querySelectorAll('.pb-fill').forEach(el => el.style.width = el.getAttribute('data-w') + '%'), 80);
}

if (requireLogin('assess')) buildChips();
