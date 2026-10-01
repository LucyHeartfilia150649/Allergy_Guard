// ===== หน้า register =====
let rS = 1;

function rsN(s) { if (s === 1 && (!v('rNm') || !v('rEm') || v('rPw').length < 8)) { alert('กรุณากรอกข้อมูลให้ครบ (รหัสผ่านอย่างน้อย 8 ตัว)'); return; } if (s === 2 && !v('rAge')) { alert('กรุณาระบุอายุ'); return; } hide('rs' + s); show('rs' + (s + 1)); rS = s + 1; updDots(); }

function rsB(s) { hide('rs' + s); show('rs' + (s - 1)); rS = s - 1; updDots(); }

function updDots() { [1, 2, 3].forEach(i => { const d = $('rd' + i); d.className = 'rbd' + (i < rS ? ' done' : i === rS ? ' act' : ''); }); }

function doReg() { if (!rcOk('rCap')) { show('rCapErr'); return; } hide('rCapErr'); loadU(); const u = { email: v('rEm'), pass: v('rPw'), name: v('rNm'), age: v('rAge'), sex: v('rSex'), wt: v('rWt'), ht: v('rHt'), bld: v('rBld'), fam: v('rFam'), env: v('rEnv'), job: v('rJob'), pet: v('rPet'), fa: v('rFA'), da: v('rDA'), dis: v('rDis') }; if (users.find(x => x.email === u.email)) { alert('อีเมลนี้มีผู้ใช้งานแล้ว'); rcReset('rCap'); return; } users.push(u); saveU(); enterApp(u); }


