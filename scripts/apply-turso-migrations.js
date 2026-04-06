require('dotenv').config({ path: '.env.local' });

const fs = require('fs');
const path = require('path');
const { createClient } = require('@libsql/client');

const url = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;

if (!url) {
  console.error('Missing TURSO_DATABASE_URL');
  process.exit(1);
}

const client = createClient({ url, authToken });

function splitStatements(sql) {
  return sql
    .split('--> statement-breakpoint')
    .flatMap((part) => part.split(';'))
    .map((s) => s.trim())
    .filter(Boolean)
    .map((s) => `${s};`);
}

function isBenignError(message) {
  return (
    message.includes('already exists') ||
    message.includes('duplicate column name') ||
    message.includes('UNIQUE constraint failed')
  );
}

(async () => {
  const migrationsDir = path.join(process.cwd(), 'drizzle');
  const files = fs
    .readdirSync(migrationsDir)
    .filter((f) => /^\d+_.*\.sql$/.test(f))
    .sort();

  for (const file of files) {
    const fullPath = path.join(migrationsDir, file);
    const sql = fs.readFileSync(fullPath, 'utf8');
    const statements = splitStatements(sql);

    console.log(`\nApplying ${file} (${statements.length} statements)`);

    for (let i = 0; i < statements.length; i += 1) {
      const stmt = statements[i];
      try {
        await client.execute(stmt);
      } catch (error) {
        const message = String(error?.message || error);
        if (isBenignError(message)) {
          console.log(`  - skip [${i + 1}] ${message}`);
          continue;
        }

        console.error(`  - fail [${i + 1}] ${message}`);
        console.error(stmt);
        process.exit(2);
      }
    }
  }

  const tables = await client.execute("select name from sqlite_master where type='table' order by name");
  console.log('\nDone. Tables:', tables.rows.map((r) => r.name).join(', '));
})();
