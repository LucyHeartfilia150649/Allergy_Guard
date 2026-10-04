// ===== หน้า login =====

async function doLogin() {

  const email = v('lEm').trim().toLowerCase();
  const password = v('lPw');

  hide('lErr');


  // =========================
  // ตรวจ Email / Password
  // =========================

  if (!email || !password) {

    show('lErr');

    $('lErr').textContent =
      'กรุณากรอกอีเมลและรหัสผ่าน';

    return;
  }


  // =========================
  // ดึง reCAPTCHA token โดยตรง
  // =========================

  let recaptchaToken = '';

  if (window.grecaptcha) {
    recaptchaToken = grecaptcha.getResponse();
  }


  // =========================
  // ตรวจว่า reCAPTCHA ผ่านหรือยัง
  // =========================

  if (!recaptchaToken) {

    show('lErr');

    $('lErr').textContent =
      'กรุณายืนยัน reCAPTCHA ก่อนเข้าสู่ระบบ';

    return;
  }


  // =========================
  // ส่ง Login ไป Flask
  // =========================

  try {

    const res = await fetch('/api/auth/login', {

      method: 'POST',

      headers: {
        'Content-Type': 'application/json'
      },

      credentials: 'same-origin',

      body: JSON.stringify({

        email: email,

        pass: password,

        recaptcha_token: recaptchaToken

      })
    });


    const data = await res.json();


    // =========================
    // Login ไม่สำเร็จ
    // =========================

    if (!res.ok || !data.ok) {

      show('lErr');

      $('lErr').textContent =
        data.error ||
        'อีเมลหรือรหัสผ่านไม่ถูกต้อง';


      // Reset reCAPTCHA
      if (window.grecaptcha) {
        grecaptcha.reset();
      }

      return;
    }


    // =========================
    // Login สำเร็จ
    // =========================

    location.href = 'dashboard.html';


  } catch (err) {

    console.error('Login error:', err);

    show('lErr');

    $('lErr').textContent =
      'ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้ กรุณาลองใหม่';
  }
}