import { Env, Context, CustomRequest } from "./types";
import { validatePOST } from "./validators";

export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function onRequest(ctx: Context): Promise<Response> {
  const { request, env } = ctx;

  const url = new URL(request.url);

  try {
    switch (request.method) {
      case "OPTIONS":
        return new Response(null, {
          headers: corsHeaders,
          status: 204,
        });

      case "POST":
        return await handleSet(url, env, request);

      case "GET":
        if (url.searchParams.has("key")) {
          const keyParam = url.searchParams.get("key") as string;
          return await handleGet(keyParam, env);
        } else {
          return await handleList(env);
        }

      default:
        return new Response("Method Not Allowed", {
          headers: corsHeaders,
          status: 405,
        });
    }
  } catch (error) {
    console.error("Error processing request:", error);
    return new Response("Internal Server Error", {
      headers: corsHeaders,
      status: 500,
    });
  }
}

async function handleSet(url: URL, env: Env, request: CustomRequest): Promise<Response> {
  const key = url.searchParams.get("key");
  const value = url.searchParams.get("value");

  if (key && value) {
    const isValid = await validatePOST(url, request);

    if (!isValid) {
      return new Response("Unauthorized", {
        headers: corsHeaders,
        status: 400,
      });
    }

    await env.userToReferral.put(key, value);
    return new Response(`Key '${key}' added with value '${value}'`, {
      headers: corsHeaders,
      status: 200,
    });
  }
  return new Response("Missing key or value", {
    headers: corsHeaders,
    status: 400,
  });
}

async function handleGet(key: string, env: Env): Promise<Response> {
  const value = await env.userToReferral.get(key);
  if (value) {
    return new Response(`Value for '${key}': ${value}`, {
      headers: corsHeaders,
      status: 200,
    });
  }
  return new Response(`No value found for '${key}'`, {
    headers: corsHeaders,
    status: 404,
  });
}

async function handleList(env: Env): Promise<Response> {
  const keys = await env.userToReferral.list();
  const keyValuePairs: Record<string, string | null> = {};

  for (const key of keys.keys) {
    keyValuePairs[key.name] = await env.userToReferral.get(key.name);
  }

  return new Response(JSON.stringify(keyValuePairs, null, 2), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
