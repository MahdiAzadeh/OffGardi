# OffGardi (آف‌گردی)
PWA فارسی تخفیف‌های محلی گرمدره، با Supabase (Auth + Postgres + RLS).

## راه‌اندازی
1. `config.js` از قبل پر شده است (آدرس پروژه و کلید publishable).
2. Supabase → Authentication → Providers → Email: برای تست سریع «Confirm email» را خاموش کنید.
3. مدیر: ابتدا با ایمیل خودتان ثبت‌نام کنید، بعد در SQL Editor:
   `update public.profiles set role='admin' where email='EMAIL_شما';`

## انتشار روی GitHub Pages
1. یک ریپو بسازید و همه فایل‌ها (با پوشه `.github`) را آپلود کنید.
2. Settings → Pages → Source: **GitHub Actions**. با هر push روی `main` منتشر می‌شود.
