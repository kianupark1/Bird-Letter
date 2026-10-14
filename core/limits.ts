/**
 * 편지 글자 수 한도.
 * 편지는 짧아도 길어도 되도록 사실상 제한을 두지 않아요. 서버 문서 하나가 1MB를 넘을 수 없어서
 * (한글은 글자당 3바이트 안팎) 안전하게 10만 자를 넘지 않게만 막습니다. 책 한 권 가까운 분량이에요.
 * ⚠️ 이 값을 바꾸면 firebase/firestore.rules의 message.size() 한도도 같이 바꾸고 콘솔에 게시해야 해요.
 */
export const MAX_LETTER_CHARS = 100000;

/**
 * 사진: 한 편지에 최대 3장. 사진은 줄인 JPEG를 글자(data URL)로 바꿔서 한 장씩 따로 저장해요(문서 1MB 한도를 넘지 않게).
 * ⚠️ MAX_PHOTO_CHARS를 바꾸면 firebase/firestore.rules의 photo 한도(450000)도 같이 바꾸고 콘솔에 게시해야 해요.
 */
export const MAX_PHOTOS = 3;
export const MAX_PHOTO_CHARS = 450000;
/** 줄일 때 긴 변의 길이(px) */
export const PHOTO_MAX_SIDE = 1080;
