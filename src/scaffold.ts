import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import type { Ctx, Module, PkgPartial } from "./types.js";
import { deepMerge, fill, sortKeys, writeFiles } from "./utils.js";
import { base } from "./modules/base.js";
import { d1 } from "./modules/d1.js";
import { r2 } from "./modules/r2.js";
import { auth } from "./modules/auth.js";

export function selectedModules(ctx: Ctx): Module[] {
  const list: Module[] = [base];
  if (ctx.modules.has("d1")) list.push(d1);
  if (ctx.modules.has("r2")) list.push(r2);
  if (ctx.modules.has("auth")) list.push(auth);
  return list;
}

export async function scaffold(root: string, ctx: Ctx) {
  const mods = selectedModules(ctx);
  await mkdir(root, { recursive: true });

  // package.json
  const pkg: Required<PkgPartial> = { dependencies: {}, devDependencies: {}, scripts: {} };
  for (const m of mods) {
    const p = typeof m.pkg === "function" ? m.pkg(ctx) : (m.pkg ?? {});
    Object.assign(pkg.dependencies, p.dependencies);
    Object.assign(pkg.devDependencies, p.devDependencies);
    Object.assign(pkg.scripts, p.scripts);
  }
  const packageJson = {
    name: ctx.name,
    type: "module",
    version: "0.0.1",
    engines: { node: ">=22.12.0" },
    scripts: pkg.scripts,
    dependencies: sortKeys(pkg.dependencies),
    allowScripts: { esbuild: true },
    devDependencies: sortKeys(pkg.devDependencies),
  };

  // wrangler.jsonc
  let wrangler: Record<string, unknown> = {};
  for (const m of mods) if (m.wrangler) wrangler = deepMerge(wrangler, m.wrangler(ctx));

  // .dev.vars
  const vars: Record<string, string> = {};
  for (const m of mods) if (m.devVars) Object.assign(vars, m.devVars(ctx));

  const files: Record<string, string> = {};
  for (const m of mods) Object.assign(files, m.files(ctx));
  for (const k of Object.keys(files)) files[k] = fill(files[k], ctx);

  files["package.json"] = fill(JSON.stringify(packageJson, null, 2), ctx) + "\n";
  files["wrangler.jsonc"] = (JSON.stringify(wrangler, null, 2) + "\n").replace(
    /^(\s*)"database_id": ""/m,
    '$1// Paste the database ID from the Cloudflare dashboard (Storage & databases > D1)\n$1"database_id": ""',
  );
  files["README.md"] = readme(ctx);

  if (Object.keys(vars).length) {
    files[".dev.vars"] = Object.entries(vars).map(([k, v]) => `${k}=${v}`).join("\n") + "\n";
    files[".dev.vars.example"] =
      Object.keys(vars).map((k) => `${k}=`).join("\n") + "\n";
  }

  await writeFiles(root, files);
}

function readme(ctx: Ctx): string {
  const parts = [`# ${ctx.name}\n`, "Astro + Svelte + Cloudflare, Tailwind v4, shadcn-svelte.\n", "```sh\npnpm dev\n```\n"];
  if (ctx.modules.has("d1"))
    parts.push(
      "## Database (D1 + Drizzle)\n",
      "```sh\npnpm db:generate        # create a migration from src/db/schema.ts\npnpm db:migrate:local   # apply locally\npnpm db:migrate:remote  # apply to production\n```\n",
    );
  if (ctx.modules.has("auth"))
    parts.push(
      "## Auth (Better Auth)\n",
      "Fill in the GitHub/Google client IDs and secrets in `.dev.vars`. OAuth callback URLs:\n",
      "- `http://localhost:4321/api/auth/callback/github`\n- `http://localhost:4321/api/auth/callback/google`\n",
      "Use the same paths on your production domain, and set production secrets with `wrangler secret put`.\n",
    );
  if (ctx.modules.has("r2")) parts.push("## R2\n", `Bucket: \`${ctx.bucketName}\` (binding \`BUCKET\`).\n`);
  return parts.join("\n");
}

export async function patchWrangler(root: string, fn: (cfg: any) => void) {
  const p = join(root, "wrangler.jsonc");
  const raw = await readFile(p, "utf8");
  const cfg = JSON.parse(raw.replace(/^\s*\/\/.*$/gm, ""));
  fn(cfg);
  await writeFile(p, JSON.stringify(cfg, null, 2) + "\n");
}

/** Replace compatibility_date in wrangler.jsonc without disturbing comments. */
export async function setCompatDate(root: string, date: string) {
  const p = join(root, "wrangler.jsonc");
  const raw = await readFile(p, "utf8");
  await writeFile(p, raw.replace(/"compatibility_date": "[^"]*"/, `"compatibility_date": "${date}"`));
}
