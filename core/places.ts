/**
 * 새가 출발하고 도착하는 곳(전국 지역)과 랜드마크.
 * - 지역(Place)마다 대표 랜드마크가 하나씩 있어서 "서울 · 남대문"처럼 보여요.
 * - 좌표는 지도에 점을 찍고 거리를 재기에 충분한 대략값(소수점 둘째 자리쯤)이에요. 정밀 좌표가 필요하면 여기만 고치면 돼요.
 * - id에는 "-"를 쓰지 마세요(노선 id가 "출발-도착"이에요).
 */
import { haversineKm } from "./geo";

export type LandmarkKind = "gate" | "tower" | "bridge" | "mountain" | "island" | "fortress" | "hanok" | "beach" | "lighthouse" | "park";
export type Landmark = { name: string; lat: number; lng: number; kind: LandmarkKind };
/** minor: 서울 25개 구·작은 도시. 가까운 거리 노선의 경유지와 확대한 지도에서만 보여요 */
export type Place = { id: string; name: string; region: string; lat: number; lng: number; landmark: Landmark; minor?: boolean };

const L = (name: string, lat: number, lng: number, kind: LandmarkKind): Landmark => ({ name, lat, lng, kind });

export const PLACES: Place[] = [
  { id: "seoul", name: "서울 중구", region: "서울", lat: 37.5665, lng: 126.978, landmark: L("남대문", 37.5599, 126.9753, "gate") },
  { id: "jongno", name: "서울 종로구", region: "서울", lat: 37.5735, lng: 126.979, minor: true, landmark: L("경복궁", 37.5796, 126.977, "hanok") },
  { id: "yongsan", name: "서울 용산구", region: "서울", lat: 37.5324, lng: 126.9906, minor: true, landmark: L("N서울타워", 37.5512, 126.9882, "tower") },
  { id: "seongdong", name: "서울 성동구", region: "서울", lat: 37.5634, lng: 127.0369, minor: true, landmark: L("서울숲", 37.5444, 127.0374, "park") },
  { id: "gwangjin", name: "서울 광진구", region: "서울", lat: 37.5385, lng: 127.0824, minor: true, landmark: L("어린이대공원", 37.5483, 127.0817, "park") },
  { id: "dongdaemun", name: "서울 동대문구", region: "서울", lat: 37.5744, lng: 127.0396, minor: true, landmark: L("동대문디자인플라자", 37.5665, 127.0092, "tower") },
  { id: "jungnang", name: "서울 중랑구", region: "서울", lat: 37.6063, lng: 127.0926, minor: true, landmark: L("용마산", 37.5736, 127.1008, "mountain") },
  { id: "seongbuk", name: "서울 성북구", region: "서울", lat: 37.5894, lng: 127.0167, minor: true, landmark: L("북악산", 37.5947, 126.9822, "mountain") },
  { id: "gangbuk", name: "서울 강북구", region: "서울", lat: 37.6397, lng: 127.0257, minor: true, landmark: L("4·19 민주묘지", 37.6498, 127.01, "park") },
  { id: "dobong", name: "서울 도봉구", region: "서울", lat: 37.6688, lng: 127.0471, minor: true, landmark: L("도봉산", 37.6896, 127.0157, "mountain") },
  { id: "nowon", name: "서울 노원구", region: "서울", lat: 37.6542, lng: 127.0568, minor: true, landmark: L("불암산", 37.6417, 127.0997, "mountain") },
  { id: "eunpyeong", name: "서울 은평구", region: "서울", lat: 37.6027, lng: 126.9291, minor: true, landmark: L("은평한옥마을", 37.637, 126.919, "hanok") },
  { id: "seodaemun", name: "서울 서대문구", region: "서울", lat: 37.5791, lng: 126.9368, minor: true, landmark: L("서대문형무소", 37.5744, 126.9577, "fortress") },
  { id: "mapo", name: "서울 마포구", region: "서울", lat: 37.5663, lng: 126.9019, minor: true, landmark: L("월드컵경기장", 37.5683, 126.8972, "park") },
  { id: "yangcheon", name: "서울 양천구", region: "서울", lat: 37.5169, lng: 126.8664, minor: true, landmark: L("안양천", 37.523, 126.864, "park") },
  { id: "gangseo", name: "서울 강서구", region: "서울", lat: 37.5509, lng: 126.8495, minor: true, landmark: L("서울식물원", 37.569, 126.8348, "park") },
  { id: "guro", name: "서울 구로구", region: "서울", lat: 37.4954, lng: 126.8874, minor: true, landmark: L("고척스카이돔", 37.4982, 126.8671, "tower") },
  { id: "geumcheon", name: "서울 금천구", region: "서울", lat: 37.4519, lng: 126.902, minor: true, landmark: L("호암산", 37.444, 126.914, "mountain") },
  { id: "yeongdeungpo", name: "서울 영등포구", region: "서울", lat: 37.5264, lng: 126.8963, minor: true, landmark: L("63빌딩", 37.5198, 126.9402, "tower") },
  { id: "dongjak", name: "서울 동작구", region: "서울", lat: 37.5124, lng: 126.9393, minor: true, landmark: L("국립서울현충원", 37.5016, 126.9747, "park") },
  { id: "gwanak", name: "서울 관악구", region: "서울", lat: 37.4784, lng: 126.9516, minor: true, landmark: L("관악산", 37.4437, 126.9636, "mountain") },
  { id: "seocho", name: "서울 서초구", region: "서울", lat: 37.4837, lng: 127.0324, minor: true, landmark: L("예술의전당", 37.479, 127.0116, "hanok") },
  { id: "gangnam", name: "서울 강남구", region: "서울", lat: 37.5172, lng: 127.0473, minor: true, landmark: L("코엑스", 37.5126, 127.059, "tower") },
  { id: "songpa", name: "서울 송파구", region: "서울", lat: 37.5145, lng: 127.1059, minor: true, landmark: L("롯데월드타워", 37.5126, 127.1025, "tower") },
  { id: "gangdong", name: "서울 강동구", region: "서울", lat: 37.5301, lng: 127.1238, minor: true, landmark: L("암사동 선사유적", 37.553, 127.131, "park") },
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
  { id: "goyang", name: "고양", region: "수도권", lat: 37.6584, lng: 126.832, minor: true, landmark: L("일산호수공원", 37.659, 126.769, "park") },
  { id: "seongnam", name: "성남", region: "수도권", lat: 37.42, lng: 127.1265, minor: true, landmark: L("판교 테크노밸리", 37.402, 127.1085, "tower") },
  { id: "yongin", name: "용인", region: "수도권", lat: 37.2411, lng: 127.1776, minor: true, landmark: L("에버랜드", 37.2938, 127.202, "park") },
  { id: "anyang", name: "안양", region: "수도권", lat: 37.3943, lng: 126.9568, minor: true, landmark: L("삼성산", 37.429, 126.915, "mountain") },
  { id: "bucheon", name: "부천", region: "수도권", lat: 37.5034, lng: 126.766, minor: true, landmark: L("원미산", 37.495, 126.792, "mountain") },
  { id: "hwaseong", name: "화성", region: "수도권", lat: 37.1995, lng: 126.8312, minor: true, landmark: L("제부도", 37.163, 126.624, "island") },
  { id: "pyeongtaek", name: "평택", region: "수도권", lat: 36.9921, lng: 127.1128, minor: true, landmark: L("평택호", 36.965, 126.956, "park") },
  { id: "gapyeong", name: "가평", region: "수도권", lat: 37.8315, lng: 127.5095, minor: true, landmark: L("남이섬", 37.791, 127.525, "island") },
  { id: "yangpyeong", name: "양평", region: "수도권", lat: 37.4917, lng: 127.4875, minor: true, landmark: L("두물머리", 37.534, 127.318, "park") },
  { id: "icheon", name: "이천", region: "수도권", lat: 37.272, lng: 127.435, minor: true, landmark: L("설봉산", 37.279, 127.456, "mountain") },
  { id: "hongcheon", name: "홍천", region: "강원", lat: 37.697, lng: 127.8886, minor: true, landmark: L("공작산", 37.714, 127.916, "mountain") },
  { id: "pyeongchang", name: "평창", region: "강원", lat: 37.3705, lng: 128.3903, minor: true, landmark: L("대관령 양떼목장", 37.683, 128.727, "park") },
  { id: "samcheok", name: "삼척", region: "강원", lat: 37.45, lng: 129.165, minor: true, landmark: L("죽서루", 37.443, 129.167, "hanok") },
  { id: "taebaek", name: "태백", region: "강원", lat: 37.164, lng: 128.9856, minor: true, landmark: L("황지연못", 37.175, 128.987, "park") },
  { id: "chungju", name: "충주", region: "충청", lat: 36.991, lng: 127.926, minor: true, landmark: L("충주호", 36.976, 128.087, "park") },
  { id: "jecheon", name: "제천", region: "충청", lat: 37.1326, lng: 128.191, minor: true, landmark: L("의림지", 37.176, 128.205, "park") },
  { id: "taean", name: "태안", region: "충청", lat: 36.7456, lng: 126.298, minor: true, landmark: L("안면도", 36.5, 126.34, "beach") },
  { id: "boryeong", name: "보령", region: "충청", lat: 36.3333, lng: 126.6127, minor: true, landmark: L("대천해수욕장", 36.307, 126.518, "beach") },
  { id: "nonsan", name: "논산", region: "충청", lat: 36.1872, lng: 127.0987, minor: true, landmark: L("탑정호", 36.145, 127.143, "park") },
  { id: "iksan", name: "익산", region: "전라", lat: 35.9483, lng: 126.9577, minor: true, landmark: L("미륵사지", 36.012, 127.03, "hanok") },
  { id: "namwon", name: "남원", region: "전라", lat: 35.4164, lng: 127.3904, minor: true, landmark: L("광한루", 35.4, 127.379, "hanok") },
  { id: "suncheon", name: "순천", region: "전라", lat: 34.9506, lng: 127.4872, minor: true, landmark: L("순천만", 34.887, 127.509, "park") },
  { id: "gimcheon", name: "김천", region: "경상", lat: 36.1398, lng: 128.1136, minor: true, landmark: L("직지사", 36.136, 128.03, "hanok") },
  { id: "yeongju", name: "영주", region: "경상", lat: 36.8057, lng: 128.624, minor: true, landmark: L("부석사", 36.999, 128.687, "hanok") },
  { id: "mungyeong", name: "문경", region: "경상", lat: 36.5866, lng: 128.1867, minor: true, landmark: L("문경새재", 36.758, 128.099, "fortress") },
  { id: "gimhae", name: "김해", region: "경상", lat: 35.2285, lng: 128.8894, minor: true, landmark: L("수로왕릉", 35.23, 128.875, "hanok") },
  { id: "geoje", name: "거제", region: "경상", lat: 34.8806, lng: 128.6211, minor: true, landmark: L("외도 보타니아", 34.745, 128.71, "island") },
  { id: "sacheon", name: "사천", region: "경상", lat: 35.0037, lng: 128.0642, minor: true, landmark: L("삼천포대교", 34.923, 128.062, "bridge") },
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
  const order = ["서울", "수도권", "강원", "충청", "전라", "경상", "제주"];
  return order.map((region) => ({ region, places: PLACES.filter((p) => p.region === region) }));
}
