import { copyFileSync, existsSync, readFileSync, renameSync, writeFileSync } from 'node:fs'
import type { City, Registration, Source } from './types'

export type NewRegistration = { name: string; company: string; city: City; source: Source }

/** Keeps registrations in a JSON file so changes survive a restart. */
export class RegistrationStore {
  constructor(
    private readonly filePath: string,
    sampleFilePath: string
  ) {
    if (!existsSync(filePath)) copyFileSync(sampleFilePath, filePath)
  }

  list(): Registration[] {
    return JSON.parse(readFileSync(this.filePath, 'utf8')) as Registration[]
  }

  add(input: NewRegistration): Registration {
    const list = this.list()
    const id = list.reduce((max, r) => Math.max(max, r.id), 0) + 1
    const registration: Registration = { id, ...input, status: 'Registered' }
    list.push(registration)
    this.save(list)
    return registration
  }

  checkIn(id: number): Registration | undefined {
    const list = this.list()
    const registration = list.find((r) => r.id === id)
    if (!registration) return undefined
    registration.status = 'Checked in'
    this.save(list)
    return registration
  }

  private save(list: Registration[]) {
    // Write to a temp file first so a crash mid-write can't corrupt the data.
    const tmp = `${this.filePath}.tmp`
    writeFileSync(tmp, JSON.stringify(list, null, 2) + '\n')
    renameSync(tmp, this.filePath)
  }
}
