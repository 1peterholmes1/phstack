# phdstack

Scaffolds Astro + Svelte + Cloudflare projects (Tailwind v4, shadcn-svelte, mode-watcher).

Optional modules: D1 + Drizzle, R2 (binding / presigned / public), Better Auth (GitHub + Google; auto-enables D1).

```sh
pnpm install && pnpm build
pnpm add -g .      # then: phdstack my-app
# or during development:
pnpm dev my-app         # runs via tsx
pnpm dev my-app --skip-post   # write files only (no install / git / wrangler / shadcn)
```

Post-scaffold steps: pnpm install, optional D1/R2 creation via wrangler, `shadcn-svelte add` (button, card, input, label, dialog, dropdown-menu, separator, badge), `wrangler types`, `git init` + first commit.

Modules live in `src/modules/`; each declares package.json fragments, wrangler.jsonc fragments, files and `.dev.vars` entries.
