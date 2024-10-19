import { EventContext, KVNamespace, Request, IncomingRequestCfProperties } from "@cloudflare/workers-types";
import { OAuthToken } from "../src/home/getters/get-github-access-token";

export interface Env {
  KVNamespace: KVNamespace;
}

export interface POSTRequestBody {
  authToken: OAuthToken;
  referralCode: string;
}

export interface ValidationResult {
  isValid: boolean;
  githubUserId?: string;
  referralCode?: string;
}

export type Context = EventContext<Env, string, Record<string, string>>;

export type CustomRequest = Request<unknown, IncomingRequestCfProperties<unknown>>;
