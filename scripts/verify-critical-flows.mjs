import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), "utf8");

const checks = [
  {
    file: "src/pages/CheckoutPage.tsx",
    needles: ["create_secure_order_v3", "p_items", "p_delivery_company_id", "trackingToken: createdOrder.tracking_token"],
    message: "Checkout must use the Genan secure order RPC and pass the tracking token into confirmation state.",
  },
  {
    file: "src/integrations/supabase/client.ts",
    needles: ["mwwyvmyeqlgccsnztvkm.supabase.co", "VITE_SUPABASE_URL", "VITE_SUPABASE_PUBLISHABLE_KEY"],
    message: "The storefront must target the Genan Supabase project.",
  },
  {
    file: "src/pages/ProductDetailPageBase.tsx",
    needles: ["VITE_GENAN_WHATSAPP_URL", "Genan", "product-json-ld"],
    message: "Product detail must use Genan branding and optional Genan WhatsApp configuration.",
  },
  {
    file: "src/pages/OrderTrackingPage.tsx",
    needles: ["VITE_GENAN_WHATSAPP_NUMBER", 'placeholder="GN-12345"', "get_order_tracking"],
    message: "Order tracking must use Genan order numbering and optional Genan contact configuration.",
  },
  {
    file: "src/pages/QRCodePage.tsx",
    needles: ["window.location.origin", "genan-qr.png", "GENAN"],
    message: "The QR page must use the current Genan deployment origin.",
  },
  {
    file: "functions/product/[slug].ts",
    needles: ["new URL(context.request.url).origin", "| Genan", "icons/app-icon-1024.png"],
    message: "Product social metadata must use the active Genan deployment origin.",
  },
  {
    file: "functions/sitemap.xml.ts",
    needles: ["new URL(request.url).origin", "products", "brands", "categories", "application/xml"],
    message: "The sitemap must use the active Genan deployment origin and include dynamic catalog routes.",
  },
  {
    file: "functions/api/build-health.ts",
    needles: ['service: "genan"', "2026-09-18-genan-bootstrap-1"],
    message: "Build health must identify Genan.",
  },
  {
    file: "src/components/Navbar.tsx",
    needles: ['@/components/Logo', "<Logo"],
    message: "Navigation must use the Genan wordmark component.",
  },
  {
    file: "src/components/HeroSlider.tsx",
    needles: ["A NEW CHAPTER", "GENAN EDIT", "FallbackHero"],
    message: "Home hero must keep the Genan fallback experience.",
  },
];

const forbiddenInRuntime = [
  "flamingoparkaden.com",
  "967778579777",
  "/icons/flamingo.jpeg",
  "Flamingo Park",
  "FLAMINGO PARK",
];

const runtimeRoots = ["src", "functions"];
const runtimeExtensions = new Set([".ts", ".tsx", ".js", ".mjs", ".html", ".css"]);

const walk = (dir) => {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const absolute = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...walk(absolute));
    else if (runtimeExtensions.has(path.extname(entry.name))) files.push(absolute);
  }
  return files;
};

let failures = 0;

for (const check of checks) {
  let source = "";
  try {
    source = read(check.file);
  } catch {
    console.error(`FAIL ${check.file}: file is missing.`);
    failures += 1;
    continue;
  }

  const normalized = source.toLowerCase();
  const missing = check.needles.filter((needle) => !normalized.includes(needle.toLowerCase()));
  if (missing.length) {
    console.error(`FAIL ${check.file}: ${check.message}`);
    console.error(`  Missing: ${missing.join(", ")}`);
    failures += 1;
    continue;
  }

  console.log(`PASS ${check.file}`);
}

for (const relativeRoot of runtimeRoots) {
  const absoluteRoot = path.join(root, relativeRoot);
  if (!fs.existsSync(absoluteRoot)) continue;

  for (const file of walk(absoluteRoot)) {
    const source = fs.readFileSync(file, "utf8");
    for (const forbidden of forbiddenInRuntime) {
      if (source.includes(forbidden)) {
        console.error(`FAIL ${path.relative(root, file)}: legacy Flamingo runtime reference found: ${forbidden}`);
        failures += 1;
      }
    }
  }
}

if (failures > 0) {
  console.error(`Genan critical flow verification failed with ${failures} issue(s).`);
  process.exit(1);
}

console.log("Genan critical flow verification passed.");
