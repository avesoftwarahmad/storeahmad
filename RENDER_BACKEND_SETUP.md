# نشر Backend على Render.com - دليل سريع

## الخطوة 1: رفع الكود على GitHub
1. تأكد من رفع مشروعك على GitHub
2. تأكد من وجود `.gitignore` لحماية ملف `.env`

## الخطوة 2: إنشاء حساب Render
1. اذهب إلى: https://render.com
2. سجل باستخدام حساب GitHub
3. اعطِ Render صلاحية الوصول لمستودعاتك

## الخطوة 3: إنشاء خدمة Web Service
1. انقر "New +" ← "Web Service"
2. اختر مستودع GitHub الخاص بك
3. املأ البيانات:
   - **Name**: `week5-mvp-api`
   - **Region**: اختر الأقرب لك
   - **Branch**: `main`
   - **Root Directory**: `apps/api`
   - **Runtime**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Instance Type**: `Free`

## الخطوة 4: إضافة Environment Variables
انقر على تبويب "Environment" وأضف:
```
MONGODB_URI=mongodb+srv://week5user:PASSWORD@cluster.xxxxx.mongodb.net/week5mvp?retryWrites=true&w=majority
PORT=3001
NODE_ENV=production
CORS_ORIGINS=https://your-frontend.vercel.app,http://localhost:5173
LLM_ENDPOINT=https://your-ngrok.ngrok-free.app/generate
```

## الخطوة 5: النشر
1. انقر "Create Web Service"
2. انتظر اكتمال البناء (3-5 دقائق)
3. ستحصل على رابط مثل: `https://week5-mvp-api.onrender.com`

## ملاحظات مهمة:
- الخدمة المجانية تتوقف بعد 15 دقيقة من عدم النشاط
- أول طلب بعد التوقف يستغرق 30-60 ثانية
- الرابط سيكون عام ومتاح للجميع
