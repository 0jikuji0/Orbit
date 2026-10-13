import { Orbit } from "lucide-react";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { getSession } from "@/lib/permissions";

export default async function AuthLayout({ children }: { children: ReactNode }) {
  // Déjà connecté : inutile d'afficher connexion / inscription.
  if (await getSession()) redirect("/");

  return (
    <div className="flex min-h-dvh items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex items-center gap-2 text-lg font-medium">
          <Orbit className="text-accent size-5" />
          Orbit
        </div>
        <div className="border-border bg-surface border p-6">{children}</div>
      </div>
    </div>
  );
}
