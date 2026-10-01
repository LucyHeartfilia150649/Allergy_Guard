FROM nginx:alpine

COPY allergy_guard_app/ /usr/share/nginx/html/
# สคริปต์นี้ nginx image จะรันให้อัตโนมัติก่อนสตาร์ต
COPY docker/40-gen-config.sh /docker-entrypoint.d/40-gen-config.sh
# กัน CRLF จาก Windows ทำให้สคริปต์รันไม่ได้ แล้วตั้งสิทธิ์ execute
RUN sed -i 's/\r$//' /docker-entrypoint.d/40-gen-config.sh && chmod +x /docker-entrypoint.d/40-gen-config.sh

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
