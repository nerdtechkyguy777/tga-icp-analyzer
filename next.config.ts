import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Bundle seed data files into serverless output (Netlify read-only FS)
  outputFileTracingIncludes: {
    "/*": ["./data/**/*"],
    "/api/**/*": ["./data/**/*"],
    "/icp/**/*": ["./data/**/*"],
  },
};

export default nextConfig;
