# الاستضافة الخاصة: Cloudflare Pages + Cloudflare Access

الهدف: ألا يستطيع أحد غيرك فتح الموقع أو تحميل أي ملف منه (HTML أو JavaScript أو CSS أو الصور)، حتى لو عرف الرابط.

## لماذا لا يكفي GitHub Pages؟

GitHub Pages استضافة **عامة**. أي شخص يعرف الرابط يستطيع فتح الموقع، وتغيير خصوصية المستودع لا يحمي الموقع المنشور (ومع الخطة المجانية يوقف GitHub Pages نشر المستودعات الخاصة كليًا). ولا تكفي «شاشة كلمة مرور» مكتوبة بـ JavaScript، لأن الملفات نفسها تُحمَّل قبل أن تعمل الشاشة.

## الحل

- **Cloudflare Pages**: يستضيف ملفات الموقع الثابتة (مجلد `out/`)، وتُرفع من GitHub Actions عبر Direct Upload. لا نربط Cloudflare بالمستودع مباشرة، حتى لا تُنشأ معاينات تلقائية لكل فرع.
- **Cloudflare Access (Zero Trust)**: بوابة دخول تعمل على حافة Cloudflare **قبل** تقديم أي ملف. لا يمر إلا بريدك الإلكتروني، عبر رمز لمرة واحدة يصلك على البريد. الخطة المجانية تكفي (حتى 50 مستخدمًا).
- **سير العمل** `.github/workflows/deploy-cloudflare.yml`:
  1. لا يفعل شيئًا إن لم تُضبط الإعدادات بعد.
  2. **قبل** أي نشر، يتحقق من أن Access يعترض الطلبات المجهولة على:
     - النطاق الرئيسي `<project>.pages.dev`، ومعه ملفات `/_next/static/...` و`robots.txt`؛
     - رابط الفرع `main.<project>.pages.dev`؛
     - نطاق فرعي عشوائي `access-check-….<project>.pages.dev`، للتأكد من حماية **كل** روابط المعاينة؛
     - أي نطاق مخصص تضيفه.
  3. إن لم يكن أي رابط منها محميًا **يتوقف ولا ينشر شيئًا**.
  4. بعد النشر يتحقق مرة أخرى من حماية رابط النشر الجديد نفسه.
- **سكربت التحقق**: `scripts/verify-access.sh`. يعدّ الرابط محميًا فقط إذا أعاد توجيهًا إلى `*.cloudflareaccess.com` دون تقديم أي محتوى.

## الخطوات (بالترتيب، ولا يُنشر أي محتوى قبل الخطوة 6)

### 1) حساب Cloudflare و Zero Trust
1. أنشئ حسابًا مجانيًا على https://dash.cloudflare.com (أو سجّل الدخول).
2. افتح **Zero Trust** من القائمة الجانبية، واختر اسم فريق (Team name)، ثم اختر الخطة المجانية **Free**. قد يُطلب منك إدخال وسيلة دفع للتحقق فقط، ولا تُسحب أي رسوم على الخطة المجانية.
3. من **Settings → Authentication → Login methods** تأكد أن **One-time PIN** مفعّل.

### 2) مفاتيح GitHub
1. انسخ **Account ID**: يظهر في الصفحة الرئيسية للحساب، أو في **Workers & Pages** في العمود الجانبي.
2. أنشئ API Token: **My Profile → API Tokens → Create Token → Create Custom Token** بالصلاحية التالية فقط:
   - Account → **Cloudflare Pages** → **Edit**
3. في GitHub افتح **Settings → Secrets and variables → Actions**:
   - في **Secrets** (سرية):
     - `CLOUDFLARE_API_TOKEN`: التوكن.
     - `CLOUDFLARE_ACCOUNT_ID`: رقم الحساب.
   - في **Variables**:
     - `CF_PAGES_PROJECT`: اسم المشروع، مثل `smartplant-calendar`.

### 3) إنشاء مشروع Pages فارغًا (دون نشر)
1. في GitHub: **Actions → Deploy private site (Cloudflare Pages + Access) → Run workflow**، واختر `create-project`.
2. افتح **Workers & Pages** في Cloudflare وانسخ النطاق الذي خُصص للمشروع. قد يكون `smartplant-calendar.pages.dev`، أو باسم مختلف قليلًا إن كان الاسم محجوزًا.
3. أضف متغيرًا في GitHub (Variables): `CF_PAGES_HOST` = ذلك النطاق بالضبط، مثل `smartplant-calendar.pages.dev`.

> المشروع فارغ: لا يوجد فيه أي ملف من الموقع بعد.

### 4) سياسة Cloudflare Access
1. افتح **Zero Trust → Access → Applications → Add an application → Self-hosted**.
2. اسم التطبيق: `SmartPlant Calendar`.
3. أضف **نطاقين عامين** (Public hostnames) في التطبيق نفسه:
   - Subdomain: `smartplant-calendar` (اسم مشروعك)، Domain: `pages.dev`؛
   - Subdomain: `*.smartplant-calendar`، Domain: `pages.dev`. هذا يحمي كل روابط المعاينة والفروع.
4. اجعل مدة الجلسة (Session duration) مثلًا 24 ساعة.
5. أضف سياسة (Policy):
   - الاسم: `Only me`.
   - الإجراء: **Allow**.
   - Include → **Emails** → بريدك الإلكتروني فقط.
6. احفظ التطبيق.

> بديل: من **Workers & Pages → مشروعك → Settings → General → Access policy → Enable** يُنشأ تطبيق يحمي `*.<project>.pages.dev` (المعاينات) فقط. إن استخدمته **عدّله** لإضافة النطاق الرئيسي `<project>.pages.dev` وسياسة بريدك، وإلا يبقى الرابط الرئيسي مكشوفًا.

### 5) التحقق قبل النشر
1. شغّل **Run workflow** مع الاختيار `verify`.
2. يجب أن تظهر كل الروابط بحالة `PROTECTED`.
3. إن ظهر `NOT PROTECTED` لأي رابط، فارجع إلى الخطوة 4.

### 6) النشر الخاص
1. شغّل **Run workflow** مع الاختيار `deploy`. بعد دمج هذا التحديث في `main` سيعمل النشر تلقائيًا أيضًا مع كل تحديث للفرع.
2. افتح `https://<project>.pages.dev` في نافذة خاصة: يجب أن تظهر صفحة دخول Cloudflare Access، ولا يظهر الموقع إلا بعد إدخال الرمز المرسل إلى بريدك.
3. جرّب بريدًا آخر: يجب أن يُرفض.

### 7) (اختياري) نطاق مخصص
إذا أضفت نطاقًا مخصصًا للمشروع (Custom domain):
1. أضفه إلى تطبيق Access نفسه كنطاق عام ثالث.
2. أضفه إلى متغير GitHub `CF_EXTRA_HOSTS` (عدة نطاقات تُفصل بفواصل)، حتى يتحقق منه سير العمل قبل كل نشر.

### 8) إلغاء النشر العام على GitHub Pages (بعد التأكد من عمل الموقع الخاص)
1. **Settings → Pages**: من القائمة بجانب رابط الموقع اختر **Unpublish site**، ثم اجعل **Source** على **None** إن ظهر هذا الخيار.
2. **Actions → Deploy to GitHub Pages → … → Disable workflow** (هذا السير ينشر تلقائيًا مع كل تحديث للفرع `main`)، أو احذف ملفه `.github/workflows/deploy-pages.yml`.
3. تأكد أن `https://smartplantcalendar.github.io/` يعرض 404. قد يحتاج ذلك بضع دقائق، وقد تبقى نسخ قديمة في ذاكرة المتصفح أو محركات البحث فترة قصيرة.
4. (يُنصح به) اجعل المستودع **Private** من **Settings → General → Danger Zone**، حتى لا يستطيع أحد بناء نسخة من الموقع بنفسه من الكود. النشر إلى Cloudflare يعمل مع المستودع الخاص.

### 9) إن فعّلت Supabase
- **Site URL**: `https://<project>.pages.dev/`
- **Redirect URLs**: `https://<project>.pages.dev/auth/confirm/`
- **Variables في GitHub**: `NEXT_PUBLIC_SUPABASE_URL` و`NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.

> واجهة Supabase البرمجية نفسها ليست خلف Access، لكنها محمية بسياسات RLS في قاعدة البيانات، ولا يستطيع أحد قراءة بياناتك دون تسجيل الدخول بحسابك.

## ما الذي يحميه هذا الإعداد وما الذي لا يحميه

| الطبقة | الحالة |
| --- | --- |
| HTML وJS وCSS وكل ملفات الموقع على `*.pages.dev` والنطاقات المضافة | محمية بـ Access قبل التحميل |
| روابط المعاينة والفروع ورابط كل نشر | محمية بالنطاق العام `*.<project>.pages.dev` |
| نسخة GitHub Pages القديمة | تبقى عامة **حتى تنفّذ الخطوة 8** |
| الكود في GitHub | عام ما دام المستودع عامًا (الخطوة 8-4) |
| بيانات Supabase | محمية بـ RLS وبتسجيل الدخول |
| الخدمات الخارجية (OpenStreetMap، Open-Meteo) | تُستدعى من متصفحك فقط بعد موافقتك، ولا ترى سوى الإحداثيات (المقرّبة للطقس) |
