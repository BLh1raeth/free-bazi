import type { LocationOption } from "./types";

function chinaCity(
  id: string,
  province: string,
  city: string,
  longitude: number,
  latitude: number,
  timezone = "Asia/Shanghai",
): LocationOption {
  return { id, country: "中国", province, city, timezone, longitude, latitude };
}

export const CITIES: LocationOption[] = [
  chinaCity("beijing", "北京市", "北京", 116.4074, 39.9042),
  chinaCity("tianjin", "天津市", "天津", 117.2009, 39.0842),
  chinaCity("shijiazhuang", "河北省", "石家庄", 114.5149, 38.0428),
  chinaCity("tangshan", "河北省", "唐山", 118.1802, 39.6305),
  chinaCity("baoding", "河北省", "保定", 115.4646, 38.874),
  chinaCity("qinhuangdao", "河北省", "秦皇岛", 119.6005, 39.9354),
  chinaCity("handan", "河北省", "邯郸", 114.5391, 36.6256),
  chinaCity("taiyuan", "山西省", "太原", 112.5489, 37.8706),
  chinaCity("datong", "山西省", "大同", 113.3001, 40.0768),
  chinaCity("hohhot", "内蒙古自治区", "呼和浩特", 111.7492, 40.8426),
  chinaCity("baotou", "内蒙古自治区", "包头", 109.8403, 40.6574),
  chinaCity("ordos", "内蒙古自治区", "鄂尔多斯", 109.7813, 39.6083),
  chinaCity("shenyang", "辽宁省", "沈阳", 123.4315, 41.8057),
  chinaCity("dalian", "辽宁省", "大连", 121.6147, 38.914),
  chinaCity("changchun", "吉林省", "长春", 125.3235, 43.8171),
  chinaCity("jilin", "吉林省", "吉林", 126.5496, 43.8378),
  chinaCity("harbin", "黑龙江省", "哈尔滨", 126.5349, 45.8038),
  chinaCity("qiqihar", "黑龙江省", "齐齐哈尔", 123.9182, 47.3543),
  chinaCity("shanghai", "上海市", "上海", 121.4737, 31.2304),
  chinaCity("nanjing", "江苏省", "南京", 118.7969, 32.0603),
  chinaCity("suzhou", "江苏省", "苏州", 120.5853, 31.2989),
  chinaCity("wuxi", "江苏省", "无锡", 120.3119, 31.4912),
  chinaCity("changzhou", "江苏省", "常州", 119.9739, 31.8107),
  chinaCity("xuzhou", "江苏省", "徐州", 117.2841, 34.2058),
  chinaCity("nantong", "江苏省", "南通", 120.8943, 31.9802),
  chinaCity("hangzhou", "浙江省", "杭州", 120.1551, 30.2741),
  chinaCity("ningbo", "浙江省", "宁波", 121.5503, 29.8746),
  chinaCity("wenzhou", "浙江省", "温州", 120.6994, 27.9943),
  chinaCity("jiaxing", "浙江省", "嘉兴", 120.7555, 30.7461),
  chinaCity("shaoxing", "浙江省", "绍兴", 120.5802, 30.0303),
  chinaCity("jinhua", "浙江省", "金华", 119.6474, 29.0791),
  chinaCity("hefei", "安徽省", "合肥", 117.2272, 31.8206),
  chinaCity("wuhu", "安徽省", "芜湖", 118.4331, 31.3525),
  chinaCity("fuzhou", "福建省", "福州", 119.2965, 26.0745),
  chinaCity("xiamen", "福建省", "厦门", 118.0894, 24.4798),
  chinaCity("quanzhou", "福建省", "泉州", 118.6757, 24.8741),
  chinaCity("nanchang", "江西省", "南昌", 115.8582, 28.6829),
  chinaCity("ganzhou", "江西省", "赣州", 114.935, 25.8311),
  chinaCity("jinan", "山东省", "济南", 117.1201, 36.6512),
  chinaCity("qingdao", "山东省", "青岛", 120.3826, 36.0671),
  chinaCity("yantai", "山东省", "烟台", 121.4479, 37.4638),
  chinaCity("weifang", "山东省", "潍坊", 119.1618, 36.7069),
  chinaCity("linyi", "山东省", "临沂", 118.3565, 35.1047),
  chinaCity("zhengzhou", "河南省", "郑州", 113.6254, 34.7466),
  chinaCity("luoyang", "河南省", "洛阳", 112.454, 34.6197),
  chinaCity("nanyang", "河南省", "南阳", 112.5283, 32.9908),
  chinaCity("wuhan", "湖北省", "武汉", 114.3054, 30.5931),
  chinaCity("yichang", "湖北省", "宜昌", 111.2865, 30.6919),
  chinaCity("xiangyang", "湖北省", "襄阳", 112.1224, 32.0089),
  chinaCity("changsha", "湖南省", "长沙", 112.9388, 28.2282),
  chinaCity("zhuzhou", "湖南省", "株洲", 113.134, 27.8274),
  chinaCity("changde", "湖南省", "常德", 111.6985, 29.0316),
  chinaCity("guangzhou", "广东省", "广州", 113.2644, 23.1291),
  chinaCity("shenzhen", "广东省", "深圳", 114.0579, 22.5431),
  chinaCity("foshan", "广东省", "佛山", 113.1214, 23.0215),
  chinaCity("dongguan", "广东省", "东莞", 113.7518, 23.0207),
  chinaCity("zhuhai", "广东省", "珠海", 113.5767, 22.2707),
  chinaCity("shantou", "广东省", "汕头", 116.6819, 23.3541),
  chinaCity("nanning", "广西壮族自治区", "南宁", 108.3669, 22.817),
  chinaCity("guilin", "广西壮族自治区", "桂林", 110.2902, 25.2736),
  chinaCity("haikou", "海南省", "海口", 110.1983, 20.044),
  chinaCity("sanya", "海南省", "三亚", 109.5119, 18.2528),
  chinaCity("chongqing", "重庆市", "重庆", 106.5516, 29.563),
  chinaCity("chengdu", "四川省", "成都", 104.0665, 30.5723),
  chinaCity("mianyang", "四川省", "绵阳", 104.6796, 31.4675),
  chinaCity("leshan", "四川省", "乐山", 103.7656, 29.5521),
  chinaCity("guiyang", "贵州省", "贵阳", 106.6302, 26.647),
  chinaCity("zunyi", "贵州省", "遵义", 106.9272, 27.7257),
  chinaCity("kunming", "云南省", "昆明", 102.8329, 24.8801),
  chinaCity("dali", "云南省", "大理", 100.2676, 25.6065),
  chinaCity("lijiang", "云南省", "丽江", 100.233, 26.8721),
  chinaCity("lhasa", "西藏自治区", "拉萨", 91.1409, 29.6456),
  chinaCity("xian", "陕西省", "西安", 108.9398, 34.3416),
  chinaCity("baoji", "陕西省", "宝鸡", 107.2373, 34.3619),
  chinaCity("lanzhou", "甘肃省", "兰州", 103.8343, 36.0611),
  chinaCity("xining", "青海省", "西宁", 101.7782, 36.6171),
  chinaCity("yinchuan", "宁夏回族自治区", "银川", 106.2309, 38.4872),
  chinaCity("urumqi", "新疆维吾尔自治区", "乌鲁木齐", 87.6168, 43.8256),
  chinaCity("kashgar", "新疆维吾尔自治区", "喀什", 75.9898, 39.4704),
  chinaCity(
    "hong-kong",
    "香港特别行政区",
    "香港",
    114.1694,
    22.3193,
    "Asia/Hong_Kong",
  ),
  chinaCity("macau", "澳门特别行政区", "澳门", 113.5439, 22.1987, "Asia/Macau"),
  chinaCity("taipei", "台湾省", "台北", 121.5654, 25.033, "Asia/Taipei"),
  chinaCity("kaohsiung", "台湾省", "高雄", 120.3014, 22.6273, "Asia/Taipei"),
];

export const CITY_GROUPS = Array.from(
  new Set(CITIES.map((city) => city.province)),
).map((province) => ({
  province,
  cities: CITIES.filter((city) => city.province === province),
}));

// Only used by timezone boundary tests; these entries never appear in the China city selector.
const INTERNAL_TIMEZONE_FIXTURES: LocationOption[] = [
  {
    id: "tokyo",
    country: "日本",
    province: "东京都",
    city: "东京",
    timezone: "Asia/Tokyo",
    longitude: 139.6917,
    latitude: 35.6895,
  },
  {
    id: "new-york",
    country: "美国",
    province: "纽约州",
    city: "纽约",
    timezone: "America/New_York",
    longitude: -74.006,
    latitude: 40.7128,
  },
];

export const SUPPORTED_LOCATIONS = [...CITIES, ...INTERNAL_TIMEZONE_FIXTURES];

export function getCity(id: string): LocationOption {
  const city = SUPPORTED_LOCATIONS.find((item) => item.id === id);
  if (!city) throw new Error("请选择受支持的出生城市");
  return city;
}
