require('dotenv').config({ path: '.env.local' });

const { createClient } = require('@libsql/client');

const keys = [
  'GEMMA_API_KEY',
  'PAYOS_CLIENT_ID',
  'PAYOS_API_KEY',
  'PAYOS_CHECKSUM_KEY',
  'PAYOS_WEBHOOK_SECRET',
  'SERVICE_PRICING_PER_DAY_JSON',
  'SEO_SITE_TITLE',
  'SEO_SITE_DESCRIPTION',
  'SEO_SITE_KEYWORDS',
  'SEO_OG_IMAGE_URL',
  'SEO_SITE_AUTHOR',
  'SEO_SITE_EMAIL',
  'SEO_SITE_PHONE',
  'SEO_SOCIAL_LINKS',
];

async function main() {
  const url = process.env.TURSO_DATABASE_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN;

  if (!url || !authToken) {
    throw new Error('Thiếu TURSO_DATABASE_URL hoặc TURSO_AUTH_TOKEN trong .env.local');
  }

  const client = createClient({ url, authToken });

  for (const key of keys) {
    await client.execute({ sql: 'DELETE FROM settings WHERE key = ?', args: [key] });
    console.log(`Deleted key: ${key}`);
  }

  const remaining = await client.execute('SELECT key FROM settings ORDER BY key');
  console.log('Remaining keys:', remaining.rows.map((row) => row.key));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
