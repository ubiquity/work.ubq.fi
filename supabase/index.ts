import { Referral } from "./tables/referrals";
import { getSupabase } from "../src/home/rendering/render-github-login-button";

const supabase = getSupabase();

export const db = {
  referrals: new Referral(supabase),
};
