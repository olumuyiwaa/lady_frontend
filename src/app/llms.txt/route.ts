import { headers } from "next/headers";
import { getStorefrontServer } from "@/app/api/storefront.server";
import { buildLlmsTxt } from "@/lib/llmsTxt";

export async function GET() {
  const h = await headers();
  const slug = h.get("x-tenant-slug");
  const host = h.get("x-forwarded-host") || h.get("host") || "";
  const proto = h.get("x-forwarded-proto")?.split(",")[0].trim() || (/^(localhost|127\.)/.test(host) ? "http" : "https");
  const data = slug ? await getStorefrontServer(slug).catch(() => null) : null;
  if (!data) return new Response("Not found", { status: 404 });
  return new Response(buildLlmsTxt(data, `${proto}://${host}`), {
    headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "public, max-age=3600" },
  });
}
