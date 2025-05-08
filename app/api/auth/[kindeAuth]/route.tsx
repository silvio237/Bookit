import { handleAuth } from "@kinde-oss/kinde-auth-nextjs/server";

// Vous pouvez définir les cookies comme Secure et SameSite=None ici aussi
export const GET = handleAuth({
  cookies: {
    secure: true, // Activer en production
    sameSite: 'None', // Important pour cross-site
  },
});
