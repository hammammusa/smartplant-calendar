import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { deriveAlerts } from "@/domain/weather";
import { DEFAULT_TIMEZONE, isValidTimeZone } from "@/lib/dates";
import { getWeatherThresholds } from "@/services/content";
import { fetchForecast, WeatherUnavailableError } from "@/services/weather";

const querySchema = z.object({
  lat: z.coerce.number().min(-90).max(90),
  lon: z.coerce.number().min(-180).max(180),
  tz: z
    .string()
    .max(64)
    .optional()
    .transform((v) => (v && isValidTimeZone(v) ? v : DEFAULT_TIMEZONE)),
});

export async function GET(request: NextRequest) {
  const parsed = querySchema.safeParse(Object.fromEntries(request.nextUrl.searchParams));
  if (!parsed.success) {
    return NextResponse.json({ error: "إحداثيات الموقع غير صالحة." }, { status: 400 });
  }
  const { lat, lon, tz } = parsed.data;
  try {
    const [forecast, thresholds] = await Promise.all([fetchForecast(lat, lon, tz), getWeatherThresholds()]);
    return NextResponse.json(
      { forecast, alerts: deriveAlerts(forecast.daily, thresholds), thresholds },
      { headers: { "Cache-Control": "public, max-age=600, s-maxage=1800" } },
    );
  } catch (err) {
    if (!(err instanceof WeatherUnavailableError)) console.error("[weather]", err);
    return NextResponse.json(
      { error: "تعذّر الحصول على بيانات الطقس حاليًا. سنحاول مرة أخرى لاحقًا، وبقية المنصة تعمل بشكل طبيعي." },
      { status: 503 },
    );
  }
}
