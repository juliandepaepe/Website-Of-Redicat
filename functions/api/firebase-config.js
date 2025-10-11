// /functions/api/firebase-config.js
// Serves your Firebase Web config from Cloudflare env vars.
// Extra safety: blocks cross-site use (checks Host against ALLOWED_HOSTS)
// and disables caching.

const asList = (s) =>
  String(s || "")
    .split(",")
    .map(v => v.trim().toLowerCase())
    .filter(Boolean);

export async function onRequest({ request, env }) {
  const url = new URL(request.url);
  const host = (url.host || "").toLowerCase();

  // Comma-separated list, e.g. "redicat.me, *.pages.dev, redicat-a8376.web.app, redicat-a8376.firebaseapp.com"
  const allowedHosts = asList(env.ALLOWED_HOSTS || "");
  const ok = allowedHosts.some((h) => {
    if (h.startsWith("*.")) {
      const domain = h.slice(2);        // "*.pages.dev" -> "pages.dev"
      return host === domain || host.endsWith("." + domain);
    }
    return host === h;
  });

  if (!ok) {
    return new Response("Forbidden", { status: 403 });
  }

  const cfg = {
    apiKey: env.FIREBASE_API_KEY,
    authDomain: env.FIREBASE_AUTH_DOMAIN,
    projectId: env.FIREBASE_PROJECT_ID,
    storageBucket: env.FIREBASE_STORAGE_BUCKET,
    messagingSenderId: env.FIREBASE_MESSAGING_SENDER_ID,
    appId: env.FIREBASE_APP_ID,
    measurementId: env.FIREBASE_MEASUREMENT_ID
  };

  // Basic sanity (helps catch missing env var typos)
  if (!cfg.apiKey || !cfg.authDomain || !cfg.projectId || !cfg.appId) {
    return new Response("Misconfigured Firebase environment", { status: 500 });
  }

  return new Response(JSON.stringify(cfg), {
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store, no-cache, must-revalidate, max-age=0"
    }
  });
}
