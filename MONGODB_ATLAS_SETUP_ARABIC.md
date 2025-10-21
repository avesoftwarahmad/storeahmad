# إعداد MongoDB Atlas خطوة بخطوة 🚀

## 1. إنشاء حساب مجاني
1. اذهب إلى: https://www.mongodb.com/cloud/atlas/register
2. سجل بـ email أو Google
3. لا تحتاج بطاقة ائتمان!

## 2. إنشاء Cluster مجاني
1. اختر **FREE** Shared Cluster
2. اختر أقرب منطقة (Europe/Frankfurt مثلاً)
3. اضغط **Create Cluster**
4. انتظر 1-3 دقائق

## 3. إعداد Database Access
1. اضغط **Database Access** من القائمة الجانبية
2. **Add New Database User**
3. Username: `shopmart`
4. Password: `Shop2024Pass` (أو أي password قوي)
5. Database User Privileges: **Atlas Admin**
6. **Add User**

## 4. إعداد Network Access
1. اضغط **Network Access** من القائمة
2. **Add IP Address**
3. **ALLOW ACCESS FROM ANYWHERE** (للتطوير فقط)
4. Confirm

## 5. الحصول على Connection String
1. ارجع لـ **Database** → **Connect**
2. اختر **Connect your application**
3. Driver: **Node.js**
4. Version: **5.5 or later**
5. انسخ connection string

سيكون بالشكل:
```
mongodb+srv://shopmart:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
```

## 6. تحديث الـ .env
استبدل `<password>` بكلمة السر التي اخترتها:
```
MONGODB_URI=mongodb+srv://shopmart:Shop2024Pass@cluster0.xxxxx.mongodb.net/shopmart?retryWrites=true&w=majority
```

## ✅ تم! جاهز للاستخدام
