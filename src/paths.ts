import { fileURLToPath } from 'node:url'

const root = (p: string) => fileURLToPath(new URL(`../${p}`, import.meta.url))

export const DATA_FILE = root('data/registrations.json')
export const SAMPLE_FILE = root('data/sample-registrations.json')
export const PUBLIC_DIR = root('public')
