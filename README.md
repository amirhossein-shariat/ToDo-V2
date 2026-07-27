# TodoApp

اپلیکیشن مدیریت کار پیشرفته (تک‌کاربره) با نمای روزانه/هفتگی/ماهانه، اهداف و زیرتسک، نمودار و خروجی گزارش.

## استک فنی
- **Frontend:** React + Vite + TailwindCSS + Framer Motion + Recharts
- **Backend:** Python + FastAPI + SQLAlchemy
- **Database:** SQLite (فعلاً لوکال)

## اجرای لوکال

### Backend
```bash
cd backend
source venv/bin/activate
uvicorn app.main:app --reload --port 8000
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

فرانت روی `http://localhost:5173` بالا می‌آید و درخواست‌های `/api/*` را به بک‌اند (`http://127.0.0.1:8000`) پراکسی می‌کند.
