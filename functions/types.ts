import { EventContext, KVNamespace } from "@cloudflare/workers-types";

export interface Env {
  KVNamespace: KVNamespace;
  SUPABASE_URL: string;
  SUPABASE_ANON_KEY: string;
  VOYAGEAI_API_KEY: string;
}

export interface POSTRequestBody {
  authToken: string;
  referralCode: string;
}

export interface ValidationResult {
  isValid: boolean;
  gitHubUserId?: string;
  referralCode?: string;
}

export type Context = EventContext<Env, string, Record<string, string>>;
