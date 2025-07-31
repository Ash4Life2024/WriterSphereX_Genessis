/** @type {import('next').NextConfig} */
const nextConfig = {
  allowedDevOrigins: [
    'spock.replit.dev',
    '*.spock.replit.dev'
  ],
  experimental: {
    esmExternals: 'loose'
  },
  webpack: (config) => {
    config.externals = [
      ...config.externals,
      { canvas: "canvas" } // required to make pdfjs work
    ];
    return config;
  },
};

module.exports = nextConfig;
