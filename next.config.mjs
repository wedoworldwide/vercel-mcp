/** @type {import('next').NextConfig} */
const nextConfig = {
  // The upstream stdio server lives in src/ and uses ESM-style ".js" specifiers
  // that point at ".ts" files. Next resolves those only with an explicit alias.
  webpack: (config) => {
    config.resolve.extensionAlias = {
      ...(config.resolve.extensionAlias ?? {}),
      '.js': ['.ts', '.js'],
    };
    return config;
  },
  serverExternalPackages: ['mcp-handler', '@modelcontextprotocol/sdk', 'axios'],
};

export default nextConfig;
