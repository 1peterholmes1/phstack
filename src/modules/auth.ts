import type { Module } from "../types.js";

const authSchema = String.raw`import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

export const user = sqliteTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: integer("email_verified", { mode: "boolean" }).default(false).notNull(),
  image: text("image"),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).$defaultFn(() => new Date()).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" })
    .$defaultFn(() => new Date())
    .$onUpdate(() => new Date())
    .notNull(),
});

export const session = sqliteTable("session", {
  id: text("id").primaryKey(),
  expiresAt: integer("expires_at", { mode: "timestamp_ms" }).notNull(),
  token: text("token").notNull().unique(),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).$defaultFn(() => new Date()).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" })
    .$defaultFn(() => new Date())
    .$onUpdate(() => new Date())
    .notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
});

export const account = sqliteTable("account", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: integer("access_token_expires_at", { mode: "timestamp_ms" }),
  refreshTokenExpiresAt: integer("refresh_token_expires_at", { mode: "timestamp_ms" }),
  scope: text("scope"),
  password: text("password"),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).$defaultFn(() => new Date()).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" })
    .$defaultFn(() => new Date())
    .$onUpdate(() => new Date())
    .notNull(),
});

export const verification = sqliteTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: integer("expires_at", { mode: "timestamp_ms" }).notNull(),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).$defaultFn(() => new Date()).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" })
    .$defaultFn(() => new Date())
    .$onUpdate(() => new Date())
    .notNull(),
});
`;

const authButtons = String.raw`<script lang="ts">
  import { authClient } from "@/lib/auth-client";
  import { Button } from "@/lib/components/ui/button/index.js";

  let { userName = null }: { userName?: string | null } = $props();

  const signIn = (provider: "github" | "google") =>
    authClient.signIn.social({ provider, callbackURL: "/" });

  const signOut = async () => {
    await authClient.signOut();
    window.location.reload();
  };
</script>

{#if userName}
  <div class="flex items-center gap-3">
    <span>Signed in as {userName}</span>
    <Button variant="outline" onclick={signOut}>Sign out</Button>
  </div>
{:else}
  <div class="flex gap-3">
    <Button onclick={() => signIn("github")}>Sign in with GitHub</Button>
    <Button variant="outline" onclick={() => signIn("google")}>Sign in with Google</Button>
  </div>
{/if}
`;

export const auth: Module = {
  id: "auth",
  pkg: { dependencies: { "better-auth": "^1.6.0" } },
  devVars: (ctx) => ({
    BETTER_AUTH_SECRET: ctx.authSecret,
    BETTER_AUTH_URL: "http://localhost:4321",
    GITHUB_CLIENT_ID: "",
    GITHUB_CLIENT_SECRET: "",
    GOOGLE_CLIENT_ID: "",
    GOOGLE_CLIENT_SECRET: "",
  }),
  files: () => ({
    "src/db/auth-schema.ts": authSchema,
    "src/lib/auth.ts": `import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { env } from "cloudflare:workers";
import { getDb, schema } from "@/db";

export function createAuth() {
  return betterAuth({
    baseURL: env.BETTER_AUTH_URL,
    secret: env.BETTER_AUTH_SECRET,
    database: drizzleAdapter(getDb(), { provider: "sqlite", schema }),
    socialProviders: {
      github: {
        clientId: env.GITHUB_CLIENT_ID,
        clientSecret: env.GITHUB_CLIENT_SECRET,
      },
      google: {
        clientId: env.GOOGLE_CLIENT_ID,
        clientSecret: env.GOOGLE_CLIENT_SECRET,
      },
    },
  });
}
`,
    "src/lib/auth-client.ts": `import { createAuthClient } from "better-auth/svelte";

export const authClient = createAuthClient();
`,
    "src/pages/api/auth/[...all].ts": `import type { APIRoute } from "astro";
import { createAuth } from "@/lib/auth";

export const prerender = false;

export const ALL: APIRoute = async ({ request }) => {
  return createAuth().handler(request);
};
`,
    "src/middleware.ts": `import { defineMiddleware } from "astro:middleware";
import { createAuth } from "@/lib/auth";

export const onRequest = defineMiddleware(async (context, next) => {
  const session = await createAuth().api.getSession({ headers: context.request.headers });
  context.locals.user = session?.user ?? null;
  context.locals.session = session?.session ?? null;
  return next();
});
`,
    "src/locals.d.ts": `import type { User, Session } from "better-auth";

declare global {
  namespace App {
    interface Locals {
      user: User | null;
      session: Session | null;
    }
  }
}
`,
    "src/lib/components/AuthButtons.svelte": authButtons,
  }),
};
