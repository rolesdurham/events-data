import { serve } from '@hono/node-server'
import { createApp } from './app'
import { DATA_FILE, PUBLIC_DIR, SAMPLE_FILE } from './paths'
import { RegistrationStore } from './store'

const port = Number(process.env.PORT) || 8787
const app = createApp(new RegistrationStore(DATA_FILE, SAMPLE_FILE), PUBLIC_DIR)

serve({ fetch: app.fetch, port }, (info) => {
  console.log(`Event registrations app running at http://localhost:${info.port}`)
  console.log(`Data is saved in ${DATA_FILE}`)
})
