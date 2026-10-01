// ===== reCAPTCHA helper (ใช้ในหน้า login และ register) =====
const RC = { ids: {} };

// Google เรียกฟังก์ชันนี้เมื่อโหลดสคริปต์เสร็จ (onload=onRecaptchaLoad)
function onRecaptchaLoad() {
  document.querySelectorAll('.rc-box').forEach(el => {
    RC.ids[el.id] = grecaptcha.render(el, { sitekey: RECAPTCHA_SITE_KEY });
  });
}
// true เมื่อผู้ใช้ติ๊กผ่านแล้ว (ถ้าโหลดสคริปต์ไม่ได้ เช่น ออฟไลน์ จะถือว่าไม่ผ่าน)
function rcOk(boxId) {
  return typeof grecaptcha !== 'undefined' && boxId in RC.ids && !!grecaptcha.getResponse(RC.ids[boxId]);
}
function rcReset(boxId) {
  if (typeof grecaptcha !== 'undefined' && boxId in RC.ids) grecaptcha.reset(RC.ids[boxId]);
}
