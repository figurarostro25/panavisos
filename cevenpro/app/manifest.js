export default function manifest() {
  return {
    name: "Cevenpro - Central de Ventas y Proyectos",
    short_name: "Cevenpro",
    description: "Panel y catálogo inmobiliario de Cevenpro.",
    start_url: "/admin",
    scope: "/",
    display: "standalone",
    background_color: "#edf5f7",
    theme_color: "#0b1d33",
    icons: [
      {
        src: "/brand/cevenpro-app-icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any"
      },
      {
        src: "/brand/cevenpro-app-icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any maskable"
      }
    ]
  };
}
