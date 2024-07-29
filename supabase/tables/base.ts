import { SupabaseClient } from "@supabase/supabase-js";
import { Logs, LOG_LEVEL, LogLevel } from "@ubiquity-dao/ubiquibot-logger";

export class SupaBase {
  protected supabase: SupabaseClient;
  public logger: Logs;

  constructor(supabase: SupabaseClient, logLevel?: LogLevel) {
    this.supabase = supabase;
    this.logger = new Logs(logLevel || LOG_LEVEL.DEBUG);
  }
}
