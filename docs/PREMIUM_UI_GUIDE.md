# Minimal Premium UI — KMITL Marketplace

ใช้คอมโพเนนต์ `AetherFlowHero` ที่ดัดแปลงจากโค้ด 21st.dev ซึ่งผู้ใช้แนบมา โดยใช้เฉพาะเป็น Hero หน้าแรกและรักษา API ของระบบเดิมทั้งหมด

## ติดตั้ง / เปิดใช้งาน (Windows PowerShell)

```powershell
cd "$env:USERPROFILE\Downloads\KMITL_Marketplace_Project\KMITL_Marketplace"
# สำรองโปรเจกต์เดิมก่อน แล้วคัดลอกไฟล์จากชุด Premium ทับในโปรเจกต์เดิม
# หากเปิดจากโฟลเดอร์โปรเจกต์ Premium ที่ดาวน์โหลดมา ให้ cd ไปยังโฟลเดอร์นั้นแทน
docker compose up --build
```

เปิด `http://localhost:3000` และทดสอบการค้นหา/กรองสินค้า การล็อกอิน และการลงขาย

## ไฟล์ที่เปลี่ยน
- `frontend/components/ui/aether-flow-hero.tsx` — component จากโค้ด 21st.dev ที่ปรับใช้กับ Marketplace พร้อมรองรับ reduced motion และ mobile
- `frontend/app/page.tsx` — หน้าแรกใหม่ เชื่อม API รายการสินค้าเดิม
- `frontend/components/Navbar.tsx` — navigation สีใหม่
- `frontend/components/ListingCard.tsx` — product card สีใหม่
- `frontend/app/globals.css` — design tokens และสไตล์พื้นฐาน
- `frontend/package.json` — เพิ่ม `framer-motion`

## Git (ทำงานแยก branch)

```powershell
git switch main
git pull origin main
git switch -c feature/premium-ui
# คัดลอกไฟล์ที่เปลี่ยนจากชุดนี้เข้าโปรเจกต์ของคุณ

git add frontend/app/page.tsx frontend/app/globals.css frontend/components/Navbar.tsx frontend/components/ListingCard.tsx frontend/components/ui/aether-flow-hero.tsx frontend/package.json docs/PREMIUM_UI_GUIDE.md
git commit -m "feat(ui): add premium marketplace hero and styling"
git push -u origin feature/premium-ui
```

เปิด Pull Request ให้ทีม Review ก่อน merge ห้าม Commit หรือ Push แทนสมาชิกคนอื่น

## ข้อจำกัด
ยังไม่ได้ทดสอบ `npm run build` ภายใน Docker ในสภาพแวดล้อมที่สร้างไฟล์นี้ ต้องรันบนเครื่องจริงก่อน merge. โหมดอนุภาคถูกปิดอัตโนมัติสำหรับผู้ใช้ที่ตั้งค่า reduced motion.
