import { copyFileSync } from 'node:fs'
import { DATA_FILE, SAMPLE_FILE } from '../src/paths'

copyFileSync(SAMPLE_FILE, DATA_FILE)
console.log(`Reset ${DATA_FILE} to the sample data.`)
