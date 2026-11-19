export const CITIES = ['Chicago', 'Austin', 'Denver'] as const
export const SOURCES = ['Website', 'Email', 'Referral', 'Social', 'Partner'] as const
export const STATUSES = ['Registered', 'Checked in'] as const

export type City = (typeof CITIES)[number]
export type Source = (typeof SOURCES)[number]
export type Status = (typeof STATUSES)[number]

export type Registration = {
  id: number
  name: string
  company: string
  city: City
  source: Source
  status: Status
}

export type Filters = {
  city?: string
  status?: string
}
