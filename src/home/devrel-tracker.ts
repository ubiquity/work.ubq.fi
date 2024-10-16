import { getGitHubAccessToken } from "./getters/get-github-access-token";
import { corsHeaders } from "../../functions/types";

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

export async function trackDevRelReferral(devGitHubId: number) {
  const devRelCode = localStorage.getItem("devRel");

  // key: user_id (devGitHubId), value: referral_id (devRelCode)
  if (devRelCode && devRelCode != "done") {
    const url = `${WORKER_URL}/tracker?key=${encodeURIComponent(devGitHubId)}&value=${encodeURIComponent(devRelCode)}`;

    const accessToken = await getGitHubAccessToken();

    const response = await fetch(url, {
      method: "POST",
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(accessToken),
    });

    if (response.status === 200) {
      localStorage.setItem("devRel", "done");
    } else {
      console.error(`Failed to set referral. Status: ${response.status}`);
    }
  }
}
