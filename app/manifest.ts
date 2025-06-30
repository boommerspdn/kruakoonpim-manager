import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Kruakoonpim",
    short_name: "Kruakoonpim",
    description: "App to manage orders and menu for Kruakoonpim",
    start_url: "/",
    display: "fullscreen",
    background_color: "#ffffff",
    theme_color: "#ff2056",
    icons: [
      {
        src: "/icon-192x192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icon-512x512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}
