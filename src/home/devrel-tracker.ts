import { db } from "../../supabase";

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

export async function trackDevRelReferral(developerGithub: string): Promise<void> {
  try {
    const referralCode = localStorage.getItem("ref");

    if (referralCode && referralCode !== "done") {
      const isReferralExisting = await db.referrals.doesReferralExist(referralCode);

      if (!isReferralExisting) {
        await db.referrals.addReferall(referralCode, developerGithub);

        localStorage.setItem("ref", "done");
      }
    }
  } catch (error) {
    console.error(`Error tracking referral: ${error}`);
  }
}
