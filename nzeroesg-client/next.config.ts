const path = require("path");

module.exports = {
  webpack: (config: any) => {
    config.resolve.alias['@'] = path.resolve(__dirname);
    return config;
  },
};

// import type { NextConfig } from "next";

// const nextConfig: NextConfig = {
//   async rewrites() {
//     return [
//       // {
//       //   source: '/user-portal',
//       //   destination: '/pages/user-portal', 
//       // }
//       // {
//       //   source: "/api/chat",
//       //   destination: `${process.env.NEXT_PUBLIC_BACKEND_URL}/chat`, // Proxy to Backend
//       // },
//       // {
//       //   source: "/api/health",
//       //   destination: `${process.env.NEXT_PUBLIC_BACKEND_URL}/health`, // Proxy to Backend
//       // },
//     ];
//   }
// };

// export default nextConfig;
