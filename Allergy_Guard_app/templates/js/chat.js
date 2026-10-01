// ===== หน้า chat =====
const QQS = ['ยาแก้แพ้ตัวไหนดี?', 'ไรฝุ่นคืออะไร?', 'อาหารที่ควรกิน?', 'เมื่อไหร่ควรพบแพทย์?', 'วิธีลดอาการกลางคืน', 'แพ้อาหารทะเลอันตรายไหม?'];

function initChat() {
  if (!chatH.length) chatH = [{ r: 'ai', t: 'สวัสดีครับ ผมคือผู้ช่วยแพทย์ AI ด้านโรคภูมิแพ้ 🫁\nถามได้เลยเกี่ยวกับ: อาการและประเภทโรคภูมิแพ้, วิธีดูแลตัวเองและป้องกัน, ยาและการรักษาเบื้องต้น, หรือเมื่อไหร่ควรพบแพทย์' }];
  renderChat();
  setH('chatQs', '<span style="font-size:12px;color:var(--ss);align-self:center;margin-right:4px;font-weight:600">คำถามด่วน:</span>' + QQS.map(q => `<button class="cq" onclick="sendQ('${q}')">${q}</button>`).join(''));
}

function renderChat() { const c = $('chatMsgs'); if (!c) return; c.innerHTML = chatH.map(m => `<div><div class="msg-who">${m.r === 'ai' ? '🤖 AllergyGuard AI' : '👤 คุณ'}</div><div class="msg msg-${m.r}">${m.t.replace(/\n/g, '<br>')}</div></div>`).join(''); c.scrollTop = c.scrollHeight; saveLS(); }

function sendQ(q) { $('chatInp').value = q; sendChat(); }

    async function sendChat() {
      const inp = $('chatInp'); const q = inp.value.trim(); if (!q) return; inp.value = '';
      chatH.push({ r: 'user', t: q }); chatH.push({ r: 'ai', t: '...' }); renderChat();
      const u = CU; const top = lSc ? Object.entries(lSc).sort((a, b) => b[1] - a[1]).slice(0, 2).map(([t]) => TY[t].n).join(',') : '-';
      const sys = `คุณเป็นผู้ช่วยแพทย์ AI ด้านโรคภูมิแพ้ ชื่อว่า AllergyGuard AI ตอบเป็นภาษาไทยที่เข้าใจง่าย กระชับ เป็นกันเอง
ข้อมูลผู้ใช้: ${u.name} อายุ ${u.age || '?'} ปี แพ้อาหาร: ${u.fa || 'ไม่มี'} แพ้ยา: ${u.da || 'ไม่มี'} ประเมินล่าสุด: ${top}
ตอบไม่เกิน 5 ประโยค ถ้าเรื่องฉุกเฉินให้แนะนำพบแพทย์ทันที`;
      try {
        const res = await fetch('https://api.anthropic.com/v1/messages', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ model: 'claude-sonnet-4-6', max_tokens: 500, messages: [{ role: 'user', content: sys + '\n\nคำถาม: ' + q }] }) });
        const data = await res.json(); chatH[chatH.length - 1] = { r: 'ai', t: data.content?.find(c => c.type === 'text')?.text || 'ขออภัย ไม่สามารถตอบได้' };
      } catch (e) { chatH[chatH.length - 1] = { r: 'ai', t: 'ไม่สามารถเชื่อมต่อได้ กรุณาลองใหม่' }; }
      renderChat();
    }

if (requireLogin('chat')) initChat();
