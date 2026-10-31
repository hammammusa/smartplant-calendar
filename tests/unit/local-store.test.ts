import { describe, expect, it } from "vitest";
import { findSeedCrop } from "@/data/crops";
import { applyTaskPatch, EMPTY_SNAPSHOT, localAddTask, localCreatePlan, localDeletePlanting, toImportPayload } from "@/lib/local-store";
import type { PlanRequest } from "@/domain/schemas";

const tomato = findSeedCrop("tomato")!;
const lettuce = findSeedCrop("lettuce")!;
const req = (over: Partial<PlanRequest> = {}): PlanRequest => ({
  cropSlug: "tomato",
  plantedOn: "2026-04-15",
  zone: "highland",
  spaceType: "home_garden",
  regionId: "ps-hebron",
  gardenId: null,
  gardenName: "حديقتي",
  areaM2: 20,
  quantity: 10,
  notes: "",
  latitude: 31.5,
  longitude: 35.1,
  completeBefore: null,
  ...over,
});

describe("guest store", () => {
  it("creates a garden, planting and dated tasks", () => {
    const { snapshot, plantingId, gardenId } = localCreatePlan(EMPTY_SNAPSHOT, req(), tomato);
    expect(snapshot.gardens).toHaveLength(1);
    expect(snapshot.plantings[0].id).toBe(plantingId);
    expect(snapshot.plantings[0].expectedHarvestStart).toBe("2026-06-14");
    expect(snapshot.tasks.every((t) => t.plantingId === plantingId && t.gardenId === gardenId)).toBe(true);
    expect(snapshot.tasks.every((t) => t.status === "pending")).toBe(true);
  });

  it("reuses the garden for a second crop in the same plan", () => {
    const first = localCreatePlan(EMPTY_SNAPSHOT, req(), tomato);
    const second = localCreatePlan(first.snapshot, req({ cropSlug: "lettuce", gardenId: first.gardenId }), lettuce);
    expect(second.snapshot.gardens).toHaveLength(1);
    expect(second.snapshot.plantings).toHaveLength(2);
  });

  it("marks tasks before completeBefore as done", () => {
    const { snapshot } = localCreatePlan(EMPTY_SNAPSHOT, req({ completeBefore: "2026-05-01" }), tomato);
    const before = snapshot.tasks.filter((t) => t.dueDate < "2026-05-01");
    const after = snapshot.tasks.filter((t) => t.dueDate >= "2026-05-01");
    expect(before.length).toBeGreaterThan(0);
    expect(before.every((t) => t.status === "done" && t.completedAt)).toBe(true);
    expect(after.every((t) => t.status === "pending")).toBe(true);
  });

  it("patches tasks and keeps completedAt consistent", () => {
    const { snapshot } = localCreatePlan(EMPTY_SNAPSHOT, req(), tomato);
    const t = snapshot.tasks[0];
    const done = applyTaskPatch(t, { status: "done" }, new Date("2026-04-20T10:00:00Z"));
    expect(done.completedAt).toBe("2026-04-20T10:00:00.000Z");
    expect(applyTaskPatch(done, { status: "pending" }).completedAt).toBeNull();
    expect(applyTaskPatch(t, { dueDate: "2026-04-30", postponedCount: 1 })).toMatchObject({ dueDate: "2026-04-30", postponedCount: 1 });
  });

  it("deletes a planting with its tasks and empty garden, keeping custom tasks", () => {
    const { snapshot, plantingId } = localCreatePlan(EMPTY_SNAPSHOT, req(), tomato);
    const withCustom = localAddTask(snapshot, { title: "شراء سماد", description: "", dueDate: "2026-04-10", type: "custom", plantingId: null }).snapshot;
    const after = localDeletePlanting(withCustom, plantingId);
    expect(after.plantings).toHaveLength(0);
    expect(after.gardens).toHaveLength(0);
    expect(after.tasks.map((t) => t.title)).toEqual(["شراء سماد"]);
  });

  it("builds an import payload grouping tasks under their plan", () => {
    const { snapshot } = localCreatePlan(EMPTY_SNAPSHOT, req(), tomato);
    const withCustom = localAddTask(snapshot, { title: "مهمة", description: "", dueDate: "2026-04-10", type: "custom", plantingId: null }).snapshot;
    const payload = toImportPayload(withCustom);
    expect(payload.plans).toHaveLength(1);
    expect(payload.plans[0].tasks).toHaveLength(snapshot.tasks.length);
    expect(payload.looseTasks).toHaveLength(1);
  });
});
