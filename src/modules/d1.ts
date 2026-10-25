import type { Module } from "../types.js";

export const d1: Module = {
  id: "d1",
  pkg: {
    dependencies: { "drizzle-orm": "1.0.0-rc.4" },
    devDependencies: { "drizzle-kit": "1.0.0-rc.4" },
    scripts: {
      "db:generate": "drizzle-kit generate",
      "db:migrate:local": "wrangler d1 migrations apply {{dbName}} --local",
      "db:migrate:remote": "wrangler d1 migrations apply {{dbName}} --remote",
      "db:studio:local":
        "LOCAL_DB_PATH=$(find .wrangler/state/v3/d1/miniflare-D1DatabaseObject -type f -name '*.sqlite' -print -quit) drizzle-kit studio",
    },
  },
  wrangler: (ctx) => ({
    d1_databases: [
      {
        binding: "DB",
        database_name: ctx.dbName,
        database_id: "",
        migrations_dir: "src/db/migrations",
        migrations_pattern: "src/db/migrations/*/migration.sql",
      },
    ],
  }),
  files: (ctx) => ({
    "drizzle.config.ts": `import { defineConfig } from "drizzle-kit";

export default defineConfig({
  dialect: "sqlite",
  schema: "./src/db/schema.ts",
  out: "./src/db/migrations",
  // Only needed for \`pnpm db:studio:local\`
  dbCredentials: { url: process.env.LOCAL_DB_PATH ?? "" },
});
`,
    "src/db/schema.ts": ctx.modules.has("auth")
      ? `export * from "./auth-schema";

// Add your own tables below:
// import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
`
      : `// import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
//
// export const example = sqliteTable("example", {
//   id: integer("id").primaryKey({ autoIncrement: true }),
//   name: text("name").notNull(),
// });
export {};
`,
    "src/db/index.ts": `import { drizzle } from "drizzle-orm/d1";
import { env } from "cloudflare:workers";
import * as schema from "./schema";

export { schema };

export function getDb() {
  return drizzle(env.DB, { schema });
}
`,
    "src/db/migrations/.gitkeep": "",
  }),
};
