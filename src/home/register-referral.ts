import { checkSupabaseSession } from "./rendering/render-github-login-button";

export function initiateReferralCodeTracking() {
  const oldRefCode = localStorage.getItem("ref");
  if (!oldRefCode) {
    const urlParams = new URLSearchParams(window.location.search);
    const refCode = urlParams.get("ref");
    if (refCode) {
      localStorage.setItem("ref", refCode);
    }
  }
}

export async function trackReferralCode() {
  const refCode = localStorage.getItem("ref");

  if (refCode && refCode != "done") {
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
      localStorage.setItem("ref", "done");

      const newURL = new URL(window.location.href);
      newURL.searchParams.delete("ref");
      window.history.pushState({}, "", newURL.toString());
    } else {
      console.error(`Failed to set referral. Status: ${response.status}`);
    }
  }
}
