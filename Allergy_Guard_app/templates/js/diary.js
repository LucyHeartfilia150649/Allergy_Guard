// ===== หน้า diary =====
function initDPicker() { const w = $('dSymPick'); if (!w || w.dataset.built) return; w.dataset.built = 1; const sh = ALL.slice(0, 12); w.innerHTML = sh.map(s => `<button data-id="${s.id}" onclick="this.classList.toggle('dsel');this.style.background=this.classList.contains('dsel')?'var(--tl)':'';this.style.borderColor=this.classList.contains('dsel')?'var(--t)':'var(--sm)'" style="padding:5px 11px;border-radius:999px;font-size:12px;border:1.5px solid var(--sm);background:var(--w);cursor:pointer;transition:all .15s">${s.ic} ${s.l}</button>`).join(''); }

function saveDiary() {
  const date = v('dDate') || new Date().toISOString().slice(0, 10); const level = parseInt(v('dLevel')) || 3; const syms = [];
  document.querySelectorAll('#dSymPick button.dsel').forEach(b => { const s = ALL.find(x => x.id === b.dataset.id); if (s) syms.push(s.l); });
  diary.unshift({ id: Date.now(), date, level, syms, trigger: v('dTrig'), med: v('dMed'), note: v('dNote') });
  saveLS(); clearDForm(); buildDiaryList(); buildNotifs();
  show('dSaved'); setTimeout(() => hide('dSaved'), 2500);
}

function clearDForm() { $('dDate').value = new Date().toISOString().slice(0, 10); $('dLevel').value = '3'; $('dTrig').value = ''; $('dMed').value = ''; $('dNote').value = ''; const w = $('dSymPick'); if (w) { w.dataset.built = ''; initDPicker(); } }

function buildDiaryList() {
  if (!diary.length) { setH('diaryList', '<div class="empty-s"><div class="es-ic">📓</div><h3>ยังไม่มีบันทึก</h3><p>เพิ่มบันทึกอาการด้านบนเพื่อเริ่มติดตามสุขภาพ</p></div>'); return; }
  const lc = ['', '#0D9373', '#15803D', '#D97706', '#E5533A', '#B91C1C']; const ll = ['', 'ไม่มีอาการ', 'เล็กน้อย', 'ปานกลาง', 'รุนแรง', 'รุนแรงมาก'];
  setH('diaryList', diary.map((d, i) => `<div class="diary-entry"><div class="diary-hd"><div><span class="diary-dt">${d.date}</span><span style="margin-left:8px;font-size:12px;font-weight:700;color:${lc[d.level] || '#475569'}">● ${ll[d.level] || '?'}</span></div><button onclick="if(confirm('ลบบันทึกนี้?')){diary.splice(${i},1);saveLS();buildDiaryList();buildNotifs()}" style="padding:3px 9px;border-radius:6px;font-size:11px;border:1px solid var(--cm);background:var(--cl);color:var(--c);cursor:pointer">ลบ</button></div><div class="diary-body">${d.note || '—'}</div><div class="diary-tg">${(d.syms || []).map(s => `<span class="tag tg-s">${s}</span>`).join('')}${d.trigger ? `<span class="tag tg-a">⚡ ${d.trigger}</span>` : ''}${d.med ? `<span class="tag tg-o">💊 ${d.med}</span>` : ''}</div></div>`).join(''));
}

if (requireLogin('diary')) { $('dDate').value = new Date().toISOString().slice(0, 10); buildDiaryList(); initDPicker(); }
