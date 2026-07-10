import { ImageResponse } from "next/og";
import { pwaIconMark } from "@/lib/pwa-icon";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(pwaIconMark(180, { radius: 0.22 }), size);
}
