# KMITL Marketplace — Liquid Glass & Theme

- Hero สีส้มเดิม: `frontend/components/ui/aether-flow-hero.tsx` ไม่มีการแก้ไข
- ค้นหา/ตัวกรอง: `frontend/app/page.tsx`, `frontend/components/ui/glass-select.tsx`, `frontend/app/globals.css`
- สวิตช์ Nimbus: `frontend/components/ui/liquid-glass-toggle.tsx` (โค้ดจากไฟล์ที่ให้มา)
- ธีม: `frontend/components/theme-provider.tsx`, `frontend/components/theme-toggle.tsx`
- FAQ: `frontend/components/marketplace-faq.tsx`

## Run
จากโฟลเดอร์ที่มี docker-compose.yml:
```powershell
docker compose up -d --build --force-recreate
```
เปิด http://localhost:3000  ทดสอบสลับโหมดที่ Navbar, ค้นหา/ตัวกรอง, และ FAQ

## Fonts & licensing
- Colasta ระบุ 'Free for personal use / No commercial use' ที่ https://www.dafont.com/colasta.font — ไม่รวมไฟล์ฟอนต์ใน ZIP นี้ ให้ขอสิทธิ์การใช้และเว็บฟอนต์ก่อนเผยแพร่ แล้วติดตั้งไฟล์ตาม license
- TH Sarabun New: https://www.f0nt.com/release/th-sarabun-new/ (GPL 2.0 + font exception) — CSS เตรียม family 'TH Sarabun New' เอาไว้ แต่ต้องติดตั้งฟอนต์เอง หรือเพิ่ม @font-face ด้วยไฟล์ที่ได้รับอนุญาต
- ใช้ fallback ที่มีบนระบบเมื่อไม่มีไฟล์ฟอนต์

## Deployment
ยังไม่ได้ Deploy ออนไลน์ เพราะต้องมีบัญชีและข้อมูลตั้งค่า Hosting / Secrets ของเจ้าของโปรเจกต์
- เชื่อม GitHub repository กับ hosting ที่รองรับ Next.js + FastAPI + PostgreSQL
- ตั้ง `NEXT_PUBLIC_API_URL`, `DATABASE_URL`, `SECRET_KEY`, `SMTP_*` ผ่านระบบ secrets ของผู้ให้บริการ (อย่า commit .env)
- เปิดการใช้งาน HTTPS, เก็บ uploads ใน persistent object storage, เปิด production security settings และทดสอบ auth ก่อน public
- ทดสอบ CI/CD รวมถึง FastAPI และ database migration ก่อน deploy

## Verify
```powershell
cd frontend
npm install
npm run typecheck
npm run build
```
