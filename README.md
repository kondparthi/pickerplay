# PickerPlay – white-label random picker wheel

React (Vite) frontend + Laravel 11 API + MySQL. Feature parity with Wheel of Names, branded as
PickerPlay, with every brand value (name, logo, favicon, colours, ads, SEO, languages, default
entries) editable in the admin panel. Nothing is hard-coded to one client, so the same code can be
re-skinned for any client from **/admin → Branding & settings**.

```
pickerplay/
├── backend/     Laravel 11 app (API, admin API, SEO/SPA server, MySQL migrations + seeders)
│   └── public/spa/   ← compiled React app (already built; rebuild with npm run build)
└── frontend/    React 18 + Vite source
```

## Features

**Wheel** – canvas wheel with cryptographic randomness (`crypto.getRandomValues`), physics-style
ease, ticking pointer, “Click to spin / ctrl+enter” hint, idle rotation, weighted entries, per-entry
images & colours, enable/disable entries, duplicates merge, max-visible-names, centre image (S–XL),
wheel background image, contours, drop shadow, pointer/text colour, page background colour/image.

**Toolbar** – Pickers menu (SEO tool pages), Customize (During spin / After spin / Appearance, the
same options as Wheel of Names), New (with Undo), Open (my wheels / file / shared link), Save
(account or .json download), Share (Share → Theme → Visibility → Link stepper, 3 visibility levels,
embed code, social buttons), Gallery, Fullscreen, More (Feedback, FAQ, Google Sheets import, account,
admin, preferences, sign out) and Language.

**Panel** – Entries / Results tabs, Shuffle, Sort, Add image, Advanced editor (weight, colour,
image, %), multiple wheels (spin one by clicking, all with ctrl+enter), duplicate/rename/remove wheel,
“Run 10,000 spins” fairness test, results copy/sort/clear, collapsible panel.

**After spin** – synthesised sounds (no licensed audio files), confetti, animated winner slice,
winner popup with Remove / Remove all instances, auto-remove after 5 s, click sound.

**Platform** – accounts (Sanctum tokens), password reset e-mail, saved wheels, share links
(`/abc-123`), public gallery with search/tags/thumbnails, embed page `/embed/abc-123` with
`postMessage` events (OBS/Streamlabs), developer REST API with API keys, CMS pages (Terms, Privacy,
FAQ, API, Streaming, Blog, Changelog), 16 SEO picker pages (`/yes-no-wheel`, `/number-picker`,
`/country-picker`, NBA/NFL/MLB …), sitemap.xml, robots.txt, server-side meta/OG tags per URL,
activity counter, ads slot with “Close ads” / “Report bad ad”, dark mode, 6 languages
(EN, HI, TE, TA, ES, FR – add more in `frontend/src/i18n`), auto-deletion of share links unused for
365 days.

**Admin (/admin)** – dashboard, branding & settings (logo/favicon/OG upload, colours, fonts, ads code,
GA4, custom CSS/head, feature switches, Unsplash key), wheels moderation (visibility, feature,
delete), picker-tool page editor (“use current wheel” imports a wheel you designed), page CMS,
users, feedback inbox, activity log.

## Install (local)

Requirements: PHP 8.2+ (pdo_mysql, mbstring, gd, fileinfo), Composer 2, MySQL 5.7+/MariaDB 10.3+,
Node 18+ (only to rebuild the frontend).

```bash
cd backend
composer install
cp .env.example .env          # set DB_*, APP_URL, ADMIN_EMAIL, ADMIN_PASSWORD, MAIL_*
php artisan key:generate
php artisan migrate --seed    # tables + admin user + pages + 16 picker tools + sample gallery
php artisan serve             # http://127.0.0.1:8000  (admin: /admin)
```

Frontend development (hot reload, proxies /api to :8000):

```bash
cd frontend
npm install
npm run dev                   # http://localhost:5173
npm run build                 # writes into backend/public/spa
```

## Deploy on Hostinger (shared hosting)

1. Create a MySQL database + user in hPanel.
2. Upload the `backend` folder (e.g. to `~/domains/pickerplay.com/pickerplay`).
   `public/spa` is already built – Node is not needed on the server.
3. SSH in: `composer install --no-dev --optimize-autoloader`, copy `.env.example` → `.env`,
   fill in DB/APP_URL/MAIL, then `php artisan key:generate` and `php artisan migrate --seed --force`.
4. Point the domain’s document root to `backend/public`.
   If you can’t change it, put the backend in `public_html` and use `htaccess-for-public_html.txt`
   as `public_html/.htaccess`.
5. Make `storage/`, `bootstrap/cache/` and `public/uploads/` writable (755/775).
6. Cron (hPanel → Cron Jobs, every minute):
   `cd /home/USER/domains/pickerplay.com/pickerplay && php artisan schedule:run >> /dev/null 2>&1`
7. `php artisan config:cache && php artisan route:cache`
8. Sign in at `https://pickerplay.com/admin` with ADMIN_EMAIL / ADMIN_PASSWORD, **change the
   password**, then upload the final logo/favicon in Branding & settings.

## White-labelling for another client

Everything brand-specific lives in the `settings` table: change it in **/admin → Branding &
settings** (no rebuild needed). Replace the seeded pages/tools in the admin, and swap
`backend/public/brand/logo.webp` + `favicon.png` if you want different defaults for new installs.

## API quick reference

| Area | Endpoints |
|---|---|
| Public | `GET /api/bootstrap`, `GET /api/gallery?q=&sort=`, `GET/POST /api/shares`, `GET /api/stats`, `POST /api/uploads`, `POST /api/import/google-sheet`, `GET /api/tools/{slug}`, `GET /api/pages/{slug}`, `POST /api/feedback` |
| Auth | `POST /api/auth/register|login|forgot-password|reset-password`, `GET /api/auth/me`, `POST /api/auth/logout` |
| User (Bearer) | `/api/wheels` CRUD, `/api/my/shares`, `/api/api-keys` |
| Admin | `/api/admin/*` (dashboard, settings, wheels, users, feedback, pages, tools, audit-logs) |
| Developer (X-Api-Key) | `/api/v1/wheels` CRUD, `POST /api/v1/shares`, `GET/DELETE /api/v1/shares/{code}` |

## Notes

- Wheels are stored as a JSON snapshot (`wheels.config`), the same model Wheel of Names uses for
  share links; `entries_text` is kept alongside for gallery search.
- Uploaded images are re-encoded to WebP (metadata stripped) into `public/uploads` – no
  `storage:link` symlink needed on shared hosting.
- Seeded Terms/Privacy pages are starting points – have them reviewed before launch.
