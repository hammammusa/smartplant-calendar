import { expect, test, type Page } from "@playwright/test";

/**
 * Acceptance journey in preview/guest mode (no Supabase):
 * home → crop search → planner (city, space, crop, date) → plan → calendar →
 * edit a task → mark it complete. Also asserts there is no stray English UI.
 */

const ENGLISH_ALLOWED = /Open-Meteo|Solanum|Cucumis|Allium|Lactuca|Capsicum|Mentha|Origanum|Fragaria|Olea|Vitis|spp\.|ananassa|lycopersicum|sativus|tuberosum|cepa|sativum|annuum|syriacum|europaea|vinifera|×/g;

async function expectNoStrayEnglish(page: Page) {
  const text = await page.locator("body").innerText();
  const cleaned = text.replace(ENGLISH_ALLOWED, "");
  const words = cleaned.match(/[A-Za-z]{3,}/g) ?? [];
  expect(words, `English words found: ${words.join(", ")}`).toEqual([]);
}

test("guest can plan a crop and manage tasks in the calendar", async ({ page, isMobile }) => {
  await page.goto("/");
  await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
  await expect(page.locator("html")).toHaveAttribute("lang", "ar");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("ازرع في الوقت المناسب");
  await expectNoStrayEnglish(page);

  // Browse and search crops.
  await page.goto("/crops");
  await page.getByRole("searchbox", { name: "ابحث عن محصول" }).fill("بندوره");
  await expect(page.getByText("1 من 12 محصولًا")).toBeVisible();
  await page.getByRole("link", { name: /البندورة/ }).first().click();
  await expect(page).toHaveURL(/\/crops\/tomato/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("البندورة");
  await expectNoStrayEnglish(page);

  // Planner wizard.
  await page.getByRole("link", { name: /أنشئ خطة زراعة البندورة/ }).click();
  await expect(page).toHaveURL(/\/planner\?crop=tomato/);
  await page.getByLabel("المحافظة أو المدينة").selectOption("ps-jericho");
  await expect(page.getByRole("radio", { name: /غور/ })).toBeChecked();
  await page.getByRole("button", { name: "التالي" }).click();
  await page.getByRole("radio", { name: /سطح منزل/ }).click();
  await page.getByRole("button", { name: "التالي" }).click();
  await expect(page.getByRole("button", { name: /البندورة/, pressed: true })).toBeVisible();
  await page.getByRole("button", { name: "التالي" }).click();
  await page.getByLabel("تاريخ الزراعة أو الشتل").fill("2026-10-05");
  await page.getByLabel("اسم المساحة").fill("سطح البيت");
  await expect(page.getByText(/ضمن المواعيد المقترحة لمنطقتك/)).toBeVisible();
  await page.getByRole("button", { name: "التالي" }).click();
  await expect(page.getByRole("heading", { name: "راجع خطتك" })).toBeVisible();
  await expectNoStrayEnglish(page);
  await page.getByRole("button", { name: "أنشئ الخطة" }).click();
  await expect(page.getByRole("heading", { name: "خطتك جاهزة" })).toBeVisible();

  // Calendar shows the planting day.
  await page.getByRole("button", { name: "عرض المهام في الرزنامة" }).click();
  await expect(page).toHaveURL(/\/calendar\?date=2026-10-05/);
  await expect(page.getByRole("heading", { name: /تشرين الأول 2026/ })).toBeVisible();
  const dayPanel = page.locator("section[aria-labelledby='day-title']");
  await expect(dayPanel.getByText("شتل أشتال البندورة")).toBeVisible();
  await expectNoStrayEnglish(page);

  // Open the task, edit its title and date, then complete it.
  await dayPanel.getByRole("button", { name: /^شتل أشتال البندورة/ }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByRole("button", { name: "تعديل" }).click();
  await dialog.getByLabel("عنوان المهمة").fill("شتل البندورة على السطح");
  await dialog.getByLabel("التاريخ").fill("2026-10-06");
  await dialog.getByRole("button", { name: "حفظ التعديلات" }).click();
  await expect(dialog.getByRole("heading", { name: "شتل البندورة على السطح" })).toBeVisible();
  await dialog.getByRole("button", { name: "وضع كمكتملة" }).click();
  await expect(dialog.getByRole("button", { name: "إلغاء الإكمال" })).toBeVisible();
  await page.keyboard.press("Escape");

  // Data survives a reload (stored in this browser) and appears in task list.
  await page.goto("/tasks");
  await page.getByRole("tab", { name: /المكتملة/ }).click();
  await expect(page.getByText("شتل البندورة على السطح")).toBeVisible();

  await page.goto("/dashboard");
  await expect(page.getByRole("heading", { name: "محاصيلي" })).toBeVisible();
  await expect(page.getByText("سطح البيت · سطح منزل")).toBeVisible();
  await expectNoStrayEnglish(page);

  if (isMobile) {
    await expect(page.getByRole("navigation", { name: "التنقل السريع" })).toBeVisible();
    for (const path of ["/", "/crops", "/crops/tomato", "/planner", "/calendar", "/tasks", "/dashboard", "/weather"]) {
      await page.goto(path);
      // In mobile emulation the layout viewport grows when content overflows, so compare with the device width.
      const overflow = await page.evaluate(() => Math.max(window.innerWidth, document.documentElement.scrollWidth) - screen.width);
      expect(overflow, `horizontal overflow on ${path}`).toBeLessThanOrEqual(0);
    }
  }
});

test("weather failure shows an Arabic message and the page keeps working", async ({ page }) => {
  await page.route("**/api/weather**", (route) =>
    route.fulfill({ status: 503, contentType: "application/json", body: JSON.stringify({ error: "تعذّر الحصول على بيانات الطقس حاليًا." }) }),
  );
  await page.goto("/weather");
  await page.getByLabel("المدينة").selectOption("ps-hebron");
  await expect(page.getByText("الطقس غير متاح الآن")).toBeVisible();
  await expect(page.getByRole("button", { name: "إعادة المحاولة" })).toBeVisible();
  await expectNoStrayEnglish(page);
});

test("weather renders forecast and agricultural alerts from the API", async ({ page }) => {
  const days = Array.from({ length: 7 }, (_, i) => `2026-11-0${i + 1}`);
  await page.route("**/api/weather**", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        forecast: {
          latitude: 31.53, longitude: 35.1, timezone: "Asia/Hebron", source: "Open-Meteo", fetchedAt: "2026-11-01T08:00:00Z",
          current: { time: "2026-11-01T10:00", temperature: 19.4, apparentTemperature: 18, humidity: 55, windSpeed: 12, weatherCode: 2, isDay: true },
          daily: days.map((date, i) => ({ date, weatherCode: i === 2 ? 63 : 1, tempMax: 21, tempMin: i === 4 ? 1 : 10, precipitationProbability: i === 2 ? 85 : 5, precipitationSum: i === 2 ? 6 : 0, windSpeedMax: 15 })),
        },
        alerts: [
          { kind: "rain", severity: "info", date: days[2], title: "احتمال أمطار", message: "قد تستطيع تأجيل الري." },
          { kind: "frost", severity: "warning", date: days[4], title: "احتمال صقيع", message: "غطِّ الأشتال الحساسة." },
        ],
      }),
    }),
  );
  await page.goto("/weather");
  await page.getByLabel("المدينة").selectOption("ps-hebron");
  await expect(page.getByText("19°")).toBeVisible();
  await expect(page.getByText(/احتمال صقيع —/)).toBeVisible();
  await expect(page.getByText(/المصدر: Open-Meteo/)).toBeVisible();
  await expectNoStrayEnglish(page);
});
