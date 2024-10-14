import { corsHeaders } from "./helpers";

export async function onRequest(ctx) {
  const { request, env } = ctx;

  const url = new URL(request.url);

  try {
    switch (request.method) {
      case "POST":
        return handleSet(url, env);

      case "GET":
        if (url.searchParams.has("key")) {
          return handleGet(url.searchParams.get("key"), env);
        } else {
          return handleList(env);
        }

      default:
        return new Response("Method Not Allowed", { headers: corsHeaders, status: 405 });
    }
  } catch (error) {
    console.error("Error processing request:", error);
    return new Response("Internal Server Error", { headers: corsHeaders, status: 500 });
  }
}

async function handleSet(url, env) {
  const key = url.searchParams.get("key");
  const value = url.searchParams.get("value");

  if (key && value) {
    await env.userToReferral.put(key, value);
    return new Response(`Key '${key}' added with value '${value}'`, { headers: corsHeaders, status: 200 });
  }
  return new Response("Missing key or value", { headers: corsHeaders, status: 400 });
}

async function handleGet(key, env) {
  const value = await env.userToReferral.get(key);
  if (value) {
    return new Response(`Value for '${key}': ${value}`, { headers:corsHeaders, status: 200 });
  }
  return new Response(`No value found for '${key}'`, { headers: corsHeaders, status: 404 });
}

async function handleList(env) {
  const keys = await env.userToReferral.list();
  const keyValuePairs = {};

  for (const key of keys.keys) {
    keyValuePairs[key.name] = await env.userToReferral.get(key.name);
  }

  return new Response(JSON.stringify(keyValuePairs, null, 2), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
  