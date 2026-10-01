// ===== โค้ดที่ใช้ร่วมกันทุกหน้า =====
const SDB = {
  nasal: [{ id: 'n1', l: 'จามบ่อย', ic: '💨', w: { rhinitis: 3, dust: 2 } }, { id: 'n2', l: 'คัดจมูก', ic: '🤧', w: { rhinitis: 3, dust: 2 } }, { id: 'n3', l: 'น้ำมูกใส', ic: '💧', w: { rhinitis: 3, pollen: 2 } }, { id: 'n4', l: 'คันจมูก', ic: '✋', w: { rhinitis: 2, dust: 2 } }, { id: 'n5', l: 'ตาแดง/คัน', ic: '👁️', w: { rhinitis: 2, pollen: 3 } }, { id: 'n6', l: 'น้ำตาไหล', ic: '😢', w: { pollen: 3, rhinitis: 1 } }],
  skin: [{ id: 's1', l: 'ผื่นแดง', ic: '🔴', w: { eczema: 3, food: 2, contact: 2 } }, { id: 's2', l: 'คันผิวหนัง', ic: '🖐️', w: { eczema: 3, contact: 3, dust: 1 } }, { id: 's3', l: 'ลมพิษ', ic: '⚠️', w: { food: 3, drug: 2, contact: 2 } }, { id: 's4', l: 'ผิวแห้ง/แตก', ic: '🌵', w: { eczema: 3, contact: 1 } }, { id: 's5', l: 'บวมที่ผิว/ปาก', ic: '🫧', w: { food: 2, drug: 3, insect: 2 } }, { id: 's6', l: 'ผื่นหลังสัมผัส', ic: '🤚', w: { contact: 4, latex: 3 } }],
  resp: [{ id: 'r1', l: 'หายใจมีเสียงหวีด', ic: '🌬️', w: { asthma: 4, dust: 2 } }, { id: 'r2', l: 'หอบ/หายใจลำบาก', ic: '💨', w: { asthma: 4, food: 2 } }, { id: 'r3', l: 'ไอเรื้อรัง', ic: '😮‍💨', w: { asthma: 3, dust: 2, rhinitis: 1 } }, { id: 'r4', l: 'แน่นหน้าอก', ic: '❤️', w: { asthma: 3, food: 1 } }, { id: 'r5', l: 'ไอมากตอนเช้า', ic: '🌅', w: { dust: 3, rhinitis: 2 } }],
  gut: [{ id: 'g1', l: 'คลื่นไส้/อาเจียน', ic: '🤢', w: { food: 3, drug: 2 } }, { id: 'g2', l: 'ปวดท้องหลังกิน', ic: '😣', w: { food: 3, drug: 1 } }, { id: 'g3', l: 'ท้องเสียบ่อย', ic: '🚽', w: { food: 3 } }, { id: 'g4', l: 'ปาก/ลิ้นชา/บวม', ic: '👄', w: { food: 4, latex: 2 } }, { id: 'g5', l: 'คันปากหลังกิน', ic: '😋', w: { food: 3, latex: 1 } }]
};

const ALL = [...Object.values(SDB).flat()];

const TY = {
  rhinitis: { n: 'จมูกอักเสบภูมิแพ้', c: '#0D9373', bg: '#E5F6F1' },
  asthma: { n: 'โรคหืด', c: '#1B4F8A', bg: '#E8F0FA' },
  eczema: { n: 'ผื่นผิวหนังภูมิแพ้', c: '#993C1D', bg: '#FAECE7' },
  food: { n: 'แพ้อาหาร', c: '#B45309', bg: '#FEF9EE' },
  dust: { n: 'แพ้ไรฝุ่น', c: '#475569', bg: '#F1F5F9' },
  pollen: { n: 'แพ้ละอองเกสร', c: '#3B6D11', bg: '#EAF3DE' },
  contact: { n: 'ผื่นสัมผัส', c: '#7C2D12', bg: '#FFF7ED' },
  drug: { n: 'แพ้ยา', c: '#991B1B', bg: '#FEF2F2' },
  latex: { n: 'แพ้ยาง Latex', c: '#5B21B6', bg: '#EDE9FE' },
  insect: { n: 'แพ้แมลงกัด', c: '#92400E', bg: '#FEF9EE' }
};

let CU = null, sel = new Set(), lSc = null, lSym = [], hist = [], diary = [], chatH = [], pChk = {};

const DEMO = { email: 'demo@allergy.com', pass: 'demo1234', name: 'สมชาย ใจดี', age: 32, sex: 'ชาย', wt: 70, ht: 170, bld: 'B', fam: '1', env: 'urban', job: 'office', pet: '0', fa: 'อาหารทะเล', da: '', dis: '' };

let users = [DEMO];

const $ = id => document.getElementById(id);

const v = id => ($(id) || {}).value || '';

const show = id => $(id) && $(id).classList.remove('hidden');

const hide = id => $(id) && $(id).classList.add('hidden');

const setH = (id, h) => { if ($(id)) $(id).innerHTML = h; };

function saveLS() { if (!CU) return; const k = CU.email; localStorage.setItem('agh_' + k, JSON.stringify(hist)); localStorage.setItem('agd_' + k, JSON.stringify(diary)); localStorage.setItem('agp_' + k, JSON.stringify(pChk)); localStorage.setItem('ags_' + k, JSON.stringify({ lSc, lSym, chatH })); }

function loadLS() { if (!CU) return; const h = localStorage.getItem('agh_' + CU.email); const d = localStorage.getItem('agd_' + CU.email); const p = localStorage.getItem('agp_' + CU.email); const s = localStorage.getItem('ags_' + CU.email); if (h) hist = JSON.parse(h); if (d) diary = JSON.parse(d); if (p) pChk = JSON.parse(p); if (s) { const o = JSON.parse(s); lSc = o.lSc || null; lSym = o.lSym || []; chatH = o.chatH || []; } }

function saveU() { localStorage.setItem('ag_users', JSON.stringify(users)); }

function loadU() { const u = localStorage.getItem('ag_users'); if (u) { const p = JSON.parse(u); if (!p.find(x => x.email === DEMO.email)) p.unshift(DEMO); users = p; } }

function showAuth(p) { location.href = p === 'reg' ? 'register.html' : 'login.html'; }

function doLogin() { loadU(); const e = v('lEm'), p = v('lPw'); const u = users.find(x => x.email === e && x.pass === p); if (!u) { show('lErr'); return; } hide('lErr'); enterApp(u); }

function enterApp(u) { sessionStorage.setItem('ag_session', u.email); location.href = 'dashboard.html'; }

function logout() { saveLS(); sessionStorage.removeItem('ag_session'); location.href = 'login.html'; }

function buildNotifs() {
  const ns = [];
  if (hist.length && hist[hist.length - 1].r === 'hi') ns.push({ c: 'al-err', m: '🚨 ผลประเมินล่าสุดความเสี่ยงสูง — แนะนำพบแพทย์' });
  if (CU.fa) ns.push({ c: 'al-warn', m: '⚠️ แพ้อาหาร: ' + CU.fa }); if (CU.da) ns.push({ c: 'al-warn', m: '⚠️ แพ้ยา: ' + CU.da });
  if (!diary.find(d => d.date === new Date().toISOString().slice(0, 10))) ns.push({ c: 'al-info', m: '📓 ยังไม่ได้บันทึกอาการวันนี้' });
  if (!hist.length) ns.push({ c: 'al-info', m: '🔍 ยังไม่เคยประเมินอาการ ลองเลยวันนี้!' });
  $('ndot').style.display = ns.length ? '' : 'none';
  setH('notifList', ns.length ? ns.map(n => `<div class="al ${n.c}" style="margin-bottom:8px">${n.m}</div>`).join('') : '<div class="al al-ok">✅ ไม่มีการแจ้งเตือนใหม่</div>');
}

function openModal(id) { if (id === 'editModal') openEditModal(); show(id); document.body.style.overflow = 'hidden'; }

function closeModal(id) { hide(id); document.body.style.overflow = ''; }

    async function callAI(syms, top5, mode) {
      const u = CU; const sl = syms.map(s => s.l).join(', '); const tt = top5.slice(0, 3).map(([t]) => TY[t].n).join(', ');
      const fL = { '0': 'ไม่มี', '0.5': 'ไม่แน่ใจ', '1': 'มีพ่อหรือแม่', '2': 'มีทั้งพ่อและแม่' };
      const jL = { office: 'พนักงานออฟฟิศ', outdoor: 'นอกสถานที่', medical: 'บุคลากรการแพทย์', student: 'นักเรียน', farmer: 'เกษตรกร', other: 'อื่นๆ' };
      const eL = { urban: 'เมือง/มลภาวะสูง', suburban: 'ชานเมือง', rural: 'ชนบท' };
      const rd = diary.slice(0, 5).map(d => `${d.date}:ระดับ${d.level} ${(d.syms || []).join(',')}`).join('; ');
      let prompt = '';
      if (mode === 'assess') {
        prompt = `คุณเป็นแพทย์ผู้เชี่ยวชาญโรคภูมิแพ้ในประเทศไทย วิเคราะห์ผู้ป่วย:
ชื่อ: ${u.name} | อายุ: ${u.age || '?'} ปี | เพศ: ${u.sex || '?'} | อาชีพ: ${jL[u.job] || u.job || '?'}
สภาพแวดล้อม: ${eL[u.env] || u.env} | สัตว์เลี้ยง: ${u.pet === '1' ? 'มีในบ้าน' : 'ไม่มี'}
ประวัติครอบครัว: ${fL[u.fam] || '?'} | แพ้อาหาร: ${u.fa || 'ไม่มี'} | แพ้ยา: ${u.da || 'ไม่มี'}
อาการ: ${sl} | ความรุนแรง: ${v('aSev')}/10 | ระยะเวลา: ${v('aDur')} เดือน
ประเภทที่วิเคราะห์: ${tt}${v('aNote') ? '\nสิ่งที่สงสัย: ' + v('aNote') : ''}
${rd ? 'บันทึกอาการล่าสุด: ' + rd : ''}
เขียนวิเคราะห์ภาษาไทยเข้าใจง่าย 5-7 ประโยค: 1)สรุปความเสี่ยง 2)ประเภทโรคที่น่าสงสัยพร้อมเหตุผล 3)คำแนะนำดูแลตัวเองที่เหมาะกับวิถีชีวิต 4)สัญญาณควรพบแพทย์ ไม่ใช้ bullet/header`;
      } else {
        prompt = `คุณเป็นแพทย์ผู้เชี่ยวชาญโรคภูมิแพ้ สร้างคำแนะนำส่วนตัวสำหรับ:
${u.name} | อายุ ${u.age || '?'} | อาชีพ ${jL[u.job] || u.job || '?'} | สภาพแวดล้อม ${eL[u.env] || u.env}
สัตว์เลี้ยง: ${u.pet === '1' ? 'มีในบ้าน' : 'ไม่มี'} | แพ้อาหาร: ${u.fa || 'ไม่มี'} | โรคประจำตัว: ${u.dis || 'ไม่มี'}
อาการ: ${sl || 'ยังไม่ประเมิน'} | ประเภทที่น่าสงสัย: ${tt || 'ยังไม่ระบุ'}
เขียนคำแนะนำส่วนตัวภาษาไทย 5-7 ประโยค: 1)สิ่งกระตุ้นที่ควรหลีกเลี่ยงตามวิถีชีวิต 2)การดูแลตัวเองรายวัน 3)โภชนาการ 4)การออกกำลังกายที่เหมาะสม ไม่ใช้ bullet/header`;
      }
      const tid = mode === 'assess' ? 'aAI' : 'recAI';
      setH(tid, '<div class="typing"><span></span><span></span><span></span></div>');
      try {
        const res = await fetch('https://api.anthropic.com/v1/messages', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ model: 'claude-sonnet-4-6', max_tokens: 1000, messages: [{ role: 'user', content: prompt }] }) });
        const data = await res.json(); $(tid).textContent = data.content?.find(c => c.type === 'text')?.text || 'ไม่สามารถวิเคราะห์ได้';
      } catch (e) { $(tid).textContent = 'ไม่สามารถเชื่อมต่อ AI ได้ กรุณาตรวจสอบอินเทอร์เน็ต'; }
    }

function tpChk(k, el) { pChk[k] = !pChk[k]; el.classList.toggle('done', pChk[k]); el.textContent = pChk[k] ? '✓' : ''; saveLS(); }

const PTASKS = [
  { freq: 'ทุกวัน', task: 'ล้างจมูกด้วยน้ำเกลือ Isotonic', res: 'ลดสารก่อภูมิแพ้ในช่องจมูก', tg: 'tg-t' },
  { freq: 'ทุกวัน', task: 'เช็ดพื้น/ระบายอากาศห้องนอน', res: 'ลดฝุ่น ลดความชื้น ลดเชื้อรา', tg: 'tg-t' },
  { freq: 'ทุกวัน', task: 'บันทึกอาการในแอป', res: 'ติดตามแนวโน้มและระบุสิ่งกระตุ้น', tg: 'tg-t' },
  { freq: 'ทุกสัปดาห์', task: 'ซักผ้าปูที่นอน/ปลอกหมอน (น้ำร้อน)', res: 'กำจัดไรฝุ่นและเชื้อโรค', tg: 'tg-a' },
  { freq: 'ทุกสัปดาห์', task: 'ดูดฝุ่นพรม โซฟา ผ้าม่าน', res: 'ลดฝุ่นสะสม', tg: 'tg-a' },
  { freq: 'ทุกเดือน', task: 'เปลี่ยนไส้กรองเครื่องกรองอากาศ', res: 'ประสิทธิภาพกรองสูงสุด', tg: 'tg-o' },
  { freq: 'ทุกเดือน', task: 'ทบทวนบันทึกอาการ หาแนวโน้ม', res: 'วางแผนหลีกเลี่ยงสิ่งกระตุ้น', tg: 'tg-o' },
  { freq: 'ทุก 3 เดือน', task: 'พบแพทย์ติดตามอาการ', res: 'ปรับยาและแผนการดูแล', tg: 'tg-v' }
];

const PAGES = { dash: 'dashboard.html', assess: 'assess.html', diary: 'diary.html', chat: 'chat.html', plan: 'plan.html', rec: 'recommend.html', prev: 'prevent.html', prof: 'profile.html' };
function goto(p) { if (PAGES[p]) location.href = PAGES[p]; }

// เรียกในทุกหน้าหลังล็อกอิน: ตรวจ session, โหลดข้อมูลผู้ใช้, ตั้งค่า navbar
function requireLogin(page) {
  loadU();
  const u = users.find(x => x.email === sessionStorage.getItem('ag_session'));
  if (!u) { location.replace('login.html'); return false; }
  CU = u; loadLS();
  $('navAv').textContent = u.name[0]; $('navNm').textContent = u.name;
  document.querySelectorAll('.ntab').forEach((t, i) => t.classList.toggle('on', Object.keys(PAGES)[i] === page));
  buildNotifs();
  return true;
}

loadU();
