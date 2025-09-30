/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  output: 'standalone',
  images: {
    domains: [
      'images.unsplash.com',
      'res.cloudinary.com',
      'cdn.pixabay.com',
      'images.pexels.com'
    ],
    formats: ['image/avif', 'image/webp']
  },
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1'
  },
  experimental: {
    optimizeCss: false
  },
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production'
  }
}

module.exports = nextConfig