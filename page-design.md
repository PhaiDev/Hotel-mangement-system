# 🏨 ZUMOTEL System Blueprint & Page Design

เอกสารฉบับนี้สรุปโครงสร้างฐานข้อมูล (Database) และเส้นทาง (Paths/Routes) ทั้งหมดของระบบ ZUMOTEL เพื่อใช้เป็นแนวทางในการออกแบบหน้าเว็บและพัฒนาต่อยอด

---

## 🗄️ 1. Database Schema (โครงสร้างฐานข้อมูล)

อ้างอิงจากความสัมพันธ์ของตาราง **Booking** และ **Room** ในระบบ:

### **ตาราง Room (ข้อมูลห้องพัก)**
เก็บข้อมูลกายภาพของห้องพักและการเชื่อมต่อกับ Smart Lock
- `id`: รหัสห้องพัก (Primary Key)
- `name`: ชื่อห้องพัก (เช่น "Room 101", "Deluxe Suite")
- `lockId`: รหัสเชื่อมต่อกับ Smart Lock (TTLock ID) สำหรับสั่งเปิดประตู/Generate PIN
- `capacity`: จำนวนผู้เข้าพักสูงสุดต่อห้อง
- `pricePerNight`: ราคาต่อคืน (Dynamic Pricing)
- `isActive`: สถานะการเปิดใช้งานห้องพัก (Boolean)
- `createdAt`: วันที่เพิ่มห้องพักเข้าสู่ระบบ

### **ตาราง Booking (ข้อมูลการจอง)**
เก็บรายละเอียดการทำรายการจองของลูกค้าและสถานะการชำระเงิน
- `id`: รหัสการจอง (Primary Key)
- `customerName`: ชื่อ-นามสกุล ผู้เข้าพัก
- `customerLine`: LINE User ID หรือ ข้อมูลติดต่อ (Phone/Line ID)
- `roomId`: รหัสห้องพักที่จอง (Foreign Key เชื่อมกับ Room)
- `checkIn`: วัน/เวลา เข้าพัก (Timestamp)
- `checkOut`: วัน/เวลา ที่ต้องเช็คเอาท์ (Timestamp)
- `status`: สถานะการจอง (`PENDING`, `PAID`, `ACTIVE`, `COMPLETED`, `CANCELLED`)
- `pinCode`: รหัสผ่าน Smart Lock (ได้รับอัตโนมัติหลังจากสถานะเป็น `PAID`)
- `totalPrice`: ยอดเงินรวมที่ต้องชำระ
- `createdAt`: วันที่ทำรายการจอง

---

## 🖥️ 2. Admin Dashboard Paths (ระบบจัดการสำหรับแอดมิน)
*พัฒนาด้วย Next.js (App Router) เน้นความ Modern และ Premium UI*

| Path | หน้าหน้าที่ | รายละเอียดการออกแบบ (Design Context) |
| :--- | :--- | :--- |
| `/admin` | **Dashboard Summary** | หน้าแรกแสดงสถิติภาพรวม: ยอดจองวันนี้, ห้องว่าง, รายได้รวม และสถานะห้องพักแบบ Quick View |
| `/admin/bookings` | **Booking Management** | แสดงรายการจองในรูปแบบ **Box (Cards)** เพื่อให้ใช้งานง่ายบนมือถือ มีระบบ Filter ตามสถานะ และค้นหาชื่อแขก |
| `/admin/calendar` | **Room Calendar** | ปฏิทินแสดงความหนาแน่นของการเข้าพัก รายวัน/รายเดือน และเช็คห้องว่างที่แน่นอนตามวันที่เลือก |
| `/admin/rooms` | **Room Setup** | จัดการข้อมูลห้องพัก เพิ่ม/ลด ห้องพักในระบบ และตั้งค่า Lock ID ของ Smart Lock |
| `/admin/analysis` | **Financial Analytics** | กราฟวิเคราะห์รายได้ย้อนหลัง 7 วัน, อันดับห้องพักยอดนิยม และอัตราการเข้าพัก (Occupancy Rate) |
| `/admin/profile` | **System Settings** | ตั้งค่า Profile ของโรงแรม, ข้อมูลการแจ้งเตือน LINE และการตั้งค่าความปลอดภัยอื่นๆ |

---

## 📱 3. Customer Experience Paths (ระบบจองสำหรับลูกค้า)
*พัฒนาด้วย HTML5/JS (LIFF) เน้นความง่าย รวดเร็ว และ Mobile-First*

| Path (HTML File) | หน้าหน้าที่ | สิ่งที่ผู้ใช้ต้องทำ (UX Flow) |
| :--- | :--- | :--- |
| `index.html` | **Availability View** | ดูปฏิทินห้องว่าง เลือกวันที่ต้องการเข้าพัก และดูราคาเบื้องต้น |
| `booking.html` | **Booking Form** | กรอกชื่อแขก, ข้อมูลติดต่อ และกดยืนยันการจอง (ล็อคห้องชั่วคราว) |
| `payment.html` | **Payment & Slip Check** | จ่ายเงินผ่าน PromptPay QR และ**อัปโหลดสลิป**เพื่อตรวจสอบความถูกต้องอัตโนมัติ |
| `success.html` | **Booking Success** | รับข้อความยืนยันพร้อม **รหัส PIN Code** สำหรับเปิดห้องพักในวันเข้าพัก |

---

## 🔄 4. ระบบการทำงานเบื้องหลัง (System Logic)
1. **Overlap Guard**: ระบบจะเช็คอัตโนมัติไม่ให้มีการจองซ้อนกัน (Double Booking) ในช่วงเวลาเดียวกัน
2. **Auto-PIN Generation**: เมื่อระบบตรวจสอบสลิปผ่านและสถานะเปลี่ยนเป็น `PAID` ระบบจะสั่งงาน Smart Lock เพื่อขอรหัสผ่านชุดใหม่ทันที
3. **LINE Notify**: แจ้งเตือนแอดมินผ่าน LINE เมื่อมีคนจอง และส่งรหัสประตูให้ลูกค้าผ่าน LINE เมื่อชำระเงินเสร็จสิ้น
