# 📝 ZUMOTEL PMS - Developer Log (Changelog)

ไฟล์นี้ถูกสร้างขึ้นเพื่อติดตามความคืบหน้าของการพัฒนาโปรเจกต์ (Execution Tracking) ตาม `PROJECT_ROADMAP.md`

---

## 🚀 Phase 1: Booking Flow + UI Upgrade (กำลังดำเนินการ)

### ✅ สิ่งที่ทำเสร็จแล้ว (Completed)
- [x] **Architecture Refactor (ล้างบาง Swal HTML)**: ถอดการใช้ SweetAlert2 ในการสร้างแบบฟอร์มออกทั้งหมด เพื่อเตรียมรองรับฟีเจอร์ระดับ Enterprise
- [x] **Smart Booking Modal**: สร้าง Component `<BookingModal />` ที่รองรับทั้งการจอง "รายวัน" และ "ชั่วคราว" ในตัวเดียว พร้อมคำนวณราคาอัตโนมัติ
- [x] **Premium Detail & Status Modal**: สร้าง Component `<BookingDetailModal />` ที่ออกแบบ UI ใหม่ทั้งหมด พร้อมระบบ Dropdown เปลี่ยนสถานะที่ใช้งานง่ายขึ้น
- [x] **Unified Booking UX (Calendar Integration)**: เพิ่มปุ่มจองโดยตรงในแผงด้านข้างของหน้า Calendar (ระบบกรอกรหัสห้องและวันที่ให้อัตโนมัติ)
- [x] **Settings Page (UI Layout)**: สร้างหน้า `/admin/settings` สำหรับให้ผู้บริหารตั้งค่าราคาโรงแรม, ภาษี, และ LINE Official Account (ตอนนี้รันด้วย Mock Data เพื่อรอเชื่อมต่อ DB)
- [x] **Check-in / Check-out Action Buttons**: สร้างปุ่ม Quick Action ในหน้า Bookings Card ให้พนักงานกด รับชำระเงิน/เช็คอิน/เช็คเอาท์ ได้ในคลิกเดียว (Smart State Button)
- [x] **Smart Conflict Detection**: อัปเกรด `<BookingModal />` ให้สามารถเช็คห้องว่างได้แบบ Real-time ป้องกันการจองซ้อนทับกัน (Disable ห้องที่เต็มแล้ว)
- [x] **Architecture Refactor (API Routes)**: ย้ายการเชื่อมต่อฐานข้อมูลจาก Frontend ไปอยู่ที่ Next.js API Routes (Repository -> Service -> API Route pattern) เพื่อความปลอดภัยและความยืดหยุ่นของระบบ

---

## 📊 Phase 2: Data & Analytics (กำลังดำเนินการ)

### ✅ สิ่งที่ทำเสร็จแล้ว (Completed)
- [x] **Dashboard Analytics**: นำ `chart.js` มาสร้างกราฟ Occupancy Rate และ Revenue (7 วันย้อนหลัง) ในหน้า Dashboard
- [x] **Export to Excel/CSV**: สร้างปุ่มดาวน์โหลดรายการจอง (สามารถ Filter ก่อนโหลดได้) ออกมาเป็นไฟล์ `.csv` รองรับภาษาไทยเพื่อส่งให้บัญชี

### ⏳ สิ่งที่กำลังจะทำเป็นลำดับถัดไป (Next Tasks)
- [ ] **Role System**: สร้างระบบสิทธิ์การใช้งาน (Admin, Staff, Viewer) ป้องกันไม่ให้ Staff ลบข้อมูลสำคัญ

---

## 🔐 Phase 3: Role System + Audit Log + Export (กำลังดำเนินการ)

### ✅ สิ่งที่ทำเสร็จแล้ว (Completed)
- [x] **Audit Log Backend (Supabase Integration)**: พัฒนาระบบบันทึกประวัติการแก้ไขข้อมูล (Audit Log) ผ่าน Next.js Middleware บันทึกโดยตรงลงในฐานข้อมูล Supabase (`AuditLogs` table) โดยอัตโนมัติทุกครั้งที่มีการ Mutation (POST/PUT/PATCH/DELETE) หรือเข้าใช้งานหน้าสำคัญ พร้อมเก็บข้อมูล UserId, Email, Action, TargetId, IP Address, และ Request Details

### ⏳ สิ่งที่กำลังจะทำเป็นลำดับถัดไป (Next Tasks)
- [ ] **Log Viewer UI**: สร้างหน้าแสดงประวัติ Audit Logs บนหน้าจอแอดมิน เพื่อให้ผู้บริหารตรวจสอบการทำงานย้อนหลังได้
- [ ] **Middleware Permissions**: จำกัดสิทธิ์ของบทบาท Viewer และ Staff ในการลบข้อมูลหรือตั้งค่าระบบ

---
*อัปเดตล่าสุด: 30 มิถุนายน 2026*
