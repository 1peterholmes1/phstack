import type { Module } from "../types.js";

export const r2: Module = {
  id: "r2",
  pkg: (ctx) => (ctx.r2Access.has("presigned") ? { dependencies: { aws4fetch: "^1.0.20" } } : {}),
  wrangler: (ctx) => ({
    r2_buckets: [{ binding: "BUCKET", bucket_name: ctx.bucketName }],
  }),
  devVars: (ctx): Record<string, string> =>
    ctx.r2Access.has("presigned")
      ? { R2_ACCOUNT_ID: "", R2_ACCESS_KEY_ID: "", R2_SECRET_ACCESS_KEY: "" }
      : {},
  files: (ctx) => {
    const files: Record<string, string> = {};
    const auth = ctx.modules.has("auth");

    if (ctx.r2Access.has("binding")) {
      const guard = auth
        ? `  if (!locals.user) return new Response("Unauthorized", { status: 401 });\n`
        : "";
      files["src/pages/api/files/[...key].ts"] = `import type { APIRoute } from "astro";
import { env } from "cloudflare:workers";

export const prerender = false;

export const GET: APIRoute = async ({ params }) => {
  const object = await env.BUCKET.get(params.key!);
  if (!object) return new Response("Not found", { status: 404 });
  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set("etag", object.httpEtag);
  return new Response(object.body as unknown as BodyInit, { headers });
};

export const PUT: APIRoute = async ({ params, request, locals }) => {
${guard}  await env.BUCKET.put(params.key!, request.body as unknown as ReadableStream, {
    httpMetadata: { contentType: request.headers.get("content-type") ?? undefined },
  });
  return Response.json({ key: params.key });
};

export const DELETE: APIRoute = async ({ params, locals }) => {
${guard}  await env.BUCKET.delete(params.key!);
  return new Response(null, { status: 204 });
};
`;
    }

    if (ctx.r2Access.has("presigned")) {
      files["src/lib/r2-presign.ts"] = `import { AwsClient } from "aws4fetch";
import { env } from "cloudflare:workers";

const BUCKET = "{{bucketName}}";

/**
 * Create a presigned URL for direct browser uploads/downloads.
 * Requires an R2 API token (R2_ACCESS_KEY_ID / R2_SECRET_ACCESS_KEY) and a CORS
 * policy on the bucket that allows your site's origin.
 */
export async function presignR2Url(key: string, method: "GET" | "PUT" = "PUT", expiresIn = 900) {
  const client = new AwsClient({
    accessKeyId: env.R2_ACCESS_KEY_ID,
    secretAccessKey: env.R2_SECRET_ACCESS_KEY,
    service: "s3",
    region: "auto",
  });
  const url = new URL("https://" + env.R2_ACCOUNT_ID + ".r2.cloudflarestorage.com/" + BUCKET + "/" + key);
  url.searchParams.set("X-Amz-Expires", String(expiresIn));
  const signed = await client.sign(new Request(url, { method }), { aws: { signQuery: true } });
  return signed.url;
}
`;
    }

    if (ctx.r2Access.has("public")) {
      files["src/lib/r2-public.ts"] = `/** Public URL for objects served through the bucket's custom domain / r2.dev URL. */
export function r2PublicUrl(key: string) {
  const base = (import.meta.env.PUBLIC_R2_URL ?? "").replace(/\\/$/, "");
  return base + "/" + key;
}
`;
      files[".env"] = `# Public base URL of the R2 bucket (custom domain or r2.dev URL)
PUBLIC_R2_URL=
`;
    }
    return files;
  },
};

