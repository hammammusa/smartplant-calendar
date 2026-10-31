# رزنامة الزراعة الذكية — SmartPlant Calendar

منصة ويب عربية بالكامل تساعد المزارعين الصغار وأصحاب الحدائق المنزلية والأسطح والشرفات على معرفة **ماذا يزرعون ومتى**، وتنظّم **الري والتسميد والمتابعة والحصاد** في رزنامة واحدة، وفق المنطقة المناخية والموسم ونوع المحصول. الجمهور المستهدف مبدئيًا فلسطين وبلاد الشام.

> المعلومات الزراعية الحالية **بيانات أولية إرشادية** لم يراجعها مهندس زراعي بعد، والمنصة توضح ذلك في كل صفحة. يمكن تعديلها كلها من لوحة الإدارة.

---

## النشر الحالي: GitHub Pages (موقع ثابت)

الموقع يُبنى كموقع ثابت بالكامل (Next.js Static Export) ويُنشر على:
**https://hammammusa.github.io/smartplant-calendar/**

> النسخة السابقة المعتمدة على الخادم (Server Actions وRoute Handlers وProxy) محفوظة كما هي في الفرع **`server-version`** لمن يريد النشر لاحقًا على خادم Node.

### ما يعمل على GitHub Pages دون أي خادم

| الميزة | الحالة على GitHub Pages |
| --- | --- |
| الواجهة العربية الكاملة RTL، التصميم، الخطوط، الوضع المتجاوب للجوال | تعمل |
| الصفحة الرئيسية والمعاينة التفاعلية للرزنامة | تعمل |
| دليل المحاصيل (12 محصولًا) مع البحث والفلاتر وصفحات التفاصيل | تعمل (صفحات مولّدة مسبقًا) |
| مولّد الخطط الزراعية | يعمل في المتصفح |
| الرزنامة (شهري/أسبوعي/قائمة) وإدارة المهام ولوحة التحكم | تعمل، والبيانات تُحفظ في متصفح الزائر (localStorage) مع تنبيه واضح |
| الطقس والتنبيهات الزراعية | يعمل: المتصفح يتصل مباشرة بـ Open-Meteo (لا مفاتيح) |
| فتح أي صفحة مباشرة أو تحديثها، وصفحة 404 عربية | تعمل (`trailingSlash` + `404.html`) |

### ما يحتاج Backend خارجيًا (Supabase) — اختياري

عند ضبط متغيرات Supabase العامة في GitHub، تتصل المنصة **من المتصفح مباشرة** بـ Supabase:

| الميزة | ماذا تحتاج |
| --- | --- |
| إنشاء حساب، تسجيل الدخول/الخروج، استعادة كلمة المرور، الملف الشخصي | مشروع Supabase (مجاني) + متغيرات GitHub |
| حفظ المحاصيل والخطط والمهام في الحساب ومزامنتها بين الأجهزة، ونقل بيانات المتصفح إلى الحساب | Supabase |
| لوحة الإدارة (المحاصيل، الصور، المواعيد، القواعد، الأسئلة، الإعدادات، الإحصاءات) | Supabase + حساب مشرف |

**كيف تبقى آمنة دون خادم؟** المتصفح يستخدم المفتاح العام (publishable/anon) فقط، وهو مصمم ليكون علنيًا. الحماية الحقيقية داخل PostgreSQL:
سياسات Row Level Security تمنع أي مستخدم من قراءة أو تعديل بيانات غيره، والكتابة على المحتوى مقصورة على `is_admin()`، ولا يمكن لمستخدم ترقية نفسه، وقيود CHECK وحدود عدد الصفوف تمنع إدخال بيانات غير صالحة حتى لو استُدعيت الواجهة البرمجية مباشرة (`supabase/migrations/20261101000003_client_hardening.sql`). **لا يوجد ولا يُستخدم أي مفتاح سري في المتصفح.**

### قيود معروفة للنسخة الثابتة

- تعديلات المحتوى من لوحة الإدارة تُحفظ فورًا في قاعدة البيانات وتُستخدم فورًا في مولّد الخطط للمستخدمين المسجلين، لكنها تظهر في **الصفحات العامة** (دليل المحاصيل، الأسئلة الشائعة) بعد إعادة البناء: تلقائيًا كل يوم، أو فورًا من **Actions → Deploy to GitHub Pages → Run workflow**. المحصول الجديد يحصل على صفحة بعد إعادة البناء.
- لا يمكن ضبط ترويسات HTTP الأمنية على GitHub Pages (مثل CSP)؛ أُضيف `referrer` عبر وسوم HTML.
- واجهة Open-Meteo المجانية مخصصة للاستخدام غير التجاري. للاستخدام التجاري يلزم مفتاح مدفوع، ويجب ألا يوضع في المتصفح؛ يحتاج حينها وسيطًا صغيرًا (مثل Supabase Edge Function) أو استخدام فرع `server-version`.
- ملف `robots.txt` موجود داخل `/smartplant-calendar/`، ومحركات البحث تقرأ robots من جذر النطاق فقط؛ خريطة الموقع `sitemap.xml` تعمل ويمكن إرسالها يدويًا إلى Google Search Console.

---

## إعداد GitHub Pages (مرة واحدة)

1. افتح المستودع على GitHub ← **Settings** ← **Pages**.
2. في **Build and deployment** ← **Source** اختر **GitHub Actions** (وليس Deploy from a branch).
3. (اختياري لتفعيل الحسابات) **Settings ← Secrets and variables ← Actions ← تبويب Variables** وأضف متغيرات (Variables وليس Secrets لأنها عامة أصلًا):
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
4. أي دمج في `main` يشغّل **Deploy to GitHub Pages** تلقائيًا. يمكنك تشغيله يدويًا من تبويب **Actions**.
5. بعد نجاحه يظهر الموقع على `https://hammammusa.github.io/smartplant-calendar/` (قد يستغرق أول نشر بضع دقائق).

إذا فعّلت Supabase أضف في **Authentication → URL Configuration**:
- Site URL: `https://hammammusa.github.io/smartplant-calendar/`
- Redirect URLs: `https://hammammusa.github.io/smartplant-calendar/auth/confirm/` و`http://localhost:3000/auth/confirm/`

---

## التقنيات

- Next.js 16 (App Router، Turbopack) + React 19 + TypeScript بنمط strict
- Tailwind CSS 4 مع نظام Design Tokens في `src/app/globals.css`
- مكونات بأسلوب shadcn/ui مبنية على Radix (`radix-ui`) و`class-variance-authority`
- Lucide React للأيقونات، Sonner للإشعارات
- React Hook Form + Zod 4 (رسائل عربية، والتحقق نفسه يُعاد على الخادم)
- Supabase (Auth + PostgreSQL + Storage) من المتصفح عبر `@supabase/ssr`
- Open-Meteo للطقس (طلبات مباشرة من المتصفح)
- Static Export للنشر على GitHub Pages
- Vitest للاختبارات الوحدوية، Playwright للاختبارات الشاملة، وPostgreSQL 16 لاختبارات الصلاحيات

**التقويم** مبني داخليًا (`src/components/calendar`) بدل مكتبة خارجية، للتحكم الكامل في RTL وأسماء الأشهر الشامية وبداية الأسبوع يوم السبت وتوقيت `Asia/Hebron`. كل الجدولة تعمل على تواريخ بلا وقت (`YYYY-MM-DD`) فلا تنزاح المهام بسبب التوقيت الصيفي.

---

## التشغيل محليًا

المتطلبات: Node.js 20.9 أو أحدث (مُختبَر على 22).

```bash
npm install
cp .env.example .env.local   # اتركه فارغًا لتشغيل وضع المعاينة
npm run dev                  # http://localhost:3000
```

### الأوامر

| الأمر | الوظيفة |
| --- | --- |
| `npm run dev` | خادم التطوير (دون المسار الفرعي) |
| `npm run build` | بناء ثابت إلى مجلد `out/` (دون مسار فرعي) |
| `npm run build:pages` | بناء ثابت بمسار GitHub Pages `/smartplant-calendar` |
| `npm run serve:pages` | معاينة `out/` محليًا كما يقدمها GitHub Pages على `http://localhost:3200/smartplant-calendar/` |
| `npm run lint` | ESLint |
| `npm run typecheck` | فحص TypeScript |
| `npm test` | الاختبارات الوحدوية (Vitest) |
| `npm run test:e2e` | اختبارات Playwright على الموقع الثابت (شغّل `npm run build:pages` أولًا) |
| `npm run test:db` | يطبّق ملفات قاعدة البيانات على PostgreSQL مؤقت ويختبر سياسات RLS (يتطلب `initdb`/`pg_ctl`) |
| `npm run db:seed:generate` | يعيد توليد `supabase/seed.sql` من بيانات `src/data` |

---

## إعداد Supabase (لتفعيل الحسابات ولوحة الإدارة)

1. أنشئ مشروعًا على [supabase.com](https://supabase.com).
2. من **SQL Editor** نفّذ الملفات بالترتيب:
   1. `supabase/migrations/20261027000001_init.sql`
   2. `supabase/migrations/20261027000002_storage.sql`
   3. `supabase/migrations/20261101000003_client_hardening.sql`
   4. `supabase/seed.sql`
3. انسخ رابط المشروع والمفتاح العام (publishable / anon) من **Project Settings → API** إلى متغيرات GitHub (انظر أعلاه) أو إلى `.env.local` محليًا. لا تستخدم مفتاح `service_role` أبدًا.
4. اضبط Site URL وRedirect URLs كما في قسم GitHub Pages.
5. **ترقية مشرف**: بعد إنشاء حسابك من الموقع نفّذ:
   ```sql
   update public.profiles set role = 'admin'
   where id = (select id from auth.users where email = 'you@example.com');
   ```
6. شغّل سير عمل النشر مرة أخرى ليُبنى الموقع بمحتوى قاعدة البيانات.

---

## هيكل المشروع

```
src/
  app/            الصفحات (App Router) — كلها ثابتة
  data-access/    الوصول إلى Supabase من المتصفح (المستخدم والإدارة) مع تحقق Zod، والحماية في RLS
  components/     ui (مكونات التصميم) و layout و calendar و planner و tasks و dashboard و weather و admin و auth
  domain/         منطق الأعمال: الأنواع، مولّد الخطط، المواعيد، المهام، الطقس، مخططات Zod، التسميات العربية
  data/           البيانات الأولية: المحاصيل، المدن، الأسئلة الشائعة
  lib/            التواريخ، التنسيق العربي، Supabase، التخزين المحلي للضيف
  services/       قراءة المحتوى العام وقت البناء (المحاصيل، الأسئلة، الإعدادات)
scripts/          توليد seed.sql، وخادم محلي يحاكي GitHub Pages
supabase/         migrations و seed.sql
tests/            unit (Vitest) و e2e (Playwright) و db (اختبارات RLS)
```

---

## قابلية التطوير التجاري

- عمود `plan_tier` في `profiles` (`free`/`premium`/`organization`) جاهز لربط الاشتراكات لاحقًا، ولا تعتمد عليه أي ميزة أساسية حاليًا.
- البيانات مبنية على «مساحات» (gardens) متعددة لكل مستخدم، فتدعم الحدائق والمزارع المتعددة.
- جدول `notification_preferences` يحتوي قنوات البريد والإشعارات الفورية (معطلة) جاهزة لربط مزود حقيقي.
- لا يوجد أي نظام دفع وهمي.

---

## ما بقي غير مكتمل / مقترحات المرحلة التالية

- **مراجعة البيانات الزراعية** من مهندس زراعي، ثم تحويل حالة كل محصول إلى «مراجعة من مختص» من لوحة الإدارة.
- إرسال التذكيرات بالبريد أو الإشعارات الفورية (يتطلب مزود خدمة مثل Resend أو Web Push ومهمة مجدولة).
- صور فوتوغرافية حقيقية للمحاصيل (حاليًا رسوم توضيحية مدمجة، ويمكن للمشرف رفع صور من لوحة الإدارة).
- الوضع الداكن (رموز الألوان جاهزة في `globals.css` تحت `data-theme="dark"`).
- تعديل المساحات الزراعية بعد إنشائها، وحذف الحساب ذاتيًا.
- مراجعة قانونية لسياسة الخصوصية وشروط الاستخدام قبل الإطلاق التجاري.
