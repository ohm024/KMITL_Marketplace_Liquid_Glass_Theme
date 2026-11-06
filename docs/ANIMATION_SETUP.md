# Aether Flow Animation — วิธีติดตั้งใน KMITL Marketplace

โปรเจกต์นี้มี Next.js + TypeScript + Tailwind CSS และคอมโพเนนต์ที่ `frontend/components/ui/aether-flow-hero.tsx` แล้ว ไม่มีความจำเป็นต้องติดตั้ง shadcn CLI เพื่อใช้เอฟเฟกต์นี้ (การใช้ shadcn component อื่นในอนาคตสามารถตั้งค่า CLI แยกได้)

## ถ้าต้องการแก้ใน GitHub Repository เดิม

1. ที่โฟลเดอร์โปรเจกต์ Git เดิม รัน `git switch main`, `git pull origin main` และ `git switch -c feature/aether-animation` (หากมี branch นี้แล้วให้ใช้ `git switch feature/aether-animation`).
2. คัดลอกไฟล์ `frontend/components/ui/aether-flow-hero.tsx` **จากชุดนี้เท่านั้น** ไปทับไฟล์ตำแหน่งเดียวกันในโปรเจกต์เดิม อย่าเอา ZIP ทั้งโฟลเดอร์มาทับไฟล์งานเพื่อน
3. ถ้าขาด dependency ให้เข้าที่ `frontend` แล้วรัน `npm install framer-motion lucide-react` (ใน ZIP นี้มีรายชื่อ dependency ใน package.json อยู่แล้ว)
4. ทดสอบจากรากโปรเจกต์ด้วย `docker compose up --build` แล้วเปิด `http://localhost:3000` หาก port 3000/8000 ถูกใช้อยู่ให้หยุดคอนเทนเนอร์เก่าก่อน
5. ทดสอบว่าจุดและเส้นเคลื่อนที่, เมาส์ผลักอนุภาค, ปุ่มไป Browse/Sell ใช้ได้, แสดงบนมือถือ และตั้งค่า reduced motion ของ OS แล้วไม่เกิดการเคลื่อนไหว
6. `git add frontend/components/ui/aether-flow-hero.tsx`, `git commit -m "feat(ui): improve interactive aether hero animation"`, `git push -u origin feature/aether-animation` แล้วเปิด Pull Request

## ดีไซน์และวิธีทำงาน
- ใช้ Canvas อยู่หลังเนื้อหา (z-index 1) และไม่บังปุ่ม (`pointer-events-none`)
- เมาส์ถูกติดตามจาก `<section>` ของ Hero ไม่ใช่จาก Canvas ที่อยู่หลังข้อความ
- เส้นเชื่อมเข้มขึ้น, อนุภาคขยับ และเมื่อชี้ใกล้เส้นจะสว่างขึ้น
- ใช้ `ResizeObserver`, `IntersectionObserver` และ `requestAnimationFrame` เพื่อปรับหน้าจอและลดงานเมื่อ Hero ไม่อยู่บนหน้าจอ
- ผู้ใช้ที่เปิด Reduce Motion ในระบบปฏิบัติการจะไม่เห็นแอนิเมชันตามข้อกำหนด accessibility
