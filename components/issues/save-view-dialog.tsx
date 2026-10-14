"use client";

import { Bookmark } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Field, FormError } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Tooltip } from "@/components/ui/tooltip";
import type { ViewState } from "@/lib/issues/view";
import { createSavedView } from "@/server/actions/saved-views";
import { useIssuesContext } from "./issues-context";

export function SaveViewDialog({ view }: { view: ViewState }) {
  const { workspaceSlug, meta } = useIssuesContext();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const result = await createSavedView({
        workspaceSlug,
        projectId: meta.id,
        name,
        layout: view.layout,
        view: { groupBy: view.groupBy, filters: view.filters },
      });
      if (!result.ok) return setError(result.error);
      setOpen(false);
      setName("");
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Tooltip content="Enregistrer la vue">
        <DialogTrigger asChild>
          <Button size="icon-sm" aria-label="Enregistrer la vue">
            <Bookmark />
          </Button>
        </DialogTrigger>
      </Tooltip>
      <DialogContent>
        <form onSubmit={onSubmit} noValidate>
          <DialogHeader>
            <DialogTitle>Enregistrer la vue</DialogTitle>
            <DialogDescription>
              Disposition, regroupement et filtres actuels, visibles par tout le projet.
            </DialogDescription>
          </DialogHeader>
          <DialogBody className="flex flex-col gap-3">
            <FormError message={error} />
            <Field label="Nom de la vue" htmlFor="view-name">
              <Input
                id="view-name"
                autoFocus
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </Field>
          </DialogBody>
          <DialogFooter>
            <Button type="submit" size="sm" variant="primary" disabled={pending || !name.trim()}>
              Enregistrer
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
