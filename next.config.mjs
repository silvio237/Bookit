/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
      domains: ['files.edgestore.dev'],
    },
    typescript: {
      // ⚠️ Ignore les erreurs TypeScript au build (à utiliser avec prudence)
      ignoreBuildErrors: true,
    },
    eslint: {
      // ⚠️ Ignore les erreurs ESLint au build
      ignoreDuringBuilds: true,
    },
  }
  
  export default nextConfig
  