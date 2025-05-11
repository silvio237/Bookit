/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    domains: ['your-edgestore-bucket-name.edgestore.dev'], // 🔁 Remplace par le vrai domaine EdgeStore
  },
}

export default nextConfig
