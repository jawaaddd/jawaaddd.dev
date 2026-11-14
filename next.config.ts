import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Railway runs a plain Node server; standalone keeps the image small.
  output: "standalone",
  cacheComponents: true,
  partialPrefetching: true,
  experimental: {
    serverActions: {
      // The composer uploads photos (up to 15 MB each, see POST_LIMITS) through a server action.
      bodySizeLimit: "50mb",
    },
  },
  images: {
    // Uploaded images are served from the data volume by app/media.
    localPatterns: [{ pathname: "/media/**", search: "" }],
  },
};

export default nextConfig;
