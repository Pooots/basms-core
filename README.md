# BASMS frontend (`basms-core`)

React + Vite UI for BASMS. Foundation mirrors LPay (`lpay-core`).

## Quick start

```bash
cp .env.example .env
npm install
npm run dev
```

Open http://localhost:3000.

- `/` — login. Admins land on the admin console after signing in.
- `/admin` — dashboard: live totals, the latest bookings and today's schedule from `GET /admin/dashboard`. It refreshes every minute and after any change in another module. The top-bar search filters both lists, and clicking a booking opens its day in the calendar.
- `/admin/appointments` — list, filter, search (top-bar search box), book, edit and delete appointments. `?new=true` opens the booking form. Each booking's date links to that day on the calendar.
- `/admin/calendar` — Monday-first month grid with each day's services; selecting a day lists its bookings (click one to edit, or book on that day). `?date=YYYY-MM-DD` picks the day and month (defaults to today). It shares the `appointments` query cache, so any booking change refreshes it.
- `/admin/customers` — customer directory: search (top-bar search box), add, edit, delete and export to CSV.
- `/admin/services` — service menu: search, add, edit, delete and export to CSV. Duration and price are typed as text ("10-20 mins", "3-5 hours", "₱70-₱100", "₱10k-₱20k") and parsed by `src/lib/serviceInput.ts`.
- `/admin/staff` — team directory: search, add, edit, remove and export to CSV. Each member can have several specialties, picked as chips from the service menu. In the booking form, specialists in the chosen service are listed first.
- `/admin/reports` — stats, appointment activity chart and popular services for a date range (`?from=YYYY-MM-DD&to=YYYY-MM-DD`, defaults to the last 30 days), narrowed by the top-bar search. "Download report" opens a modal to pick the range and format (designed PDF or CSV) and export.
- `/admin/settings` — business profile (with logo upload), payment method and notification preferences; `?tab=payments` / `?tab=notifications` open those sections. The top-bar search jumps to the matching section.
- The bell in the top bar lists new-booking and cancellation alerts (refreshed every 30 seconds and after any booking change). Clicking one opens that day in the calendar.
- `/status` — Frontend, Backend API and Database status, polling `/api` and `/api/health` through the Vite proxy (`VITE_APP_URL` → Laravel).
