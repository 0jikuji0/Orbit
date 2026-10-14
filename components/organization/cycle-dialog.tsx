"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition, type FormEvent } from "react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FormError } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { cycleFields } from "@/lib/validators/organization";
import { createCycle, updateCycle } from "@/server/actions/organization";

type Cycle = { id: string; name: string; startDate: Date; endDate: Date };
const iso = (d: Date) => d.toISOString().slice(0, 10);

function defaultDates() {
  const now = new Date();
  const start = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
  const end = new Date(start.getTime() + 13 * 86_400_000); // 2 semaines
  return { start: iso(start), end: iso(end) };
}

export function CycleDialog({
  workspaceSlug,
  projectId,
  cycle,
  open,
  onOpenChange,
}: {
  workspaceSlug: string;
  projectId: string;
  cycle?: Cycle;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        {open && (
          <CycleForm
            workspaceSlug={workspaceSlug}
            projectId={projectId}
            cycle={cycle}
            onDone={() => onOpenChange(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function CycleForm({
  workspaceSlug,
  projectId,
  cycle,
  onDone,
}: {
  workspaceSlug: string;
  projectId: string;
  cycle?: Cycle;
  onDone: () => void;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const defaults = defaultDates();
  const [name, setName] = useState(cycle?.name ?? "");
  const [startDate, setStartDate] = useState(cycle ? iso(cycle.startDate) : defaults.start);
  const [endDate, setEndDate] = useState(cycle ? iso(cycle.endDate) : defaults.end);
  const [errors, setErrors] = useState<Record<string, string[] | undefined>>({});
  const [formError, setFormError] = useState<string | null>(null);

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    const parsed = cycleFields.safeParse({ name, startDate, endDate });
    if (!parsed.success) return setErrors(z.flattenError(parsed.error).fieldErrors);
    setErrors({});
    startTransition(async () => {
      const payload = { workspaceSlug, projectId, cycle: { name, startDate, endDate } };
      const result = cycle
        ? await updateCycle({ ...payload, cycleId: cycle.id })
        : await createCycle(payload);
      if (!result.ok) return setFormError(result.error);
      router.refresh();
      onDone();
    });
  }

  return (
    <form onSubmit={onSubmit} noValidate>
      <DialogHeader>
        <DialogTitle>{cycle ? "Modifier le cycle" : "Nouveau cycle"}</DialogTitle>
      </DialogHeader>
      <DialogBody className="flex flex-col gap-4">
        <FormError message={formError} />
        <Field label="Nom" htmlFor="cycle-name" error={errors.name?.[0]}>
          <Input id="cycle-name" autoFocus value={name} onChange={(e) => setName(e.target.value)} />
        </Field>
        <div className="flex gap-3">
          <Field
            label="Début"
            htmlFor="cycle-start"
            error={errors.startDate?.[0]}
            className="flex-1"
          >
            <Input
              id="cycle-start"
              type="date"
              className="font-mono"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </Field>
          <Field label="Fin" htmlFor="cycle-end" error={errors.endDate?.[0]} className="flex-1">
            <Input
              id="cycle-end"
              type="date"
              className="font-mono"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </Field>
        </div>
      </DialogBody>
      <DialogFooter>
        <Button type="submit" variant="primary" size="sm" disabled={pending}>
          {cycle ? "Enregistrer" : "Créer le cycle"}
        </Button>
      </DialogFooter>
    </form>
  );
}

export type { Cycle };
