import { Hono } from 'hono'
import { bodyLimit } from 'hono/body-limit'
import { serveStatic } from '@hono/node-server/serve-static'
import { computeStats, filterRegistrations, toCsv } from './registrations'
import type { RegistrationStore } from './store'
import { CITIES, SOURCES, STATUSES, type City, type Filters, type Source } from './types'

const MAX_LENGTH = 100

function readFilters(query: (key: string) => string | undefined): Filters {
  return { city: query('city') || undefined, status: query('status') || undefined }
}

export function createApp(store: RegistrationStore, publicDir = './public') {
  const app = new Hono()

  app.get('/api/options', (c) => c.json({ cities: CITIES, sources: SOURCES, statuses: STATUSES }))

  app.get('/api/registrations', (c) => {
    const visible = filterRegistrations(store.list(), readFilters((k) => c.req.query(k)))
    return c.json({ registrations: visible, stats: computeStats(visible) })
  })

  app.get('/api/registrations.csv', (c) => {
    const visible = filterRegistrations(store.list(), readFilters((k) => c.req.query(k)))
    const date = new Date().toISOString().slice(0, 10)
    c.header('Content-Type', 'text/csv; charset=utf-8')
    c.header('Content-Disposition', `attachment; filename="registrations-${date}.csv"`)
    // The byte-order mark helps Excel open accented names correctly.
    return c.body('\uFEFF' + toCsv(visible))
  })

  const limitBody = bodyLimit({
    maxSize: 10 * 1024,
    onError: (c) => c.json({ error: 'Registration is too large.' }, 413),
  })

  app.post('/api/registrations', limitBody, async (c) => {
    const body = await c.req.json().catch(() => null)
    if (!body || typeof body !== 'object') return c.json({ error: 'Send the registration as JSON.' }, 400)

    const name = typeof body.name === 'string' ? body.name.trim() : ''
    const company = typeof body.company === 'string' ? body.company.trim() : ''
    const errors: string[] = []
    if (!name) errors.push('Name is required.')
    if (name.length > MAX_LENGTH || company.length > MAX_LENGTH)
      errors.push(`Name and company must be ${MAX_LENGTH} characters or fewer.`)
    if (!CITIES.includes(body.city)) errors.push(`City must be one of: ${CITIES.join(', ')}.`)
    if (!SOURCES.includes(body.source)) errors.push(`Source must be one of: ${SOURCES.join(', ')}.`)
    if (errors.length) return c.json({ error: errors.join(' ') }, 400)

    const registration = store.add({ name, company, city: body.city as City, source: body.source as Source })
    return c.json(registration, 201)
  })

  app.post('/api/registrations/:id/check-in', (c) => {
    const registration = store.checkIn(Number(c.req.param('id')))
    if (!registration) return c.json({ error: 'Registration not found.' }, 404)
    return c.json(registration)
  })

  app.use('/*', serveStatic({ root: publicDir }))

  return app
}
