# MuMoiRa

MuMoiRa now deploys as a **single Cloudflare Worker** named `mumoira` using OpenNext (Next.js on Workers), with cron running in the same worker.

## Architecture

- **Web app**: Next.js (`src/app/**`), served by OpenNext worker output
- **Cron task**: scheduled trigger every 15 minutes, implemented in `src/cron.ts`
- **Worker entrypoint**: `src/index.ts` (re-exports OpenNext default fetch + scheduled handler)

## Local development

Install dependencies:

```bash
npm install
```

Run normal Next.js dev server:

```bash
npm run dev
```

Preview Worker production build locally:

```bash
npm run cf:preview
```

## Deploy to Cloudflare Workers (no Pages required)

Build and deploy in one command:

```bash
npm run cf:deploy
```

This command builds OpenNext output (`.open-next/**`) and deploys worker `mumoira`.

## Wrangler config summary

`wrangler.toml` is configured for OpenNext:

- `name = "mumoira"`
- `main = ".open-next/worker.js"`
- assets binding from `.open-next/assets`
- service self-reference for cache support
- cron trigger: `*/15 * * * *`

## Required env/secrets

Set these in Cloudflare Worker settings (or Wrangler secrets):

- `APP_BASE_URL` = `https://mumoira.id.vn`
- `MAINTENANCE_CRON_SECRET` (required secret)
- `CRON_ALERT_WEBHOOK_URL` (optional secret)

CLI alternative:

```bash
npx wrangler secret put MAINTENANCE_CRON_SECRET
npx wrangler secret put CRON_ALERT_WEBHOOK_URL
```

## Domain routing

Use custom domain `mumoira.id.vn` directly on worker `mumoira`.

Do not point the domain to a separate text-only cron worker anymore.
