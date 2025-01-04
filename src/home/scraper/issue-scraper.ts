import { checkSupabaseSession } from "../rendering/render-github-login-button";

export async function startIssueScraper(username: string) {
  const supabaseAuth = await checkSupabaseSession();

  // Get the last fetch timestamp
  const lastFetchKey = `lastFetch_${username}`;
  const lastFetch = localStorage.getItem(lastFetchKey);
  const now = Date.now();

  // Prepare the request payload
  const requestBody: { authToken: string; timestamp?: number } = {
    authToken: supabaseAuth.provider_token,
  };

  if (lastFetch) {
    const lastFetchTimestamp = Number(lastFetch);
    if (now - lastFetchTimestamp < 24 * 60 * 60 * 1000) {
      return JSON.stringify({
        success: true,
        message: "Skipping fetch - last fetch was less than 24 hours ago",
      });
    }
    requestBody.timestamp = lastFetchTimestamp;
  }

  // Send the request to the issue scraper endpoint
  const response = await fetch("/issue-scraper", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(requestBody),
  });

  if (response.status === 200) {
    // Update the last fetch timestamp in local storage
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
