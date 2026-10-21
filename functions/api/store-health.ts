// Runtime-only Cloudflare Pages smoke check. Never returns API keys or customer data.
// This does not certify payment or admin readiness.
interface GenanEnv {
  SUPABASE_URL?: string;
  SUPABASE_PUBLISHABLE_KEY?: string;
}
const EXPECTED_PROJECT = "ydpvfsemhbrkhtjjjwqs";
const headers = { "cache-control": "no-store", "content-type": "application/json; charset=utf-8" };
export const onRequestGet: PagesFunction<GenanEnv> = async ({ env }) => {
  const projectUrl = String(env.SUPABASE_URL || "").trim();
  const publishableKey = String(env.SUPABASE_PUBLISHABLE_KEY || "").trim();
  if (!projectUrl || !publishableKey) {
    return Response.json({
      ok: false, service: "genan", problem: "cloudflare_supabase_environment_missing",
      required: ["SUPABASE_URL", "SUPABASE_PUBLISHABLE_KEY"],
    }, { status: 503, headers });
  }
  let host: string;
  try { host = new URL(projectUrl).hostname; } catch { host = ""; }
  if (host !== `${EXPECTED_PROJECT}.supabase.co`) {
    return Response.json({
      ok: false, service: "genan", problem: "cloudflare_uses_wrong_supabase_project",
      expected_project_ref: EXPECTED_PROJECT,
    }, { status: 503, headers });
  }
  try {
    const url = new URL("/rest/v1/products", projectUrl);
    url.searchParams.set("select", "id");
    url.searchParams.set("is_active", "eq.true");
    url.searchParams.set("limit", "1");
    const result = await fetch(url.toString(), {
      headers: { apikey: publishableKey, accept: "application/json" },
      signal: AbortSignal.timeout(6000),
    });
    if (!result.ok) {
      return Response.json({
        ok: false, service: "genan", problem: "supabase_catalog_query_failed",
        upstream_status: result.status,
      }, { status: 503, headers });
    }
    const rows: unknown = await result.json();
    return Response.json({
      ok: true, service: "genan", supabase_connected: true,
      catalog_has_active_products: Array.isArray(rows) && rows.length > 0,
      release_note: "Infrastructure check only; production sales also require approved stock, pricing, admin and checkout tests.",
    }, { status: 200, headers });
  } catch {
    return Response.json({ ok: false, service: "genan", problem: "supabase_unreachable" }, { status: 503, headers });
  }
};
