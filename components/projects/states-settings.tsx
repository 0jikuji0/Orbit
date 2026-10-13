"use client";

import type { StateGroup } from "@prisma/client";
import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogBody,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { FormError } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tooltip } from "@/components/ui/tooltip";
import { StateDot } from "@/components/issues/state-dot";
import type { ActionResult } from "@/lib/action";
import { DATA_COLORS } from "@/lib/colors";
import { STATE_GROUPS, STATE_GROUP_LABELS } from "@/lib/validators/state";
import { createState, deleteState, moveState, updateState } from "@/server/actions/states";
import { ColorPicker } from "./color-picker";

type Ctx = { workspaceSlug: string; projectId: string };
type Run = (action: (ctx: Ctx) => Promise<ActionResult>) => Promise<boolean>;

type State = { id: string; name: string; color: string; group: StateGroup; issueCount: number };

function GroupSelect({
  value,
  onChange,
  disabled,
}: {
  value: StateGroup;
  onChange: (group: StateGroup) => void;
  disabled?: boolean;
}) {
  return (
    <Select value={value} onValueChange={(v) => onChange(v as StateGroup)} disabled={disabled}>
      <SelectTrigger className="h-7 w-36 text-xs" aria-label="Groupe">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {STATE_GROUPS.map((g) => (
          <SelectItem key={g} value={g}>
            {STATE_GROUP_LABELS[g]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function DeleteStateButton({ state, others, run }: { state: State; others: State[]; run: Run }) {
  const [replacementId, setReplacementId] = useState(others[0]?.id ?? "");
  const [open, setOpen] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Tooltip content="Supprimer">
        <DialogTrigger asChild>
          <Button
            size="icon-sm"
            variant="ghost"
            aria-label={`Supprimer ${state.name}`}
            disabled={!others.length}
          >
            <Trash2 />
          </Button>
        </DialogTrigger>
      </Tooltip>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Supprimer l&apos;état « {state.name} » ?</DialogTitle>
          <DialogDescription>
            {state.issueCount
              ? `${state.issueCount} tâche(s) seront déplacées vers l'état choisi.`
              : "Aucune tâche n'utilise cet état."}
          </DialogDescription>
        </DialogHeader>
        {state.issueCount > 0 && (
          <DialogBody>
            <Select value={replacementId} onValueChange={setReplacementId}>
              <SelectTrigger aria-label="État de remplacement">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {others.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    <span className="flex items-center gap-2">
                      <StateDot color={s.color} />
                      {s.name}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </DialogBody>
        )}
        <DialogFooter>
          <DialogClose asChild>
            <Button size="sm">Annuler</Button>
          </DialogClose>
          <Button
            size="sm"
            variant="danger"
            onClick={async () => {
              const ok = await run((ctx) =>
                deleteState({ ...ctx, stateId: state.id, replacementId }),
              );
              if (ok) setOpen(false);
            }}
          >
            Supprimer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function StatesSettings({
  workspaceSlug,
  projectId,
  states,
  canEdit,
}: {
  workspaceSlug: string;
  projectId: string;
  states: State[];
  canEdit: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [newName, setNewName] = useState("");
  const [newGroup, setNewGroup] = useState<StateGroup>("UNSTARTED");
  const [newColor, setNewColor] = useState<string>(DATA_COLORS[10]);
  const ctx: Ctx = { workspaceSlug, projectId };

  /** Exécute une action et rafraîchit la page ; renvoie `true` si elle a réussi. */
  const run: Run = (action) =>
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
      <div className="border-border border">
        {states.map((s, i) => (
          <div
            key={s.id}
            className="border-border flex h-11 items-center gap-2 border-b px-2 last:border-b-0"
          >
            {canEdit && (
              <span className="flex">
                <Button
                  size="icon-sm"
                  variant="ghost"
                  aria-label={`Monter ${s.name}`}
                  disabled={i === 0 || pending}
                  onClick={() => run((c) => moveState({ ...c, stateId: s.id, direction: "up" }))}
                >
                  <ArrowUp />
                </Button>
                <Button
                  size="icon-sm"
                  variant="ghost"
                  aria-label={`Descendre ${s.name}`}
                  disabled={i === states.length - 1 || pending}
                  onClick={() => run((c) => moveState({ ...c, stateId: s.id, direction: "down" }))}
                >
                  <ArrowDown />
                </Button>
              </span>
            )}
            <ColorPicker
              round
              value={s.color}
              disabled={!canEdit}
              onChange={(color) =>
                run((c) =>
                  updateState({ ...c, stateId: s.id, name: s.name, group: s.group, color }),
                )
              }
            />
            <Input
              key={s.name}
              aria-label="Nom de l'état"
              defaultValue={s.name}
              disabled={!canEdit}
              className="h-7 flex-1"
              onBlur={(e) => {
                const name = e.target.value.trim();
                if (name && name !== s.name) {
                  run((c) =>
                    updateState({ ...c, stateId: s.id, name, group: s.group, color: s.color }),
                  );
                }
              }}
              onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
            />
            <GroupSelect
              value={s.group}
              disabled={!canEdit || pending}
              onChange={(group) =>
                run((c) =>
                  updateState({ ...c, stateId: s.id, name: s.name, color: s.color, group }),
                )
              }
            />
            <span className="text-text-dim w-16 text-right font-mono text-xs">{s.issueCount}</span>
            {canEdit && (
              <DeleteStateButton state={s} others={states.filter((o) => o.id !== s.id)} run={run} />
            )}
          </div>
        ))}
      </div>

      {canEdit && (
        <form
          className="flex items-center gap-2"
          onSubmit={async (e) => {
            e.preventDefault();
            const ok = await run((c) =>
              createState({ ...c, name: newName, group: newGroup, color: newColor }),
            );
            if (ok) setNewName("");
          }}
        >
          <ColorPicker round value={newColor} onChange={setNewColor} />
          <Input
            aria-label="Nouvel état"
            placeholder="Nouvel état…"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            className="flex-1"
          />
          <GroupSelect value={newGroup} onChange={setNewGroup} />
          <Button type="submit" disabled={!newName.trim() || pending}>
            <Plus />
            Ajouter
          </Button>
        </form>
      )}
    </div>
  );
}
