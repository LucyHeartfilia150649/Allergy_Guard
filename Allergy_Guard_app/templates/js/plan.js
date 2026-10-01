// ===== หน้า plan =====

function buildPlan() {
  const u = CU; const top = lSc ? Object.entries(lSc).sort((a, b) => b[1] - a[1]).slice(0, 2).map(([t]) => TY[t].n).join(', ') : '-';
  const plans = [
    { ic: '🔍', ti: 'สัปดาห์ที่ 1 — ประเมินและเตรียมตัว', ds: 'ทำการประเมินอาการครบถ้วน เริ่มบันทึกอาการทุกวัน ซื้อเครื่องกรองอากาศ HEPA' },
    { ic: '🏠', ti: 'สัปดาห์ที่ 2 — ปรับสภาพแวดล้อม', ds: 'ซักผ้าปูที่นอนด้วยน้ำร้อน ดูดฝุ่นบ้านทั้งหลัง ควบคุมความชื้น 40-50%' },
    { ic: '💊', ti: 'สัปดาห์ที่ 3 — เริ่มใช้ยาและดูแลตัวเอง', ds: 'ล้างจมูกด้วยน้ำเกลือ Isotonic เช้า-เย็น ใช้ยาแก้แพ้ตามที่แพทย์แนะนำ' },
    { ic: '🏥', ti: 'สัปดาห์ที่ 4 — นัดพบแพทย์', ds: 'นำผลบันทึกอาการ 4 สัปดาห์ไปพบแพทย์ผู้เชี่ยวชาญเพื่อวินิจฉัยและวางแผนรักษา' },
    { ic: '🔄', ti: 'เดือนที่ 2 — ทบทวนและปรับแผน', ds: 'ทบทวนผลการรักษา ปรับยาตามคำแนะนำแพทย์ วิเคราะห์สิ่งกระตุ้นจากบันทึก' },
    { ic: '📊', ti: 'เดือนที่ 3 — ติดตามผลระยะยาว', ds: 'พบแพทย์ติดตาม ตรวจ IgE และ Skin Prick Test พิจารณา Immunotherapy' },
  ];
  const am = ['ล้างจมูกด้วยน้ำเกลือ Isotonic', 'รับประทานยาแก้แพ้ (ถ้ามี)', 'ดูค่าฝุ่น AQI ก่อนออกนอกบ้าน', 'สวมหน้ากากเมื่อ AQI > 100'];
  const pm = ['ล้างจมูกรอบเย็น', 'อาบน้ำเพื่อล้างสารก่อภูมิแพ้', 'เปลี่ยนเสื้อผ้าก่อนนอน', 'บันทึกอาการในแอป'];
  setH('planContent', `
<div class="plan-hero"><h2>📋 แผนการดูแลส่วนตัว</h2><p>ออกแบบสำหรับ ${u.name} — ประเภทที่น่าสงสัย: ${top}</p></div>
<div class="card">
  <div class="card-t"><div class="ct-ic" style="background:var(--ol)">📅</div>แผน 3 เดือนแรก</div>
  ${plans.map((p, i) => `<div class="plan-row"><div class="plan-ic">${p.ic}</div><div style="flex:1"><div class="plan-ti">${p.ti}</div><div class="plan-ds">${p.ds}</div></div><div class="pchk ${pChk['pl_' + i] ? 'done' : ''}" onclick="tpChk('pl_${i}',this)">${pChk['pl_' + i] ? '✓' : ''}</div></div>`).join('<div style="height:1px;background:var(--s1)"></div>')}
</div>
<div class="g2">
  <div class="card"><div class="card-t"><div class="ct-ic" style="background:var(--tl)">🌅</div>กิจวัตรเช้า</div>${am.map((t, i) => `<div class="plan-row" style="padding:8px 0"><div class="pchk ${pChk['am_' + i] ? 'done' : ''}" onclick="tpChk('am_${i}',this)" style="margin-top:0">${pChk['am_' + i] ? '✓' : ''}</div><div style="font-size:13.5px;color:var(--sd);margin-left:10px">${t}</div></div>`).join('')}</div>
  <div class="card"><div class="card-t"><div class="ct-ic" style="background:var(--vl)">🌙</div>กิจวัตรคืน</div>${pm.map((t, i) => `<div class="plan-row" style="padding:8px 0"><div class="pchk ${pChk['pm_' + i] ? 'done' : ''}" onclick="tpChk('pm_${i}',this)" style="margin-top:0">${pChk['pm_' + i] ? '✓' : ''}</div><div style="font-size:13.5px;color:var(--sd);margin-left:10px">${t}</div></div>`).join('')}</div>
</div>
<div class="card"><div class="card-t"><div class="ct-ic" style="background:var(--al)">📞</div>โรงพยาบาลคลินิกโรคภูมิแพ้</div>
  <div style="overflow-x:auto"><table class="htab"><thead><tr><th>โรงพยาบาล</th><th>แผนก</th><th>หมายเหตุ</th></tr></thead><tbody>
    <tr><td>รพ.จุฬาลงกรณ์</td><td>คลินิกโรคภูมิแพ้และภูมิคุ้มกัน</td><td>ระดับตติยภูมิ มีทุกวิธีรักษา</td></tr>
    <tr><td>รพ.ศิริราช</td><td>หน่วยโรคภูมิแพ้</td><td>ศูนย์ความเชี่ยวชาญระดับประเทศ</td></tr>
    <tr><td>รพ.รามาธิบดี</td><td>คลินิกภูมิแพ้และภูมิคุ้มกัน</td><td>มีการทดสอบครบถ้วน</td></tr>
    <tr><td>รพ.ในจังหวัด</td><td>อายุรแพทย์</td><td>สะดวกและใกล้บ้าน</td></tr>
  </tbody></table></div>
</div>`);
}


if (requireLogin('plan')) buildPlan();
