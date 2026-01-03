import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { isServer, webpack }) => {
    if (!isServer) {
      // For client builds, replace direct API module with a stub
      // This prevents webpack from trying to bundle Node.js dependencies
      config.plugins.push(
        new webpack.NormalModuleReplacementPlugin(
          /lib\/api\/direct\.ts$/,
          path.resolve(__dirname, 'lib/api/direct-stub.ts')
        )
      );

      // Provide fallbacks for Node.js built-ins
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: false,
        stream: false,
        url: false,
        zlib: false,
        http: false,
        https: false,
        assert: false,
        os: false,
        path: false,
      };
    }
    return config;
  },
};

// Conditional static export for Tauri desktop app
if (process.env.BUILD_MODE === 'tauri') {
  nextConfig.output = 'export';
  nextConfig.images = {
    unoptimized: true,
  };
  nextConfig.trailingSlash = true;
}

export default nextConfig;
