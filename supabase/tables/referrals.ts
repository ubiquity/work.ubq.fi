import { SupabaseClient } from "@supabase/supabase-js";
import { SupaBase } from "./base";
import { Database } from "../types";

export type ReferralInsert = Database["public"]["Tables"]["referrals"]["Insert"];

export class Referral extends SupaBase {
  constructor(client: SupabaseClient) {
    super(client);
  }

  public async addReferral(referral: ReferralInsert): Promise<void> {
    try {
      const { error } = await this.supabase.from("referrals").insert(referral);

      if (error) throw new Error(`Error saving referral: ${error.message}`);
    } catch (error) {
      if (error instanceof Error) {
        this.logger.error(error.message);
      }
      throw error;
    }
  }

  public async getReferral(referralCode: string): Promise<ReferralInsert | null> {
    try {
      const { data, error } = await this.supabase.from("referrals").select("*").eq("referral_code", referralCode).maybeSingle();

      if (error) throw new Error(`Error finding referral: ${error.message}`);
      return data ?? null;
    } catch (error) {
      if (error instanceof Error) {
        this.logger.error(error.message);
      }
      throw error;
    }
  }

  public async doesReferralExist(referralCode: string): Promise<boolean> {
    try {
      const referral = await this.getReferral(referralCode);
      return referral !== null && referral.referralCode === referralCode;
    } catch (error) {
      if (error instanceof Error) {
        this.logger.error(error.message);
      }
      throw error;
    }
  }
}
