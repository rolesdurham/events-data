// Browser code for the registrations page. It talks to the server's /api routes.
const $ = (id) => document.getElementById(id)

const state = { city: '', status: '' }

function queryString() {
  const params = new URLSearchParams()
  if (state.city) params.set('city', state.city)
  if (state.status) params.set('status', state.status)
  const qs = params.toString()
  return qs ? `?${qs}` : ''
}

function fillSelect(select, values) {
  for (const value of values) select.append(new Option(value, value))
}

function renderStats(stats) {
  $('stat-total').textContent = stats.total
  $('stat-checked-in').textContent = stats.checkedIn
  $('stat-checked-in-pct').textContent = stats.total
    ? `${Math.round((stats.checkedIn / stats.total) * 100)}% of registrations`
    : ''
  const list = $('stat-sources')
  list.replaceChildren()
  for (const [source, count] of Object.entries(stats.bySource)) {
    const li = document.createElement('li')
    const name = document.createElement('span')
    name.textContent = source
    const value = document.createElement('strong')
    value.textContent = count
    li.append(name, value)
    list.append(li)
  }
  const scope = [state.city || 'all cities', state.status || 'all statuses'].join(', ')
  $('stats-scope').textContent = `Showing numbers for ${scope}.`
}

function renderRows(registrations) {
  const tbody = $('rows')
  tbody.replaceChildren()
  for (const r of registrations) {
    const tr = document.createElement('tr')
    for (const value of [r.name, r.company, r.city, r.source]) {
      const td = document.createElement('td')
      td.textContent = value
      tr.append(td)
    }
    const statusCell = document.createElement('td')
    const badge = document.createElement('span')
    badge.className = r.status === 'Checked in' ? 'badge in' : 'badge'
    badge.textContent = r.status
    statusCell.append(badge)
    tr.append(statusCell)

    const actionCell = document.createElement('td')
    if (r.status !== 'Checked in') {
      const button = document.createElement('button')
      button.type = 'button'
      button.className = 'small'
      button.textContent = 'Check in'
      button.addEventListener('click', () => checkIn(r.id, button))
      actionCell.append(button)
    }
    tr.append(actionCell)
    tbody.append(tr)
  }
  $('empty').hidden = registrations.length > 0
}

async function load() {
  const res = await fetch(`/api/registrations${queryString()}`)
  const data = await res.json()
  renderRows(data.registrations)
  renderStats(data.stats)
}

async function checkIn(id, button) {
  button.disabled = true
  const res = await fetch(`/api/registrations/${id}/check-in`, { method: 'POST' })
  if (!res.ok) {
    button.disabled = false
    alert('Could not check in this person. Please reload the page and try again.')
    return
  }
  await load()
}

async function addRegistration(event) {
  event.preventDefault()
  const form = event.target
  const message = $('form-message')
  const body = Object.fromEntries(new FormData(form))
  const res = await fetch('/api/registrations', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const data = await res.json()
  if (!res.ok) {
    message.className = 'message error'
    message.textContent = data.error
    return
  }
  message.className = 'message success'
  message.textContent = `Added ${data.name} (${data.city}).`
  form.reset()
  await load()
}

async function init() {
  const options = await (await fetch('/api/options')).json()
  fillSelect($('filter-city'), options.cities)
  fillSelect($('filter-status'), options.statuses)
  fillSelect($('form-city'), options.cities)
  fillSelect($('form-source'), options.sources)

  $('filter-city').addEventListener('change', (e) => {
    state.city = e.target.value
    load()
  })
  $('filter-status').addEventListener('change', (e) => {
    state.status = e.target.value
    load()
  })
  $('clear-filters').addEventListener('click', () => {
    state.city = state.status = ''
    $('filter-city').value = $('filter-status').value = ''
    load()
  })
  $('export-csv').addEventListener('click', () => {
    window.location.href = `/api/registrations.csv${queryString()}`
  })
  $('add-form').addEventListener('submit', addRegistration)

  await load()
}

init()
