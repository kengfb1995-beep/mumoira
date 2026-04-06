const fs = require("fs");
const path = require("path");

const rootPkgDir = path.join(process.cwd(), "node_modules", "@libsql", "isomorphic-ws");
const sourceWebMjs = path.join(rootPkgDir, "web.mjs");
const sourceWebCjs = path.join(rootPkgDir, "web.cjs");

if (!fs.existsSync(sourceWebMjs) || !fs.existsSync(sourceWebCjs)) {
  console.error("Missing source @libsql/isomorphic-ws web files in root node_modules");
  process.exit(1);
}

function walk(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === "isomorphic-ws" && full.includes(path.join("node_modules", "@libsql"))) {
        out.push(full);
      }
      walk(full, out);
    }
  }
  return out;
}

const targets = walk(path.join(process.cwd(), ".open-next"));
if (!targets.length) {
  console.log("No @libsql/isomorphic-ws targets found under .open-next");
  process.exit(0);
}

for (const targetDir of targets) {
  fs.copyFileSync(sourceWebMjs, path.join(targetDir, "web.mjs"));
  fs.copyFileSync(sourceWebCjs, path.join(targetDir, "web.cjs"));
  console.log(`Patched ${targetDir}`);
}
