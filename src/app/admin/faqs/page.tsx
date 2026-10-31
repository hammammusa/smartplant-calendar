import { FaqManager, type FaqRow } from "@/components/admin/faq-manager";
import { PageHeader } from "@/components/layout/page-header";
import { getServerSupabase } from "@/lib/supabase/server";

export default async function AdminFaqsPage() {
  const supabase = await getServerSupabase();
  if (!supabase) return null;
  const { data } = await supabase.from("faqs").select("id, question, answer, sort_order, is_published").order("sort_order");
  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="الأسئلة الشائعة" description="تظهر الأسئلة المنشورة في الصفحة الرئيسية حسب الترتيب." />
      <FaqManager faqs={(data ?? []) as FaqRow[]} />
    </div>
  );
}
