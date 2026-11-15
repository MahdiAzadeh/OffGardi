# OffGardi (آف‌گردی)
PWA فارسی تخفیف‌های محلی با Supabase (Auth + Postgres + RLS + Storage + Realtime).
`config.js` پر شده است (آدرس پروژه و کلید publishable).

## انتشار روی GitHub Pages
1. همه فایل‌ها (با پوشه `.github`) را در ریپو آپلود کنید.
2. Settings → Pages → Source: **GitHub Actions**.
3. Supabase → Authentication → URL Configuration: Site URL = آدرس Pages.

## نکات
- نقش مدیر فقط با SQL داده می‌شود: `update public.profiles set role='admin' where email='...';`
- اعلان‌ها: وقتی برنامه باز/نصب‌شده است با Realtime نمایش داده می‌شوند. اعلان پس‌زمینه (برنامه بسته) نیاز به سرور Web Push دارد.
