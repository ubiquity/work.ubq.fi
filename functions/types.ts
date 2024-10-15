import { EventContext, KVNamespace} from "@cloudflare/workers-types";

export interface Env {
    userToReferral: KVNamespace;
}

export type Context = EventContext<Env, string, Record<string, string> >;
