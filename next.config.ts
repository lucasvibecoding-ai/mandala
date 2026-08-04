import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Vercel's image-transformation quota is used up, so the optimizer is off
    // for good: public/ images are pre-sized to ~2x their slots and webp'd
    // (~/image-generation/manual_optimize_public.py). This also sidesteps the
    // Next 16 Turbopack dev /_next/image deadlock.
    unoptimized: true,
  },
};

export default nextConfig;
