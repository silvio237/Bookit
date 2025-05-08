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
  async headers() {
    return [
      {
        source: '/(.*)', // Applique cette règle à toutes les routes
        headers: [
          {
            key: 'Set-Cookie',
            value: 'Secure; SameSite=None; Path=/; HttpOnly', // Définition des cookies sécurisés
          },
        ],
      },
    ]
  },
}

export default nextConfig
