/**
 * 연락처에서 고른 전화번호를 대화방까지만 잠깐 들고 가요(문자로 알려 줄 때 쓰기).
 * 메모리에만 있고 저장하지 않아요(앱을 닫으면 사라짐, 서버로 보내지 않음).
 */
const tels = new Map<string, string>();
export const keepTel = (name: string, tel: string) => { if (name.trim() && tel.trim()) tels.set(name.trim(), tel.trim()); };
export const telFor = (name: string) => tels.get(name.trim()) ?? "";
