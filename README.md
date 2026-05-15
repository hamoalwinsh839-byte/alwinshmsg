# Discord Automation Dashboard

لوحة تحكم احترافية لأتمتة ديسكورد — إدارة التوكنات، جدولة الرسائل، رفع الصور.

## متطلبات التشغيل

- Node.js 18+
- npm 8+
- PostgreSQL database

## خطوات التشغيل

### 1. تهيئة المتغيرات البيئية

```bash
cp .env.example .env
```

افتح ملف `.env` وأضف قيمك:
```
DATABASE_URL=postgresql://user:password@localhost:5432/discord_dashboard
SESSION_SECRET=any-random-secret-string
PORT=3001
```

### 2. تثبيت المكتبات

```bash
npm install
```

### 3. إنشاء جداول قاعدة البيانات

```bash
npm run db:push --workspace=server
```

### 4. تشغيل المشروع

```bash
npm run dev
```

سيعمل:
- **السيرفر** على: http://localhost:3001
- **الواجهة** على: http://localhost:3000

## البناء للإنتاج (Production)

```bash
npm run build
npm run start --workspace=server
```

## هيكل المشروع

```
discord-dashboard/
├── package.json         # root
├── .env                 # متغيرات البيئة (أنشئه من .env.example)
├── server/              # Express backend
│   ├── src/
│   │   ├── index.ts     # نقطة البداية
│   │   ├── app.ts       # Express app
│   │   ├── db/          # Drizzle ORM + PostgreSQL
│   │   ├── routes/      # API routes
│   │   └── scheduler.ts # مُجدِّل المهام (كل 5 ثوان)
│   └── uploads/         # الصور المرفوعة
└── client/              # React + Vite frontend
    └── src/
        ├── lib/api.ts   # React Query hooks
        ├── pages/       # صفحات التطبيق
        └── components/  # مكونات UI
```
