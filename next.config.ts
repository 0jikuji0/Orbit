import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  // Pas d'optimisation d'images côté serveur (aucun usage de next/image) : image Docker plus légère.
  images: { unoptimized: true },
  // Dossier de build séparé pour les tests e2e : évite d'écraser `.next` du serveur de dev.
  distDir: process.env.NEXT_DIST_DIR || ".next",
};

export default nextConfig;
