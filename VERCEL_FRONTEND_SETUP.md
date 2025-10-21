# نشر Frontend على Vercel - دليل سريع

## الخطوة 1: إنشاء حساب Vercel
1. اذهب إلى: https://vercel.com
2. سجل باستخدام GitHub
3. اعطِ Vercel صلاحية الوصول

## الخطوة 2: استيراد المشروع
1. انقر "Add New..." ← "Project"
2. اختر مستودع GitHub الخاص بك
3. املأ الإعدادات:
   - **Framework Preset**: `Vite`
   - **Root Directory**: `apps/storefront`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`

## الخطوة 3: Environment Variables
أضف هذه المتغيرات:
```
VITE_API_URL=https://week5-mvp-api.onrender.com/api
```
(استبدل الرابط برابط Render الخاص بك)

## الخطوة 4: النشر
1. انقر "Deploy"
2. انتظر اكتمال البناء (2-3 دقائق)
3. ستحصل على رابط مثل: `https://your-project.vercel.app`

## الخطوة 5: تحديث CORS في Backend
بعد الحصول على رابط Vercel، ارجع إلى Render وحدث:
```
CORS_ORIGINS=https://your-project.vercel.app,http://localhost:5173
```

## روابط مباشرة:
- Frontend: `https://your-project.vercel.app`
- Backend API: `https://week5-mvp-api.onrender.com/api`
