"use client";

import type { ModuleStatus } from "@prisma/client";
import { useRouter } from "next/navigation";
import { useState, useTransition, type FormEvent } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { MODULE_STATUSES, MODULE_STATUS_LABELS, moduleFields } from "@/lib/validators/organization";
import { createModule, updateModule } from "@/server/actions/organization";

type Module = {
  id: string;
  name: string;
  description: string | null;
  leadId: string | null;
  status: ModuleStatus;
};

const NO_LEAD = "none";

export function ModuleDialog({
  workspaceSlug,
  projectId,
  members,
  module,
  open,
  onOpenChange,
}: {
  workspaceSlug: string;
  projectId: string;
  members: { id: string; name: string }[];
  module?: Module;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [name, setName] = useState(module?.name ?? "");
  const [description, setDescription] = useState(module?.description ?? "");
  const [leadId, setLeadId] = useState(module?.leadId ?? NO_LEAD);
  const [status, setStatus] = useState<ModuleStatus>(module?.status ?? "PLANNED");
  const [error, setError] = useState<string | null>(null);

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    const parsed = moduleFields.safeParse({
      name,
      description,
      leadId: leadId === NO_LEAD ? null : leadId,
      status,
    });
    if (!parsed.success) return setError(parsed.error.issues[0]?.message ?? "Données invalides");
    startTransition(async () => {
      const payload = { workspaceSlug, projectId, module: parsed.data };
      const result = module
        ? await updateModule({ ...payload, moduleId: module.id })
        : await createModule(payload);
      if (!result.ok) return setError(result.error);
      router.refresh();
      onOpenChange(false);
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form onSubmit={onSubmit} noValidate>
          <DialogHeader>
            <DialogTitle>{module ? "Modifier le module" : "Nouveau module"}</DialogTitle>
          </DialogHeader>
          <DialogBody className="flex flex-col gap-4">
            <FormError message={error} />
            <Field label="Nom" htmlFor="module-name">
              <Input
                id="module-name"
                autoFocus
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </Field>
            <Field label="Description" htmlFor="module-description">
              <Textarea
                id="module-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </Field>
            <div className="flex gap-3">
              <Field label="Responsable" htmlFor="module-lead" className="flex-1">
                <Select value={leadId} onValueChange={setLeadId}>
                  <SelectTrigger id="module-lead">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NO_LEAD}>Aucun</SelectItem>
                    {members.map((m) => (
                      <SelectItem key={m.id} value={m.id}>
                        {m.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Statut" htmlFor="module-status" className="flex-1">
                <Select value={status} onValueChange={(v) => setStatus(v as ModuleStatus)}>
                  <SelectTrigger id="module-status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {MODULE_STATUSES.map((s) => (
                      <SelectItem key={s} value={s}>
                        {MODULE_STATUS_LABELS[s]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            </div>
          </DialogBody>
          <DialogFooter>
            <Button type="submit" variant="primary" size="sm" disabled={pending}>
              {module ? "Enregistrer" : "Créer le module"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export type { Module };
