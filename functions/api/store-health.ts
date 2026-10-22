// GENAN diagnostic endpoint for Cloudflare Pages (public information only).
// Confirms catalog connectivity without exposing private keys or order/customer data.
interface GenanEnv {
  SUPABASE_URL?: string;
  SUPABASE_PUBLISHABLE_KEY?: string;
  VITE_SUPABASE_URL?: string;
  VITE_SUPABASE_PUBLISHABLE_KEY?: string;
}
const EXPECTED_PROJECT = "ydpvfsemhbrkhtjjjwqs";
const FALLBACK_URL = `https://${EXPECTED_PROJECT}.supabase.co`;
// Publishable (not secret or service-role) key used by the Vite client fallback.
const FALLBACK_PUBLISHABLE_KEY = "sb_publishable_qxG8kmwCkPI4Xnbp6EXinA_61fpyBVD";
const headers = { "cache-control": "no-store", "content-type": "application/json; charset=utf-8" };

export const onRequestGet: PagesFunction<GenanEnv> = async ({ env }) => {
  const configuredUrl = String(env.SUPABASE_URL || env.VITE_SUPABASE_URL || "").trim();
  const configuredKey = String(env.SUPABASE_PUBLISHABLE_KEY || env.VITE_SUPABASE_PUBLISHABLE_KEY || "").trim();
  const configuredHost = (() => {
    try { return configuredUrl ? new URL(configuredUrl).hostname : ""; }
    catch { return "invalid"; }
  })();
  const staleDeletedProject = configuredHost === "mwwyvmyeqlgccsnztvkm.supabase.co";
  const url = !configuredUrl || staleDeletedProject ? FALLBACK_URL : configuredUrl;
  const key = !configuredKey || staleDeletedProject ? FALLBACK_PUBLISHABLE_KEY : configuredKey;
  const host = (() => {
    try { return new URL(url).hostname; } catch { return ""; }
  })();

  if (host !== `${EXPECTED_PROJECT}.supabase.co`) {
    return Response.json({
      ok: false,
      service: "genan",
      problem: "cloudflare_uses_wrong_supabase_project",
      expected_project_ref: EXPECTED_PROJECT,
      diagnostic_note: "Production frontend VITE_* variables must use this project.",
    }, { status: 503, headers });
  }

  const configurationSource = staleDeletedProject
    ? "deleted_project_override"
    : configuredUrl && configuredKey
      ? "runtime_environment"
      : "public_client_fallback";

  try {
    const catalog = new URL("/rest/v1/products", url);
    catalog.searchParams.set("select", "id");
    catalog.searchParams.set("is_active", "eq.true");
    catalog.searchParams.set("limit", "1");
    const res = await fetch(catalog.toString(), {
      headers: { apikey: key, accept: "application/json" },
      signal: AbortSignal.timeout(6000),
    });

    if (!res.ok) {
      return Response.json({
        ok: false,
        service: "genan",
        problem: "supabase_catalog_query_failed",
        upstream_status: res.status,
        configuration_source: configurationSource,
      }, { status: 503, headers });
    }

    const rows: unknown = await res.json();
    return Response.json({
      ok: true,
      service: "genan",
      supabase_connected: true,
      expected_project_ref: EXPECTED_PROJECT,
      configuration_source: configurationSource,
      catalog_has_active_products: Array.isArray(rows) && rows.length > 0,
      note: "Catalog connectivity only: this does not verify the frontend build, checkout, or admin access.",
    }, { status: 200, headers });
  } catch {
    return Response.json({
      ok: false,
      service: "genan",
      problem: "supabase_unreachable",
      configuration_source: configurationSource,
    }, { status: 503, headers });
  }
};
