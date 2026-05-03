import { readFileSync } from "node:fs";
import { resolve } from "node:path";

function loadEnv(path: string) {
  try {
    const txt = readFileSync(path, "utf8");
    for (const line of txt.split(/\r?\n/)) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (!m) continue;
      let v = m[2];
      if (v.startsWith('"') && v.endsWith('"')) v = v.slice(1, -1);
      if (!process.env[m[1]]) process.env[m[1]] = v;
    }
  } catch {
    /* no .env file — fine */
  }
}

async function main() {
  loadEnv(resolve(process.cwd(), ".env.local"));
  if (!process.env.TURSO_DATABASE_URL) {
    console.error("TURSO_DATABASE_URL not set. Add it to .env.local first.");
    process.exit(1);
  }
  const { ensureSchema } = await import("../src/lib/db");
  await ensureSchema();
  console.log("✓ schema initialized");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
