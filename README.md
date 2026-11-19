# Event Registrations

A small web app for tracking registrations across a three-city event series (Chicago, Austin and Denver).

- See every registration in a table: name, company, city, registration source and attendance status
- Filter by city and attendance status
- See total registrations, how many people are checked in, and a count per registration source (these numbers follow the filters)
- Add a registration and check people in
- Download the rows you are currently viewing as a CSV file

## Run it

You need [Node.js](https://nodejs.org) 20 or newer.

```sh
npm install      # first time only: downloads the libraries the app uses
npm start        # starts the app
```

Open <http://localhost:8787> in your browser. Press `Ctrl+C` in the terminal to stop the app.

To use a different port: `PORT=3000 npm start`.

## Where the data lives

| File | What it is |
| --- | --- |
| `data/sample-registrations.json` | 30 sample registrations. The app never changes this file. |
| `data/registrations.json` | The live data. It is created from the sample the first time the app starts, and every new registration or check-in is saved here. You can open it in any text editor. It is not stored in git. |

To throw away your changes and start over from the sample data, run `npm run reset-data`. If the app is running, reload the page afterwards.

## Checks

```sh
npm run check    # runs both checks below
npm run typecheck   # TypeScript checks the server code for mistakes
npm test            # automated tests for listing, filters, stats, adding, check-in and CSV export
```

## How the code is organized

| Path | What it does |
| --- | --- |
| `public/index.html`, `public/app.js`, `public/styles.css` | The page you see in the browser. Plain HTML, JavaScript and CSS with no build step. |
| `src/server.ts` | Starts the web server. |
| `src/app.ts` | The server's routes (listed below) and the checks on new registrations. |
| `src/registrations.ts` | Filtering, the summary numbers and the CSV format. |
| `src/store.ts` | Reads and writes `data/registrations.json`. |
| `src/types.ts` | The allowed cities, sources and statuses. Edit this to rename a city or add a source. |
| `test/app.test.ts` | Automated tests. |

### Server routes

| Route | What it does |
| --- | --- |
| `GET /api/registrations?city=&status=` | Registrations matching the filters, plus the summary numbers |
| `GET /api/registrations.csv?city=&status=` | The same registrations as a CSV download |
| `POST /api/registrations` | Add a registration (`name`, `company`, `city`, `source`). New registrations start as "Registered". |
| `POST /api/registrations/:id/check-in` | Mark a registration as "Checked in" |
| `GET /api/options` | The allowed cities, sources and statuses |

Built with [Hono](https://hono.dev), a small web framework, running on Node.js.
