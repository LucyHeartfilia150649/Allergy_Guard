// ===== หน้า register =====

let rS = 1;


// =========================
// ไปขั้นตอนถัดไป
// =========================
function rsN(s) {

  // ขั้นตอนที่ 1 → ตรวจข้อมูลบัญชี
  if (s === 1) {

    const name = v('rNm').trim();
    const email = v('rEm').trim();
    const password = v('rPw');

    if (!name || !email || !password) {
      alert('กรุณากรอกข้อมูลให้ครบ');
      return;
    }

    // ตรวจรูปแบบ Password
    if (!isStrongPassword(password)) {
      alert(
        'รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร และประกอบด้วย\n' +
        '- ตัวพิมพ์เล็ก (a-z)\n' +
        '- ตัวพิมพ์ใหญ่ (A-Z)\n' +
        '- ตัวเลข (0-9)\n' +
        '- อักขระพิเศษ เช่น ! @ # $ %'
      );
      return;
    }
  }


  // ขั้นตอนที่ 2 → ตรวจอายุ
  if (s === 2) {

    if (!v('rAge')) {
      alert('กรุณาระบุอายุ');
      return;
    }
  }


  // เปลี่ยนหน้า
  hide('rs' + s);
  show('rs' + (s + 1));

  rS = s + 1;

  updDots();
}


// =========================
// ย้อนกลับ
// =========================
function rsB(s) {

  hide('rs' + s);
  show('rs' + (s - 1));

  rS = s - 1;

  updDots();
}


// =========================
// อัปเดตจุดด้านบน
// =========================
function updDots() {

  [1, 2, 3].forEach(i => {

    const d = $('rd' + i);

    d.className =
      'rbd' +
      (
        i < rS
          ? ' done'
          : i === rS
            ? ' act'
            : ''
      );
  });
}


// =========================
// สมัครสมาชิก
// =========================
async function doReg() {

  // -------------------------
  // ตรวจ Password อีกครั้ง
  // -------------------------

  const password = v('rPw');

  if (!isStrongPassword(password)) {

    alert(
      'รหัสผ่านไม่ตรงตามเงื่อนไข\n\n' +
      'ต้องมี:\n' +
      '✓ อย่างน้อย 8 ตัวอักษร\n' +
      '✓ ตัวพิมพ์เล็ก (a-z)\n' +
      '✓ ตัวพิมพ์ใหญ่ (A-Z)\n' +
      '✓ ตัวเลข (0-9)\n' +
      '✓ อักขระพิเศษ'
    );

    return;
  }


  // -------------------------
  // ตรวจ reCAPTCHA
  // -------------------------

  if (!recaptchaToken) {

    alert('กรุณายืนยัน reCAPTCHA ก่อนสร้างบัญชี');

    return;
  }


  // -------------------------
  // เก็บข้อมูลผู้ใช้
  // -------------------------

  const u = {

    email: v('rEm').trim().toLowerCase(),

    pass: password,

    name: v('rNm').trim(),

    age: v('rAge'),

    sex: v('rSex'),

    wt: v('rWt'),

    ht: v('rHt'),

    bld: v('rBld'),

    fam: v('rFam'),

    env: v('rEnv'),

    job: v('rJob'),

    pet: v('rPet'),

    fa: v('rFA').trim(),

    da: v('rDA').trim(),

    dis: v('rDis').trim()
  };


  // -------------------------
  // ตรวจข้อมูลจำเป็น
  // -------------------------

  if (!u.name || !u.email || !u.pass) {

    alert('กรุณากรอกข้อมูลให้ครบ');

    return;
  }


  // -------------------------
  // ส่งไป Flask API
  // -------------------------

  try {

    const res = await fetch('/api/auth/register', {

      method: 'POST',

      headers: {
        'Content-Type': 'application/json'
      },

      credentials: 'same-origin',

      body: JSON.stringify({
    email: u.email,
    pass: u.pass,
    recaptcha_token: recaptchaToken,
    user: {
        name: u.name,
        age: u.age,
        sex: u.sex,
        wt: u.wt,
        ht: u.ht,
        bld: u.bld,
        fam: u.fam,
        env: u.env,
        job: u.job,
        pet: u.pet,
        fa: u.fa,
        da: u.da,
        dis: u.dis
    }
})
    });


    const data = await res.json();


    // -------------------------
    // สมัครไม่สำเร็จ
    // -------------------------

    if (!res.ok || !data.ok) {

      alert(
        data.error ||
        'ไม่สามารถสร้างบัญชีได้ กรุณาลองใหม่'
      );


      // reset reCAPTCHA
      if (window.grecaptcha) {
        grecaptcha.reset();
      }

      recaptchaToken = '';

      return;
    }


    // -------------------------
    // สมัครสำเร็จ
    // -------------------------

    alert('สร้างบัญชีสำเร็จ!');

    location.href = 'dashboard.html';


  } catch (err) {

    console.error('Register error:', err);

    alert(
      'ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้\n' +
      'กรุณาลองใหม่อีกครั้ง'
    );
  }
}