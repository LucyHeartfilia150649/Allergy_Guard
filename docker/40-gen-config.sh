#!/bin/sh
# สร้าง js/config.js จากตัวแปร RECAPTCHA_SITE_KEY ตอนสตาร์ต container
# ถ้าไม่ได้ตั้งค่า จะใช้ config.js ตัวเดิม (คีย์ทดสอบของ Google)
set -e
ROOT="${WEB_ROOT:-/usr/share/nginx/html}"
KEY="${RECAPTCHA_SITE_KEY:-}"

if [ -z "$KEY" ]; then
  echo "gen-config: RECAPTCHA_SITE_KEY ว่าง — ใช้ค่าเริ่มต้นใน js/config.js"
  exit 0
fi
case "$KEY" in
  *[!A-Za-z0-9_-]*) echo "gen-config: RECAPTCHA_SITE_KEY มีอักขระที่ไม่ถูกต้อง" >&2; exit 1 ;;
esac

cat > "$ROOT/js/config.js" <<JS
// สร้างอัตโนมัติจาก .env ตอนสตาร์ต container — อย่าแก้ไฟล์นี้ใน container
const RECAPTCHA_SITE_KEY = '$KEY';
JS
echo "gen-config: เขียน js/config.js แล้ว"
