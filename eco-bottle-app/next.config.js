/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['res.cloudinary.com', 'images.unsplash.com'],
  },
  async rewrites() {
    return [
      {
        source: '/api/v1/:path*',
        destination: process.env.NODE_ENV === 'production'
          ? 'https://your-backend-api.com/api/:path*'
          : 'http://localhost:5000/api/:path*',
      },
    ];
  },
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000',
  },
};

module.exports = nextConfig;