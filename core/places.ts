/**
 * 새가 출발하고 도착하는 곳(전국 지역)과 랜드마크.
 * - 지역(Place)마다 대표 랜드마크가 하나씩 있어서 "서울 · 남대문"처럼 보여요.
 * - 좌표는 지도에 점을 찍고 거리를 재기에 충분한 대략값(소수점 둘째 자리쯤)이에요. 정밀 좌표가 필요하면 여기만 고치면 돼요.
 * - id에는 "-"를 쓰지 마세요(노선 id가 "출발-도착"이에요).
 */
import { haversineKm } from "./geo";

export type LandmarkKind = "gate" | "tower" | "bridge" | "mountain" | "island" | "fortress" | "hanok" | "beach" | "lighthouse" | "park";
export type Landmark = { name: string; lat: number; lng: number; kind: LandmarkKind };
export type Place = { id: string; name: string; region: string; lat: number; lng: number; landmark: Landmark };

const L = (name: string, lat: number, lng: number, kind: LandmarkKind): Landmark => ({ name, lat, lng, kind });

export const PLACES: Place[] = [
  { id: "seoul", name: "서울", region: "수도권", lat: 37.5665, lng: 126.978, landmark: L("남대문", 37.5599, 126.9753, "gate") },
  { id: "incheon", name: "인천", region: "수도권", lat: 37.4563, lng: 126.7052, landmark: L("월미도", 37.4747, 126.5975, "island") },
  { id: "suwon", name: "수원", region: "수도권", lat: 37.2636, lng: 127.0286, landmark: L("수원화성", 37.287, 127.0117, "fortress") },
  { id: "paju", name: "파주", region: "수도권", lat: 37.7599, lng: 126.78, landmark: L("임진각", 37.889, 126.742, "tower") },
  { id: "chuncheon", name: "춘천", region: "강원", lat: 37.8813, lng: 127.7298, landmark: L("소양강", 37.9, 127.72, "park") },
  { id: "wonju", name: "원주", region: "강원", lat: 37.3422, lng: 127.9202, landmark: L("치악산", 37.3636, 128.0522, "mountain") },
  { id: "gangneung", name: "강릉", region: "강원", lat: 37.7519, lng: 128.8761, landmark: L("경포대", 37.7955, 128.9086, "hanok") },
  { id: "sokcho", name: "속초", region: "강원", lat: 38.207, lng: 128.5918, landmark: L("설악산", 38.1195, 128.4656, "mountain") },
  { id: "donghae", name: "동해", region: "강원", lat: 37.5247, lng: 129.1143, landmark: L("추암 촛대바위", 37.479, 129.162, "beach") },
  { id: "cheongju", name: "청주", region: "충청", lat: 36.6424, lng: 127.489, landmark: L("상당산성", 36.6728, 127.5361, "fortress") },
  { id: "daejeon", name: "대전", region: "충청", lat: 36.3504, lng: 127.3845, landmark: L("대전 엑스포", 36.3754, 127.388, "tower") },
  { id: "sejong", name: "세종", region: "충청", lat: 36.48, lng: 127.289, landmark: L("세종호수공원", 36.4985, 127.2686, "park") },
  { id: "cheonan", name: "천안", region: "충청", lat: 36.8151, lng: 127.1139, landmark: L("독립기념관", 36.7836, 127.2231, "hanok") },
  { id: "gongju", name: "공주", region: "충청", lat: 36.4465, lng: 127.119, landmark: L("공산성", 36.464, 127.125, "fortress") },
  { id: "buyeo", name: "부여", region: "충청", lat: 36.2756, lng: 126.9097, landmark: L("낙화암", 36.288, 126.91, "hanok") },
  { id: "jeonju", name: "전주", region: "전라", lat: 35.8242, lng: 127.148, landmark: L("전주 한옥마을", 35.8148, 127.153, "hanok") },
  { id: "gunsan", name: "군산", region: "전라", lat: 35.9676, lng: 126.7369, landmark: L("선유도", 35.819, 126.415, "island") },
  { id: "gwangju", name: "광주", region: "전라", lat: 35.1595, lng: 126.8526, landmark: L("무등산", 35.134, 126.988, "mountain") },
  { id: "mokpo", name: "목포", region: "전라", lat: 34.8118, lng: 126.3922, landmark: L("유달산", 34.797, 126.379, "mountain") },
  { id: "yeosu", name: "여수", region: "전라", lat: 34.7604, lng: 127.6622, landmark: L("오동도", 34.744, 127.765, "island") },
  { id: "daegu", name: "대구", region: "경상", lat: 35.8714, lng: 128.6014, landmark: L("83타워", 35.854, 128.566, "tower") },
  { id: "gyeongju", name: "경주", region: "경상", lat: 35.8562, lng: 129.2247, landmark: L("불국사", 35.7898, 129.332, "hanok") },
  { id: "pohang", name: "포항", region: "경상", lat: 36.019, lng: 129.3435, landmark: L("호미곶", 36.077, 129.569, "lighthouse") },
  { id: "andong", name: "안동", region: "경상", lat: 36.5684, lng: 128.7294, landmark: L("하회마을", 36.5393, 128.5186, "hanok") },
  { id: "ulsan", name: "울산", region: "경상", lat: 35.5384, lng: 129.3114, landmark: L("간절곶", 35.36, 129.36, "lighthouse") },
  { id: "busan", name: "부산", region: "경상", lat: 35.1796, lng: 129.0756, landmark: L("광안대교", 35.1476, 129.1304, "bridge") },
  { id: "changwon", name: "창원", region: "경상", lat: 35.228, lng: 128.6811, landmark: L("창원 중앙", 35.228, 128.6811, "park") },
  { id: "jinju", name: "진주", region: "경상", lat: 35.18, lng: 128.1076, landmark: L("진주성", 35.188, 128.084, "fortress") },
  { id: "tongyeong", name: "통영", region: "경상", lat: 34.8544, lng: 128.4331, landmark: L("미륵산", 34.824, 128.417, "mountain") },
  { id: "jeju", name: "제주", region: "제주", lat: 33.4996, lng: 126.5312, landmark: L("한라산", 33.3617, 126.5292, "mountain") },
  { id: "seogwipo", name: "서귀포", region: "제주", lat: 33.2541, lng: 126.56, landmark: L("성산일출봉", 33.458, 126.9425, "mountain") },
  { id: "ulleung", name: "울릉도", region: "경상", lat: 37.4844, lng: 130.9057, landmark: L("울릉도", 37.4844, 130.9057, "island") },
  { id: "dokdo", name: "독도", region: "경상", lat: 37.2414, lng: 131.8647, landmark: L("독도", 37.2414, 131.8647, "island") },
];

/** 도착지가 아니어도 길 위에서 보이는 랜드마크(경유지 후보) */
export const EXTRA_LANDMARKS: Landmark[] = [
  L("북한산", 37.659, 126.977, "mountain"),
  L("남한산성", 37.479, 127.184, "fortress"),
  L("오대산", 37.797, 128.543, "mountain"),
  L("월악산", 36.863, 128.072, "mountain"),
  L("속리산", 36.54, 127.868, "mountain"),
  L("소백산", 36.957, 128.483, "mountain"),
  L("태백산", 37.096, 128.914, "mountain"),
  L("계룡산", 36.341, 127.204, "mountain"),
  L("덕유산", 35.86, 127.745, "mountain"),
  L("지리산", 35.337, 127.73, "mountain"),
  L("가야산", 35.8, 128.117, "mountain"),
  L("팔공산", 35.999, 128.69, "mountain"),
  L("해운대", 35.1587, 129.1604, "beach"),
  L("거제도", 34.88, 128.62, "island"),
  L("백령도", 37.96, 124.68, "island"),
];

/** 지도에 흐리게 보여줄 도(道) 이름 */
export const REGION_LABELS: { name: string; lat: number; lng: number }[] = [
  { name: "경기", lat: 37.6, lng: 127.25 },
  { name: "강원", lat: 37.85, lng: 128.3 },
  { name: "충북", lat: 36.85, lng: 127.85 },
  { name: "충남", lat: 36.55, lng: 126.65 },
  { name: "전북", lat: 35.7, lng: 127.2 },
  { name: "전남", lat: 34.95, lng: 126.9 },
  { name: "경북", lat: 36.45, lng: 128.85 },
  { name: "경남", lat: 35.35, lng: 128.35 },
];

export const getPlace = (id: string) => PLACES.find((p) => p.id === id);

/** 좌표에서 가장 가까운 지역(내 위치로 고르기에 써요) */
export function nearestPlace(lat: number, lng: number): Place {
  let best = PLACES[0], bestKm = Infinity;
  for (const p of PLACES) {
    const km = haversineKm(lat, lng, p.lat, p.lng);
    if (km < bestKm) { best = p; bestKm = km; }
  }
  return best;
}

/** 도(道)별로 묶은 목록(선택 상자용) */
export function placesByRegion() {
  const order = ["수도권", "강원", "충청", "전라", "경상", "제주"];
  return order.map((region) => ({ region, places: PLACES.filter((p) => p.region === region) }));
}
