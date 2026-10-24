import { createClient } from "npm:@supabase/supabase-js@2.112.0";

// TEMPORARY: Genan is testing password-only phone registration.
// Without phone ownership verification, users could register a number they do not own.
// Restore verification before accepting live customer orders.
const DEFAULT_ORIGINS = ["https://genan.pages.dev", "http://localhost:5173", "http://localhost:8080"];
const allowedOrigins = new Set(
  (Deno.env.get("ALLOWED_ORIGINS") || DEFAULT_ORIGINS.join(","))
    .split(",").map(x => x.trim()).filter(Boolean),
);
const headersFor = (origin: string | null) => ({
  "Access-Control-Allow-Origin": origin && allowedOrigins.has(origin) ? origin : DEFAULT_ORIGINS[0],
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Cache-Control": "no-store",
  Vary: "Origin",
});
const json = (body: unknown, status: number, origin: string | null) =>
  Response.json(body, { status, headers: headersFor(origin) });
const digitsToLatin = (input: string) =>
  input.replace(/[٠-٩]/g, d => String("٠١٢٣٤٥٦٧٨٩".indexOf(d)))
    .replace(/[۰-۹]/g, d => String("۰۱۲۳۴۵۶۷۸۹".indexOf(d)));
const countryDial: Record<string, string> = {
  YE: "+967", SA: "+966", AE: "+971", OM: "+968", QA: "+974",
  KW: "+965", BH: "+973", EG: "+20", JO: "+962", US: "+1",
  MY: "+60", GB: "+44", DE: "+49", NL: "+31", TR: "+90",
  IN: "+91", PK: "+92", ID: "+62", CN: "+86",
};
const digestKey = async (raw: string) => {
  const hash = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(raw));
  return Array.from(new Uint8Array(hash), b => b.toString(16).padStart(2, "0")).join("");
};

Deno.serve(async (req: Request) => {
  const origin = req.headers.get("origin");
  if (origin && !allowedOrigins.has(origin)) return json({ error: "Origin not allowed" }, 403, origin);
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: headersFor(origin) });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405, origin);
  const size = Number(req.headers.get("content-length") || 0);
  if (size > 4096) return json({ error: "الطلب كبير جداً." }, 413, origin);

  let body: Record<string, unknown>;
  try {
    const raw = await req.text();
    if (new TextEncoder().encode(raw).byteLength > 4096) return json({ error: "الطلب كبير جداً." }, 413, origin);
    body = JSON.parse(raw);
    if (!body || typeof body !== "object" || Array.isArray(body)) throw new Error("Invalid body");
  } catch {
    return json({ error: "بيانات التسجيل غير صالحة." }, 400, origin);
  }

  const name = typeof body.name === "string" ? body.name.trim().replace(/\s+/g, " ").slice(0, 100) : "";
  const region = typeof body.region === "string" ? body.region.trim().slice(0, 100) : "";
  const country = typeof body.country === "string" ? body.country.trim().toUpperCase() : "";
  const password = typeof body.password === "string" ? body.password : "";
  const phone = typeof body.phone === "string" ? digitsToLatin(body.phone).trim() : "";
  if (name.length < 2 || region.length < 2 || !countryDial[country] ||
      !/^\+[1-9]\d{7,14}$/.test(phone) || !phone.startsWith(countryDial[country]) ||
      password.length < 8 || new TextEncoder().encode(password).byteLength > 72) {
    return json({ error: "تحقق من الاسم ورقم الهاتف والمنطقة وكلمة المرور (8 أحرف على الأقل)." }, 400, origin);
  }

  const url = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !serviceKey) return json({ error: "خدمة التسجيل غير مهيأة." }, 503, origin);
  const service = createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // Best-effort abuse protection: shared hourly counters by phone and IP.
  // A CAPTCHA / actual phone verification is still required before public launch.
  const ip = req.headers.get("cf-connecting-ip")
    || req.headers.get("x-real-ip")
    || req.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    || "unknown";
  const phoneKey = await digestKey("genan:phone:" + phone);
  const ipKey = await digestKey("genan:ip:" + ip);
  for (const [key, maxAttempts] of [[ipKey, 15], [phoneKey, 4]] as const) {
    const { data: allowed, error } = await service.rpc("genan_signup_allowed", {
      p_key_hash: key, p_max_attempts: maxAttempts,
    });
    if (error) {
      console.error("Genan signup throttle unavailable:", error.message);
      return json({ error: "خدمة التسجيل غير متاحة حالياً." }, 503, origin);
    }
    if (allowed !== true) return json({ error: "محاولات تسجيل كثيرة، حاول لاحقاً." }, 429, origin);
  }

  // Admin API stores a salted password hash in auth.users and creates an
  // authenticated account immediately (NO SMS / OTP in this limited pilot).
  const { data: created, error: createError } = await service.auth.admin.createUser({
    phone, password, phone_confirm: true,
    user_metadata: {
      name, full_name: name, contact_phone: phone, country, region,
      customer_signup: "genan_customer",
    },
  });
  if (createError || !created.user) {
    return json({ error: "تعذر إنشاء الحساب. قد يكون الرقم مستخدماً بالفعل." }, 409, origin);
  }

  const { error: customerError } = await service.from("customers").insert({
    user_id: created.user.id, name, phone, country, region,
  });
  if (customerError) {
    console.error("Genan customer creation failed:", customerError.code);
    await service.auth.admin.deleteUser(created.user.id).catch(() => undefined);
    return json({ error: "تعذر إنشاء ملف العميل. حاول مرة أخرى." }, 500, origin);
  }

  return json({ ok: true }, 201, origin);
});
