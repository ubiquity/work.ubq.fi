export default {
	async fetch(request: Request, env: Env): Promise<Response> {
		return handleRequest(request, env);
	},
};
  
const corsHeaders: HeadersInit = {
		"Access-Control-Allow-Origin": "*",
};

async function handleRequest(request: Request, env: Env): Promise<Response> {
	try {
		const url = new URL(request.url);

		if (url.pathname === '/set') {
			const key = url.searchParams.get('key');
			const value = url.searchParams.get('value');

			if (key && value) {
					await env.myKVNamespace.put(key, value);
					return new Response(`Key '${key}' added with value '${value}'`, { headers: corsHeaders, status: 200 });
			} else {
					return new Response('Missing key or value in query params', { headers: corsHeaders, status: 400 });
			}
		}

		if (url.pathname === '/get') {
			const key = url.searchParams.get('key');

			if (key) {
					const value = await env.myKVNamespace.get(key);

					return value ? 
							new Response(`Value for '${key}': ${value}`, { headers: corsHeaders, status: 200 }) :
							new Response(`No value found for '${key}'`, { headers: corsHeaders, status: 404 });
			} else {
					return new Response('Missing key in query params', { headers: corsHeaders, status: 400 });
			}
		}

		if (url.pathname === '/list') {
			const keys = await env.myKVNamespace.list(); // Get a max of 1000 keys
			const keyValuePairs: Record<string, string | null> = {};

			for (const key of keys.keys) {
					const value = await env.myKVNamespace.get(key.name);
					keyValuePairs[key.name] = value;
			}

			return new Response(JSON.stringify(keyValuePairs, null, 2), {
					headers: { ...corsHeaders, 'Content-Type': 'application/json' },
			});
		}

		return new Response('Not Found', { headers: corsHeaders, status: 404 });

	} catch (error) {
		console.error('There was an error while processing your request.', error);
		return new Response('There was an error while processing your request.', { status: 500 });
	}
}