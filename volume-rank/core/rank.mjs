// 기간별 순위 계산. volume 배열은 오래된 날 → 최근 날 순서(영업일 기준).
export const PERIODS = [
  { key: '1d', label: '1일', days: 1 },
  { key: '1w', label: '1주', days: 5 },
  { key: '1m', label: '1달', days: 21 },
  { key: '3m', label: '3달', days: 63 },
  { key: '6m', label: '6달', days: 126 },
  { key: '1y', label: '1년', days: 252 },
]

const sum = (a) => a.reduce((x, y) => x + y, 0)

// 최근 days일 합계, 그 직전 같은 길이 구간 합계
export function windowSums(arr, days) {
  const n = arr.length
  if (n < days * 2) return null // 비교 구간이 모자라면 계산하지 않음
  return { cur: sum(arr.slice(n - days)), prev: sum(arr.slice(n - days * 2, n - days)) }
}

// metric: 'amount'(거래대금 = 거래량 × 종가) | 'volume'(거래량)
export function rankStocks(stocks, days, metric = 'amount') {
  const mul = (s) => (metric === 'amount' ? s.price : 1)
  const rows = []
  for (const s of stocks) {
    const w = windowSums(s.volume, days)
    if (!w) continue
    const cur = w.cur * mul(s)
    const prev = w.prev * mul(s)
    rows.push({ id: s.id, name: s.name, theme: s.theme, value: cur, prev, change: prev > 0 ? cur / prev - 1 : null })
  }
  rows.sort((a, b) => b.value - a.value)
  return rows.map((r, i) => ({ ...r, rank: i + 1 }))
}

// 상위 N개 종목이 속한 분야 비중 ("요즘 이런 분야에 몰렸어요")
export function themeSummary(ranked, topN = 10) {
  const top = ranked.slice(0, topN)
  const total = sum(top.map((r) => r.value))
  const map = new Map()
  for (const r of top) {
    const t = map.get(r.theme) ?? { theme: r.theme, value: 0, prev: 0, count: 0 }
    t.value += r.value
    t.prev += r.prev
    t.count += 1
    map.set(r.theme, t)
  }
  return [...map.values()]
    .map((t) => ({ ...t, share: total > 0 ? t.value / total : 0, change: t.prev > 0 ? t.value / t.prev - 1 : null }))
    .sort((a, b) => b.value - a.value)
}
