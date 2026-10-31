"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, MailCheck } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import type { z } from "zod";
import { Button } from "@/components/ui/button";
import { Alert, Spinner } from "@/components/ui/feedback";
import { Checkbox, Field, Input } from "@/components/ui/form-controls";
import { forgotPasswordSchema, loginSchema, registerSchema, updatePasswordSchema } from "@/domain/schemas";
import { authErrorMessage, safeNext } from "@/lib/auth-errors";
import { appUrl } from "@/lib/env";
import { getBrowserSupabase } from "@/lib/supabase/client";

function PasswordInput({ id, invalid, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { id: string; invalid?: boolean }) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <Input id={id} type={show ? "text" : "password"} aria-invalid={invalid} className="pe-11" {...props} />
      <button
        type="button"
        onClick={() => setShow((v) => !v)}
        className="absolute end-1.5 top-1/2 flex size-8 -translate-y-1/2 items-center justify-center rounded-md text-subtle-foreground hover:bg-surface-muted"
        aria-label={show ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"}
      >
        {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
      </button>
    </div>
  );
}


export function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const next = safeNext(params.get("next"));
  const [error, setError] = useState<string | null>(
    params.get("error") === "link" ? "رابط التأكيد غير صالح أو انتهت صلاحيته. سجّل الدخول أو اطلب رابطًا جديدًا." : null,
  );
  const form = useForm<z.infer<typeof loginSchema>>({ resolver: zodResolver(loginSchema), defaultValues: { email: "", password: "" } });
  const { errors, isSubmitting } = form.formState;

  return (
    <form
      noValidate
      className="flex flex-col gap-4"
      onSubmit={form.handleSubmit(async (v) => {
        setError(null);
        const supabase = getBrowserSupabase();
        if (!supabase) return;
        const { error: err } = await supabase.auth.signInWithPassword({ email: v.email, password: v.password });
        if (err) return setError(authErrorMessage(err));
        toast.success("أهلًا بعودتك!");
        router.replace(next);
        router.refresh();
      })}
    >
      {error ? <Alert tone="danger">{error}</Alert> : null}
      <Field label="البريد الإلكتروني" htmlFor="email" error={errors.email?.message}>
        <Input id="email" type="email" autoComplete="email" dir="ltr" aria-invalid={!!errors.email} {...form.register("email")} />
      </Field>
      <Field label="كلمة المرور" htmlFor="password" error={errors.password?.message}>
        <PasswordInput id="password" autoComplete="current-password" invalid={!!errors.password} {...form.register("password")} />
      </Field>
      <Link href="/auth/forgot-password" className="self-start text-sm font-semibold text-brand-600 hover:underline">نسيت كلمة المرور؟</Link>
      <Button type="submit" size="lg" disabled={isSubmitting}>
        {isSubmitting ? <Spinner /> : null} تسجيل الدخول
      </Button>
    </form>
  );
}

export function RegisterForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [sentTo, setSentTo] = useState<string | null>(null);
  const form = useForm<z.input<typeof registerSchema>, unknown, z.output<typeof registerSchema>>({
    resolver: zodResolver(registerSchema),
    defaultValues: { fullName: "", email: "", password: "", confirmPassword: "" },
  });
  const { errors, isSubmitting } = form.formState;

  if (sentTo) {
    return (
      <Alert tone="success" title="تحقق من بريدك الإلكتروني">
        أرسلنا رابط تأكيد إلى <span dir="ltr" className="font-semibold">{sentTo}</span>. افتح الرابط لتفعيل حسابك ثم سجّل الدخول.
        <MailCheck className="sr-only" />
      </Alert>
    );
  }

  return (
    <form
      noValidate
      className="flex flex-col gap-4"
      onSubmit={form.handleSubmit(async (v) => {
        setError(null);
        const supabase = getBrowserSupabase();
        if (!supabase) return;
        const { data, error: err } = await supabase.auth.signUp({
          email: v.email,
          password: v.password,
          options: { data: { full_name: v.fullName }, emailRedirectTo: appUrl("/auth/confirm/?next=/dashboard/") },
        });
        if (err) return setError(authErrorMessage(err));
        if (data.session) {
          toast.success("تم إنشاء حسابك بنجاح");
          router.replace("/dashboard");
          router.refresh();
        } else {
          setSentTo(v.email);
        }
      })}
    >
      {error ? <Alert tone="danger">{error}</Alert> : null}
      <Field label="الاسم" htmlFor="fullName" error={errors.fullName?.message}>
        <Input id="fullName" autoComplete="name" aria-invalid={!!errors.fullName} {...form.register("fullName")} />
      </Field>
      <Field label="البريد الإلكتروني" htmlFor="email" error={errors.email?.message}>
        <Input id="email" type="email" autoComplete="email" dir="ltr" aria-invalid={!!errors.email} {...form.register("email")} />
      </Field>
      <Field label="كلمة المرور" htmlFor="password" hint="8 أحرف على الأقل" error={errors.password?.message}>
        <PasswordInput id="password" autoComplete="new-password" invalid={!!errors.password} {...form.register("password")} />
      </Field>
      <Field label="تأكيد كلمة المرور" htmlFor="confirmPassword" error={errors.confirmPassword?.message}>
        <PasswordInput id="confirmPassword" autoComplete="new-password" invalid={!!errors.confirmPassword} {...form.register("confirmPassword")} />
      </Field>
      <div className="flex flex-col gap-1">
        <label className="flex items-start gap-2 text-sm leading-6">
          <Checkbox className="mt-1" aria-invalid={!!errors.acceptTerms} {...form.register("acceptTerms")} />
          <span>
            أوافق على{" "}
            <Link href="/terms" className="font-semibold text-brand-600 hover:underline">شروط الاستخدام</Link> و
            <Link href="/privacy" className="font-semibold text-brand-600 hover:underline">سياسة الخصوصية</Link>
          </span>
        </label>
        {errors.acceptTerms ? <p role="alert" className="text-sm font-medium text-danger">{errors.acceptTerms.message}</p> : null}
      </div>
      <Button type="submit" size="lg" disabled={isSubmitting}>
        {isSubmitting ? <Spinner /> : null} إنشاء الحساب
      </Button>
    </form>
  );
}

export function ForgotPasswordForm() {
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const form = useForm<z.infer<typeof forgotPasswordSchema>>({ resolver: zodResolver(forgotPasswordSchema), defaultValues: { email: "" } });
  const { errors, isSubmitting } = form.formState;
  if (sent) {
    return (
      <Alert tone="success" title="تحقق من بريدك">
        إذا كان هناك حساب مرتبط بهذا البريد، فستصلك رسالة تحتوي على رابط لتعيين كلمة مرور جديدة.
      </Alert>
    );
  }
  return (
    <form
      noValidate
      className="flex flex-col gap-4"
      onSubmit={form.handleSubmit(async (v) => {
        setError(null);
        const supabase = getBrowserSupabase();
        if (!supabase) return;
        const { error: err } = await supabase.auth.resetPasswordForEmail(v.email, {
          redirectTo: appUrl("/auth/confirm/?next=/auth/update-password/"),
        });
        // Do not reveal whether the email exists; only surface rate-limit/network problems.
        if (err && (err.status === 429 || err.code?.startsWith("over_"))) return setError(authErrorMessage(err));
        setSent(true);
      })}
    >
      {error ? <Alert tone="danger">{error}</Alert> : null}
      <Field label="البريد الإلكتروني" htmlFor="email" error={errors.email?.message}>
        <Input id="email" type="email" autoComplete="email" dir="ltr" aria-invalid={!!errors.email} {...form.register("email")} />
      </Field>
      <Button type="submit" size="lg" disabled={isSubmitting}>
        {isSubmitting ? <Spinner /> : null} إرسال رابط الاستعادة
      </Button>
    </form>
  );
}

export function UpdatePasswordForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const form = useForm<z.infer<typeof updatePasswordSchema>>({ resolver: zodResolver(updatePasswordSchema), defaultValues: { password: "", confirmPassword: "" } });
  const { errors, isSubmitting } = form.formState;
  return (
    <form
      noValidate
      className="flex flex-col gap-4"
      onSubmit={form.handleSubmit(async (v) => {
        setError(null);
        const supabase = getBrowserSupabase();
        if (!supabase) return;
        const { data } = await supabase.auth.getUser();
        if (!data.user) return setError("انتهت صلاحية رابط الاستعادة أو لم يُفتح من بريدك. اطلب رابطًا جديدًا.");
        const { error: err } = await supabase.auth.updateUser({ password: v.password });
        if (err) return setError(authErrorMessage(err));
        toast.success("تم تحديث كلمة المرور");
        router.replace("/dashboard");
      })}
    >
      {error ? <Alert tone="danger">{error}</Alert> : null}
      <Field label="كلمة المرور الجديدة" htmlFor="password" hint="8 أحرف على الأقل" error={errors.password?.message}>
        <PasswordInput id="password" autoComplete="new-password" invalid={!!errors.password} {...form.register("password")} />
      </Field>
      <Field label="تأكيد كلمة المرور" htmlFor="confirmPassword" error={errors.confirmPassword?.message}>
        <PasswordInput id="confirmPassword" autoComplete="new-password" invalid={!!errors.confirmPassword} {...form.register("confirmPassword")} />
      </Field>
      <Button type="submit" size="lg" disabled={isSubmitting}>
        {isSubmitting ? <Spinner /> : null} حفظ كلمة المرور
      </Button>
    </form>
  );
}
