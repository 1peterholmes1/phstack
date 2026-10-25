export type ModuleId = "d1" | "r2" | "auth";
export type R2Access = "binding" | "presigned" | "public";

export interface Ctx {
  name: string;
  modules: Set<ModuleId>;
  dbName: string;
  bucketName: string;
  r2Access: Set<R2Access>;
  compatDate: string;
  authSecret: string;
}

export interface PkgPartial {
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  scripts?: Record<string, string>;
}

export interface Module {
  id: string;
  pkg?: PkgPartial | ((ctx: Ctx) => PkgPartial);
  /** Fragment merged into wrangler.jsonc (arrays are concatenated). */
  wrangler?: (ctx: Ctx) => Record<string, unknown>;
  files: (ctx: Ctx) => Record<string, string>;
  /** Lines written to .dev.vars (secrets / local env). */
  devVars?: (ctx: Ctx) => Record<string, string>;
}
