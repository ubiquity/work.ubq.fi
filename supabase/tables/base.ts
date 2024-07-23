import { SupabaseClient } from "@supabase/supabase-js";

export class SuperBase {
  protected supabase: SupabaseClient;

  constructor(supabase: SupabaseClient) {
    this.supabase = supabase;
  }
}
