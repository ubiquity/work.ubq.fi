import { db } from "../../supabase";

export async function trackDevRelReferral(developerGithub: string): Promise<void> {
  try {
    const urlParams = new URLSearchParams(window.location.search);
    const referralCode = urlParams.get("ref");

    if (referralCode) {
      const isReferralExisting = await db.referrals.doesReferralExist(referralCode);

      if (!isReferralExisting) {
        await db.referrals.addReferall(referralCode, developerGithub);
      }
    }
  } catch (error) {
    console.error(`Error tracking referral: ${error}`);
  }
}
