const fs = require("fs");
const path = require("path");

function copyIfMissing(src, dst) {
  if (!fs.existsSync(src)) return false;
  if (!fs.existsSync(path.dirname(dst))) {
    fs.mkdirSync(path.dirname(dst), { recursive: true });
  }
  if (!fs.existsSync(dst)) {
    fs.copyFileSync(src, dst);
    return true;
  }
  return false;
}

function walk(dir, cb) {
  if (!fs.existsSync(dir)) return;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(p, cb);
    else cb(p);
  }
}

const root = process.cwd();
const openNextDir = path.join(root, ".open-next");

const srcClientWeb = path.join(root, "node_modules", "@libsql", "client", "lib-esm", "web.js");
const srcIsoWebMjs = path.join(root, "node_modules", "@libsql", "isomorphic-ws", "web.mjs");
const srcIsoWebCjs = path.join(root, "node_modules", "@libsql", "isomorphic-ws", "web.cjs");

let patched = 0;

walk(openNextDir, (file) => {
  if (file.endsWith(path.join("@libsql", "client", "package.json"))) {
    const pkgDir = path.dirname(file);
    if (copyIfMissing(srcClientWeb, path.join(pkgDir, "lib-esm", "web.js"))) patched += 1;
  }

  if (file.endsWith(path.join("@libsql", "isomorphic-ws", "package.json"))) {
    const pkgDir = path.dirname(file);
    if (copyIfMissing(srcIsoWebMjs, path.join(pkgDir, "web.mjs"))) patched += 1;
    if (copyIfMissing(srcIsoWebCjs, path.join(pkgDir, "web.cjs"))) patched += 1;
  }
});

console.log(`[fix-open-next-libsql] patched files: ${patched}`);
