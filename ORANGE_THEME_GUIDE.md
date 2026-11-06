# KMITL Marketplace — Orange Premium Theme

โครงการเดิมทุกระบบยังอยู่ครบ: Next.js, FastAPI, PostgreSQL, Docker. ปรับสีใน Frontend ให้เป็นส้ม-ครีม-น้ำตาลเข้มทั้งเว็บ รวม Hero Animation, Navbar, ฟอร์ม, Card และปุ่ม

## เริ่มต้น

เปิดโฟลเดอร์ `KMITL_Marketplace_Animated` ใน VS Code แล้วรัน:

```powershell
docker compose up -d --build --force-recreate
```

เปิด http://localhost:3000 และ Ctrl+Shift+R

## ถ้าจะย้ายไปโปรเจกต์ GitHub ที่กำลังทำงานอยู่

ใช้ Branch ใหม่ `feature/orange-theme` แล้วคัดลอกเฉพาะ `frontend/app/`, `frontend/components/` และ `frontend/app/globals.css` ที่มีการเปลี่ยนแปลง หลังจากนั้นทดสอบและเปิด Pull Request ห้ามทับ `main` ตรง ๆ

**หมายเหตุ:** ตรวจการแปลงสี/โครงสร้างไฟล์แล้ว ยังไม่ได้ยืนยัน Browser และ Docker Build ในเครื่องผู้ใช้
