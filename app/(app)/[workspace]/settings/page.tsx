import { Settings } from "lucide-react";
import type { Metadata } from "next";
import { SettingsSection } from "@/components/layout/settings-section";
import { Topbar } from "@/components/layout/topbar";
import { InviteLinks } from "@/components/workspaces/invite-links";
import { WorkspaceMembers } from "@/components/workspaces/workspace-members";
import { WorkspaceNameForm } from "@/components/workspaces/workspace-name-form";
import { getWorkspaceSettings } from "@/server/queries/workspaces";

export const metadata: Metadata = { title: "Réglages · Orbit" };

export default async function WorkspaceSettingsPage({
  params,
}: {
  params: Promise<{ workspace: string }>;
}) {
  const { workspace: slug } = await params;
  const { user, workspace, isAdmin, invitableRoles, members, invites } =
    await getWorkspaceSettings(slug);

  return (
    <>
      <Topbar
        breadcrumb={
          <>
            <Settings className="text-text-muted size-4" />
            <span>Réglages de l&apos;espace</span>
          </>
        }
      />
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-2xl px-6">
          <SettingsSection title="Général">
            <WorkspaceNameForm slug={workspace.slug} name={workspace.name} canEdit={isAdmin} />
          </SettingsSection>
          <SettingsSection title="Membres" description={`${members.length} membre(s)`}>
            <WorkspaceMembers workspaceSlug={slug} currentUserId={user.id} members={members} />
          </SettingsSection>
          {isAdmin && (
            <SettingsSection
              title="Liens d'invitation"
              description="Toute personne disposant du lien peut rejoindre l'espace avec le rôle choisi, pendant 7 jours."
            >
              <InviteLinks workspaceSlug={slug} roles={invitableRoles} invites={invites} />
            </SettingsSection>
          )}
        </div>
      </div>
    </>
  );
}
