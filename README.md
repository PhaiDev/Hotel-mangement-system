# SUMOTEL Admin Dashboard

ระบบจัดการห้องพักและการจองสำหรับ SUMOTEL สร้างด้วย Next.js, Supabase และ Tailwind CSS โดยมีเป้าหมายให้แอดมินจัดการห้องพัก การจอง สถานะการเข้าพัก ราคา และการตั้งค่าระบบได้จากหน้าเดียว

## Tech Stack

- Next.js 16 App Router
- React 19
- TypeScript
- Tailwind CSS
- Supabase Auth
- Supabase PostgreSQL
- Supabase Storage
- SWR
- SweetAlert2
- Framer Motion
- Chart.js

## Main Features

- Login สำหรับแอดมินผ่าน Supabase Auth
- Dashboard สรุปห้องว่าง ห้องมีผู้พัก รายได้ และรายการจองล่าสุด
- จัดการห้องพัก เพิ่ม แก้ไข ลบ เปิด/ปิดการใช้งาน
- ตั้งราคาต่อห้องผ่าน `Room.price`
- จัดการการจอง สร้าง แก้ไข เปลี่ยนสถานะ ลบ และตรวจการจองซ้อน
- Calendar สำหรับดูภาพรวมการจอง
- Analysis สำหรับดูสถิติ
- Settings สำหรับตั้งค่าข้อมูลโรงแรม ราคาเริ่มต้น VAT และ notification token
- Backend API layer สำหรับ business logic แทนการให้ frontend คุย database โดยตรง

## Project Structure

```txt
my-app/
  app/
    admin/
      page.tsx              # Dashboard
      rooms/page.tsx        # Room management
      bookings/page.tsx     # Booking management
      calendar/page.tsx     # Calendar view
      analysis/page.tsx     # Analytics
      settings/page.tsx     # System settings
      login/page.tsx        # Admin login
    api/
      settings/route.ts     # GET/PUT system settings
      notify/route.ts       # Notification integration
  components/
    BookingModal.tsx
    BookingDetailModal.tsx
    NotificationBell.tsx
  lib/
    supabase/
      client.ts             # Browser Supabase client
      server.ts             # Server Supabase client with cookies
      admin.ts              # Backend Supabase client
      middleware.ts
    repositories/
      settingsRepo.ts
    services/
      settingsService.ts
      notificationService.ts
    validators/
      settings.ts
    types/
      settings.ts
    supabase.ts             # Current frontend data helper, being migrated
```

## Architecture Direction

โปรเจกต์ใช้แนวทาง Hybrid:

1. Supabase ใช้เป็น Database, Auth และ Storage
2. Next.js API routes ใช้เป็น Backend API และ business logic layer
3. Frontend เรียก API ของตัวเองแทนการคุย Supabase DB ตรง

ตอนนี้ `settings` เริ่มย้ายเข้า API แล้วผ่าน `GET /api/settings` และ `PUT /api/settings`

เป้าหมายต่อไปคือทยอยย้าย:

- `rooms` ไปที่ `app/api/rooms`
- `bookings` ไปที่ `app/api/bookings`
- overlap check ไปอยู่ฝั่ง server
- frontend เหลือใช้ Supabase โดยตรงเฉพาะ auth/session

## Environment Variables

สร้างไฟล์ `.env` ที่ root ของ `my-app`

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Recommended for backend API routes in production
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Optional notification integration
SHEETS_URL=your_google_apps_script_url
```

หมายเหตุ: `SUPABASE_SERVICE_ROLE_KEY` ห้าม expose ไป frontend และควรใช้เฉพาะใน server/API routes เท่านั้น

## Getting Started

ติดตั้ง dependencies:

```bash
npm install
```

รัน development server:

```bash
npm run dev
```

เปิดเว็บ:

```txt
http://localhost:3000
```

เข้าแอดมิน:

```txt
http://localhost:3000/admin
```

## Available Scripts

```bash
npm run dev      # Start local development server
npm run build    # Build production app
npm run start    # Start production server
npm run lint     # Run ESLint
```

## Current Database Schema

### Room

```sql
CREATE TABLE "Room" (
  "id" SERIAL PRIMARY KEY,
  "name" TEXT NOT NULL,
  "lockId" TEXT,
  "isActive" BOOLEAN DEFAULT true,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "capacity" INTEGER,
  "pinLock" TEXT,
  "price" INTEGER NOT NULL DEFAULT 0,
<<<<<<< HEAD
  "imageUrl" TEXT,
  "imagePath" TEXT
=======
  "imageUrl" TEXT
>>>>>>> a85e558 (Add uploade image feature, chaneg calendar booking buttton)
);
```

### Booking

```sql
CREATE TABLE "Booking" (
  "id" SERIAL PRIMARY KEY,
  "customerName" TEXT NOT NULL,
  "customerLine" TEXT,
  "roomId" INTEGER REFERENCES "Room"("id"),
  "checkIn" TIMESTAMP,
  "checkOut" TIMESTAMP,
  "status" TEXT,
  "pinCode" TEXT,
  "totalPrice" INTEGER,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "idCardImageUrl" TEXT,
  "idCardImagePath" TEXT
);
```

### SystemSettings

```sql
CREATE TABLE IF NOT EXISTS "SystemSettings" (
  "id" SERIAL PRIMARY KEY,
  "hotelName" TEXT NOT NULL,
  "hotelAddress" TEXT NOT NULL,
  "hotelPhone" TEXT,
  "taxId" TEXT,
  "vatEnabled" BOOLEAN NOT NULL DEFAULT true,
  "vatPercent" NUMERIC(5,2) NOT NULL DEFAULT 7.00 CHECK ("vatPercent" >= 0),
  "priceDaily" INTEGER NOT NULL DEFAULT 500 CHECK ("priceDaily" >= 0),
  "priceTemporary" INTEGER NOT NULL DEFAULT 300 CHECK ("priceTemporary" >= 0),
  "lineOaChannelAccessToken" TEXT,
  "lineOaRecipientId" TEXT,
  "allowOverbooking" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

ควรบังคับให้ `SystemSettings` มีแค่ 1 row:

```sql
CREATE UNIQUE INDEX IF NOT EXISTS "SystemSettings_single_row_idx"
ON "SystemSettings" ((true));
```

ถ้าโปรเจกต์มีตาราง `SystemSettings` อยู่แล้วและยังใช้ LINE Notify เดิม ให้เพิ่มคอลัมน์สำหรับ LINE OA:

```sql
ALTER TABLE "SystemSettings"
ADD COLUMN IF NOT EXISTS "lineOaChannelAccessToken" TEXT,
ADD COLUMN IF NOT EXISTS "lineOaRecipientId" TEXT;
```

## Supabase Storage Plan

ระบบไฟล์ควรใช้ Supabase Storage โดยแยก bucket ตามประเภทข้อมูล

```txt
<<<<<<< HEAD
room-images
=======
room_image
>>>>>>> a85e558 (Add uploade image feature, chaneg calendar booking buttton)
booking-id-cards
```

แนะนำ policy:

<<<<<<< HEAD
- `room-images`: public bucket ได้ เพราะเป็นรูปห้อง
=======
- `room_image`: public bucket ได้ เพราะเป็นรูปห้อง
>>>>>>> a85e558 (Add uploade image feature, chaneg calendar booking buttton)
- `booking-id-cards`: private bucket เพราะเป็นข้อมูลส่วนบุคคล

รูปบัตรประชาชนควรเปิดผ่าน signed URL จาก backend API เท่านั้น ไม่ควรใช้ public URL

## File Upload Roadmap

### Room Images

เพิ่มในหน้า `admin/rooms`:

- upload รูปห้องตอนสร้าง/แก้ไขห้อง
- preview รูปก่อนบันทึก
<<<<<<< HEAD
- upload เข้า bucket `room-images`
- เก็บ `imageUrl` และ `imagePath` ในตาราง `Room`
=======
- upload เข้า bucket `room_image`
- เก็บ `imageUrl` ในตาราง `Room`
>>>>>>> a85e558 (Add uploade image feature, chaneg calendar booking buttton)

### Booking ID Card Images

เพิ่มใน `BookingModal`:

- upload รูปบัตรประชาชนตอนสร้าง booking
- preview รูปก่อนบันทึก
- upload เข้า bucket `booking-id-cards`
- เก็บ `idCardImageUrl` และ `idCardImagePath` ในตาราง `Booking`
- หน้า `BookingDetailModal` ใช้ signed URL สำหรับดูรูป

## Booking Price Logic

ตอนสร้าง booking:

- ถ้าเลือกห้องที่มี `Room.price > 0` ให้ใช้ราคาห้องนั้น
- ถ้า `Room.price = 0` ให้ fallback ไปใช้ราคา default
- daily booking คำนวณตามจำนวนคืน
- temporary booking ใช้ราคาเหมาจ่ายจาก settings หรือ fallback เดิม

## Booking Status

สถานะที่ใช้อยู่:

```txt
PENDING
PAID
ACTIVE
COMPLETED
CANCELLED
```

## API Direction

API ที่มีแล้ว:

```txt
GET /api/settings
PUT /api/settings
POST /api/notify
```

API ที่ควรเพิ่มต่อ:

```txt
GET    /api/rooms
POST   /api/rooms
GET    /api/rooms/[id]
PUT    /api/rooms/[id]
DELETE /api/rooms/[id]

GET    /api/bookings
POST   /api/bookings
GET    /api/bookings/[id]
PUT    /api/bookings/[id]
DELETE /api/bookings/[id]

POST   /api/uploads/room-image
POST   /api/uploads/id-card
```

## Development Notes

- โปรเจกต์ยังมีบางส่วนที่ frontend เรียก Supabase ตรงผ่าน `lib/supabase.ts`
- เป้าหมายคือค่อยๆ ย้าย business logic ไปไว้ใน API routes
- ควรเก็บ validation ไว้ใน `lib/validators`
- ควรเก็บ query/database access ไว้ใน `lib/repositories`
- ควรเก็บ business rule ไว้ใน `lib/services`

## Known Build Note

ถ้า `npm run build` ล้มเหลวเพราะโหลด Google Fonts ไม่ได้ ให้ตรวจ network หรือเปลี่ยน font เป็น local/self-hosted font เพราะ `next/font/google` ต้องเข้าถึง Google Fonts ระหว่าง build
