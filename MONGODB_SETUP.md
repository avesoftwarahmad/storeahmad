# إعداد MongoDB Atlas - دليل سريع

## الخطوة 1: إنشاء حساب مجاني
1. اذهب إلى: https://www.mongodb.com/cloud/atlas/register
2. سجل بإيميلك (لا يحتاج بطاقة ائتمان)
3. اختر الخطة المجانية M0 (512MB مجاناً)

## الخطوة 2: إنشاء Cluster
1. اختر AWS كمزود السحابة
2. اختر منطقة قريبة منك (Europe أو Middle East)
3. اسم الـ cluster: `week5-mvp`
4. انقر "Create Cluster" (يستغرق 3-5 دقائق)

## الخطوة 3: إعداد المستخدم
1. من القائمة الجانبية اختر "Database Access"
2. انقر "Add New Database User"
3. Username: `week5user`
4. Password: اختر كلمة مرور قوية واحفظها!
5. Database User Privileges: "Atlas Admin"
6. انقر "Add User"

## الخطوة 4: السماح بالاتصال من أي مكان
1. من القائمة الجانبية اختر "Network Access"
2. انقر "Add IP Address"
3. انقر "Allow Access from Anywhere"
4. انقر "Confirm"

## الخطوة 5: الحصول على رابط الاتصال
1. من القائمة الجانبية اختر "Database"
2. انقر "Connect" على cluster الخاص بك
3. اختر "Connect your application"
4. انسخ رابط الاتصال
5. استبدل `<password>` بكلمة المرور التي اخترتها
6. استبدل `myFirstDatabase` بـ `week5mvp`

مثال على الرابط:
```
mongodb+srv://week5user:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/week5mvp?retryWrites=true&w=majority
```

## الخطوة 6: تحديث ملف .env في Backend
احفظ الرابط في ملف `.env` في مجلد `apps/api/`:
```env
MONGODB_URI=mongodb+srv://week5user:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/week5mvp?retryWrites=true&w=majority
```
