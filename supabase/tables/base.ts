import { SupabaseClient } from "@supabase/supabase-js";
import { Logs } from "@ubiquity-dao/ubiquibot-logger";

export class SupaBase {
  protected supabase: SupabaseClient;
  public logger: Logs;

  constructor(supabase: SupabaseClient) {
    this.supabase = supabase;
    this.logger = {} as Logs;
  }
}
