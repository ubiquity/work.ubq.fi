import { checkSupabaseSession } from "./rendering/render-github-login-button";

export function initiateDevRelTracking() {
  const oldDevRelCode = localStorage.getItem("devRel");
  if (!oldDevRelCode) {
    const urlParams = new URLSearchParams(window.location.search);
    const devRelCode = urlParams.get("ref");
    if (devRelCode) {
      localStorage.setItem("devRel", devRelCode);
    }
  }
}

export async function trackDevRelReferral() {
  const devRelCode = localStorage.getItem("devRel");

  // key: user_id (devGitHubId), value: referral_id (devRelCode)
  if (devRelCode && devRelCode != "done") {
    const url = "/tracker";

    const supabaseAuth = await checkSupabaseSession();

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        authToken: supabaseAuth.provider_token,
        referralCode: devRelCode,
      }),
    });

    if (response.status === 200) {
      localStorage.setItem("devRel", "done");

      const newURL = new URL(window.location.href);
      newURL.searchParams.delete("ref");
      window.history.pushState({}, "", newURL.toString());
    } else {
      console.error(`Failed to set referral. Status: ${response.status}`);
    }
  }
}
