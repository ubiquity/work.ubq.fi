import { EventContext, KVNamespace } from "@cloudflare/workers-types";
import { GitHubUser } from "../src/home/github-types";

export interface Env {
  KVNamespace: KVNamespace;
  SUPABASE_URL: string;
  SUPABASE_ANON_KEY: string;
  SUPABASE_KEY: string;
  VOYAGEAI_API_KEY: string;
}

export interface POSTRequestBody {
  authToken: string;
  referralCode: string;
  timestamp: number;
}

export interface ValidationResult {
  isValid: boolean;
  gitHubUser?: GitHubUser;
  referralCode?: string;
  authToken?: string;
  timestamp?: number;
}

export type Context = EventContext<Env, string, Record<string, string>>;
