addEventListener('fetch', event => {
	event.respondWith(handleRequest(event.request));
});
  
const corsHeaders = {
	"Access-Control-Allow-Origin": "*",
};

async function handleRequest(request) {
	const url = new URL(request.url);

	if (url.pathname === '/set') {
			const key = url.searchParams.get('key');
			const value = url.searchParams.get('value');
			
			if(key && value) {
				await userToReferral.put(key, value);

				return new Response(`Key '${key}' added with value '${value}'`, { headers: corsHeaders, status: 200 });
			} else {
				return new Response('Missing key or value in query params', { headers: corsHeaders, status: 400 });
			}
	}

	if (url.pathname === '/get') {
			const key = url.searchParams.get('key');

			if (key) {
				const value = await userToReferral.get(key);

				return value ? 
					new Response(`Value for '${key}': ${value}`, { headers: corsHeaders, status: 200 }) : 
					new Response(`No value found for '${key}'`, { headers: corsHeaders, status: 404 });
			} else {
				return new Response('Missing key in query params', { headers: corsHeaders, status: 400 });
			}
	}

	if (url.pathname == '/list') {
			const keys = await userToReferral.list(); // get at max 1000 keys
			const keyValuePairs = {};

			for (const key of keys.keys) {
				const value = await userToReferral.get(key.name);
				keyValuePairs[key.name] = value; 
			}

			return new Response(JSON.stringify(keyValuePairs, null, 2), {
				headers: {...corsHeaders, 'Content-Type': 'application/json' },
			});
	}
	return new Response('Not Found', { headers: corsHeaders, status: 404 });
}