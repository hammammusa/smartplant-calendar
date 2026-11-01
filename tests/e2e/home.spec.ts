import { expect, test, type Page } from "@playwright/test";
import { go, seedLocation } from "./helpers";

const HEBRON = { latitude: 31.5326, longitude: 35.0998, label: "الخليل", regionId: "ps-hebron", zone: "highland" as const };

const search = (page: Page) => page.getByRole("combobox", { name: "ابحث عن محصول" });

test.describe("home page", () => {
  test("first screen: question, search and the three main actions", async ({ page }) => {
    await go(page, "/");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("شو بدك تزرع اليوم؟");
    await expect(search(page)).toBeInViewport();
    const actions = page.getByRole("navigation", { name: "الإجراءات الرئيسية" });
    await expect(actions.getByRole("link", { name: /ماذا أزرع الآن؟/ })).toHaveAttribute("href", /\/recommendations\/$/);
    await expect(actions.getByRole("button", { name: /ابحث عن موعد زراعة محصول/ })).toBeVisible();
    await expect(actions.getByRole("link", { name: /رزنامتي الزراعية/ })).toHaveAttribute("href", /\/calendar\/$/);
    // Quick picks are real crops linked to their guide pages.
    await expect(page.getByRole("link", { name: "بندورة", exact: true })).toHaveAttribute("href", /\/crops\/tomato\/$/);
  });

  test("without a saved location it offers to set one and shows real examples", async ({ page }) => {
    await go(page, "/");
    await expect(page.getByRole("link", { name: /حدّد قريتك لنعرض مواعيد منطقتك/ })).toHaveAttribute("href", /\/location\/$/);
    await expect(page.getByRole("link", { name: "حدّد قريتك", exact: true })).toBeVisible();
    await expect(page.getByRole("link", { name: /الزعتر.*في المرتفعات/ })).toHaveAttribute("href", /\/crops\/zaatar\/$/);
  });

  test("search shows planting months for the saved area and opens the crop", async ({ page }) => {
    await page.clock.setFixedTime(new Date("2026-10-10T09:00:00+03:00"));
    await seedLocation(page, HEBRON);
    await go(page, "/");
    await expect(page.getByTestId("home-location-label")).toHaveText("الخليل");
    await expect(page.getByRole("link", { name: /تغيير المنطقة/ })).toHaveAttribute("href", /\/location\/$/);

    await search(page).fill("بندوره");
    const option = page.getByRole("option", { name: /البندورة/ });
    await expect(option).toBeVisible();
    await expect(option).toContainText("يُزرع:");
    await expect(search(page)).toHaveAttribute("aria-expanded", "true");
    await search(page).press("ArrowDown");
    await expect(option).toHaveAttribute("aria-selected", "true");
    await search(page).press("Enter");
    await expect(page).toHaveURL(/\/crops\/tomato\/$/);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("البندورة");
  });

  test("other names, no results and the full results page", async ({ page }) => {
    await go(page, "/");
    await search(page).fill("فريز");
    await expect(page.getByRole("option", { name: /الفراولة/ })).toBeVisible();

    await search(page).fill("كيوي");
    await expect(page.getByText("لا يوجد محصول بهذا الاسم في الدليل بعد")).toBeVisible();
    await expect(page.getByRole("option")).toHaveCount(0);

    await search(page).press("Escape");
    await expect(search(page)).toHaveAttribute("aria-expanded", "false");

    // Several matches + Enter → the crop guide filtered by the same text.
    await search(page).fill("خ");
    await expect(page.getByRole("option").first()).toBeVisible();
    await search(page).press("Enter");
    await expect(page).toHaveURL(/\/crops\/\?q=/);
    await expect(page.getByRole("searchbox", { name: "ابحث عن محصول" })).toHaveValue("خ");
    await expect(page.getByRole("link", { name: /الخيار/ }).first()).toBeVisible();
    await expect(page.getByRole("link", { name: /الزيتون/ })).toHaveCount(0);
  });

  test("the search action focuses the search box", async ({ page }) => {
    await go(page, "/");
    await page.getByRole("button", { name: /ابحث عن موعد زراعة محصول/ }).click();
    await expect(search(page)).toBeFocused();
  });

  test("reduced motion turns the entrance animations off", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await go(page, "/");
    const name = await page.locator(".home-enter").first().evaluate((el) => getComputedStyle(el).animationName);
    expect(name).toBe("none");
  });

  for (const [label, width, height] of [
    ["360px", 360, 740],
    ["390px", 390, 844],
    ["tablet", 820, 1180],
    ["desktop", 1440, 900],
  ] as const) {
    test(`no horizontal overflow and actions reachable at ${label}`, async ({ page }) => {
      await page.setViewportSize({ width, height });
      await seedLocation(page, HEBRON);
      await go(page, "/");
      await expect(page.getByTestId("home-location-label")).toBeVisible();
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      expect(overflow).toBeLessThanOrEqual(0);
      await expect(search(page)).toBeInViewport();
      await expect(page.getByRole("link", { name: /ماذا أزرع الآن؟/ }).first()).toBeInViewport();
      // Touch targets: every main action is at least 48px tall.
      const heights = await page
        .getByRole("navigation", { name: "الإجراءات الرئيسية" })
        .locator("a, button")
        .evaluateAll((els) => els.map((e) => e.getBoundingClientRect().height));
      for (const h of heights) expect(h).toBeGreaterThanOrEqual(48);
    });
  }
});

test.describe("expanded crop catalogue", () => {
  test("dialect names find the crop and the status is honest", async ({ page }) => {
    await page.clock.setFixedTime(new Date("2026-10-10T09:00:00+03:00"));
    await seedLocation(page, HEBRON);
    await go(page, "/");
    await search(page).fill("جبس");
    const option = page.getByRole("option", { name: /البطيخ/ });
    await expect(option).toContainText("(الجبس)");
    await expect(option).toContainText("لا توجد معلومات موثوقة كافية");
    await expect(option).toHaveAttribute("data-status", "no_data");

    await search(page).fill("بندوره");
    await expect(page.getByRole("option", { name: /البندورة/ })).toHaveAttribute("data-status", "later");
    await expect(page.getByRole("option", { name: /البندورة/ })).toContainText("ليس وقته حاليًا");

    // A typo still finds the crop.
    await search(page).fill("ملوخيا");
    await expect(page.getByRole("option", { name: /الملوخية/ })).toBeVisible();
  });

  test("an incomplete crop page says so and cannot be planned", async ({ page }) => {
    await seedLocation(page, HEBRON);
    await go(page, "/crops/okra/");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("البامية");
    await expect(page.getByText("معلومات غير مكتملة").first()).toBeVisible();
    await expect(page.getByTestId("planting-status")).toHaveAttribute("data-status", "no_data");
    await expect(page.getByRole("link", { name: /أنشئ خطة زراعة/ })).toHaveCount(0);
    await expect(page.getByText("لا يمكن إنشاء خطة لهذا المحصول بعد")).toBeVisible();
  });

  test("the crop guide pages results and keeps the shared search", async ({ page }) => {
    await go(page, "/crops/");
    await expect(page.getByText(/^\d{3} محصولًا في الدليل$/)).toBeVisible();
    await page.getByRole("button", { name: /عرض المزيد/ }).click();
    await page.getByRole("searchbox", { name: "ابحث عن محصول" }).fill("فصة");
    await expect(page.getByRole("link", { name: /البرسيم الحجازي/ })).toBeVisible();
  });

  test("Gaza and Jericho get their own status for the same crop", async ({ page }) => {
    await page.clock.setFixedTime(new Date("2026-10-10T09:00:00+03:00"));
    await seedLocation(page, { latitude: 31.8667, longitude: 35.45, label: "أريحا والأغوار", regionId: "ps-jericho", zone: "jordan_valley" });
    await go(page, "/crops/tomato/");
    await expect(page.getByTestId("planting-status")).toHaveAttribute("data-status", "now");
    const gaza = await page.context().newPage();
    await gaza.clock.setFixedTime(new Date("2026-10-10T09:00:00+03:00"));
    await seedLocation(gaza, { latitude: 31.5017, longitude: 34.4668, label: "غزة", regionId: "ps-gaza", zone: "coastal" });
    await go(gaza, "/crops/tomato/");
    await expect(gaza.getByTestId("planting-status")).not.toHaveAttribute("data-status", "now");
  });
});
