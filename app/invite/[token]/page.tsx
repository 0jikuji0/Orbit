import { Orbit } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { AcceptInvite } from "@/components/workspaces/accept-invite";
import { WORKSPACE_ROLE_LABELS } from "@/lib/roles";
import { getInvite } from "@/server/queries/workspaces";

export const metadata: Metadata = { title: "Invitation · Orbit" };

export default async function InvitePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const invite = await getInvite(token);

  return (
    <div className="flex min-h-dvh items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex items-center gap-2 text-lg font-medium">
          <Orbit className="text-accent size-5" />
          Orbit
        </div>
        <div className="border-border bg-surface flex flex-col gap-4 border p-6">
          {!invite || !invite.valid ? (
            <>
              <h1 className="text-base font-medium">Invitation invalide</h1>
              <p className="text-text-muted text-sm">
                Ce lien a expiré ou a été révoqué. Demandez-en un nouveau à un administrateur.
              </p>
              <Link href="/" className={buttonVariants()}>
                Retour à l&apos;accueil
              </Link>
            </>
          ) : invite.alreadyMember ? (
            <>
              <h1 className="text-base font-medium">Vous êtes déjà membre</h1>
              <p className="text-text-muted text-sm">
                de l&apos;espace « {invite.workspaceName} ».
              </p>
              <Link
                href={`/${invite.workspaceSlug}`}
                className={buttonVariants({ variant: "primary" })}
              >
                Ouvrir l&apos;espace
              </Link>
            </>
          ) : (
            <>
              <h1 className="text-base font-medium">Rejoindre « {invite.workspaceName} »</h1>
              <p className="text-text-muted text-sm">
                Vous êtes invité en tant que{" "}
                <span className="text-text">{WORKSPACE_ROLE_LABELS[invite.role]}</span>.
              </p>
              <AcceptInvite token={token} />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
