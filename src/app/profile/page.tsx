import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/page-header";
import { ProfileView } from "@/components/profile/profile-view";

export const metadata: Metadata = { title: "الملف الشخصي", robots: { index: false } };

export default function ProfilePage() {
  return (
    <div className="container-page flex flex-col gap-6 py-8 sm:py-10">
      <PageHeader eyebrow="حسابي" title="الملف الشخصي" description="عدّل بياناتك وموقعك المفضل وإعدادات التنبيهات." />
      <ProfileView />
    </div>
  );
}
