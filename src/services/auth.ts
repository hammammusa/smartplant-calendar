import "server-only";
import { redirect } from "next/navigation";
import { getServerSupabase } from "@/lib/supabase/server";

export interface SessionUser {
  id: string;
  email: string | null;
  role: "user" | "admin";
}

/** Verifies the session with Supabase Auth (not just the cookie) and loads the role. */
export async function getSessionUser(): Promise<SessionUser | null> {
  const supabase = await getServerSupabase();
  if (!supabase) return null;
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return null;
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", data.user.id).maybeSingle();
  return { id: data.user.id, email: data.user.email ?? null, role: profile?.role === "admin" ? "admin" : "user" };
}

export async function requireAdmin(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) redirect("/auth/login?next=/admin");
  if (user.role !== "admin") redirect("/dashboard?denied=admin");
  return user;
}
