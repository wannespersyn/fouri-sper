import { ImageResponse } from "next/og";
import { pwaIconMark } from "@/lib/pwa-icon";

export const dynamic = "force-static";

export async function GET() {
  return new ImageResponse(pwaIconMark(192), { width: 192, height: 192 });
}
