"use client";

import type { WorkspaceRole } from "@prisma/client";
import { LogOut, UserMinus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
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
import { WORKSPACE_ROLE_LABELS } from "@/lib/roles";
import { removeWorkspaceMember, updateWorkspaceMember } from "@/server/actions/workspace-members";

type Member = {
  id: string;
  name: string;
  email: string;
  avatarUrl: string | null;
  role: WorkspaceRole;
  assignableRoles: WorkspaceRole[];
  removable: boolean;
};

export function WorkspaceMembers({
  workspaceSlug,
  currentUserId,
  members,
}: {
  workspaceSlug: string;
  currentUserId: string;
  members: Member[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function run<T>(action: () => Promise<ActionResult<T>>, onOk?: (data: T) => void) {
    setError(null);
    startTransition(async () => {
      const result = await action();
      if (!result.ok) return setError(result.error);
      if (onOk) onOk(result.data);
      else router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-3">
      <FormError message={error} />
      <div className="border-border border">
        {members.map((m) => {
          const isSelf = m.id === currentUserId;
          return (
            <div
              key={m.id}
              className="border-border flex h-11 items-center gap-3 border-b px-3 last:border-b-0"
            >
              <Avatar name={m.name} src={m.avatarUrl} />
              <div className="min-w-0 flex-1">
                <div className="truncate">
                  {m.name}
                  {isSelf && <span className="text-text-dim"> (vous)</span>}
                </div>
                <div className="text-text-dim truncate text-xs">{m.email}</div>
              </div>
              {m.assignableRoles.length > 1 ? (
                <Select
                  value={m.role}
                  disabled={pending}
                  onValueChange={(role) =>
                    run(() => updateWorkspaceMember({ workspaceSlug, userId: m.id, role }))
                  }
                >
                  <SelectTrigger className="h-7 w-32 text-xs" aria-label={`Rôle de ${m.name}`}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {m.assignableRoles.map((r) => (
                      <SelectItem key={r} value={r}>
                        {WORKSPACE_ROLE_LABELS[r]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Badge>{WORKSPACE_ROLE_LABELS[m.role]}</Badge>
              )}
              {m.removable && (
                <Tooltip content="Retirer de l'espace">
                  <Button
                    size="icon-sm"
                    variant="ghost"
                    aria-label={`Retirer ${m.name}`}
                    disabled={pending}
                    onClick={() =>
                      run(() => removeWorkspaceMember({ workspaceSlug, userId: m.id }))
                    }
                  >
                    <UserMinus />
                  </Button>
                </Tooltip>
              )}
              {isSelf && (
                <Tooltip content="Quitter l'espace">
                  <Button
                    size="icon-sm"
                    variant="ghost"
                    aria-label="Quitter l'espace"
                    disabled={pending}
                    onClick={() =>
                      run(
                        () => removeWorkspaceMember({ workspaceSlug, userId: m.id }),
                        () => router.push("/"),
                      )
                    }
                  >
                    <LogOut />
                  </Button>
                </Tooltip>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
