// 시안 캡처: node screenshot.mjs  (app/ 을 임시 서버로 띄워 모바일 크기로 저장)
import { createServer } from 'node:http'
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
const { chromium } = createRequire('/opt/node-tools/package.json')('playwright')
const types = { html: 'text/html; charset=utf-8', json: 'application/json' }
const srv = createServer((q, s) => {
  const f = q.url.split('?')[0] === '/' ? 'index.html' : q.url.split('?')[0].slice(1)
  try { s.writeHead(200, { 'content-type': types[f.split('.').pop()] }); s.end(readFileSync(new URL('./app/' + f, import.meta.url))) }
  catch { s.writeHead(404); s.end() }
}).listen(0)
const port = srv.address().port
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' })
const shots = [
  ['01-국내-1주-거래대금', 'market=kr&period=1w&metric=amount'],
  ['02-해외-1주-거래대금', 'market=us&period=1w&metric=amount'],
  ['03-국내-1년-거래량', 'market=kr&period=1y&metric=volume'],
  ['04-해외-1일-거래대금', 'market=us&period=1d&metric=amount'],
]
for (const [name, qs] of shots) {
  const p = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 })
  await p.goto(`http://localhost:${port}/?${qs}`)
  await p.waitForSelector('.row')
  await p.screenshot({ path: decodeURIComponent(new URL(`./screenshots/${name}.png`, import.meta.url).pathname), fullPage: true })
  await p.close()
}
await b.close(); srv.close(); console.log('캡처 완료')
