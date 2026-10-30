import type { Module } from "../types.js";

const globalCss = String.raw`@import "tailwindcss";
@import "tw-animate-css";

@custom-variant dark (&:is(.dark *));

:root {
  --radius: 0.625rem;
  --background: oklch(1 0 0);
  --foreground: oklch(0.145 0 0);
  --card: oklch(1 0 0);
  --card-foreground: oklch(0.145 0 0);
  --popover: oklch(1 0 0);
  --popover-foreground: oklch(0.145 0 0);
  --primary: oklch(0.205 0 0);
  --primary-foreground: oklch(0.985 0 0);
  --secondary: oklch(0.97 0 0);
  --secondary-foreground: oklch(0.205 0 0);
  --muted: oklch(0.97 0 0);
  --muted-foreground: oklch(0.556 0 0);
  --accent: oklch(0.97 0 0);
  --accent-foreground: oklch(0.205 0 0);
  --destructive: oklch(0.577 0.245 27.325);
  --border: oklch(0.922 0 0);
  --input: oklch(0.922 0 0);
  --ring: oklch(0.708 0 0);
}

.dark {
  --background: oklch(0.145 0 0);
  --foreground: oklch(0.985 0 0);
  --card: oklch(0.205 0 0);
  --card-foreground: oklch(0.985 0 0);
  --popover: oklch(0.205 0 0);
  --popover-foreground: oklch(0.985 0 0);
  --primary: oklch(0.922 0 0);
  --primary-foreground: oklch(0.205 0 0);
  --secondary: oklch(0.269 0 0);
  --secondary-foreground: oklch(0.985 0 0);
  --muted: oklch(0.269 0 0);
  --muted-foreground: oklch(0.708 0 0);
  --accent: oklch(0.269 0 0);
  --accent-foreground: oklch(0.985 0 0);
  --destructive: oklch(0.704 0.191 22.216);
  --border: oklch(1 0 0 / 10%);
  --input: oklch(1 0 0 / 15%);
  --ring: oklch(0.556 0 0);
}

@theme inline {
  --radius-sm: calc(var(--radius) - 4px);
  --radius-md: calc(var(--radius) - 2px);
  --radius-lg: var(--radius);
  --radius-xl: calc(var(--radius) + 4px);
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-card: var(--card);
  --color-card-foreground: var(--card-foreground);
  --color-popover: var(--popover);
  --color-popover-foreground: var(--popover-foreground);
  --color-primary: var(--primary);
  --color-primary-foreground: var(--primary-foreground);
  --color-secondary: var(--secondary);
  --color-secondary-foreground: var(--secondary-foreground);
  --color-muted: var(--muted);
  --color-muted-foreground: var(--muted-foreground);
  --color-accent: var(--accent);
  --color-accent-foreground: var(--accent-foreground);
  --color-destructive: var(--destructive);
  --color-border: var(--border);
  --color-input: var(--input);
  --color-ring: var(--ring);
}

@layer base {
  * {
    @apply border-border outline-ring/50;
  }
  body {
    @apply bg-background text-foreground;
  }
}
`;

const modeToggle = String.raw`<script lang="ts">
  import Sun from "@lucide/svelte/icons/sun";
  import Moon from "@lucide/svelte/icons/moon";
  import { ModeWatcher, resetMode, setMode } from "mode-watcher";
  import { Button } from "@/lib/components/ui/button/index.js";
  import * as DropdownMenu from "@/lib/components/ui/dropdown-menu/index.js";
</script>

<!-- Lives in the same island as the toggle so both share one mode-watcher instance -->
<ModeWatcher />

<DropdownMenu.Root>
  <DropdownMenu.Trigger>
    {#snippet child({ props })}
      <Button {...props} variant="outline" size="icon">
        <Sun class="h-[1.2rem] w-[1.2rem] scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90" />
        <Moon class="absolute h-[1.2rem] w-[1.2rem] scale-0 rotate-90 transition-all dark:scale-100 dark:rotate-0" />
        <span class="sr-only">Toggle theme</span>
      </Button>
    {/snippet}
  </DropdownMenu.Trigger>
  <DropdownMenu.Content align="end">
    <DropdownMenu.Item onclick={() => setMode("light")}>Light</DropdownMenu.Item>
    <DropdownMenu.Item onclick={() => setMode("dark")}>Dark</DropdownMenu.Item>
    <DropdownMenu.Item onclick={() => resetMode()}>System</DropdownMenu.Item>
  </DropdownMenu.Content>
</DropdownMenu.Root>
`;

const utilsTs = String.raw`import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Helper types used by shadcn-svelte components
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type WithoutChild<T> = T extends { child?: any } ? Omit<T, "child"> : T;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type WithoutChildren<T> = T extends { children?: any } ? Omit<T, "children"> : T;
export type WithoutChildrenOrChild<T> = WithoutChildren<WithoutChild<T>>;
export type WithElementRef<T, U extends HTMLElement = HTMLElement> = T & { ref?: U | null };
`;

export const base: Module = {
  id: "base",
  pkg: {
    dependencies: {
      "@astrojs/cloudflare": "^14.3.3",
      "@astrojs/svelte": "^9.0.1",
      "@tailwindcss/vite": "^4.3.3",
      astro: "^7.3.5",
      "mode-watcher": "0.5.1",
      svelte: "^5.57.1",
      tailwindcss: "^4.3.3",
      typescript: "^6.0.3",
      wrangler: "^4.147.0",
    },
    devDependencies: {
      "@internationalized/date": "^3.12.4",
      "@lucide/svelte": "^1.49.0",
      "@types/node": "^26.6.3",
      "bits-ui": "^2.19.4",
      clsx: "^2.1.1",
      "shadcn-svelte": "^1.7.0",
      "tailwind-merge": "^3.3.1",
      "tailwind-variants": "^3.3.1",
      tsx: "^4.23.15",
      "tw-animate-css": "^1.4.0",
    },
    scripts: {
      dev: "astro dev",
      build: "astro build",
      preview: "astro preview",
      astro: "astro",
      "generate-types": "wrangler types",
      deploy: "astro build && wrangler deploy",
    },
  },
  wrangler: (ctx) => ({
    $schema: "node_modules/wrangler/config-schema.json",
    name: ctx.name,
    main: "@astrojs/cloudflare/entrypoints/server",
    compatibility_date: ctx.compatDate,
    compatibility_flags: ["nodejs_compat", "global_fetch_strictly_public"],
    assets: { binding: "ASSETS", directory: "./dist" },
    observability: { enabled: true },
  }),
  files: (ctx) => {
    const auth = ctx.modules.has("auth");
    return {
      "astro.config.mjs": `// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';

import svelte from '@astrojs/svelte';
import cloudflare from '@astrojs/cloudflare';

// https://astro.build/config
export default defineConfig({
  vite: {
    plugins: [tailwindcss()]
  },
  output: 'server',
  integrations: [svelte()],
  adapter: cloudflare()
});
`,
      "svelte.config.js": `import { vitePreprocess } from "@astrojs/svelte";

export default {
  preprocess: vitePreprocess(),
};
`,
      "tsconfig.json": `{
  "extends": "astro/tsconfigs/strict",
  "include": [
    ".astro/types.d.ts",
    "**/*",
    "./worker-configuration.d.ts"
  ],
  "exclude": [
    "dist"
  ],
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": [
        "./src/*"
      ],
      "@components/*": [
        "./src/lib/components/*"
      ]
    }
  }
}
`,
      "components.json": `{
  "$schema": "https://shadcn-svelte.com/schema.json",
  "tailwind": {
    "css": "src/styles/global.css",
    "baseColor": "neutral"
  },
  "aliases": {
    "components": "@/lib/components",
    "utils": "@/lib/utils",
    "ui": "@/lib/components/ui",
    "hooks": "@/lib/hooks",
    "lib": "@/lib"
  },
  "typescript": true,
  "registry": "https://shadcn-svelte.com/registry"
}
`,
      "pnpm-workspace.yaml": `allowBuilds:
  esbuild: true
  workerd: true
`,
      ".gitignore": `node_modules/
dist/
.astro/
.wrangler/
.dev.vars
.env
worker-configuration.d.ts
.DS_Store
`,
      "src/env.d.ts": `/// <reference types="astro/client" />
`,
      "src/styles/global.css": globalCss,
      "src/lib/utils.ts": utilsTs,
      "src/lib/components/ModeToggle.svelte": modeToggle,
      "public/favicon.svg": `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" rx="8" fill="#111"/></svg>
`,
      "src/layouts/Layout.astro": `---
import "@/styles/global.css";

interface Props {
  title?: string;
}

const { title = "{{name}}" } = Astro.props;
---

<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width" />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <title>{title}</title>
    <script is:inline>
      // Apply the saved theme before first paint (mode-watcher takes over once hydrated)
      (function () {
        var mode = localStorage.getItem("mode-watcher-mode") || "system";
        var dark = mode === "dark" || (mode === "system" && matchMedia("(prefers-color-scheme: dark)").matches);
        document.documentElement.classList.toggle("dark", dark);
        document.documentElement.style.colorScheme = dark ? "dark" : "light";
      })();
    </script>
  </head>
  <body>
    <slot />
  </body>
</html>
`,
      "src/pages/index.astro": `---
import Layout from "@/layouts/Layout.astro";
import ModeToggle from "@components/ModeToggle.svelte";
${auth ? 'import AuthButtons from "@components/AuthButtons.svelte";\n' : ""}${auth ? "\nconst user = Astro.locals.user;\n" : ""}---

<Layout>
  <main class="mx-auto flex min-h-screen max-w-2xl flex-col gap-6 p-8">
    <header class="flex items-center justify-between">
      <h1 class="text-2xl font-semibold">{{name}}</h1>
      <ModeToggle client:load />
    </header>
    <p class="text-muted-foreground">Astro + Svelte + Cloudflare + Tailwind + shadcn-svelte.</p>
${auth ? '    <AuthButtons client:load userName={user?.name ?? null} />\n' : ""}  </main>
</Layout>
`,
    };
  },
};
