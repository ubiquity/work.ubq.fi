import { SupabaseClient } from "@supabase/supabase-js";
import { Logs } from "ubiquibot-logger";

export class SuperBase {
  protected supabase: SupabaseClient;
  public logger: Logs;

  constructor(supabase: SupabaseClient) {
    this.supabase = supabase;
    this.logger = {} as Logs;
  }
}
