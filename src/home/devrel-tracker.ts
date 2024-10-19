import { checkSupabaseSession } from "./rendering/render-github-login-button";

declare const WORKER_URL: string; // @DEV: passed in at build time check build/esbuild-build.ts

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
    const url = `${WORKER_URL}/tracker`;

    const authToken = await checkSupabaseSession();

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        authToken: authToken,
        referralCode: devRelCode,
      }),
    });

    if (response.status === 200) {
      localStorage.setItem("devRel", "done");
    } else {
      console.error(`Failed to set referral. Status: ${response.status}`);
    }
  }
}
