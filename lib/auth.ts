import "server-only";
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";
import { db } from "./db";
import { PASSWORD_MIN_LENGTH } from "./validators/auth";

export const auth = betterAuth({
  appName: "Orbit",
  database: prismaAdapter(db, { provider: "postgresql" }),
  emailAndPassword: {
    enabled: true,
    minPasswordLength: PASSWORD_MIN_LENGTH,
    autoSignIn: true,
  },
  user: { fields: { image: "avatarUrl" } },
  // Limitation anti-bruteforce (active par défaut en production) ; désactivable pour les tests e2e.
  ...(process.env.AUTH_RATE_LIMIT_DISABLED === "1" && { rateLimit: { enabled: false } }),
  session: {
    expiresIn: 60 * 60 * 24 * 30, // 30 jours
    updateAge: 60 * 60 * 24, // prolongée au plus une fois par jour
  },
  // Doit rester le dernier plugin : pose les cookies depuis les server actions.
  plugins: [nextCookies()],
});
