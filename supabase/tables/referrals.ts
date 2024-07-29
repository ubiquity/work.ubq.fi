import { SupabaseClient } from "@supabase/supabase-js";
import { SupaBase } from "./base";
import { Tables } from "../types";

export type ReferralRow = Tables<"referrals">;

export class Referral extends SupaBase {
  constructor(client: SupabaseClient) {
    super(client);
  }

  public async addReferall(referralCode: string, devGithub: string): Promise<void> {
    try {
      const { error } = await this.supabase.from("referrals").insert({ referral_code: referralCode, dev_github: devGithub });

      if (error) throw new Error(`Error saving referral: ${error.message}`);
    } catch (error) {
      if (error instanceof Error) {
        this.logger.error(error.message);
      }
      throw error;
    }
  }

  public async getReferral(referralCode: string): Promise<ReferralRow | null> {
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
      return referral !== null && referral.referral_code === referralCode;
    } catch (error) {
      if (error instanceof Error) {
        this.logger.error(error.message);
      }
      throw error;
    }
  }
}
