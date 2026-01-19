import { NextResponse } from "next/server";
import { getSetting } from "@/lib/db/queries";

export const dynamic = "force-dynamic";

let cached: {
  url: string;
  body: ArrayBuffer;
  contentType: string;
  expiresAt: number;
} | null = null;

export async function GET(request: Request) {
  let target = "/icon.svg";
  try {
    const logo = await getSetting("shop_logo");
    if (logo?.trim()) {
      target = logo.trim();
    }
  } catch {
    // best effort
  }

  const url = target.startsWith("http://") || target.startsWith("https://")
    ? target
    : new URL(target, request.url).toString();

  try {
    const now = Date.now();
    if (cached && cached.url === url && cached.expiresAt > now) {
      return new NextResponse(cached.body, {
        status: 200,
        headers: {
          "Content-Type": cached.contentType,
          "Cache-Control": "public, max-age=86400, stale-while-revalidate=3600",
        },
      });
    }

    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) throw new Error("fetch_failed");
    const contentType = res.headers.get("content-type") || "image/png";
    const body = await res.arrayBuffer();
    cached = {
      url,
      body,
      contentType,
      expiresAt: now + 6 * 60 * 60 * 1000,
    };
    return new NextResponse(body, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=86400, stale-while-revalidate=3600",
      },
    });
  } catch {
    const fallbackUrl = new URL("/icon.svg", request.url).toString();
    const fallbackRes = await fetch(fallbackUrl, { cache: "force-cache" });
    const contentType = fallbackRes.headers.get("content-type") || "image/svg+xml";
    const body = await fallbackRes.arrayBuffer();
    if (!cached) {
      cached = {
        url: fallbackUrl,
        body,
        contentType,
        expiresAt: Date.now() + 6 * 60 * 60 * 1000,
      };
    }
    return new NextResponse(body, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=86400, stale-while-revalidate=3600",
      },
    });
  }
}
