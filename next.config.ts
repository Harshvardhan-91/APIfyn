import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@apifyn/database"],
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "github.githubassets.com" },
      { protocol: "https", hostname: "a.slack-edge.com" },
      { protocol: "https", hostname: "ssl.gstatic.com" },
      { protocol: "https", hostname: "www.notion.so" },
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
      { protocol: "https", hostname: "platform-lookaside.fbsbx.com" },
    ],
  },
};

export default nextConfig;
