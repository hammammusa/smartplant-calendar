import { describe, expect, it } from "vitest";
import { buildForecastUrl, mapForecast } from "@/domain/open-meteo";

describe("Open-Meteo client mapping", () => {
  it("builds a keyless 7-day forecast URL in the user's time zone", () => {
    const url = new URL(buildForecastUrl(31.5326, 35.0998, "Asia/Hebron"));
    expect(url.origin).toBe("https://api.open-meteo.com");
    expect(url.searchParams.get("timezone")).toBe("Asia/Hebron");
    expect(url.searchParams.get("forecast_days")).toBe("7");
    expect(url.searchParams.has("apikey")).toBe(false);
  });

  it("maps the response and tolerates missing fields", () => {
    const f = mapForecast(
      {
        latitude: 31.5,
        longitude: 35.1,
        timezone: "Asia/Hebron",
        current: { time: "2026-11-01T10:00", temperature_2m: 19.4, weather_code: 2, is_day: 0 },
        daily: { time: ["2026-11-01", "2026-11-02"], temperature_2m_max: [21, null], temperature_2m_min: [10] },
      },
      "2026-11-01T08:00:00.000Z",
    );
    expect(f.current.temperature).toBe(19.4);
    expect(f.current.humidity).toBeNull();
    expect(f.current.isDay).toBe(false);
    expect(f.daily).toHaveLength(2);
    expect(f.daily[1]).toMatchObject({ tempMax: null, tempMin: null, weatherCode: -1, precipitationProbability: null });
    expect(f.source).toBe("Open-Meteo");
  });
});
