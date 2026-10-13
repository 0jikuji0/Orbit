import { Orbit } from "lucide-react";
import type { Metadata } from "next";
import { CreateWorkspaceForm } from "@/components/workspaces/create-workspace-form";
import { requireUser } from "@/lib/permissions";

export const metadata: Metadata = { title: "Nouvel espace de travail · Orbit" };

export default async function OnboardingPage() {
  const user = await requireUser();
  return (
    <div className="flex min-h-dvh items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex items-center gap-2 text-lg font-medium">
          <Orbit className="text-accent size-5" />
          Orbit
        </div>
        <div className="border-border bg-surface flex flex-col gap-4 border p-6">
          <div>
            <h1 className="text-base font-medium">Créer un espace de travail</h1>
            <p className="text-text-muted mt-1 text-sm">
              Bienvenue {user.name}. Un espace regroupe vos projets et votre équipe.
            </p>
          </div>
          <CreateWorkspaceForm />
        </div>
      </div>
    </div>
  );
}
