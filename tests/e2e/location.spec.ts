import { expect, test } from "@playwright/test";
import { failGeolocation, go, mockGeoServices, seedLocation } from "./helpers";

test.describe("precise location", () => {
  test("high-accuracy GPS with consent: name, elevation-based zone, saved and reused", async ({ page, context }) => {
    await context.grantPermissions(["geolocation"]);
    await context.setGeolocation({ latitude: 31.6103, longitude: 35.0711, accuracy: 12 });
    const calls = await mockGeoServices(page, { elevation: 905 });
    await go(page, "/location/");
    await page.getByRole("checkbox", { name: /أوافق على استخدام خدمات الخرائط والطقس/ }).check();
    await page.getByRole("button", { name: "حدّد موقعي بدقة" }).click();
    await expect(page.getByText("دقة عالية")).toBeVisible();
    await expect(page.getByText("± 12 م").first()).toBeVisible();
    await expect(page.getByTestId("location-coords")).toHaveText("31.61030, 35.07110");
    await expect(page.getByTestId("location-label")).toHaveText("بيت أمر، محافظة الخليل");
    await expect(page.getByText(/905 م فوق سطح البحر/).first()).toBeVisible();
    await expect(page.getByText(/المقترح: جبلي \/ مرتفعات/)).toBeVisible();
    // The nearest listed city is shown as a reference, not as the location.
    await expect(page.getByText(/أقرب مدينة في قائمتنا/)).toBeVisible();
    await page.getByRole("button", { name: "تأكيد الموقع وحفظه" }).click();
    await expect(page.getByTestId("saved-location-label")).toHaveText("بيت أمر، محافظة الخليل");

    // Elevation lookups are rounded to ~100 m before leaving the device.
    expect(calls.elevation[0]).toContain("latitude=31.610&longitude=35.071");

    // Weather uses the real (rounded) coordinates of the confirmed location.
    await go(page, "/weather/");
    await expect(page.getByRole("heading", { name: "الطقس في بيت أمر، محافظة الخليل" })).toBeVisible();
    await expect.poll(() => calls.forecast.length).toBeGreaterThan(0);
    expect(calls.forecast[0]).toContain("latitude=31.6100&longitude=35.0700");

    // Reused by the planner and the dashboard after a reload.
    await go(page, "/planner/");
    await expect(page.getByTestId("saved-location-label")).toHaveText("بيت أمر، محافظة الخليل");
    await go(page, "/dashboard/");
    await page.reload();
    await expect(page.getByText("ماذا أزرع الآن في منطقتي؟").first()).toBeVisible();
  });

  test("without consent nothing is sent to external services", async ({ page, context }) => {
    await context.grantPermissions(["geolocation"]);
    await context.setGeolocation({ latitude: 31.6103, longitude: 35.0711, accuracy: 20 });
    const calls = await mockGeoServices(page);
    await go(page, "/location/");
    await page.getByRole("button", { name: "حدّد موقعي بدقة" }).click();
    await expect(page.getByTestId("location-coords")).toHaveText("31.61030, 35.07110");
    await expect(page.getByText("وافق على الخدمات الخارجية لمعرفة اسم القرية أو الحي.")).toBeVisible();
    await expect(page.getByText(/لم يتوفر ارتفاع موثوق/)).toBeVisible();
    await page.getByRole("tab", { name: "الخريطة" }).click();
    await expect(page.getByText("الخريطة تحتاج موافقتك")).toBeVisible();
    await page.getByRole("tab", { name: /موقعي الحالي/ }).click();
    await page.getByRole("button", { name: "تأكيد الموقع وحفظه" }).click();
    await go(page, "/weather/");
    await expect(page.getByText("الطقس يحتاج موافقتك")).toBeVisible();
    await page.waitForTimeout(800);
    expect(calls).toEqual({ nominatim: [], elevation: [], forecast: [], tiles: 0 });
  });

  test("low accuracy is reported clearly", async ({ page, context }) => {
    await context.grantPermissions(["geolocation"]);
    await context.setGeolocation({ latitude: 31.9, longitude: 35.2, accuracy: 3500 });
    await mockGeoServices(page);
    await go(page, "/location/");
    await page.getByRole("button", { name: "حدّد موقعي بدقة" }).click();
    await expect(page.getByText("دقة ضعيفة جدًا")).toBeVisible({ timeout: 40_000 });
    await expect(page.getByText("± 3.5 كم").first()).toBeVisible();
    await expect(page.getByText("الدقة ضعيفة", { exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "صحّح الموقع على الخريطة" })).toBeVisible();
  });

  for (const [code, text] of [
    [1, "رُفض إذن الوصول إلى الموقع"],
    [2, "تعذّر تحديد موقعك الآن"],
    [3, "استغرق تحديد الموقع وقتًا أطول"],
  ] as const) {
    test(`geolocation error ${code} shows an Arabic message`, async ({ page }) => {
      await failGeolocation(page, code);
      await go(page, "/location/");
      await page.getByRole("button", { name: "حدّد موقعي بدقة" }).click();
      await expect(page.getByText("تعذّر تحديد الموقع")).toBeVisible();
      await expect(page.getByText(new RegExp(text))).toBeVisible();
    });
  }

  test("manual selection on the map and by search", async ({ page, isMobile }) => {
    const calls = await mockGeoServices(page, { elevation: 420 });
    await go(page, "/location/");
    await page.getByRole("checkbox", { name: /أوافق على استخدام خدمات الخرائط والطقس/ }).check();
    await page.getByRole("tab", { name: "الخريطة" }).click();
    const map = page.getByRole("application", { name: /خريطة تفاعلية/ });
    await expect(map).toBeVisible();
    const box = (await map.boundingBox())!;
    const position = { x: Math.round(box.width * 0.3), y: Math.round(box.height * 0.4) };
    // Phones tap, computers click: both must move the pin.
    if (isMobile) await map.tap({ position });
    else await map.click({ position });
    await expect(page.getByText("المصدر: اختيار يدوي على الخريطة")).toBeVisible();
    expect(calls.tiles).toBeGreaterThan(0);
    await expect(page.getByText(/© مساهمو OpenStreetMap/).first()).toBeVisible();

    await page.getByRole("tab", { name: /بحث عن قرية/ }).click();
    await page.getByRole("textbox", { name: "اسم القرية أو البلدة أو المكان" }).fill("سبسطية");
    // No request while typing (no autocomplete) — only on submit.
    expect(calls.nominatim.filter((u) => u.includes("/search"))).toHaveLength(0);
    await page.getByRole("button", { name: "بحث", exact: true }).click();
    await page.getByRole("button", { name: /سبسطية، محافظة نابلس/ }).click();
    await expect(page.getByTestId("location-label")).toHaveText("سبسطية، محافظة نابلس");
    await expect(page.getByTestId("location-coords")).toHaveText("32.27630, 35.19500");
    expect(calls.nominatim.filter((u) => u.includes("/search"))).toHaveLength(1);
  });

  test("manual climate-zone correction is kept", async ({ page }) => {
    await go(page, "/location/");
    await page.getByRole("tab", { name: "قائمة المدن" }).click();
    await page.getByLabel("المدينة").selectOption("ps-hebron");
    await page.getByRole("radio", { name: /سهلي داخلي/ }).check();
    await page.getByRole("button", { name: "تأكيد الموقع وحفظه" }).click();
    await expect(page.getByText("حددتها يدويًا")).toBeVisible();
  });
});

test.describe("what to plant now", () => {
  const hebron = { latitude: 31.5326, longitude: 35.0998, label: "الخليل", regionId: "ps-hebron", zone: "highland" as const };
  const jericho = { latitude: 31.8667, longitude: 35.45, label: "أريحا والأغوار", regionId: "ps-jericho", zone: "jordan_valley" as const };
  const gaza = { latitude: 31.5017, longitude: 34.4668, label: "غزة", regionId: "ps-gaza", zone: "coastal" as const };

  test("prompts for a location first", async ({ page }) => {
    await go(page, "/recommendations/");
    await expect(page.getByText("لم تحدد موقع أرضك بعد.")).toBeVisible();
  });

  test("highland vs Jordan Valley vs coast in October", async ({ page }) => {
    await page.clock.setFixedTime(new Date("2026-10-10T09:00:00+03:00"));
    await seedLocation(page, hebron);
    await go(page, "/recommendations/");
    await expect(page.getByTestId("rec-tomato")).toHaveAttribute("data-status", "later");
    await expect(page.getByTestId("rec-garlic")).toHaveAttribute("data-status", "now");

    const p2 = await page.context().newPage();
    await p2.clock.setFixedTime(new Date("2026-10-10T09:00:00+03:00"));
    await seedLocation(p2, jericho);
    await go(p2, "/recommendations/");
    await expect(p2.getByTestId("rec-tomato")).toHaveAttribute("data-status", "now");
    await expect(p2.getByTestId("rec-tomato")).toContainText("غور / منخفض حار");

    const p3 = await page.context().newPage();
    await p3.clock.setFixedTime(new Date("2026-10-10T09:00:00+03:00"));
    await seedLocation(p3, gaza);
    await go(p3, "/recommendations/");
    await expect(p3.getByTestId("rec-lettuce")).toHaveAttribute("data-status", "now");
  });

  test("updates with the month and the space type, and links to the planner", async ({ page }) => {
    await page.clock.setFixedTime(new Date("2026-04-20T09:00:00+03:00"));
    await seedLocation(page, hebron);
    await go(page, "/recommendations/");
    await expect(page.getByTestId("rec-tomato")).toHaveAttribute("data-status", "now");
    // Same location, another date → recomputed without reload.
    await page.getByLabel("التاريخ").fill("2026-07-01");
    await expect(page.getByTestId("rec-tomato")).toHaveAttribute("data-status", "later");
    await expect(page.getByText(/معاينة لتاريخ آخر/)).toBeVisible();
    await page.getByLabel("التاريخ").fill("2026-12-15");
    await expect(page.getByTestId("rec-olive")).toHaveAttribute("data-status", "now");
    // Space type: an olive tree on a balcony needs special care.
    await page.getByLabel("نوع المساحة").selectOption("balcony");
    await expect(page.getByTestId("rec-olive")).toHaveAttribute("data-status", "protect");
    await page.getByLabel("نوع المساحة").selectOption("greenhouse");
    await expect(page.getByText(/لا تتوفر في بيانات المنصة حاليًا مواعيد خاصة بالبيوت المحمية/)).toBeVisible();
    // Method filter.
    await page.getByLabel("نوع المساحة").selectOption("home_garden");
    await page.getByLabel("طريقة الزراعة").selectOption("tubers");
    await expect(page.getByTestId("rec-tomato")).toHaveAttribute("data-status", "no_data");
    await page.getByLabel("طريقة الزراعة").selectOption("all");
    // Add to plan → planner with crop and space preselected.
    await page.getByLabel("التاريخ").fill("2026-04-20");
    await page.getByTestId("rec-tomato").getByRole("link", { name: "أضف إلى خطتي الزراعية" }).click();
    await expect(page).toHaveURL(/\/planner\/?\?crop=tomato&space=home_garden/);
    await page.getByRole("button", { name: "التالي" }).click();
    await expect(page.getByRole("radio", { name: /حديقة منزلية/ })).toHaveAttribute("aria-checked", "true");
  });

  test("frost in the forecast moves frost-sensitive crops to 'needs protection'", async ({ page }) => {
    await page.clock.setFixedTime(new Date("2026-11-01T09:00:00+02:00"));
    await mockGeoServices(page);
    await seedLocation(page, { ...jericho, externalConsent: true });
    await go(page, "/recommendations/");
    await expect(page.getByTestId("rec-tomato")).toHaveAttribute("data-status", "protect");
    await expect(page.getByTestId("rec-tomato")).toContainText("حساس للصقيع");
    await expect(page.getByTestId("rec-garlic")).toHaveAttribute("data-status", "now");
  });

  test("home page shows the section with the saved location", async ({ page }) => {
    await page.clock.setFixedTime(new Date("2026-10-10T09:00:00+03:00"));
    await seedLocation(page, jericho);
    await go(page, "/");
    await expect(page.getByRole("heading", { name: "ماذا أزرع الآن في منطقتي؟" })).toBeVisible();
    await expect(page.getByText(/لـأريحا والأغوار/)).toBeVisible();
  });
});
