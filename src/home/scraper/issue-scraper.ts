import { checkSupabaseSession } from "../rendering/render-github-login-button.ts";

async function fetchWithRetry(input: RequestInfo, init?: RequestInit, retries: number = 3): Promise<Response> {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(input, init);
      if (response.status < 500) return response; // Only retry on server errors

      const retryAfter = response.headers.get("Retry-After");
      if (retryAfter) {
        await new Promise((resolve) => setTimeout(resolve, parseInt(retryAfter) * 1000));
      } else {
        await new Promise((resolve) => setTimeout(resolve, Math.pow(2, i) * 1000));
      }
    } catch (error) {
      if (i === retries - 1) throw error;
      await new Promise((resolve) => setTimeout(resolve, Math.pow(2, i) * 1000));
    }
  }
  throw new Error("Max retries reached");
}

export async function startIssueScraper(username: string) {
  const supabaseAuth = await checkSupabaseSession();

  // Get the last fetch timestamp
  const lastFetchKey = `lastFetch_${username}`;
  const lastFetch = localStorage.getItem(lastFetchKey);
  const now = Date.now();

  // Prepare the request payload
  const requestBody: { authToken: string; timestamp?: number } = {
    authToken: supabaseAuth?.provider_token,
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

  try {
    const response = await fetchWithRetry(
      "/issue-scraper",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      },
      3
    );

    const responseData = await response.json().catch(() => null);

    if (responseData?.retryInfo) {
      const { source, retryAfter } = responseData.retryInfo;
      const minutes = Math.ceil(retryAfter / 60);
      return JSON.stringify({
        success: false,
        message: `Service temporarily unavailable (${source}). Retry in ${minutes}m.`,
      });
    }

    if (response.status === 200 && responseData?.success) {
      localStorage.setItem(lastFetchKey, now.toString());
      return JSON.stringify({
        success: true,
        message: "Successfully fetched issues",
      });
    }

    return JSON.stringify({
      success: false,
      message: responseData?.error || "Failed to fetch issues",
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Network error";
    return JSON.stringify({ success: false, message });
  }
}
