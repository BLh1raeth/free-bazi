import type { LocationOption } from "./types";

export const CITIES: LocationOption[] = [
  { id: "beijing", country: "中国", city: "北京", timezone: "Asia/Shanghai", longitude: 116.4074, latitude: 39.9042 },
  { id: "shanghai", country: "中国", city: "上海", timezone: "Asia/Shanghai", longitude: 121.4737, latitude: 31.2304 },
  { id: "chengdu", country: "中国", city: "成都", timezone: "Asia/Shanghai", longitude: 104.0665, latitude: 30.5723 },
  { id: "urumqi", country: "中国", city: "乌鲁木齐", timezone: "Asia/Shanghai", longitude: 87.6168, latitude: 43.8256 },
  { id: "hong-kong", country: "中国香港", city: "香港", timezone: "Asia/Hong_Kong", longitude: 114.1694, latitude: 22.3193 },
  { id: "tokyo", country: "日本", city: "东京", timezone: "Asia/Tokyo", longitude: 139.6917, latitude: 35.6895 },
  { id: "singapore", country: "新加坡", city: "新加坡", timezone: "Asia/Singapore", longitude: 103.8198, latitude: 1.3521 },
  { id: "london", country: "英国", city: "伦敦", timezone: "Europe/London", longitude: -0.1276, latitude: 51.5072 },
  { id: "new-york", country: "美国", city: "纽约", timezone: "America/New_York", longitude: -74.006, latitude: 40.7128 },
  { id: "sydney", country: "澳大利亚", city: "悉尼", timezone: "Australia/Sydney", longitude: 151.2093, latitude: -33.8688 },
];

export function getCity(id: string): LocationOption {
  const city = CITIES.find((item) => item.id === id);
  if (!city) throw new Error("请选择受支持的出生城市");
  return city;
}
