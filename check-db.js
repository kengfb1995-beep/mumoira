const fs = require('fs');

// Read the actual miniflare metadata sqlite
const metaDbPath = '.wrangler/state/v3/d1/miniflare-D1DatabaseObject/metadata.sqlite';
const metaBytes = fs.readFileSync(metaDbPath);
console.log('Metadata DB size:', metaBytes.length, 'bytes');
console.log('Metadata DB header:', metaBytes.slice(0, 16).toString('hex'));

// Read the actual D1 data sqlite
const dataDbPath = '.wrangler/state/v3/d1/miniflare-D1DatabaseObject/57c45c3c7ca84dcf5ff3179e2bb0a16eba74fea6b449c1d4632c8cf64248a139.sqlite';
const dataBytes = fs.readFileSync(dataDbPath);
console.log('\nData DB size:', dataBytes.length, 'bytes');
console.log('Data DB header:', dataBytes.slice(0, 16).toString('hex'));

// Check if _drizzle_migrations table exists in metadata
// SQLite tables start at page 2
// Page 1 is the master page
console.log('\nFirst 200 bytes of data DB (page 1):');
console.log(dataBytes.slice(0, 200).toString('hex'));

// Check pages for _drizzle_migrations
const search = Buffer.from('_drizzle_migrations', 'utf8');
for (let i = 0; i < Math.min(dataBytes.length, 100000); i++) {
  let found = true;
  for (let j = 0; j < search.length; j++) {
    if (dataBytes[i+j] !== search[j]) { found = false; break; }
  }
  if (found) console.log('_drizzle_migrations found at byte', i, ':', dataBytes.slice(i-10, i+30).toString('hex'));
}
