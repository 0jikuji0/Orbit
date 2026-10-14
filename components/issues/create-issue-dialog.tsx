"use client";

import type { Priority } from "@prisma/client";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogTitle } from "@/components/ui/dialog";
import { FormError } from "@/components/ui/field";
import { Kbd } from "@/components/ui/kbd";
import { issueTitleSchema } from "@/lib/validators/issue";
import { useIssuesContext, type NewIssueDefaults } from "./issues-context";
import {
  AssigneesPicker,
  DatePicker,
  LabelsPicker,
  PriorityPicker,
  StatePicker,
} from "./properties";
import { useCreateIssue } from "./use-issues";

function defaultStateId(states: { id: string; group: string }[]) {
  return (states.find((s) => s.group === "UNSTARTED") ?? states[0])?.id ?? "";
}

function CreateIssueForm({ defaults, onDone }: { defaults: NewIssueDefaults; onDone: () => void }) {
  const { meta } = useIssuesContext();
  const create = useCreateIssue();
  const [title, setTitle] = useState("");
  const [stateId, setStateId] = useState(defaults.stateId ?? defaultStateId(meta.states));
  const [priority, setPriority] = useState<Priority>(defaults.priority ?? "NONE");
  const [assigneeIds, setAssigneeIds] = useState(defaults.assigneeIds ?? []);
  const [labelIds, setLabelIds] = useState(defaults.labelIds ?? []);
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [dueDate, setDueDate] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  // ⌘/Ctrl + Entrée : créer, où que soit le focus (Entrée seule ouvre les menus des propriétés).
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
        // Capture : on intercepte avant le bouton focalisé (qui ouvrirait son menu).
        e.preventDefault();
        e.stopPropagation();
        formRef.current?.requestSubmit();
      }
    }
    window.addEventListener("keydown", onKeyDown, true);
    return () => window.removeEventListener("keydown", onKeyDown, true);
  }, []);

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    const parsed = issueTitleSchema.safeParse(title);
    if (!parsed.success) return setError(parsed.error.issues[0]?.message ?? "Titre invalide");
    if (startDate && dueDate && startDate > dueDate) {
      return setError("L'échéance doit être après la date de début");
    }
    create.mutate(
      {
        tempId: `temp-${crypto.randomUUID()}`,
        title: parsed.data,
        stateId,
        priority,
        assigneeIds,
        labelIds,
        startDate,
        dueDate,
        parentId: defaults.parentId ?? null,
      },
      { onError: (e) => setError(e.message) },
    );
    onDone();
  }

  return (
    <form ref={formRef} onSubmit={onSubmit} noValidate>
      <div className="flex flex-col gap-3 p-4">
        <DialogTitle className="text-text-dim font-mono text-xs font-normal">
          {meta.identifier} · Nouvelle tâche
        </DialogTitle>
        <FormError message={error} />
        <input
          autoFocus
          aria-label="Titre"
          placeholder="Titre de la tâche"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="text-text placeholder:text-text-dim bg-transparent text-lg outline-none"
        />
        <div className="flex flex-wrap gap-1.5">
          <StatePicker variant="full" value={stateId} onChange={setStateId} />
          <PriorityPicker variant="full" value={priority} onChange={setPriority} />
          <AssigneesPicker variant="full" value={assigneeIds} onChange={setAssigneeIds} />
          <LabelsPicker variant="full" value={labelIds} onChange={setLabelIds} />
          <DatePicker variant="full" label="Début" value={startDate} onChange={setStartDate} />
          <DatePicker variant="full" label="Échéance" value={dueDate} onChange={setDueDate} />
        </div>
      </div>
      <DialogFooter>
        <span className="text-text-dim mr-auto flex items-center gap-1 text-xs">
          <Kbd>Ctrl</Kbd>
          <Kbd>Entrée</Kbd> pour créer
        </span>
        <Button type="submit" variant="primary" size="sm">
          Créer la tâche
        </Button>
      </DialogFooter>
    </form>
  );
}

export function CreateIssueDialog({
  defaults,
  onClose,
}: {
  defaults: NewIssueDefaults | null;
  onClose: () => void;
}) {
  return (
    <Dialog open={defaults !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl" aria-describedby={undefined}>
        {defaults && <CreateIssueForm defaults={defaults} onDone={onClose} />}
      </DialogContent>
    </Dialog>
  );
}
