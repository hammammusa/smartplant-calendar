import type { Garden, Planting, Task } from "@/domain/types";

export interface GardenRow {
  id: string;
  name: string;
  space_type: Garden["spaceType"];
  region_id: string | null;
  zone: Garden["zone"];
  area_m2: number | string | null;
  latitude: number | null;
  longitude: number | null;
  created_at: string;
}

export interface PlantingRow {
  id: string;
  garden_id: string;
  crop_id: string | null;
  crop_slug: string;
  crop_name: string;
  planted_on: string;
  method: Planting["method"];
  area_m2: number | string | null;
  quantity: number | null;
  status: Planting["status"];
  expected_harvest_start: string | null;
  expected_harvest_end: string | null;
  notes: string | null;
  created_at: string;
}

export interface TaskRow {
  id: string;
  planting_id: string | null;
  garden_id: string | null;
  type: Task["type"];
  title: string;
  description: string | null;
  due_date: string;
  status: Task["status"];
  completed_at: string | null;
  postponed_count: number;
  source: Task["source"];
  created_at: string;
}

const num = (v: number | string | null) => (v == null ? null : Number(v));

export const mapGarden = (r: GardenRow): Garden => ({
  id: r.id,
  name: r.name,
  spaceType: r.space_type,
  regionId: r.region_id,
  zone: r.zone,
  areaM2: num(r.area_m2),
  latitude: r.latitude,
  longitude: r.longitude,
  createdAt: r.created_at,
});

export const mapPlanting = (r: PlantingRow): Planting => ({
  id: r.id,
  gardenId: r.garden_id,
  cropId: r.crop_id ?? "",
  cropSlug: r.crop_slug,
  cropName: r.crop_name,
  plantedOn: r.planted_on,
  method: r.method,
  areaM2: num(r.area_m2),
  quantity: r.quantity,
  status: r.status,
  expectedHarvestStart: r.expected_harvest_start,
  expectedHarvestEnd: r.expected_harvest_end,
  notes: r.notes,
  createdAt: r.created_at,
});

export const mapTask = (r: TaskRow): Task => ({
  id: r.id,
  plantingId: r.planting_id,
  gardenId: r.garden_id,
  type: r.type,
  title: r.title,
  description: r.description,
  dueDate: r.due_date,
  status: r.status,
  completedAt: r.completed_at,
  postponedCount: r.postponed_count,
  source: r.source,
  createdAt: r.created_at,
});
