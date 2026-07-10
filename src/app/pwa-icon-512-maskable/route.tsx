import { ImageResponse } from "next/og";
import { pwaIconMark } from "@/lib/pwa-icon";

export const dynamic = "force-static";

// Maskable icons are cropped into arbitrary shapes by the OS, so the mark
// needs a bigger safe-zone margin and must fill the canvas edge-to-edge
// (no rounding — the OS applies its own mask shape).
export async function GET() {
  return new ImageResponse(pwaIconMark(512, { padding: 0.3, radius: 0 }), { width: 512, height: 512 });
}
