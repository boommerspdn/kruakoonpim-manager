import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Order Management System",
    short_name: "Order Management System",
    description: "App to manage orders and menu for Order Management System",
    start_url: "/",
    display: "fullscreen",
    background_color: "#ffffff",
    theme_color: "#ff2056",
    orientation: "any",
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
