/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'api.cahoicoba.com',
        port: '',
        pathname: '/assets/**',
      },
      {
        protocol: 'https',
        hostname: '14.225.255.182',
        port: '',
        pathname: '/assets/**',
      },
      {
        protocol: 'https',
        hostname: 'via.placeholder.com',
        port: '',
        pathname: '/**',
      }
    ],
  },
  async rewrites() {
    return [
      {
        source: '/shop-api/:path*',
        destination: 'http://14.225.255.182:3000/shop-api/:path*',
      },
    ];
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Access-Control-Allow-Origin',
            value: '*',
          },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET, POST, PUT, DELETE, OPTIONS',
          },
          {
            key: 'Access-Control-Allow-Headers',
            value: 'Content-Type, Authorization, X-Requested-With',
          },
          {
            key: 'Access-Control-Allow-Credentials',
            value: 'true',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload'
          }
        ],
      },
    ];
  },
  server: {
    https: {
      key: process.env.HTTPS_KEY_PATH,
      cert: process.env.HTTPS_CERT_PATH,
    },
  },
};

module.exports = nextConfig; 