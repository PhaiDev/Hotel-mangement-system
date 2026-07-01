# 🚀 ZUMOTEL PMS - Enterprise Upgrade Roadmap (Phase 1-4)

เอกสารฉบับนี้รวบรวม **Requirements (ความต้องการของระบบ)** เพื่อยกระดับโปรเจกต์ ZUMOTEL จากระบบจัดการพื้นฐาน สู่ระบบ Property Management System (PMS) ระดับ Enterprise โดยเปรียบเทียบระบบที่มีอยู่ปัจจุบัน (Base) และสิ่งที่จะต้องพัฒนาเพิ่ม (To Add)

---

## 📊 1. Dashboard / Analysis (Analytics ให้มีประโยชน์จริง)
**📌 Base (ปัจจุบัน):**
- มีหน้า Dashboard (`/admin/page.tsx`) แสดงตัวเลขสรุปพื้นฐาน: จำนวนห้องว่าง, ห้องที่มีคนพัก, รายการรอชำระ, รายได้รวมของวันนี้
- ติดตั้งไลบรารี `chart.js` ไว้ใน `package.json` แล้ว แต่ยังไม่มีกราฟแสดงผลที่ซับซ้อน

**⚡️ สิ่งที่ต้องเพิ่ม (To Add):**
- **Occupancy Rate Chart:** กราฟเส้น (Line Chart) แสดงอัตราการเข้าพักย้อนหลัง 7/30 วัน
- **Revenue Bar Chart:** กราฟแท่งแสดงรายได้เปรียบเทียบแต่ละเดือน
- **Top Performing Rooms:** ตารางจัดอันดับห้องที่ถูกจองบ่อยที่สุด
- **Average Guests:** สถิติคนเข้าพักเฉลี่ยต่อห้อง/ต่อวัน

---

## 🔄 2. Booking Flow (ระบบจองระดับมืออาชีพ)
**📌 Base (ปัจจุบัน):**
- มีระบบ CRUD พื้นฐาน (สร้าง, อ่าน, อัปเดตสถานะ, ลบ)
- ฟังก์ชัน `checkBookingOverlap` มีอยู่แล้วในฐานข้อมูล แต่ UX การแจ้งเตือนยังเป็นแค่ Error Alert ธรรมดา

**⚡️ สิ่งที่ต้องเพิ่ม (To Add):**
- **Smart Conflict Detection:** UI ในหน้าปฏิทินและแบบฟอร์มต้องล็อค (Disable) วันที่ห้องไม่ว่างทันที ไม่ต้องรอให้กด Submit แล้วค่อย Error
- **Check-in / Check-out Action:** ปุ่มกด Check-in/Check-out ชัดเจน พร้อมเปลี่ยนสถานะห้องพักแบบ Real-time
- **Booking History:** แถบประวัติการจองของลูกค้าคนเดิม (เผื่อลูกค้าเก่ากลับมาพัก)
- **Cancel Flow & Refund:** ระบบยกเลิกการจองพร้อมระบุเหตุผล (และรองรับสถานะ Refund)

---

## 🔐 3. Role System (ระบบสิทธิ์การใช้งาน)
**📌 Base (ปัจจุบัน):**
- ระบบ Auth ด้วย Supabase รองรับแค่การ Login เข้าสู่ระบบแบบ Role เดียว (ใคร Login ได้คือเป็น Admin ทั้งหมด)

**⚡️ สิ่งที่ต้องเพิ่ม (To Add):**
- **User Roles:** สร้างตาราง `Profiles` เพื่อเก็บ Role (`Admin`, `Staff`, `Viewer`)
- **Middleware Permissions:** ใช้ Next.js Middleware ป้องกันไม่ให้ `Staff` เข้าถึงหน้า Settings หรือ ลบห้องพักได้
- **Role-based UI:** ซ่อนปุ่มลบ หรือปุ่ม Export ข้อมูล ถ้าผู้ใช้มีแค่สิทธิ์ `Viewer`

---

## 🔔 4. Notification System (ระบบแจ้งเตือน)
**📌 Base (ปัจจุบัน):**
- ไม่มีระบบแจ้งเตือนอัตโนมัติ

**⚡️ สิ่งที่ต้องเพิ่ม (To Add):**
- **LINE Official Account / Webhook:** เมื่อมีลูกค้าจองใหม่ หรือ โอนเงินสำเร็จ ให้เด้งเข้ากลุ่ม LINE ของพนักงานผ่าน Messaging API ทันที
- **In-App Toast:** แจ้งเตือนแบบ Toast (มุมขวาล่าง) เมื่อมีการอัปเดตข้อมูลแบบ Real-time (เช่น สลิปถูกส่งมาแล้ว)
- **Overdue Alert:** แถบแจ้งเตือนสีแดง สำหรับรายการที่หมดเวลาชำระเงิน (Pending Payment Timeout)

---

## 🔍 5. Search / Filter (ค้นหาและกรองระดับลึก)
**📌 Base (ปัจจุบัน):**
- แสดงรายการจอง (Bookings) เรียงตามวันที่ล่าสุด แต่อาจจะยังไม่มี Filter ที่ซับซ้อน

**⚡️ สิ่งที่ต้องเพิ่ม (To Add):**
- **Multi-Filter:** กรองตามสถานะ (PENDING, PAID, ACTIVE) + วันที่เข้าพัก (Date Range)
- **Realtime Search:** ช่องค้นหาชื่อ/เบอร์โทรลูกค้า พิมพ์ปุ๊บข้อมูลกรองทันทีโดยไม่ต้องกด Enter (Debounce Search)
- **Pagination & Sort:** แบ่งหน้าข้อมูล (Pagination) เมื่อมีรายการจองหลักพันรายการ และกด Sort ตามยอดเงินได้

---

## 📝 6. Audit Log (บันทึกการกระทำ)
**📌 Base (ปัจจุบัน):**
- ไม่มีการเก็บประวัติว่าใครแก้ข้อมูลอะไร

**⚡️ สิ่งที่ต้องเพิ่ม (To Add):**
- **Audit Table:** สร้างตาราง `AuditLogs` ใน Supabase
- **Tracking:** บันทึกข้อมูล: `ใคร (User ID)` ทำ `อะไร (Action)` กับ `ข้อมูลไหน (Target ID)` เมื่อ `เวลาใด (Timestamp)`
- **Log Viewer:** หน้า UI สำหรับ Admin เพื่อดูประวัติการแก้ไขข้อมูลกรณีเกิดข้อผิดพลาด

---

## 📅 7. Pro Calendar (ปฏิทินที่จัดการได้จริง)
**📌 Base (ปัจจุบัน):**
- มี Path `/admin/calendar` (คาดว่าเป็นปฏิทินดูห้องว่างเบื้องต้น)

**⚡️ สิ่งที่ต้องเพิ่ม (To Add):**
- **Drag & Drop:** เลื่อนวันเข้าพัก หรือย้ายห้องพักได้ด้วยการใช้เมาส์ลาก (เหมือน FullCalendar)
- **Color Coding:** ใส่สีให้รายการจองตามสถานะ (เช่น เหลือง=รอจ่าย, เขียว=จ่ายแล้ว, เทา=เช็คเอาท์แล้ว)
- **Multiple Views:** กดสลับมุมมองแบบ รายวัน (Day), รายสัปดาห์ (Week), รายเดือน (Month)

---

## 📱 8. Mobile Friendly UI
**📌 Base (ปัจจุบัน):**
- โครงสร้าง Sidebar รองรับมือถือระดับหนึ่งแล้ว

**⚡️ สิ่งที่ต้องเพิ่ม (To Add):**
- **Responsive Tables:** ตาราง Booking และ Room ต้องเปลี่ยนเป็นรูปแบบ Card (กล่อง) เมื่อเปิดบนหน้าจอมือถือ (ป้องกันตารางล้นจอ)
- **Bottom Navigation:** (ทางเลือก) เปลี่ยน Sidebar เป็นเมนูด้านล่างสำหรับจอมือถือโดยเฉพาะ เพื่อให้ Staff ใช้นิ้วโป้งกดง่ายๆ

---

## 📁 9. File Upload (จัดการเอกสารและรูปภาพ)
**📌 Base (ปัจจุบัน):**
- ข้อมูล Room และ Booking เป็นแบบ Text ล้วน

**⚡️ สิ่งที่ต้องเพิ่ม (To Add):**
- **Supabase Storage:** ตั้งค่า Bucket สำหรับเก็บรูป
- **Room Images:** แอดมินสามารถอัปโหลดรูปภาพบรรยากาศห้องพักเข้าไปได้
- **Slip Upload:** ช่องทางสำหรับอัปโหลดสลิปโอนเงิน (เชื่อมไปแสดงในหน้ารายละเอียดการจอง)
- **ID Card Upload:** อัปโหลดภาพบัตรประชาชนผู้เข้าพักตอน Check-in

---

## 📑 10. Export Report (ระบบรายงานสรุปผล)
**📌 Base (ปัจจุบัน):**
- ไม่มีระบบ Export

**⚡️ สิ่งที่ต้องเพิ่ม (To Add):**
- **Export to Excel/CSV:** ปุ่มดาวน์โหลดรายการจอง (ใช้ `xlsx` หรือ `papaparse`) เพื่อส่งบัญชี
- **PDF Receipt / Summary:** สร้างใบเสร็จ (Receipt) หรือสรุปรายได้รายเดือนเป็นไฟล์ PDF (ใช้ `jspdf` หรือ `react-pdf`)

---

## 🎯 แผนการดำเนินการ (Execution Plan)
แนะนำให้ทำทีละ Phase ตามลำดับความสำคัญของ Business Core:
1. **Phase 1: Booking Flow + Search/Filter + Mobile UI** (ทำให้การทำงานรายวันสมบูรณ์และไม่มีบั๊ก)
2. **Phase 2: File Upload + Dashboard Analysis** (เพิ่มความสมบูรณ์ของข้อมูลและสถิติ)
3. **Phase 3: Role System + Audit Log + Export** (เตรียมพร้อมสำหรับ Staff หลายคนทำบัญชี)
4. **Phase 4: Notification + Pro Calendar** (ยกระดับ User Experience)
