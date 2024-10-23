import { checkSupabaseSession } from "./rendering/render-github-login-button";
import { getReferralFromUser } from "./getters/get-github-referrals";

export async function trackReferralCode(devGitHubId: number) {
  const urlParams = new URLSearchParams(window.location.search);
  const refCode = urlParams.get("ref");

  if (refCode) {
    const oldRefCode = await getReferralFromUser(devGitHubId);

    if (!oldRefCode) {
      const url = "/referral-manager";

      const supabaseAuth = await checkSupabaseSession();

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          authToken: supabaseAuth.provider_token,
          referralCode: refCode,
        }),
      });

      if (response.status === 200) {
        const newURL = new URL(window.location.href);
        newURL.searchParams.delete("ref");
        window.history.pushState({}, "", newURL.toString());
      } else {
        console.error(`Failed to set referral. Status: ${response.status}`);
      }
    }
  }
}
