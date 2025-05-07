/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https', // Utilise 'https' ou 'http' selon ton cas
        hostname: 'files.edgestore.dev', // Nom du domaine
        port: '', // Laisse vide si aucun port spécifique
        pathname: '/**', // Autorise tous les chemins sous ce domaine
      },
    ],
  },
};

export default nextConfig;
