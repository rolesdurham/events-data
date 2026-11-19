import { serve } from '@hono/node-server'
import { createApp } from './app'
import { DATA_FILE, PUBLIC_DIR, SAMPLE_FILE } from './paths'
import { RegistrationStore } from './store'

const port = Number(process.env.PORT) || 8787
// Only this computer can open the app unless HOST is set (e.g. HOST=0.0.0.0 to share it on your network).
const hostname = process.env.HOST || '127.0.0.1'
const app = createApp(new RegistrationStore(DATA_FILE, SAMPLE_FILE), PUBLIC_DIR)

serve({ fetch: app.fetch, port, hostname }, (info) => {
  const shownHost = hostname === '0.0.0.0' || hostname === '127.0.0.1' ? 'localhost' : hostname
  console.log(`Event registrations app running at http://${shownHost}:${info.port}`)
  console.log(`Data is saved in ${DATA_FILE}`)
})
