# MuMoiRa

MuMoiRa is a Next.js application (website) with a separate Cloudflare Worker that runs scheduled maintenance jobs.

## Architecture

- **Website**: Next.js app in this repository (`src/app/**`)
- **Scheduler**: Cloudflare Worker (`src/index.ts`) triggered by cron every 15 minutes

This separation is important:

- Your domain (`mumoira.id.vn`) should point to the **website deployment** (Cloudflare Pages)
- The scheduler worker should run in background and should **not** own your main domain route

## Local development

Install dependencies:

```bash
npm install
```

Run web app locally:

```bash
npm run dev
```

## Worker (cron) commands

Run worker locally with scheduled testing:

```bash
npm run cron:dev
```

Trigger scheduled event manually:

```bash
npm run cron:trigger
```

Deploy worker:

```bash
npm run cron:deploy
```

## Cloudflare production setup (recommended)

### 1) Deploy website with Cloudflare Pages

Create a Pages project connected to this repo:

- Framework preset: **Next.js**
- Build command: `npm run build`

After successful deploy, attach custom domain:

- `mumoira.id.vn`
- (optional) `www.mumoira.id.vn`

### 2) Deploy scheduler with Cloudflare Workers

Worker config is in `wrangler.toml`:

- Worker name: `mu-moi-ra-cron`
- Entry: `src/index.ts`
- Cron: `*/15 * * * *`

Deploy using:

```bash
npm run cron:deploy
```

Important:

- Keep Worker without a public route on your main website domain.
- If you need a route, use a separate subdomain (example: `cron.mumoira.id.vn/*`).

## Environment variables / secrets

Set these for Worker deployment:

- `APP_BASE_URL` (already in `wrangler.toml`)
- `MAINTENANCE_CRON_SECRET` (secret)
- `CRON_ALERT_WEBHOOK_URL` (optional secret)

Set secret values with Wrangler:

```bash
npx wrangler secret put MAINTENANCE_CRON_SECRET
npx wrangler secret put CRON_ALERT_WEBHOOK_URL
```

## Why you were seeing plain text on domain

If your domain is attached to the Worker, browser requests hit `fetch()` in `src/index.ts`, which returns:

- `mu-moi-ra scheduler worker is running`

That means traffic bypasses your Next.js website. Attach domain to Pages instead.
