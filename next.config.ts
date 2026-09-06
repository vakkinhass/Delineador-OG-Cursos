import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  // Permite que o app seja acessado por dominios externos (link oficial deployado)
  // sem bloquear recursos /_next/* no modo de desenvolvimento.
  allowedDevOrigins: [
    "https://delineadorogcursos.space-z.ai",
    "http://delineadorogcursos.space-z.ai",
  ],
};

export default nextConfig;
