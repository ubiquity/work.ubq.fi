import { EventContext, KVNamespace } from "@cloudflare/workers-types";
import { Request, IncomingRequestCfProperties } from "@cloudflare/workers-types";

export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export interface Env {
  userToReferral: KVNamespace;
}

export type Context = EventContext<Env, string, Record<string, string>>;

export type CustomRequest = Request<unknown, IncomingRequestCfProperties<unknown>>;
