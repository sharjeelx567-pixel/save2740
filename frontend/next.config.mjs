/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: true,
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '5000',
        pathname: '/**',
      },
    ],
  },
  experimental: {
    optimizePackageImports: ['lucide-react', 'recharts', 'date-fns', 'framer-motion'],
  },
  // Reduce logging in development
  logging: {
    fetches: {
      fullUrl: false,
    },
  },
  // Optimize CSS
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  // Disable automatic prefetching for all links (can be overridden per Link)
  onDemandEntries: {
    maxInactiveAge: 60 * 1000, // 1 minute
    pagesBufferLength: 5, // Only keep 5 pages in memory
  },
  async redirects() {
    const policySlugs = [
      'privacy-policy',
      'terms-conditions',
      'savings-challenge-disclaimer',
      'subscription-refund-policy',
      'affiliate-referral-policy',
    ];
    return policySlugs.map((slug) => ({
      source: `/${slug}`,
      destination: `/policy/${slug}`,
      permanent: true,
    }));
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${process.env.NEXT_PUBLIC_API_URL || 'https://save-2740-backend.vercel.app'}/api/:path*`,
      },
    ]
  },
}

export default nextConfig
