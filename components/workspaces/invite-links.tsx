"use client";

import type { WorkspaceRole } from "@prisma/client";
import { Check, Copy, Link2, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
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
import { WORKSPACE_ROLE_LABELS } from "@/lib/roles";
import { createInvite, revokeInvite } from "@/server/actions/workspace-members";

type Invite = {
  id: string;
  token: string;
  role: WorkspaceRole;
  expiresAt: Date;
  createdBy: string;
};

const dateFormat = new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "short" });

function inviteUrl(token: string) {
  return `${window.location.origin}/invite/${token}`;
}

function CopyButton({ token }: { token: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <Tooltip content={copied ? "Copié" : "Copier le lien"}>
      <Button
        size="icon-sm"
        variant="ghost"
        aria-label="Copier le lien"
        onClick={async () => {
          await navigator.clipboard.writeText(inviteUrl(token));
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        }}
      >
        {copied ? <Check /> : <Copy />}
      </Button>
    </Tooltip>
  );
}

export function InviteLinks({
  workspaceSlug,
  roles,
  invites,
}: {
  workspaceSlug: string;
  roles: WorkspaceRole[];
  invites: Invite[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [role, setRole] = useState<WorkspaceRole>("MEMBER");

  return (
    <div className="flex flex-col gap-3">
      <FormError message={error} />
      <div className="flex items-center gap-2">
        <Select value={role} onValueChange={(v) => setRole(v as WorkspaceRole)}>
          <SelectTrigger className="w-40" aria-label="Rôle de l'invitation">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {roles.map((r) => (
              <SelectItem key={r} value={r}>
                {WORKSPACE_ROLE_LABELS[r]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              setError(null);
              const result = await createInvite({ workspaceSlug, role });
              if (!result.ok) return setError(result.error);
              await navigator.clipboard?.writeText(inviteUrl(result.data.token)).catch(() => {});
              router.refresh();
            })
          }
        >
          <Link2 />
          Créer un lien
        </Button>
      </div>

      {invites.length > 0 && (
        <div className="border-border border">
          {invites.map((invite) => (
            <div
              key={invite.id}
              className="border-border flex h-10 items-center gap-3 border-b px-3 last:border-b-0"
            >
              <Badge>{WORKSPACE_ROLE_LABELS[invite.role]}</Badge>
              <span className="text-text-muted min-w-0 flex-1 truncate font-mono text-xs">
                /invite/{invite.token}
              </span>
              <span className="text-text-dim text-xs">
                par {invite.createdBy} · expire le{" "}
                <span className="font-mono">{dateFormat.format(invite.expiresAt)}</span>
              </span>
              <CopyButton token={invite.token} />
              <Tooltip content="Révoquer">
                <Button
                  size="icon-sm"
                  variant="ghost"
                  aria-label="Révoquer le lien"
                  disabled={pending}
                  onClick={() =>
                    startTransition(async () => {
                      const result = await revokeInvite({ workspaceSlug, inviteId: invite.id });
                      if (!result.ok) return setError(result.error);
                      router.refresh();
                    })
                  }
                >
                  <Trash2 />
                </Button>
              </Tooltip>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
