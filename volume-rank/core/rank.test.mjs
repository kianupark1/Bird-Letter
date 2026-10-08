import assert from 'node:assert/strict'
import { windowSums, rankStocks, themeSummary, PERIODS } from './rank.mjs'
import { makeMarket, TRADING_DAYS } from './sample.mjs'

// 1. 구간 합계
assert.deepEqual(windowSums([1, 2, 3, 4], 2), { cur: 7, prev: 3 })
assert.equal(windowSums([1, 2, 3], 2), null)
assert.deepEqual(windowSums([5, 5], 1), { cur: 5, prev: 5 })

// 2. 순위·변화율
const stocks = [
  { id: 'a', name: 'A', theme: 'X', price: 10, volume: [1, 1, 4, 4] },
  { id: 'b', name: 'B', theme: 'Y', price: 1, volume: [9, 9, 9, 9] },
]
const byAmount = rankStocks(stocks, 2, 'amount')
assert.equal(byAmount[0].id, 'a') // 80 > 18
assert.equal(byAmount[0].change, 3) // (80 / 20) - 1
const byVolume = rankStocks(stocks, 2, 'volume')
assert.equal(byVolume[0].id, 'b') // 18 > 8 : 거래량과 거래대금 순위가 다를 수 있음
assert.equal(byVolume[0].change, 0)

// 3. 분야 비중 합 = 1
const t = themeSummary(byAmount, 2)
assert.ok(Math.abs(t.reduce((x, y) => x + y.share, 0) - 1) < 1e-9)

// 4. 샘플 데이터는 모든 기간에서 계산되고 결정적
for (const m of ['kr', 'us']) {
  const s1 = makeMarket(m)
  const s2 = makeMarket(m)
  assert.deepEqual(s1[3].volume.slice(0, 5), s2[3].volume.slice(0, 5))
  assert.equal(s1[0].volume.length, TRADING_DAYS)
  for (const p of PERIODS) {
    const r = rankStocks(s1, p.days)
    assert.equal(r.length, s1.length, `${m} ${p.key}`)
    assert.ok(r.every((x, i) => i === 0 || r[i - 1].value >= x.value))
  }
}
console.log('rank 테스트 통과')

// 5. 샘플 종목 이름은 겹치지 않음
for (const m of ['kr', 'us']) {
  const names = makeMarket(m).map((s) => s.name)
  assert.equal(new Set(names).size, names.length, `${m} 이름 중복`)
}
console.log('이름 중복 없음')
