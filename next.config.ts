import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  // Dossier de build séparé pour les tests e2e : évite d'écraser `.next` du serveur de dev.
  distDir: process.env.NEXT_DIST_DIR || ".next",
};

export default nextConfig;
