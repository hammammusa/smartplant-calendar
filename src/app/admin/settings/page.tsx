import { SettingsForm } from "@/components/admin/settings-form";
import { PageHeader } from "@/components/layout/page-header";
import { getContactEmail, getWeatherThresholds } from "@/services/content";

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  const [th, email] = await Promise.all([getWeatherThresholds(), getContactEmail()]);
  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="الإعدادات العامة" />
      <SettingsForm defaults={{ ...th, contactEmail: email }} />
    </div>
  );
}
