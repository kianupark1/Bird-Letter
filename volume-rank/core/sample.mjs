// 샘플 데이터 생성기: 가짜 종목·가짜 숫자 (실제 시장 데이터 아님). 같은 입력이면 항상 같은 결과.
const THEMES = {
  kr: ['반도체', '2차전지', '바이오', '자동차', '엔터', '금융', '조선·방산', '인터넷'],
  us: ['AI·반도체', '빅테크', '전기차', '바이오', '금융', '에너지', '소비재', '클라우드'],
}
const KR_NAMES = ['한빛', '새솔', '다온', '가람', '누리', '미르', '온누리', '해든', '하늬', '아라']
const KR_SUFFIX = { '반도체': '반도체', '2차전지': '에너지솔루션', '바이오': '바이오', '자동차': '모터스', '엔터': '엔터', '금융': '금융', '조선·방산': '중공업', '인터넷': '소프트' }
const US_NAMES = ['Nova', 'Orbit', 'Lumen', 'Vertex', 'Atlas', 'Pulse', 'Zenith', 'Quanta', 'Helix', 'Aurora']
const US_SUFFIX = { 'AI·반도체': 'Chips', '빅테크': 'Platforms', '전기차': 'Motors', '바이오': 'Bio', '금융': 'Capital', '에너지': 'Energy', '소비재': 'Goods', '클라우드': 'Cloud' }

function rng(seed) {
  let s = seed >>> 0
  return () => ((s = (Math.imul(s, 1664525) + 1013904223) >>> 0) / 4294967296)
}

export const TRADING_DAYS = 504 // 1년 구간 비교(현재+이전)에 필요한 영업일

export function makeMarket(market, count = 40) {
  const r = rng(market === 'kr' ? 7 : 11)
  const themes = THEMES[market]
  const names = market === 'kr' ? KR_NAMES : US_NAMES
  const suffix = market === 'kr' ? KR_SUFFIX : US_SUFFIX
  const stocks = []
  for (let i = 0; i < count; i++) {
    const theme = themes[i % themes.length]
    const stem = names[Math.floor(i / themes.length)] // 분야 안에서 이름이 겹치지 않게
    const name = market === 'kr' ? `${stem}${suffix[theme]}` : `${stem} ${suffix[theme]}`
    const base = 10 ** (5 + r() * 2.5) // 평소 거래량
    const price = market === 'kr' ? 3000 + r() * 150000 : 8 + r() * 400
    const drift = (r() - 0.5) * 0.004
    const burst = Math.floor(r() * TRADING_DAYS) // 몰리는 시기
    const volume = []
    let level = 1
    for (let d = 0; d < TRADING_DAYS; d++) {
      level *= 1 + drift + (r() - 0.5) * 0.06
      level = Math.min(Math.max(level, 0.3), 4)
      const spike = Math.abs(d - burst) < 6 ? 2.2 : 1
      volume.push(Math.round(base * level * spike * (0.7 + r() * 0.6)))
    }
    stocks.push({ id: `${market}${i}`, name, theme, price: Math.round(price * 100) / 100, volume })
  }
  return stocks
}
