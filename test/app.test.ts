import assert from 'node:assert/strict'
import { mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, it } from 'node:test'
import { createApp } from '../src/app'
import { PUBLIC_DIR, SAMPLE_FILE } from '../src/paths'
import { toCsv } from '../src/registrations'
import { RegistrationStore } from '../src/store'
import type { Registration } from '../src/types'

const sample = JSON.parse(readFileSync(SAMPLE_FILE, 'utf8')) as Registration[]

let dir: string
let dataFile: string
let app: ReturnType<typeof createApp>

beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), 'registrations-'))
  dataFile = join(dir, 'registrations.json')
  app = createApp(new RegistrationStore(dataFile, SAMPLE_FILE), PUBLIC_DIR)
})
afterEach(() => rmSync(dir, { recursive: true, force: true }))

type Stats = { total: number; checkedIn: number; bySource: Record<string, number> }
type ListResponse = { registrations: Registration[]; stats: Stats }

const getList = async (query = '') =>
  (await (await app.request(`/api/registrations${query}`)).json()) as ListResponse
const json = async <T = Registration>(res: Response) => (await res.json()) as T
const post = (path: string, body?: unknown) =>
  app.request(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  })

describe('listing and stats', () => {
  it('returns all sample registrations with stats', async () => {
    const data = await getList()
    assert.equal(data.registrations.length, sample.length)
    assert.equal(data.stats.total, sample.length)
    assert.equal(data.stats.checkedIn, sample.filter((r) => r.status === 'Checked in').length)
    const sourceTotal = Object.values(data.stats.bySource).reduce((a, b) => a + b, 0)
    assert.equal(sourceTotal, sample.length)
  })

  it('filters by city and status together', async () => {
    const data = await getList('?city=Austin&status=Checked%20in')
    assert.ok(data.registrations.length > 0)
    for (const r of data.registrations) {
      assert.equal(r.city, 'Austin')
      assert.equal(r.status, 'Checked in')
    }
    assert.equal(data.stats.total, data.registrations.length)
    assert.equal(data.stats.checkedIn, data.registrations.length)
  })
})

describe('adding registrations', () => {
  it('adds a registration, saves it to the file and starts it as Registered', async () => {
    const res = await post('/api/registrations', { name: '  Jo Park ', company: 'Acme', city: 'Denver', source: 'Email' })
    assert.equal(res.status, 201)
    const created = await json(res)
    assert.equal(created.name, 'Jo Park')
    assert.equal(created.status, 'Registered')
    assert.equal(created.id, Math.max(...sample.map((r) => r.id)) + 1)

    const saved = JSON.parse(readFileSync(dataFile, 'utf8')) as Registration[]
    assert.equal(saved.length, sample.length + 1)
    assert.equal((await getList()).stats.total, sample.length + 1)
  })

  it('rejects missing names and unknown cities or sources', async () => {
    const res = await post('/api/registrations', { name: ' ', city: 'Paris', source: 'Billboard' })
    assert.equal(res.status, 400)
    const { error } = await json<{ error: string }>(res)
    assert.match(error, /Name is required/)
    assert.match(error, /City must be one of/)
    assert.match(error, /Source must be one of/)
    assert.equal((await getList()).stats.total, sample.length)
  })

  it('rejects oversized requests', async () => {
    const res = await post('/api/registrations', { name: 'x'.repeat(20_000), city: 'Austin', source: 'Email' })
    assert.equal(res.status, 413)
    assert.equal((await getList()).stats.total, sample.length)
  })

  it('rejects a body that is not JSON', async () => {
    const res = await app.request('/api/registrations', { method: 'POST', body: 'nope' })
    assert.equal(res.status, 400)
  })
})

describe('check-in', () => {
  it('marks a registration as checked in', async () => {
    const target = sample.find((r) => r.status === 'Registered')!
    const res = await post(`/api/registrations/${target.id}/check-in`)
    assert.equal(res.status, 200)
    assert.equal((await json(res)).status, 'Checked in')
    const data = await getList()
    assert.equal(data.stats.checkedIn, sample.filter((r) => r.status === 'Checked in').length + 1)
  })

  it('returns 404 for an unknown id', async () => {
    assert.equal((await post('/api/registrations/9999/check-in')).status, 404)
  })
})

describe('CSV export', () => {
  it('exports only the filtered registrations as a download', async () => {
    const res = await app.request('/api/registrations.csv?city=Chicago')
    assert.equal(res.status, 200)
    assert.match(res.headers.get('Content-Type') ?? '', /text\/csv/)
    assert.match(res.headers.get('Content-Disposition') ?? '', /attachment; filename="registrations-/)
    const lines = (await res.text()).replace(/^\uFEFF/, '').trim().split('\r\n')
    assert.equal(lines[0], 'Name,Company,City,Source,Status')
    assert.equal(lines.length - 1, sample.filter((r) => r.city === 'Chicago').length)
    for (const line of lines.slice(1)) assert.match(line, /,Chicago,/)
  })

  it('escapes commas and quotes and neutralizes spreadsheet formulas', () => {
    const csv = toCsv([
      { id: 1, name: 'Lee, "Sam"', company: '=HYPERLINK("x")', city: 'Austin', source: 'Email', status: 'Registered' },
    ])
    assert.equal(csv.split('\r\n')[1], `"Lee, ""Sam""","'=HYPERLINK(""x"")",Austin,Email,Registered`)
  })
})

describe('web page', () => {
  it('serves the page', async () => {
    const res = await app.request('/')
    assert.equal(res.status, 200)
    assert.match(await res.text(), /Event Registrations/)
  })
})
