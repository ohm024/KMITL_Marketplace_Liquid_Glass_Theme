# โครงสไลด์นำเสนอ Software Design and Development 2

> ใช้เนื้อหาในเอกสารนี้เป็นโครงสไลด์ แต่ต้องใส่ **ภาพหน้าจอหลักฐานจริง** ของกลุ่มก่อนนำเสนอ ไม่ควรใช้ประวัติ Git/CI/CD ที่สมมุติเป็นหลักฐาน

## ส่วน อ.ไพบูลย์ — 15 สไลด์แนะนำ

1. Cover: KMITL Marketplace / สมาชิก / Tech Stack
2. Background / Problem: นักศึกษามีหนังสือ อุปกรณ์ไอทีและของใช้หอพัก; การขายในช่องทางกระจัดกระจายทำให้ค้นหายากและไม่น่าเชื่อถือ
3. Objectives: ลดต้นทุนการค้นหา, สร้างความน่าเชื่อถือด้วย OTP, ส่งเสริมใช้ซ้ำและนัดรับในสถาบัน
4. Scope: ผู้ซื้อ/ผู้ขาย/ผู้ดูแล และ FR-1 ถึง FR-6; ระบุฟีเจอร์ที่ยังเป็น MVP
5. Component Diagram: จาก `ARCHITECTURE.md`
6. ER/Class Diagram: ความสัมพันธ์ User, Listing, Reservation, Review, Message, Report
7. SOLID example 1: SRP — router vs ListingService vs repository
8. SOLID example 2: DIP — ListingRepository Protocol; mock tests
9. High Cohesion & Low Coupling: การแยกโมดูลและผลดีต่อการดูแลรักษา
10. Project Folder / PEP 8 / Exception / Secure Input Handling
11. Git Branching Strategy / Actual Contributors and Commit History
12. Actual Pull Requests / Code Review screenshots and decisions
13. Live Demo: login -> create listing -> search -> reserve -> chat -> complete -> review
14. Error Demo: wrong OTP, edit someone else's listing (403), repeated reservation (409)
15. Lessons & Refactoring Opportunities: Postgres concurrency, Redis, object storage, FCM, Alembic

### คำถามจากอาจารย์ที่ควรตอบให้ได้

- **ทำไมใช้ Layered Monolith?** โครงงานขนาดทีมเล็ก พัฒนาง่าย มี Test Boundary ชัดเจน และยังแยก Service ได้เมื่อโตขึ้น
- **High Cohesion คืออะไร?** แต่ละโมดูลรับผิดชอบกลุ่มงานใกล้เคียง เช่น Auth แยกจาก Listing; การแก้กฎจองไม่ต้องแก้ UI หรือ OTP
- **Low Coupling ตรงไหน?** Service พึ่งพา `ListingRepository` Protocol ไม่ต้องรู้ SQL Query; Frontend เรียก API ไม่เรียก DB โดยตรง
- **แยก Service/Repository ทำไม?** ทดสอบกฎธุรกิจด้วย Fake Repository ได้และเปลี่ยน DB Implementation ได้ง่ายขึ้น
- **จองซ้ำพร้อมกันจะเกิดอะไร?** `SELECT FOR UPDATE` ใช้ล็อกแถวใน PostgreSQL ระหว่างตรวจสถานะและเปลี่ยนเป็น reserved; ยังต้องทดสอบพร้อมกันจริง
- **ทำไมเลือก JWT Cookie?** HttpOnly ลดการเข้าถึงด้วย JavaScript และมี `exp` 12 ชั่วโมง; เพิ่ม Origin validation ป้องกัน CSRF

## ส่วน อ.สุระชัย — 12 สไลด์แนะนำ

1. Security Context: ข้อมูลอีเมล สินค้า แชต ธุรกรรม และ admin
2. DFD with Trust Boundaries
3. STRIDE Threat Analysis — ตัวอย่าง attack path
4. Misuse Case: attacker abuses OTP / unauthorized edit / fake reviews
5. Asset List และผลกระทบจากการรั่วไหล
6. Security Requirements SR-01...SR-10
7. Risk Register: likelihood × impact / ranking / mitigation
8. Secure Coding: ownership checks; request validation; hashed OTP, HTTP-only cookie
9. Refactoring: repository protocol and separation of responsibilities
10. Traceability Matrix: FR → Threat → Requirement → Code → Test
11. CI Workflow: push/PR → lint/tests/typecheck/build, showing genuine logs
12. CD Workflow: merge main → Render/Vercel deploy hooks → real deployment URL + health check (not done until configured)

## Live demo script (approx. 6–8 minutes; approximate plan, not measured)

1. เปิด `/health` และ `/docs` ของ API และเว็บไซต์หน้าแรก
2. เปิดเบราว์เซอร์สอง session: seller/student01@kmitl.ac.th และ buyer/student02@kmitl.ac.th (local-dev OTP only)
3. Seller ลงขายหนังสือ ตั้งราคา 250 บาท เพิ่มรูป 1 รูป
4. Buyer ค้นหาชื่อหนังสือ กรองหมวดหมู่ กดจอง ดูสถานะ reserved
5. Buyer ส่งข้อความ; Seller รับการแจ้งเตือนเรียลไทม์ในหน้าแชต (เปิดสองหน้าต่าง)
6. Seller กดยืนยันขายเสร็จ → Sold
7. Buyer รีวิว 5 ดาว → โปรไฟล์ผู้ขายมีคะแนน
8. Buyer ลองแก้สินค้า Seller โดยยิง API → 403; ลองจองซ้ำ → 409
9. Buyer รายงานประกาศ → Admin เปิดรายงาน ลบประกาศ/ปิดรายงาน
10. เปิด actual GitHub CI checks / deploy logs / live URL (once configured)

## Clear disclosure

This project includes **working local API code and prepared deployment workflows**. It does not yet prove production uptime, 1,000 concurrent users, FCM push, integrated maps, or externally hosted production deployment. Include those limitations in Q&A rather than claiming completion.
