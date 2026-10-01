// ===== หน้า profile =====
function buildProf() {
  const u = CU; $('pAv').textContent = u.name[0]; $('pNm').textContent = u.name; $('pEm').textContent = u.email;
  const bmi = u.wt && u.ht ? (u.wt / ((u.ht / 100) ** 2)).toFixed(1) : null;
  $('pMt').textContent = [u.age ? u.age + ' ปี' : '', u.sex, u.bld ? 'กรุ๊ป ' + u.bld : ''].filter(Boolean).join(' · ');
  const tgs = []; if (u.fa) tgs.push(`<span class="tag tg-c">⚠️ แพ้: ${u.fa}</span>`); if (u.da) tgs.push(`<span class="tag tg-a">💊 แพ้ยา: ${u.da}</span>`); if (u.dis) tgs.push(`<span class="tag tg-o">🏥 ${u.dis}</span>`); tgs.push(`<span class="tag tg-${u.fam === '2' ? 'c' : u.fam === '1' ? 'a' : 't'}">🧬 เสี่ยง: ${{ 0: 'ต่ำ', '0.5': 'กลาง', 1: 'กลาง', 2: 'สูง' }[u.fam]}</span>`);
  setH('pTags', tgs.join(''));
  const fL = { '0': 'ไม่มี', '0.5': 'ไม่แน่ใจ', '1': 'มี (พ่อหรือแม่)', '2': 'มี (ทั้งพ่อและแม่)' };
  setH('pH', [['น้ำหนัก', u.wt ? u.wt + ' กก.' : '—'], ['ส่วนสูง', u.ht ? u.ht + ' ซม.' : '—'], ['BMI', bmi || '—'], ['ประวัติครอบครัว', fL[u.fam] || '—'], ['แพ้อาหาร', u.fa || 'ไม่มี'], ['แพ้ยา', u.da || 'ไม่มี'], ['โรคประจำตัว', u.dis || 'ไม่มี']].map(([k, v]) => `<div class="prow"><span class="pk">${k}</span><span class="pv">${v}</span></div>`).join(''));
  const eL = { urban: 'เมือง/มลภาวะสูง', suburban: 'ชานเมือง', rural: 'ชนบท' }; const jL = { office: 'พนักงานออฟฟิศ', outdoor: 'งานนอกสถานที่', medical: 'บุคลากรการแพทย์', student: 'นักเรียน/นักศึกษา', farmer: 'เกษตรกร', other: 'อื่นๆ' };
  setH('pL', [['สภาพแวดล้อม', eL[u.env] || '—'], ['อาชีพ', jL[u.job] || '—'], ['สัตว์เลี้ยง', u.pet === '1' ? 'มี (ในบ้าน)' : u.pet === '0.5' ? 'มี (นอกบ้าน)' : 'ไม่มี'], ['ประเมิน', hist.length + ' ครั้ง'], ['บันทึก', diary.length + ' รายการ']].map(([k, v]) => `<div class="prow"><span class="pk">${k}</span><span class="pv">${v}</span></div>`).join(''));
  const mh = hist.slice().reverse(); setH('histB', mh.length ? mh.map(h => `<tr><td>${h.dt}</td><td>${h.syms.slice(0, 3).map(s => `<span class="tag tg-s">${s}</span>`).join(' ')}</td><td><span class="tag ${h.r === 'hi' ? 'tg-c' : h.r === 'med' ? 'tg-a' : 'tg-t'}">${{ hi: 'สูง', med: 'ปานกลาง', lo: 'ต่ำ' }[h.r]}</span></td><td><span class="tag tg-o">${h.topT}</span></td><td>${h.sev || '—'}/10</td></tr>`).join('') : '<tr><td colspan="5" style="text-align:center;color:var(--ss);padding:1.5rem">ยังไม่มีประวัติ</td></tr>');
}

function openEditModal() { const u = CU; $('eName').value = u.name; $('eAge').value = u.age; $('eWt').value = u.wt; $('eHt').value = u.ht; $('eEnv').value = u.env; $('ePet').value = u.pet; $('eFA').value = u.fa || ''; $('eDA').value = u.da || ''; $('eDis').value = u.dis || ''; }

function saveProfile() { Object.assign(CU, { name: v('eName'), age: v('eAge'), wt: v('eWt'), ht: v('eHt'), env: v('eEnv'), pet: v('ePet'), fa: v('eFA'), da: v('eDA'), dis: v('eDis') }); const i = users.findIndex(x => x.email === CU.email); if (i >= 0) users[i] = CU; saveU(); $('navAv').textContent = CU.name[0]; $('navNm').textContent = CU.name; closeModal('editModal'); buildProf(); buildNotifs(); }

async function genHealthSum() {
  const u = CU; setH('profAI', '<div class="typing"><span></span><span></span><span></span></div>');
  const bmi = u.wt && u.ht ? ((u.wt / ((u.ht / 100) ** 2)).toFixed(1)) : 'ไม่ระบุ';
  const fL = { '0': 'ไม่มี', '0.5': 'ไม่แน่ใจ', '1': 'มีพ่อหรือแม่', '2': 'มีทั้งสองคน' };
  const top = lSc ? Object.entries(lSc).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([t, val]) => TY[t].n + ' ' + val + '%').join(', ') : 'ยังไม่ประเมิน';
  const p = `คุณเป็นแพทย์ผู้เชี่ยวชาญ สรุปสุขภาพสำหรับ: ${u.name} อายุ ${u.age || '?'} ปี เพศ ${u.sex || '?'} BMI ${bmi}\nประวัติครอบครัว: ${fL[u.fam] || '?'} | แพ้อาหาร: ${u.fa || 'ไม่มี'} | แพ้ยา: ${u.da || 'ไม่มี'}\nโรคประจำตัว: ${u.dis || 'ไม่มี'} | สภาพแวดล้อม: ${u.env} | สัตว์เลี้ยง: ${u.pet === '1' ? 'มีในบ้าน' : 'ไม่มี'}\nประเมินแล้ว: ${hist.length} ครั้ง | บันทึก: ${diary.length} รายการ | ผลล่าสุด: ${top}\nเขียนสรุปสุขภาพภาษาไทย 3-4 ประโยค ประเมินความเสี่ยงโดยรวม คำแนะนำสำคัญ 2-3 ข้อ ไม่ใช้ header หรือ bullet`;
  try { const res = await fetch('https://api.anthropic.com/v1/messages', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ model: 'claude-sonnet-4-6', max_tokens: 600, messages: [{ role: 'user', content: p }] }) }); const data = await res.json(); $('profAI').textContent = data.content?.find(c => c.type === 'text')?.text || 'ไม่สามารถสร้างสรุปได้'; } catch (e) { $('profAI').textContent = 'ไม่สามารถเชื่อมต่อได้'; }
}

function exportData() { const data = { user: { ...CU, pass: '***' }, assessments: hist, diary, exported: new Date().toISOString() }; const b = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }); const a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = 'allergyguard_data.json'; a.click(); }

if (requireLogin('prof')) buildProf();
