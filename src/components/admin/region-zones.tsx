"use client";

import { useState } from "react";
import { toast } from "sonner";
import { updateRegionZoneAction } from "@/actions/admin";
import { Select } from "@/components/ui/form-controls";
import { CLIMATE_ZONE_LABELS } from "@/domain/labels";
import { CLIMATE_ZONES, type ClimateZone } from "@/domain/types";

export function RegionZones({ rows }: { rows: { id: string; name: string; country: string; zone: ClimateZone }[] }) {
  const [zones, setZones] = useState(() => Object.fromEntries(rows.map((r) => [r.id, r.zone])));
  return (
    <div className="overflow-x-auto rounded-xl border border-border bg-surface">
      <table className="w-full min-w-[28rem] text-sm">
        <caption className="sr-only">المدن ومناطقها المناخية</caption>
        <thead className="bg-surface-muted text-muted-foreground">
          <tr>
            <th scope="col" className="px-4 py-3 text-start">المدينة</th>
            <th scope="col" className="px-4 py-3 text-start">الدولة</th>
            <th scope="col" className="px-4 py-3 text-start">المنطقة المناخية</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {rows.map((r) => (
            <tr key={r.id}>
              <th scope="row" className="px-4 py-2 text-start font-semibold">{r.name}</th>
              <td className="px-4 py-2 text-muted-foreground">{r.country}</td>
              <td className="px-4 py-2">
                <Select
                  aria-label={`المنطقة المناخية لـ${r.name}`}
                  className="h-9"
                  value={zones[r.id]}
                  onChange={async (e) => {
                    const zone = e.target.value as ClimateZone;
                    const prev = zones[r.id];
                    setZones((z) => ({ ...z, [r.id]: zone }));
                    const res = await updateRegionZoneAction({ id: r.id, zone });
                    if (res.ok) toast.success(`تم تحديث ${r.name}`);
                    else {
                      toast.error(res.error);
                      setZones((z) => ({ ...z, [r.id]: prev }));
                    }
                  }}
                >
                  {CLIMATE_ZONES.map((z) => <option key={z} value={z}>{CLIMATE_ZONE_LABELS[z]}</option>)}
                </Select>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
