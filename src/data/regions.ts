import type { Country, Region } from "@/domain/types";

/**
 * Seed list of countries and cities. Coordinates are approximate city centres
 * used only for weather lookups. The climate-zone assignment is a preliminary
 * simplification: users can override it in the planner, and admins can edit it.
 */
export const COUNTRIES: Country[] = [
  { code: "PS", name: "فلسطين" },
  { code: "JO", name: "الأردن" },
  { code: "LB", name: "لبنان" },
  { code: "SY", name: "سوريا" },
];

const ps = (id: string, name: string, zone: Region["zone"], lat: number, lon: number): Region => ({
  id: `ps-${id}`,
  countryCode: "PS",
  name,
  zone,
  latitude: lat,
  longitude: lon,
  timezone: "Asia/Hebron",
});

export const REGIONS: Region[] = [
  ps("jerusalem", "القدس", "highland", 31.7683, 35.2137),
  ps("hebron", "الخليل", "highland", 31.5326, 35.0998),
  ps("bethlehem", "بيت لحم", "highland", 31.7054, 35.2024),
  ps("ramallah", "رام الله والبيرة", "highland", 31.9038, 35.2034),
  ps("nablus", "نابلس", "highland", 32.2211, 35.2544),
  ps("salfit", "سلفيت", "highland", 32.0833, 35.1806),
  ps("tubas", "طوباس", "highland", 32.3209, 35.3699),
  ps("jenin", "جنين", "inland_plain", 32.4594, 35.3009),
  ps("tulkarm", "طولكرم", "inland_plain", 32.3104, 35.0286),
  ps("qalqilya", "قلقيلية", "inland_plain", 32.1896, 34.9706),
  ps("jericho", "أريحا والأغوار", "jordan_valley", 31.8667, 35.45),
  ps("gaza", "غزة", "coastal", 31.5017, 34.4668),
  ps("north-gaza", "شمال غزة", "coastal", 31.5469, 34.5),
  ps("deir-al-balah", "دير البلح", "coastal", 31.4181, 34.3517),
  ps("khan-yunis", "خان يونس", "coastal", 31.3402, 34.3063),
  ps("rafah", "رفح", "coastal", 31.2969, 34.2455),
  ps("jaffa", "يافا", "coastal", 32.0504, 34.7522),
  ps("haifa", "حيفا", "coastal", 32.794, 34.9896),
  ps("acre", "عكا", "coastal", 32.9281, 35.0818),
  ps("nazareth", "الناصرة", "highland", 32.6996, 35.3035),
  ps("beersheba", "بئر السبع", "arid", 31.252, 34.7915),
  {
    id: "jo-amman",
    countryCode: "JO",
    name: "عمّان",
    zone: "highland",
    latitude: 31.9539,
    longitude: 35.9106,
    timezone: "Asia/Amman",
  },
  {
    id: "jo-irbid",
    countryCode: "JO",
    name: "إربد",
    zone: "highland",
    latitude: 32.5568,
    longitude: 35.8469,
    timezone: "Asia/Amman",
  },
  {
    id: "jo-salt",
    countryCode: "JO",
    name: "السلط",
    zone: "highland",
    latitude: 32.0392,
    longitude: 35.7272,
    timezone: "Asia/Amman",
  },
  {
    id: "jo-karak",
    countryCode: "JO",
    name: "الكرك",
    zone: "highland",
    latitude: 31.1853,
    longitude: 35.7048,
    timezone: "Asia/Amman",
  },
  {
    id: "jo-zarqa",
    countryCode: "JO",
    name: "الزرقاء",
    zone: "arid",
    latitude: 32.0728,
    longitude: 36.088,
    timezone: "Asia/Amman",
  },
  {
    id: "jo-deir-alla",
    countryCode: "JO",
    name: "دير علا (الأغوار الوسطى)",
    zone: "jordan_valley",
    latitude: 32.1966,
    longitude: 35.6136,
    timezone: "Asia/Amman",
  },
  {
    id: "jo-aqaba",
    countryCode: "JO",
    name: "العقبة",
    zone: "arid",
    latitude: 29.532,
    longitude: 35.0063,
    timezone: "Asia/Amman",
  },
  {
    id: "lb-beirut",
    countryCode: "LB",
    name: "بيروت",
    zone: "coastal",
    latitude: 33.8938,
    longitude: 35.5018,
    timezone: "Asia/Beirut",
  },
  {
    id: "lb-saida",
    countryCode: "LB",
    name: "صيدا",
    zone: "coastal",
    latitude: 33.5571,
    longitude: 35.3729,
    timezone: "Asia/Beirut",
  },
  {
    id: "lb-tripoli",
    countryCode: "LB",
    name: "طرابلس",
    zone: "coastal",
    latitude: 34.4367,
    longitude: 35.8497,
    timezone: "Asia/Beirut",
  },
  {
    id: "lb-zahle",
    countryCode: "LB",
    name: "زحلة (البقاع)",
    zone: "highland",
    latitude: 33.8463,
    longitude: 35.902,
    timezone: "Asia/Beirut",
  },
  {
    id: "sy-damascus",
    countryCode: "SY",
    name: "دمشق",
    zone: "inland_plain",
    latitude: 33.5138,
    longitude: 36.2765,
    timezone: "Asia/Damascus",
  },
  {
    id: "sy-aleppo",
    countryCode: "SY",
    name: "حلب",
    zone: "inland_plain",
    latitude: 36.2021,
    longitude: 37.1343,
    timezone: "Asia/Damascus",
  },
  {
    id: "sy-homs",
    countryCode: "SY",
    name: "حمص",
    zone: "inland_plain",
    latitude: 34.7324,
    longitude: 36.7137,
    timezone: "Asia/Damascus",
  },
  {
    id: "sy-latakia",
    countryCode: "SY",
    name: "اللاذقية",
    zone: "coastal",
    latitude: 35.5317,
    longitude: 35.7901,
    timezone: "Asia/Damascus",
  },
];

export function findRegion(id: string | null | undefined): Region | undefined {
  if (!id) return undefined;
  return REGIONS.find((r) => r.id === id);
}

export function regionsForCountry(code: string): Region[] {
  return REGIONS.filter((r) => r.countryCode === code);
}

/** Nearest seeded city to a coordinate (used after browser geolocation). */
export function nearestRegion(lat: number, lon: number): Region {
  let best = REGIONS[0];
  let bestD = Infinity;
  for (const r of REGIONS) {
    const d = (r.latitude - lat) ** 2 + ((r.longitude - lon) * Math.cos((lat * Math.PI) / 180)) ** 2;
    if (d < bestD) {
      bestD = d;
      best = r;
    }
  }
  return best;
}
