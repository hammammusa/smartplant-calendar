"use client";

import type { EmailOtpType } from "@supabase/supabase-js";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Alert, Spinner } from "@/components/ui/feedback";
import { safeNext } from "@/lib/auth-errors";
import { getBrowserSupabase } from "@/lib/supabase/client";

/**
 * Completes email confirmation / password recovery links in the browser
 * (static hosting has no server route). Supports PKCE `code` and `token_hash`.
 */
export function AuthConfirm() {
  const params = useSearchParams();
  const router = useRouter();
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const supabase = getBrowserSupabase();
    const next = safeNext(params.get("next"));
    const code = params.get("code");
    const tokenHash = params.get("token_hash");
    const type = params.get("type") as EmailOtpType | null;
    let cancelled = false;
    (async () => {
      if (!supabase) return setFailed(true);
      const { error } = tokenHash && type
        ? await supabase.auth.verifyOtp({ type, token_hash: tokenHash })
        : code
          ? await supabase.auth.exchangeCodeForSession(code)
          : { error: new Error("missing") };
      if (cancelled) return;
      if (error) setFailed(true);
      else router.replace(next);
    })();
    return () => {
      cancelled = true;
    };
  }, [params, router]);

  if (failed) {
    return (
      <Alert tone="danger" title="الرابط غير صالح أو انتهت صلاحيته">
        اطلب رابطًا جديدًا أو{" "}
        <Link href="/auth/login" className="font-semibold underline">سجّل الدخول</Link>.
      </Alert>
    );
  }
  return (
    <p role="status" className="flex items-center gap-2 text-muted-foreground">
      <Spinner /> جارٍ التحقق…
    </p>
  );
}
