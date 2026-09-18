const RELEASE_ID = "2026-09-18-genan-bootstrap-1";

export const onRequestGet: PagesFunction = async () => {
  return Response.json(
    {
      ok: true,
      release: RELEASE_ID,
      service: "genan",
      build_verified_by: "cloudflare-pages",
    },
    {
      status: 200,
      headers: {
        "cache-control": "no-store",
      },
    },
  );
};
