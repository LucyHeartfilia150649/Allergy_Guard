// ===== หน้า dashboard =====
function buildDash() {
  const u = CU, h = new Date().getHours();
  const gt = h < 12 ? 'อรุณสวัสดิ์' : h < 17 ? 'สวัสดีตอนบ่าย' : 'สวัสดีตอนเย็น';
  setH('greetH', gt + ' ' + u.name.split(' ')[0] + ' 👋'); setH('greetS', 'AllergyGuard พร้อมดูแลสุขภาพของคุณ');
  const als = [];
  if (u.fa) als.push({ c: 'al-warn', m: '⚠️ แพ้อาหาร: <b>' + u.fa + '</b> — ตรวจสอบส่วนประกอบก่อนรับประทานทุกครั้ง' });
  if (u.da) als.push({ c: 'al-warn', m: '⚠️ แพ้ยา: <b>' + u.da + '</b> — แจ้งแพทย์ทุกครั้งก่อนรับยา' });
  if (!lSc) als.push({ c: 'al-info', m: '💡 ยังไม่มีผลประเมิน — คลิก <b>"ประเมิน"</b> เพื่อวิเคราะห์ความเสี่ยง' });
  const td = new Date().toISOString().slice(0, 10); if (!diary.find(d => d.date === td)) als.push({ c: 'al-ok', m: '📓 อย่าลืมบันทึกอาการวันนี้! <a onclick="goto(\'diary\')" style="color:var(--td);font-weight:700;cursor:pointer">บันทึกเลย →</a>' });
  setH('dashAl', als.map(a => `<div class="al ${a.c}">${a.m}</div>`).join(''));
  const bmi = u.wt && u.ht ? (u.wt / ((u.ht / 100) ** 2)).toFixed(1) : null;
  const bmiL = bmi ? (+bmi < 18.5 ? 'น้ำหนักน้อย' : +bmi < 23 ? 'ปกติ' : +bmi < 25 ? 'น้ำหนักเกิน' : 'อ้วน') : '—';
  setH('statGrd', `<div class="sc"><div class="sc-ic" style="background:var(--tl)">📋</div><div class="sc-l">การประเมิน</div><div class="sc-v">${hist.length}</div><div class="sc-s">ครั้ง</div></div><div class="sc"><div class="sc-ic" style="background:var(--vl)">📓</div><div class="sc-l">บันทึกอาการ</div><div class="sc-v">${diary.length}</div><div class="sc-s">รายการ</div></div><div class="sc"><div class="sc-ic" style="background:var(--ol)">⚖️</div><div class="sc-l">BMI</div><div class="sc-v">${bmi || '—'}</div><div class="sc-s">${bmiL}</div></div><div class="sc"><div class="sc-ic" style="background:var(--cl)">🧬</div><div class="sc-l">เสี่ยงพันธุกรรม</div><div class="sc-v">${{ 0: 'ต่ำ', '0.5': 'กลาง', 1: 'กลาง', 2: 'สูง' }[u.fam] || '—'}</div><div class="sc-s">${{ 0: 'ไม่มีประวัติ', '0.5': 'ไม่แน่ใจ', 1: 'พ่อหรือแม่', 2: 'ทั้งพ่อและแม่' }[u.fam] || '—'}</div></div>`);
  if (lSc) { const top = Object.entries(lSc).sort((a, b) => b[1] - a[1]); const mv = top[0][1], rsk = mv >= 65 ? 'hi' : mv >= 35 ? 'med' : 'lo'; $('rmn').style.left = { hi: '84%', med: '50%', lo: '16%' }[rsk]; setH('rBadge', `<span class="rbg r${rsk}">${{ hi: '🔴 ความเสี่ยงสูง', med: '🟡 ความเสี่ยงปานกลาง', lo: '🟢 ความเสี่ยงต่ำ' }[rsk]}</span>`); $('rNote').textContent = 'จากผลการประเมินล่าสุด'; setH('topAlg', top.slice(0, 4).map(([t, val]) => `<div class="pb-row"><span class="pb-nm">${TY[t].n}</span><div class="pb-bg"><div class="pb-fill" style="width:${val}%;background:${TY[t].c}"></div></div><span class="pb-pct">${val}%</span></div>`).join('')); }
  const mh = hist.slice(-4).reverse(); if (mh.length) setH('recentH', '<div class="tl">' + mh.map(h => `<div class="tli"><div class="tl-dot" style="color:${h.r === 'hi' ? '#E5533A' : h.r === 'med' ? '#D97706' : '#0D9373'}"></div><div class="tl-dt">${h.dt}</div><div class="tl-c"><b>${h.topT}</b> — ${{ hi: 'ความเสี่ยงสูง', med: 'ปานกลาง', lo: 'ต่ำ' }[h.r]}<div class="tl-tg">${h.syms.slice(0, 3).map(s => `<span class="tag tg-s">${s}</span>`).join('')}</div></div></div>`).join('') + '</div>');
  const ld = diary.slice(0, 3); if (ld.length) setH('dashDiary', ld.map(d => `<div class="diary-entry"><div class="diary-hd"><span class="diary-dt">${d.date}</span><span style="font-size:11.5px;font-weight:700;color:${['', '#0D9373', '#15803D', '#D97706', '#E5533A', '#B91C1C'][d.level]}">${['', 'ไม่มีอาการ', 'เล็กน้อย', 'ปานกลาง', 'รุนแรง', 'รุนแรงมาก'][d.level]}</span></div><div class="diary-body">${d.note || '—'}</div><div class="diary-tg">${(d.syms || []).slice(0, 3).map(s => `<span class="tag tg-s">${s}</span>`).join('')}</div></div>`).join(''));
}

if (requireLogin('dash')) buildDash();
