import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Railway runs a plain Node server; standalone keeps the image small.
  output: "standalone",
  cacheComponents: true,
  partialPrefetching: true,
  images: {
    // Uploaded images are served from the data volume by app/media.
    localPatterns: [{ pathname: "/media/**", search: "" }],
  },
};

export default nextConfig;
