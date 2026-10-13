import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthForm } from "@/components/auth/auth-form";
import { getSession } from "@/lib/permissions";
import { safeRedirectPath } from "@/lib/safe-redirect";

export const metadata: Metadata = { title: "Connexion · Orbit" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  // Déjà connecté : inutile d'afficher le formulaire.
  if (await getSession()) redirect(safeRedirectPath(next));
  return <AuthForm mode="login" next={next} />;
}
