export type RoutePoint = {
  name: string;
  lat: number;
  lng: number;
  /** 임시 SVG 지도 좌표(300x220 기준). Kakao Maps 연동 시 제거 */
  xy: [number, number];
};
export type Route = { id: string; title: string; km: number; points: RoutePoint[] };

// 좌표는 대략값입니다. Kakao Maps 연동 때 정밀 좌표로 교체하세요.
export const ROUTES: Route[] = [
  {
    id: "seoul-busan", title: "서울 → 부산", km: 325,
    points: [
      { name: "남대문", lat: 37.5599, lng: 126.9753, xy: [120, 30] },
      { name: "대전 엑스포", lat: 36.3754, lng: 127.388, xy: [135, 100] },
      { name: "광안대교", lat: 35.1476, lng: 129.1304, xy: [215, 180] },
    ],
  },
  {
    id: "seoul-jeju", title: "서울 → 제주", km: 452,
    points: [
      { name: "남대문", lat: 37.5599, lng: 126.9753, xy: [120, 30] },
      { name: "남해 상공", lat: 34.3, lng: 127.5, xy: [140, 150] },
      { name: "한라산", lat: 33.3617, lng: 126.5292, xy: [115, 200] },
    ],
  },
  {
    id: "seoul-dokdo", title: "서울 → 독도", km: 430,
    points: [
      { name: "남대문", lat: 37.5599, lng: 126.9753, xy: [120, 30] },
      { name: "울릉도", lat: 37.4844, lng: 130.9057, xy: [235, 55] },
      { name: "독도", lat: 37.2394, lng: 131.8695, xy: [270, 75] },
    ],
  },
];

export const getRoute = (id: string) => ROUTES.find((r) => r.id === id) ?? ROUTES[0];
