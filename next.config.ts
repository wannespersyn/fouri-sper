import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // Default is 1mb — phone camera photos (streepjes-profielfoto's) routinely
      // exceed that and fail the upload with a 500 before the action even runs.
      bodySizeLimit: "10mb",
    },
  },
};

export default nextConfig;
