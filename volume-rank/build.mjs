// 샘플 데이터 → app/data.json (실제 시장 데이터 연결 전 임시)
import { writeFileSync } from 'node:fs'
import { PERIODS, rankStocks, themeSummary } from './core/rank.mjs'
import { makeMarket } from './core/sample.mjs'

const out = { sample: true, asOf: '샘플 기준일', markets: {} }
for (const m of ['kr', 'us']) {
  const stocks = makeMarket(m)
  out.markets[m] = {}
  for (const p of PERIODS) {
    out.markets[m][p.key] = {}
    for (const metric of ['amount', 'volume']) {
      const ranked = rankStocks(stocks, p.days, metric)
      out.markets[m][p.key][metric] = { rows: ranked.slice(0, 30), themes: themeSummary(ranked, 10) }
    }
  }
}
writeFileSync(new URL('./app/data.json', import.meta.url), JSON.stringify(out))
console.log('app/data.json 생성')
