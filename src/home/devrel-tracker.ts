import { db } from "../../supabase";
import { ReferralInsert } from "../../supabase/tables/referrals";

export function initiateDevRelTracking() {
  const oldDevRelCode = localStorage.getItem("ref");
  if (!oldDevRelCode) {
    const urlParams = new URLSearchParams(window.location.search);
    const devRelCode = urlParams.get("ref");
    if (devRelCode) {
      localStorage.setItem("ref", devRelCode);
    }
  }
}

export async function trackDevRelReferral(referral: ReferralInsert): Promise<void> {
  try {
    if (referral.referralCode && referral.referralCode !== "done") {
      const isReferralExisting = await db.referrals.doesReferralExist(referral.referralCode);

      if (!isReferralExisting) {
        await db.referrals.addReferral(referral);

        localStorage.setItem("ref", "done");
      }
    }
  } catch (error) {
    console.error(`Error tracking referral: ${error}`);
  }
}
