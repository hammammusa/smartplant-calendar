import { RegionZones } from "@/components/admin/region-zones";
import { PageHeader } from "@/components/layout/page-header";
import { COUNTRIES } from "@/data/regions";
import type { ClimateZone } from "@/domain/types";
import { getServerSupabase } from "@/lib/supabase/server";

export default async function AdminRegionsPage() {
  const supabase = await getServerSupabase();
  if (!supabase) return null;
  const { data } = await supabase.from("regions").select("id, name, zone, country_code").order("sort_order");
  const rows = (data ?? []).map((r) => ({
    id: r.id as string,
    name: r.name as string,
    zone: r.zone as ClimateZone,
    country: COUNTRIES.find((c) => c.code === r.country_code)?.name ?? (r.country_code as string),
  }));
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="المدن والمناطق المناخية"
        description="المنطقة المناخية لكل مدينة هي ما يقترحه مولّد الخطط افتراضيًا، ويستطيع المستخدم تغييرها. مواعيد الزراعة لكل منطقة تُعدّل من صفحة كل محصول."
      />
      <RegionZones rows={rows} />
    </div>
  );
}
