import { validatePOST } from "./validators";

export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function handleReferralManager(request: Request, kv: Deno.Kv): Promise<Response> {
  const url = new URL(request.url);
  try {
    switch (request.method) {
      case "OPTIONS":
        return new Response(null, { headers: corsHeaders, status: 204 });

      case "POST":
        return await handleSet(kv, request);

      case "GET":
        if (url.searchParams.has("key")) {
          const key = url.searchParams.get("key") as string;
          return await handleGet(key, kv);
        } else {
          return await handleList();
        }

      default:
        return new Response("Method Not Allowed", { headers: corsHeaders, status: 405 });
    }
  } catch (error) {
    console.error("Error processing request:", error);
    return new Response("Internal Server Error", { headers: corsHeaders, status: 500 });
  }
}

async function handleSet(kv: Deno.Kv, request: Request): Promise<Response> {
  const result = await validatePOST(request);
  if (!result.isValid || !result.gitHubUser || !result.referralCode) {
    return new Response("Unauthorized", { headers: corsHeaders, status: 401 });
  }

  const { gitHubUser, referralCode } = result;
  const gitHubUserId = gitHubUser.id.toString();
  const key = ["referral", gitHubUserId] as const;
  const current = await kv.get<string>(key);
  if (current.value) {
    return new Response(`Key '${gitHubUserId}' already has a referral code: '${current.value}'`, {
      headers: corsHeaders,
      status: 409,
    });
  }

  // Ensure atomic creation only if absent
  const res = await kv.atomic().check(current).set(key, referralCode).commit();
  if (!res.ok) {
    return new Response(`Conflict setting referral for '${gitHubUserId}'`, { headers: corsHeaders, status: 409 });
  }

  return new Response(`Key '${gitHubUserId}' added with value '${referralCode}'`, { headers: corsHeaders, status: 200 });
}

async function handleGet(gitHubUserId: string, kv: Deno.Kv): Promise<Response> {
  const referral = await kv.get<string>(["referral", gitHubUserId]);
  if (referral.value) {
    return new Response(`Value for '${gitHubUserId}': ${referral.value}`, { headers: corsHeaders, status: 200 });
  }
  return new Response(`No value found for '${gitHubUserId}'`, { headers: corsHeaders, status: 404 });
}

async function handleList(): Promise<Response> {
  // Listing all referrals is restricted to prevent data leakage.
  // Return 403 to indicate forbidden access for unauthenticated requests.
  return new Response("Forbidden", { headers: corsHeaders, status: 403 });
}
