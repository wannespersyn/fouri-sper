import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Fouri SPER",
    short_name: "Fouri SPER",
    description: "Menuplanning, groepen, activiteiten en boodschappen voor het scoutskamp.",
    start_url: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#efe9db",
    theme_color: "#243b2e",
    icons: [
      { src: "/pwa-icon-192", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/pwa-icon-512", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/pwa-icon-512-maskable", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
