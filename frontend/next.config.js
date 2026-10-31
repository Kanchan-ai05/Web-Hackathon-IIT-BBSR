/** @type {import('next').NextConfig} */
const isGithubPages = process.env.GITHUB_PAGES === "true";
const repoName = "/Web-Hackathon-IIT-BBSR";

const nextConfig = {
  reactStrictMode: true,
  output: isGithubPages ? "export" : undefined,
  basePath: isGithubPages ? repoName : "",
  assetPrefix: isGithubPages ? `${repoName}/` : undefined,
  images: {
    unoptimized: true,
  },
  trailingSlash: true,
  swcMinify: false,
  experimental: {
    cpus: 1,
    workerThreads: false,
  },
  ...(isGithubPages
    ? {}
    : {
        async rewrites() {
          const backendTarget =
            process.env.BACKEND_PROXY_URL || "https://cit-scheduling-api.onrender.com";
          return [
            {
              source: "/api/:path*",
              destination: `${backendTarget}/api/:path*`,
            },
            {
              source: "/exports/:path*",
              destination: `${backendTarget}/exports/:path*`,
            },
            {
              source: "/docs",
              destination: `${backendTarget}/docs`,
            },
            {
              source: "/openapi.json",
              destination: `${backendTarget}/openapi.json`,
            },
          ];
        },
      }),
};

module.exports = nextConfig;
