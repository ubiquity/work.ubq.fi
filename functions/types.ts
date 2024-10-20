import { EventContext, KVNamespace } from "@cloudflare/workers-types";

export interface Env {
  KVNamespace: KVNamespace;
}

export interface POSTRequestBody {
  authToken: string;
  referralCode: string;
}

export interface ValidationResult {
  isValid: boolean;
  githubUserId?: string;
  referralCode?: string;
}

export type Context = EventContext<Env, string, Record<string, string>>;
