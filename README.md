# SEO Business Growth Workshop · Predictive

เว็บให้ผู้เข้าร่วมตอบ 18 stages และหน้า Admin สำหรับทีมงาน
หน้าเว็บอยู่บน **Vercel** และเก็บข้อมูลใน **Supabase**

```
ผู้เข้าร่วม / Admin → หน้าเว็บ (Vercel) → API บน Vercel (/api/...) → Supabase
```

หน้าเว็บไม่ได้ต่อ Supabase ตรง ๆ ทุกคำขอต้องผ่าน API ที่ตรวจรหัสก่อน
Secret key และรหัส Admin จึงไม่อยู่ในหน้าเว็บ

## ไฟล์ในโปรเจกต์

| ไฟล์ | หน้าที่ |
|---|---|
| `public/index.html` | หน้าเว็บทั้งหมด (Pop up รหัส, ตอบคำถาม, สรุป, หน้าขอบคุณ, Admin) |
| `api/verify.js` | ตรวจรหัสผู้เข้าร่วม / Admin |
| `api/check-company.js` | ตรวจชื่อบริษัทซ้ำ |
| `api/submit.js` | บันทึกคำตอบ (ต้องครบ 18 ข้อ) |
| `api/admin.js` | ดึงคำตอบทั้งหมด, บันทึกโลโก้และ Recommendation |
| `lib/server.js` | โค้ดส่วนกลางของ API |
| `supabase/schema.sql` | สร้างตารางใน Supabase (รันครั้งเดียว) |

## ขั้นตอนติดตั้ง

### 1. Supabase: สร้างโปรเจกต์
1. เข้า https://supabase.com/dashboard แล้วกด **New project**
2. ตั้งชื่อ เช่น `seo-workshop`, ตั้ง Database Password (จดเก็บไว้), Region เลือก **Southeast Asia (Singapore)**
3. รอประมาณ 1–2 นาทีจนโปรเจกต์พร้อม

### 2. Supabase: สร้างตาราง
1. เมนูซ้าย **SQL Editor** แล้วกด **New query**
2. เปิดไฟล์ `supabase/schema.sql` คัดลอกทั้งหมดไปวาง แล้วกด **Run**
3. ไปที่ **Table Editor** จะเห็นตาราง `submissions`, `answers`, `stages`

### 3. Supabase: คัดลอก URL และ Secret key
1. **Project URL** หน้าตาแบบ `https://xxxx.supabase.co` (กดปุ่ม **Connect** ด้านบนของ Dashboard)
2. **Secret key** ไปที่ **Project Settings → API Keys** คัดลอกค่าที่ขึ้นต้นด้วย `sb_secret_...`
   (ถ้ายังไม่มี กด **Create new API keys**)
3. ห้ามใส่ Secret key ในไฟล์ใด ๆ หรือส่งในแชต ใช้ใส่ใน Vercel เท่านั้น

### 4. GitHub: อัปโหลดโปรเจกต์
1. https://github.com/new ตั้งชื่อ repo เช่น `seo-workshop` เลือก **Private** แล้วกด Create
2. กด **uploading an existing file** แล้วลากไฟล์และโฟลเดอร์ทั้งหมดในโปรเจกต์นี้ลงไป
   (`api`, `lib`, `public`, `supabase`, `package.json`, `package-lock.json`, `vercel.json`, `README.md`)
3. กด **Commit changes**

### 5. Vercel: Deploy
1. https://vercel.com/new เลือก repo `seo-workshop` แล้วกด **Import**
2. Framework Preset: **Other** (ไม่ต้องตั้ง Build Command)
3. เปิด **Environment Variables** แล้วเพิ่ม 4 ตัว:

| Name | Value |
|---|---|
| `SUPABASE_URL` | Project URL จากขั้นที่ 3 |
| `SUPABASE_SECRET_KEY` | Secret key `sb_secret_...` |
| `ATTENDEE_CODE` | `123` |
| `ADMIN_CODE` | `PDT201026` |

4. กด **Deploy** รอสักครู่จะได้ลิงก์ เช่น `https://seo-workshop.vercel.app`

### 6. ทดสอบก่อนวันงาน
1. เปิดลิงก์บนมือถือ ใส่รหัส `123` ตอบครบ 18 ข้อ แล้วส่ง
2. ไปที่ Supabase → Table Editor → `submissions` ต้องมีแถวใหม่ และ `answers` มี 18 แถว
3. เปิดลิงก์อีกครั้ง กด "สำหรับทีมงาน: เข้าสู่ระบบ Admin" ใส่รหัส Admin ลองอัปโหลดโลโก้ ใส่ Recommendation และบันทึก PDF
4. ลองตั้งชื่อบริษัทซ้ำ ต้องขึ้นคำเตือนและแนะนำชื่อ
5. ลบข้อมูลทดสอบ: SQL Editor → `delete from submissions;` (คำตอบจะถูกลบตามอัตโนมัติ)

### 7. ทำ QR Code
ใช้ลิงก์จาก Vercel ทำ QR Code ใส่ในสไลด์ Scan to Play

## แก้ไขภายหลัง
- **แก้หน้าเว็บหรือ API**: แก้ไฟล์บน GitHub แล้วกด Commit Vercel จะ deploy ใหม่ให้เองภายในไม่กี่นาที ลิงก์เดิม
- **เปลี่ยนรหัส**: แก้ใน Vercel → Settings → Environment Variables แล้วไปที่ Deployments → Redeploy
  ถ้าเปลี่ยนรหัสผู้เข้าร่วม ต้องแก้เลข `123` ใน `public/index.html` (ค้นหา `code-hint-value`) ด้วย
- **ดูข้อมูลดิบ / Export**: Supabase → Table Editor → `submission_overview` หรือปุ่ม "ดาวน์โหลด CSV" ในหน้า Admin

## สิ่งที่ควรรู้
- Supabase แพ็กเกจฟรีจะหยุดโปรเจกต์ชั่วคราวถ้าไม่มีการใช้งานนานประมาณ 1 สัปดาห์
  ควรเปิดเว็บทดสอบ 1–2 วันก่อนงาน ถ้าโปรเจกต์ถูกหยุด ให้กด **Restore** ใน Supabase Dashboard
- เปิดไฟล์ `public/index.html` ในเครื่องตรง ๆ จะเป็น "โหมดทดลอง" ข้อมูลไม่เข้า Supabase
