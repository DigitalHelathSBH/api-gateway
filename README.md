# API Getaway

Template สำหรับสร้างและ deploy API Gateway (Fastify + Docker + Kong + Nginx)

---

## 1) 📂 โครงสร้างโปรเจกต์
~~~text
api-getaway/
├─ src/
│  ├─ server.js           # main entrypoint
│  ├─ patients/           # service จริง (patients + visits)
│  ├─ common/             # db.js, utils.js ใช้ร่วมกัน
│  └─ template/           # โครงเปล่าไว้สร้าง service ใหม่
├─ package.json
├─ docker-compose.yml
├─ Dockerfile
├─ .env                   # config DB/port (อย่า commit)
├─ .dockerignore
└─ README.md
~~~

---

## 2) ⚙️ การใช้งาน (Local Dev)

1) ติดตั้ง dependencies  
~~~bash
npm install
~~~

2) รัน dev (auto reload)  
~~~bash
npm run dev
~~~

3) ทดสอบ API  
~~~bash
curl http://127.0.0.1:3002/ping
~~~

---

## 3) 🐳 การใช้งาน (Docker)

1) Build image  
~~~bash
docker compose build
~~~

2) รัน container  
~~~bash
docker compose up -d
~~~

3) ดู log  
~~~bash
docker logs -f api-getaway
~~~

---

## 4) 🚀 Deploy ขึ้น Server (จาก GitHub → Linux)

> สมมติโฟลเดอร์โปรเจกต์อยู่ที่ `/opt/api-getaway`

1) ดึง/อัปเดตโค้ด  
~~~bash
ssh user@server
cd /opt/api-getaway
git pull
~~~

2) เซ็ตค่า `.env` (ทำบนเซิร์ฟเวอร์เท่านั้น)  
~~~env
PORT=3002
SQLSERVER_HOST=10.0.1.1
SQLSERVER_PORT=1433
SQLSERVER_USER=ssbsql
SQLSERVER_PASS=StrongPassword
SQLSERVER_DB=SSBDatabase
~~~

3) Build + Restart  
~~~bash
docker compose up -d --build
~~~

4) ตรวจสอบ  
~~~bash
docker ps
curl http://127.0.0.1:3002/ping
~~~

---

## 5) 🔒 Notes

- `.env` ห้าม commit ขึ้น repository
- เปิด firewall ให้เข้าพอร์ต 3002 เฉพาะจาก Kong/Reverse Proxy
- ถ้าใช้ Kong/Nginx อยู่แล้ว ให้ map path `/api/*` → ไปที่ api-getaway:3002
- ถ้าจัดการ CORS ที่ Kong แล้ว ให้ปิด `@fastify/cors` ในแอปเพื่อลด header ซ้ำ

---

## 6) 📌 การสร้าง Service ใหม่ (จากเทมเพลต)

1) คัดลอกโฟลเดอร์ `src/template` เป็นชื่อ service ใหม่ (เช่น `orders`)  
2) แก้ไขไฟล์ในโฟลเดอร์นั้น: `routes.js`, `controller.js`, `services.js`, `schema.js`  
3) import และ register ที่ `src/server.js`  
~~~js
import ordersRoutes from './orders/routes.js';
app.register(ordersRoutes);
~~~
4) commit/push แล้วทำ deploy ตามข้อ 4

---

## 7) 🔗 ตัวอย่าง Endpoint

- Health check  
~~~bash
curl http://127.0.0.1:3002/ping
~~~

- ค้นหาผู้ป่วยตาม HN  
~~~bash
curl http://127.0.0.1:3002/patients/12345
~~~

- ค้นหาผู้ป่วยด้วย CID + Hospcode  
~~~bash
curl -X POST http://127.0.0.1:3002/patients \
  -H "Content-Type: application/json" \
  -d '{"hospcode":"10661","cid":"1234567890123"}'
~~~

- ข้อมูล Visit  
~~~bash
curl -X POST http://127.0.0.1:3002/visits \
  -H "Content-Type: application/json" \
  -d '{"hospcode":"10661","cid":"1234567890123","hn":"54321","vn":"6500001","vstdate":"2025/08/26","clinicId":"01"}'
~~~

---

## 8) 🧰 คำสั่งดูแลระบบที่ใช้บ่อย

~~~bash
docker compose restart              # รีสตาร์ทแอป
docker logs -f api-getaway          # ติดตาม log
docker compose down                 # หยุดคอนเทนเนอร์
docker compose up -d --build        # สร้างใหม่และรัน
~~~
