/** Maps Supabase Auth errors to clear Arabic messages. */
export function authErrorMessage(error: { code?: string; message?: string; status?: number } | null | undefined): string {
  if (!error) return "حدث خطأ غير متوقع. حاول مرة أخرى.";
  const code = error.code ?? "";
  const msg = (error.message ?? "").toLowerCase();
  if (code === "invalid_credentials" || msg.includes("invalid login credentials")) return "البريد الإلكتروني أو كلمة المرور غير صحيحة.";
  if (code === "email_not_confirmed" || msg.includes("email not confirmed")) return "لم يتم تأكيد بريدك الإلكتروني بعد. افتح رسالة التأكيد التي أرسلناها إليك.";
  if (code === "user_already_exists" || code === "email_exists" || msg.includes("already registered")) return "يوجد حساب مسجّل بهذا البريد الإلكتروني. جرّب تسجيل الدخول أو استعادة كلمة المرور.";
  if (code === "weak_password" || msg.includes("password should")) return "كلمة المرور ضعيفة. استخدم 8 أحرف على الأقل مع مزيج من الأحرف والأرقام.";
  if (code === "same_password") return "كلمة المرور الجديدة يجب أن تختلف عن الحالية.";
  if (code.startsWith("over_") || error.status === 429) return "محاولات كثيرة خلال وقت قصير. انتظر قليلًا ثم حاول مرة أخرى.";
  if (code === "signup_disabled") return "إنشاء الحسابات الجديدة متوقف حاليًا.";
  if (code === "otp_expired" || msg.includes("expired")) return "انتهت صلاحية الرابط. اطلب رابطًا جديدًا.";
  if (msg.includes("fetch") || msg.includes("network")) return "تعذّر الاتصال بالخادم. تحقق من اتصالك بالإنترنت.";
  return "تعذّر إتمام العملية. حاول مرة أخرى بعد قليل.";
}

/** Only allow same-site relative redirects (prevents open redirects). */
export function safeNext(next: string | null | undefined, fallback = "/dashboard"): string {
  if (!next || !next.startsWith("/") || next.startsWith("//") || next.startsWith("/\\")) return fallback;
  return next;
}
