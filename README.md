# MuMoiRa

MuMoiRa là website danh bạ máy chủ MU Private, deploy trên **Netlify** với database **Turso** (libSQL).

## Architecture

- **Web app**: Next.js 15 (App Router), hosted on Netlify
- **Database**: Turso (libSQL — compatible SQLite)
- **ORM**: Drizzle ORM
- **Cron**: Netlify Scheduled Functions (`/api/maintenance/expire-banners`)

## Local development

```bash
# 1. Cài dependencies (đã bao gồm @libsql/client)
npm install

# 2. Copy biến môi trường
cp .env.example .env.local
# Chỉnh sửa .env.local với credentials thật

# 3. Chạy dev server
npm run dev
```

## Deploy to Netlify

### Cách 1: Netlify CLI

```bash
npm install -g netlify-cli
netlify login
netlify deploy --prod
```

### Cách 2: GitHub Integration

1. Push code lên GitHub
2. Kết nối repo với Netlify (Site settings → Build & deploy → Continuous deployment)
3. Thêm environment variables trong Netlify Dashboard:
   - `TURSO_DATABASE_URL`
   - `TURSO_AUTH_TOKEN`
   - `SESSION_SECRET`
   - `SETTINGS_ENCRYPTION_KEY`
   - `PAYO_CLIENT_ID`, `PAYO_API_KEY`, `PAYO_CHECKSUM_KEY`, `PAYOS_WEBHOOK_SECRET`
   - `GROQ_API_KEY` (optional)
   - `MAINTENANCE_CRON_SECRET`

## Database migrations

```bash
# Generate migration (sau khi thay đổi schema)
npm run db:generate

# Apply migration lên Turso
npm run db:migrate

# Studio (dev only)
npm run db:studio
```

## Required environment variables

| Variable | Description |
|---|---|
| `TURSO_DATABASE_URL` | Database URL từ Turso console (dạng `libsql://...`) |
| `TURSO_AUTH_TOKEN` | Auth token từ Turso console |
| `SESSION_SECRET` | Random 64-char string cho session cookies |
| `SETTINGS_ENCRYPTION_KEY` | Random 64-char string cho mã hóa settings |
| `PAYO_*` | PayOS credentials (từ payos.vn) |
| `MAINTENANCE_CRON_SECRET` | Bearer token bảo vệ cron endpoint |
| `GROQ_API_KEY` | Optional — Groq API cho AI rewrite |
