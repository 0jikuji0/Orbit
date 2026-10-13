"use client";

import type { ProjectRole, WorkspaceRole } from "@prisma/client";
import { UserMinus, UserPlus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { FormError } from "@/components/ui/field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tooltip } from "@/components/ui/tooltip";
import type { ActionResult } from "@/lib/action";
import { PROJECT_ROLE_LABELS, PROJECT_ROLES } from "@/lib/roles";
import {
  addProjectMember,
  removeProjectMember,
  updateProjectMember,
} from "@/server/actions/project-members";

type Member = {
  id: string;
  name: string;
  email: string;
  avatarUrl: string | null;
  role: ProjectRole;
};
type Candidate = { id: string; name: string; email: string; workspaceRole: WorkspaceRole };

type Props = {
  workspaceSlug: string;
  projectId: string;
  currentUserId: string;
  canEdit: boolean;
  members: Member[];
  candidates: Candidate[];
};

function RoleSelect({
  value,
  onChange,
  disabled,
  guest,
}: {
  value: ProjectRole;
  onChange: (role: ProjectRole) => void;
  disabled?: boolean;
  guest?: boolean;
}) {
  return (
    <Select value={value} onValueChange={(v) => onChange(v as ProjectRole)} disabled={disabled}>
      <SelectTrigger className="h-7 w-28 text-xs" aria-label="Rôle">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {PROJECT_ROLES.map((r) => (
          <SelectItem key={r} value={r} disabled={guest && r !== "VIEWER"}>
            {PROJECT_ROLE_LABELS[r]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export function ProjectMembers({
  workspaceSlug,
  projectId,
  currentUserId,
  canEdit,
  members,
  candidates,
}: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [newUserId, setNewUserId] = useState<string>("");
  const [newRole, setNewRole] = useState<ProjectRole>("MEMBER");
  const newCandidate = candidates.find((c) => c.id === newUserId);

  function run(action: () => Promise<ActionResult>) {
    setError(null);
    startTransition(async () => {
      const result = await action();
      if (!result.ok) setError(result.error);
      else router.refresh();
    });
  }

  const ref = { workspaceSlug, projectId };

  return (
    <div className="flex flex-col gap-3">
      <FormError message={error} />
      <div className="border-border border">
        {members.map((m) => (
          <div
            key={m.id}
            className="border-border flex h-11 items-center gap-3 border-b px-3 last:border-b-0"
          >
            <Avatar name={m.name} src={m.avatarUrl} />
            <div className="min-w-0 flex-1">
              <div className="truncate">
                {m.name}
                {m.id === currentUserId && <span className="text-text-dim"> (vous)</span>}
              </div>
              <div className="text-text-dim truncate text-xs">{m.email}</div>
            </div>
            <RoleSelect
              value={m.role}
              disabled={!canEdit || pending}
              onChange={(role) => run(() => updateProjectMember({ ...ref, userId: m.id, role }))}
            />
            {canEdit && (
              <Tooltip content="Retirer du projet">
                <Button
                  size="icon-sm"
                  variant="ghost"
                  aria-label={`Retirer ${m.name}`}
                  disabled={pending}
                  onClick={() => run(() => removeProjectMember({ ...ref, userId: m.id }))}
                >
                  <UserMinus />
                </Button>
              </Tooltip>
            )}
          </div>
        ))}
      </div>

      {canEdit && candidates.length > 0 && (
        <div className="flex items-center gap-2">
          <Select value={newUserId} onValueChange={setNewUserId}>
            <SelectTrigger className="flex-1" aria-label="Membre à ajouter">
              <SelectValue placeholder="Ajouter un membre de l'espace…" />
            </SelectTrigger>
            <SelectContent>
              {candidates.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name} <span className="text-text-dim">· {c.email}</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <RoleSelect
            value={newCandidate?.workspaceRole === "GUEST" ? "VIEWER" : newRole}
            guest={newCandidate?.workspaceRole === "GUEST"}
            onChange={setNewRole}
          />
          <Button
            disabled={!newCandidate || pending}
            onClick={() =>
              newCandidate &&
              run(async () => {
                const role = newCandidate.workspaceRole === "GUEST" ? "VIEWER" : newRole;
                const result = await addProjectMember({ ...ref, userId: newCandidate.id, role });
                if (result.ok) setNewUserId("");
                return result;
              })
            }
          >
            <UserPlus />
            Ajouter
          </Button>
        </div>
      )}
    </div>
  );
}
