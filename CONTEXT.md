# Tnalp — Project Context

เอกสารนี้สรุปบริบทและพฤติกรรมที่ตรวจพบในโค้ด ณ วันที่ 14 ตุลาคม 2026 สำหรับผู้พัฒนาและ agent ที่เข้ามาทำงานต่อ ใช้คำศัพท์ตาม [GLOSSARY.md](./GLOSSARY.md) และตรวจโค้ดอีกครั้งเมื่อพฤติกรรมเปลี่ยน

## เป้าหมายและขอบเขต

Tnalp เป็นร้านขายต้นไม้แบบ e-commerce สำหรับสาธิตและ portfolio ชื่อมาจากคำว่า plant ที่สะกดกลับด้าน ครอบคลุมการค้นหาสินค้า ตะกร้า สมัครสมาชิก สั่งซื้อ แนบสลิปโอนเงิน รีวิวสินค้า และหน้าจัดการของผู้ดูแล

โปรเจกต์มีบริบทเดียวคือร้านต้นไม้ แยก frontend และ backend ตามหน้าที่ทางเทคนิค การชำระเงินใช้การโอนผ่าน PromptPay และตรวจสลิปด้วยคน ไม่มีการเชื่อม payment gateway หรือบริการตรวจสลิปอัตโนมัติ

## ผู้ใช้งานและข้อมูลหลัก

- **User / Customer**: บัญชีผู้ใช้ทั่วไปสำหรับซื้อสินค้า ดูประวัติออเดอร์ และเขียนรีวิว
- **Admin**: บัญชีที่มีสิทธิ์จัดการสินค้า ผู้ใช้ ออเดอร์ และดูสรุปยอดขาย
- **Product**: สินค้าที่มีชื่อ slug รูป ราคา หมวดหมู่ แบรนด์ จำนวนคงเหลือ และรีวิว
- **Order**: เก็บผู้สั่ง รายการสินค้า ที่อยู่ วิธีชำระเงิน ยอดรวม สลิป และสถานะต่าง ๆ
- **Review**: คะแนนและความคิดเห็นที่เก็บอยู่ภายใน Product

Cart อยู่ใน browser ไม่ใช่เอกสารในฐานข้อมูล ส่วน Order เก็บชื่อ รูป ราคา และจำนวนของแต่ละรายการ ณ เวลาสั่งซื้อ พร้อมอ้างอิง Product

## โครงสร้างและจุดเริ่มต้น

| ตำแหน่ง | หน้าที่ |
| --- | --- |
| `backend/server.js` | โหลด environment เชื่อม MongoDB ตั้ง Express และ mount routes |
| `backend/models/` | Mongoose models: User, Product, Order |
| `backend/routes/` | API สำหรับสินค้า ผู้ใช้ ออเดอร์ อัปโหลด และ seed |
| `backend/utils.js` | สร้าง JWT และ middleware `isAuth`, `isAdmin` |
| `backend/data.js`, `backend/seed.js` | ข้อมูลสาธิตและสคริปต์ตั้งต้นฐานข้อมูล |
| `backend/uploads/` | ไฟล์อัปโหลดบน disk ที่เปิดให้เข้าถึงผ่าน `/uploads` |
| `frontend/src/index.js`, `frontend/src/App.js` | จุดเริ่ม React และการประกอบหน้า/เส้นทาง |
| `frontend/src/Store.js` | React Context และ reducer สำหรับผู้ใช้กับตะกร้า |
| `frontend/src/screens/` | หน้าร้านและ checkout |
| `frontend/src/management_screens/` | หน้าจัดการของ Admin |
| `frontend/src/components/` | ส่วนประกอบร่วม รวมถึง route guards |

Backend ใช้ JavaScript ES modules, Express 4, Mongoose 7, bcryptjs, JWT และ Multer ส่วน frontend ใช้ React 18, CRA 5, React Router 6, Axios และ React-Bootstrap ดู dependency และ scripts จริงใน `package.json` ของแต่ละฝั่ง

## ขั้นตอนหลัก

1. ลูกค้าดู Product หรือค้นหาตามชื่อ หมวดหมู่ ช่วงราคา และคะแนน พร้อมเลือกการเรียงลำดับ
2. เพิ่มสินค้าใน Cart แล้วเข้าสู่ระบบ ระบุ Shipping Address และเลือก PromptPay
3. หน้า Preview Order คำนวณยอดและส่งข้อมูลไป `POST /api/orders`
4. Backend บันทึก Order แล้วเริ่มลดสต็อกสินค้า ส่วน frontend ล้าง Cart และเปิดหน้าออเดอร์
5. ลูกค้าโอนเงิน อัปโหลดรูปด้วย `POST /api/upload` แล้วแนบ URL ให้ Order ด้วย `PUT /api/orders/:id/upload`
6. การยืนยันชำระเงินใช้ `PUT /api/orders/:id/pay` การบันทึกว่าส่งถึงแล้วใช้ `PUT /api/orders/:id/deliver`
7. การยกเลิกใช้ `PUT /api/orders/:id/cancel` ซึ่งตั้งสถานะยกเลิกและพยายามคืนสต็อก

การอัปโหลดสลิปและการยืนยันชำระเงินเป็นคนละขั้นตอน API อัปโหลดคืนค่า `secure_url` แม้ไฟล์จริงจะเก็บบน local disk

## กฎและสถานะที่โค้ดใช้อยู่

- ราคาแสดงเป็นเงินบาท ยอดสินค้าเท่ากับผลรวมราคาต่อหน่วยคูณจำนวน
- Checkout คิดค่าจัดส่ง 0 บาทเมื่อ `province === 'Bangkok'` และ 100 บาทสำหรับค่าอื่น ยอดรวมเท่ากับยอดสินค้าและค่าจัดส่ง
- Backend รับราคา จำนวน และยอดรวมจาก request โดยไม่ได้คำนวณราคาซ้ำจาก Product
- Order ใช้ flags แยกกัน: `isUploaded`, `isPaid`, `isDelivered`, `isCanceled` พร้อมเวลาที่เกิดแต่ละสถานะ ไม่มี state machine ที่บังคับลำดับการเปลี่ยนสถานะ
- การยืนยันชำระเงินตั้ง `paymentResult.status` เป็น `accept` ไม่มีผลตรวจจากธนาคาร
- API รีวิวป้องกันรีวิวซ้ำด้วยชื่อผู้ใช้ ไม่ได้ตรวจว่าผู้รีวิวเคยซื้อสินค้าหรือไม่ คะแนนรวมเป็นค่าเฉลี่ยของรีวิวทั้งหมด
- Dashboard รวม `totalPrice` ของออเดอร์ทั้งหมด โดยไม่ได้กรองเฉพาะออเดอร์ที่จ่ายแล้วหรือแยกออเดอร์ยกเลิก จึงไม่ควรตีความเป็นรายรับที่รับเงินจริง

## การยืนยันตัวตนและสิทธิ์

JWT มีอายุ 30 วัน และมี `_id`, `name`, `email`, `isAdmin` API ที่ต้องเข้าสู่ระบบใช้ header `Authorization: Bearer <token>` Frontend เก็บ `userInfo` รวม token และข้อมูล checkout ใน localStorage

การจัดการสินค้าและผู้ใช้ การดูรายการออเดอร์ทั้งหมด สรุปยอด การลบออเดอร์ และ seed API ใช้ทั้ง `isAuth` และ `isAdmin`

อย่างไรก็ตาม การอ่านออเดอร์ด้วย ID และ endpoints `pay`, `deliver`, `upload`, `cancel` ตรวจเพียง `isAuth` โดยไม่ตรวจเจ้าของออเดอร์หรือสิทธิ์ Admin จึงยังไม่รับประกันขอบเขตสิทธิ์ตามบทบาทใน API

## การรันในเครื่อง

ใช้ MongoDB และ environment ตาม `backend/.env.example`: `MONGODB_URI`, `JWT_SECRET`, `PORT` ค่า Cloudinary ในตัวอย่างไม่ได้ถูกใช้โดย upload route ปัจจุบัน

```powershell
# Terminal 1: จาก root ของ repository
cd backend
Copy-Item .env.example .env
# แก้ JWT_SECRET ใน .env และตรวจว่า MongoDB พร้อมใช้งาน
npm install
node seed.js
npm start
```

```powershell
# Terminal 2: จาก root ของ repository
cd frontend
npm install --legacy-peer-deps
# ตาม run recipe ใน README สำหรับ Node 22 / CRA 5
$env:NODE_OPTIONS = '--openssl-legacy-provider'
npm start
```

Frontend เปิดที่ `http://localhost:3000` และ proxy API ไป `http://localhost:9002` Backend ใช้ port 9002 เป็นค่าเริ่มต้น

`node seed.js` และ `GET /api/seed` ลบ Product และ User เดิมแล้วสร้างข้อมูลสาธิตใหม่ โดยไม่ล้าง Order การ seed ซ้ำจึงอาจทำให้ Order เดิมอ้างอิงข้อมูลที่ถูกลบ ใช้กับฐานข้อมูลสาธิตเท่านั้น

## ข้อจำกัดที่ต้องรู้ก่อนแก้ไข

- การลดและคืนสต็อกใช้ async callbacks ภายใน `map` โดยไม่รอทั้งหมด และไม่มี transaction จึงไม่รับประกันความสอดคล้องกับ Order
- โค้ดยกเลิกค้น Product ด้วย `item._id` ซึ่งเป็น ID ของรายการย่อยใน Order แทน `item.product` การคืนสต็อกจึงมีข้อผิดพลาดจากการอ้างอิง ID
- API ไม่ได้บังคับเงื่อนไขการเปลี่ยนสถานะหรือป้องกันการยกเลิกซ้ำ
- Upload route ยังไม่ได้กำหนดตัวกรองชนิดไฟล์หรือขนาดสูงสุด ไฟล์ที่อัปโหลดเข้าถึงได้ผ่าน static URL
- Backend ไม่มีชุดทดสอบที่ใช้งานได้ใน script `test` ส่วน `frontend/src/App.test.js` ยังเป็น test จาก CRA template ที่หา `learn react` ไม่ใช่การตรวจ flow ร้านค้า

ข้อจำกัดเหล่านี้เป็นสิ่งที่ตรวจพบจาก source ไม่ใช่ผลทดสอบระบบขณะรัน

## เอกสารที่เกี่ยวข้อง

- [GLOSSARY.md](./GLOSSARY.md): คำศัพท์ธุรกิจที่ใช้ร่วมกัน
- [README.md](./README.md): ภาพรวม การตั้งต้น และบัญชีสาธิต
- [DESIGN.md](./DESIGN.md): แนวทาง UI และ accessibility
- [docs/agents/domain.md](./docs/agents/domain.md): วิธีใช้เอกสาร domain เมื่อสำรวจโปรเจกต์

เมื่อแก้ flow กฎราคา สถานะ หรือขอบเขตสิทธิ์ ให้ปรับ CONTEXT.md ตามพฤติกรรมใหม่ และแก้ GLOSSARY.md เมื่อความหมายของคำศัพท์เปลี่ยน
