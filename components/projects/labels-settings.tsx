"use client";

import { Plus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { FormError } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Tooltip } from "@/components/ui/tooltip";
import type { ActionResult } from "@/lib/action";
import { DATA_COLORS } from "@/lib/colors";
import { createLabel, deleteLabel, updateLabel } from "@/server/actions/labels";
import { ColorPicker } from "./color-picker";

type Label = { id: string; name: string; color: string; issueCount: number };
type Ctx = { workspaceSlug: string; projectId: string };

export function LabelsSettings({
  workspaceSlug,
  projectId,
  labels,
  canEdit,
}: {
  workspaceSlug: string;
  projectId: string;
  labels: Label[];
  canEdit: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState<string>(DATA_COLORS[13]);
  const ctx: Ctx = { workspaceSlug, projectId };

  const run = (action: (c: Ctx) => Promise<ActionResult>) =>
    new Promise<boolean>((resolve) =>
      startTransition(async () => {
        setError(null);
        const result = await action(ctx);
        if (!result.ok) setError(result.error);
        else router.refresh();
        resolve(result.ok);
      }),
    );

  return (
    <div className="flex flex-col gap-3">
      <FormError message={error} />
      {labels.length > 0 ? (
        <div className="border-border border">
          {labels.map((l) => (
            <div
              key={l.id}
              className="border-border flex h-11 items-center gap-2 border-b px-2 last:border-b-0"
            >
              <ColorPicker
                value={l.color}
                disabled={!canEdit}
                onChange={(color) =>
                  run((c) => updateLabel({ ...c, labelId: l.id, name: l.name, color }))
                }
              />
              <Input
                key={l.name}
                aria-label="Nom du label"
                defaultValue={l.name}
                disabled={!canEdit}
                className="h-7 flex-1"
                onBlur={(e) => {
                  const name = e.target.value.trim();
                  if (name && name !== l.name) {
                    run((c) => updateLabel({ ...c, labelId: l.id, name, color: l.color }));
                  }
                }}
                onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
              />
              <span className="text-text-dim w-16 text-right font-mono text-xs">
                {l.issueCount}
              </span>
              {canEdit && (
                <Tooltip content="Supprimer (retiré des tâches)">
                  <Button
                    size="icon-sm"
                    variant="ghost"
                    aria-label={`Supprimer ${l.name}`}
                    disabled={pending}
                    onClick={() => run((c) => deleteLabel({ ...c, labelId: l.id }))}
                  >
                    <Trash2 />
                  </Button>
                </Tooltip>
              )}
            </div>
          ))}
        </div>
      ) : (
        <p className="text-text-dim text-sm">Aucun label.</p>
      )}

      {canEdit && (
        <form
          className="flex items-center gap-2"
          onSubmit={async (e) => {
            e.preventDefault();
            const ok = await run((c) => createLabel({ ...c, name: newName, color: newColor }));
            if (ok) setNewName("");
          }}
        >
          <ColorPicker value={newColor} onChange={setNewColor} />
          <Input
            aria-label="Nouveau label"
            placeholder="Nouveau label…"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            className="flex-1"
          />
          <Button type="submit" disabled={!newName.trim() || pending}>
            <Plus />
            Ajouter
          </Button>
        </form>
      )}
    </div>
  );
}
