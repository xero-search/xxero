export default {
  async fetch(request, env) {
    const incoming = new URL(request.url);
    const braveUrl = new URL("https://api.search.brave.com/res/v1/web/search");

    for (const [key, value] of incoming.searchParams.entries()) {
      braveUrl.searchParams.set(key, value);
    }

    const upstream = await fetch(braveUrl, {
      method: "GET",
      headers: {
        "Accept": "application/json",
        "Cache-Control": "no-cache",
        "X-Subscription-Token": env.BRAVE_API_KEY
      }
    });

    return new Response(upstream.body, {
      status: upstream.status,
      headers: {
        "Content-Type": upstream.headers.get("Content-Type") || "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type"
      }
    });
  }
};
