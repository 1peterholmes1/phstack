import { spawn } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import type { Ctx } from "./types.js";

export function fill(s: string, ctx: Ctx): string {
  return s
    .split("{{name}}").join(ctx.name)
    .split("{{dbName}}").join(ctx.dbName)
    .split("{{bucketName}}").join(ctx.bucketName);
}

export async function writeFiles(root: string, files: Record<string, string>) {
  for (const [rel, content] of Object.entries(files)) {
    const abs = join(root, rel);
    await mkdir(dirname(abs), { recursive: true });
    await writeFile(abs, content);
  }
}

export function sortKeys<T extends Record<string, string>>(o: T): T {
  return Object.fromEntries(Object.entries(o).sort(([a], [b]) => a.localeCompare(b))) as T;
}

export function deepMerge(a: Record<string, any>, b: Record<string, any>): Record<string, any> {
  const out: Record<string, any> = { ...a };
  for (const [k, v] of Object.entries(b)) {
    if (Array.isArray(v) && Array.isArray(out[k])) out[k] = [...out[k], ...v];
    else if (v && typeof v === "object" && !Array.isArray(v) && out[k] && typeof out[k] === "object") out[k] = deepMerge(out[k], v);
    else out[k] = v;
  }
  return out;
}

export function run(cmd: string, args: string[], cwd: string): Promise<{ code: number; out: string }> {
  return new Promise((resolve) => {
    const child = spawn(cmd, args, {
      cwd,
      stdio: ["ignore", "pipe", "pipe"],
      shell: process.platform === "win32",
    });
    let out = "";
    child.stdout?.on("data", (d) => (out += d));
    child.stderr?.on("data", (d) => (out += d));
    child.on("close", (code) => resolve({ code: code ?? 1, out }));
    child.on("error", (e) => resolve({ code: 1, out: String(e) }));
  });
}

export function tail(s: string, lines = 8): string {
  return s.trim().split("\n").slice(-lines).join("\n");
}
