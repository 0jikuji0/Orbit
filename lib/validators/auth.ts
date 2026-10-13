import { z } from "zod";

export const PASSWORD_MIN_LENGTH = 8;

const email = z.email("Adresse e-mail invalide").trim().toLowerCase();

export const loginSchema = z.object({
  email,
  password: z.string().min(1, "Mot de passe requis"),
});

export const registerSchema = z.object({
  name: z.string().trim().min(1, "Nom requis").max(64, "64 caractères maximum"),
  email,
  password: z
    .string()
    .min(PASSWORD_MIN_LENGTH, `${PASSWORD_MIN_LENGTH} caractères minimum`)
    .max(128, "128 caractères maximum"),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
