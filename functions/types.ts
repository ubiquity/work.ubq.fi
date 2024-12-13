import { EventContext, KVNamespace } from "@cloudflare/workers-types";

export interface Env {
  REFERRAL_TRACKING: KVNamespace;
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
