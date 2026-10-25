#!/usr/bin/env node
import { randomBytes } from "node:crypto";
import { existsSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import * as p from "@clack/prompts";
import type { Ctx, ModuleId, R2Access } from "./types.js";
import { patchWrangler, scaffold } from "./scaffold.js";
import { run, tail } from "./utils.js";

const args = process.argv.slice(2);
const skipPost = args.includes("--skip-post");
const nameArg = args.find((a) => !a.startsWith("-"));

function bail<T>(v: T | symbol): T {
  if (p.isCancel(v)) {
    p.cancel("Cancelled.");
    process.exit(0);
  }
  return v as T;
}

const kebab = (s: string) => (/^[a-z0-9][a-z0-9-]*$/.test(s) ? undefined : "Use lowercase letters, numbers and dashes");

async function main() {
  p.intro("mkapp");

  const name = nameArg ?? bail(await p.text({ message: "Project name", placeholder: "my-app", validate: (v) => kebab(v ?? "") }));
  const root = resolve(process.cwd(), name);
  if (existsSync(root) && readdirSync(root).length > 0) {
    p.cancel(`Directory ${name} already exists and is not empty.`);
    process.exit(1);
  }

  const picked = new Set<ModuleId>(
    bail(
      await p.multiselect<ModuleId>({
        message: "Optional modules (space to toggle)",
        required: false,
        options: [
          { value: "d1", label: "D1 + Drizzle", hint: "database, migrations, db:* scripts" },
          { value: "r2", label: "R2", hint: "object storage" },
          { value: "auth", label: "Better Auth", hint: "GitHub + Google SSO, needs D1" },
        ],
      }),
    ),
  );
  if (picked.has("auth") && !picked.has("d1")) {
    picked.add("d1");
    p.log.info("Better Auth stores sessions in your database, so D1 + Drizzle was added.");
  }

  let dbName = name;
  let dbMode = "skip" as "create" | "existing" | "skip";
  let dbId = "";
  if (picked.has("d1")) {
    dbName = bail(await p.text({ message: "D1 database name", initialValue: name, validate: (v) => kebab(v ?? "") }));
    dbMode = bail(
      await p.select({
        message: "D1 provisioning",
        options: [
          { value: "create", label: "Create it now with wrangler", hint: "requires wrangler login" },
          { value: "existing", label: "Use an existing database ID" },
          { value: "skip", label: "Don't create it", hint: "empty database_id in wrangler.jsonc, add it from the dashboard later" },
        ],
      }),
    ) as typeof dbMode;
    if (dbMode === "existing") dbId = bail(await p.text({ message: "Database ID", validate: (v) => (v ? undefined : "Required") }));
  }

  let bucketName = name;
  let r2Access = new Set<R2Access>();
  let createBucket = false;
  if (picked.has("r2")) {
    bucketName = bail(await p.text({ message: "R2 bucket name", initialValue: name, validate: (v) => kebab(v ?? "") }));
    r2Access = new Set(
      bail(
        await p.multiselect<R2Access>({
          message: "How will this project access R2?",
          required: true,
          options: [
            { value: "binding", label: "Worker binding", hint: "stream through Astro API routes" },
            { value: "presigned", label: "Presigned URLs", hint: "direct browser uploads via S3 API" },
            { value: "public", label: "Public bucket", hint: "reads via custom domain / r2.dev" },
          ],
        }),
      ),
    );
    createBucket = bail(await p.confirm({ message: "Create the bucket now with wrangler?", initialValue: false }));
  }

  const ctx: Ctx = {
    name,
    modules: picked,
    dbName,
    bucketName,
    r2Access,
    compatDate: new Date().toISOString().slice(0, 10),
    authSecret: randomBytes(32).toString("base64url"),
  };

  const s = p.spinner();
  s.start("Writing files");
  await scaffold(root, ctx);
  if (dbMode === "existing") await patchWrangler(root, (c) => (c.d1_databases[0].database_id = dbId));
  s.stop("Files written");

  if (!skipPost) {
    const step = async (label: string, cmd: string, cmdArgs: string[], onOut?: (out: string) => Promise<void> | void, fatal = false) => {
      s.start(label);
      const { code, out } = await run(cmd, cmdArgs, root);
      if (code !== 0) {
        s.stop(`${label} failed`, 1);
        p.log.warn(tail(out));
        if (fatal) process.exit(1);
        return false;
      }
      await onOut?.(out);
      s.stop(label);
      return true;
    };

    const installed = await step("Installing dependencies (pnpm)", "pnpm", ["install"]);
    if (installed) {
      if (dbMode === "create") {
        await step("Creating D1 database", "pnpm", ["exec", "wrangler", "d1", "create", dbName], async (out) => {
          const id = out.match(/"?database_id"?\s*[:=]\s*"([^"]+)"/)?.[1];
          if (id) await patchWrangler(root, (c) => (c.d1_databases[0].database_id = id));
          else p.log.warn("Created, but couldn't read the database ID. Copy it into wrangler.jsonc.");
        });
      }
      if (createBucket) await step("Creating R2 bucket", "pnpm", ["exec", "wrangler", "r2", "bucket", "create", bucketName]);
      await step("Adding shadcn-svelte components", "pnpm", [
        "exec", "shadcn-svelte", "add", "button", "card", "input", "label", "dialog", "dropdown-menu", "separator", "badge", "--yes",
      ]);
      await step("Generating Worker types", "pnpm", ["exec", "wrangler", "types"]);
    }
    if (await step("Initializing git", "git", ["init"])) {
      await run("git", ["add", "-A"], root);
      await run("git", ["commit", "-m", "Initial commit"], root);
    }
  }

  const todo: string[] = [`cd ${name}`];
  if (picked.has("d1") && dbMode === "skip") todo.push(`create the D1 database "${dbName}" in the dashboard, then paste its ID into wrangler.jsonc`);
  if (picked.has("d1")) todo.push("pnpm db:generate && pnpm db:migrate:local");
  if (picked.has("auth")) todo.push("fill in OAuth client IDs/secrets in .dev.vars");
  todo.push("pnpm dev");
  p.note(todo.join("\n"), "Next steps");
  p.outro("Done");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
