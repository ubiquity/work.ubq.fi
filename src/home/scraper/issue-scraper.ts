import { checkSupabaseSession } from "../rendering/render-github-login-button";

export async function startIssueScraper(username: string) {
  const supabaseAuth = await checkSupabaseSession();

  // Check if 24 hours have passed since last fetch
  const lastFetchKey = `lastFetch_${username}`;
  const lastFetch = localStorage.getItem(lastFetchKey);
  const now = Date.now();

  if (lastFetch && now - Number(lastFetch) < 24 * 60 * 60 * 1000) {
    return JSON.stringify({
      success: true,
      message: "Skipping fetch - last fetch was less than 24 hours ago",
    });
  }

  const response = await fetch("/issue-scraper", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      authToken: supabaseAuth.provider_token,
    }),
  });

  if (response.status === 200) {
    localStorage.setItem(lastFetchKey, now.toString());
    return JSON.stringify({
      success: true,
      message: "Successfully fetched issues",
    });
  } else {
    return JSON.stringify({
      success: false,
      message: `Failed to fetch issues. Status: ${response.status}`,
    });
  }
}
