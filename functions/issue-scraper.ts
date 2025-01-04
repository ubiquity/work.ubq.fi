import { Context } from "./types";

export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function onRequest(ctx: Context): Promise<Response> {
  const { request, env } = ctx;
  const url = new URL(request.url);

  try {
    switch (request.method) {
      case "GET":
        if (url.searchParams.has("key")) {
          const key = url.searchParams.get("key") as string;
          return new Response("GET request with key: " + key + JSON.stringify(env.SUPABASE_ANON_KEY), {
            headers: corsHeaders,
            status: 200,
          });
        }
        return new Response("GET request without key", {
          headers: corsHeaders,
          status: 200,
        });

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
