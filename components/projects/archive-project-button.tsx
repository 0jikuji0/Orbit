"use client";

import { Archive } from "lucide-react";
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
import { archiveProject } from "@/server/actions/projects";

export function ArchiveProjectButton({
  workspaceSlug,
  projectId,
  projectName,
}: {
  workspaceSlug: string;
  projectId: string;
  projectName: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="danger" size="sm">
          <Archive />
          Archiver le projet
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Archiver « {projectName} » ?</DialogTitle>
          <DialogDescription>
            Le projet disparaît des listes. Ses tâches sont conservées en base.
          </DialogDescription>
        </DialogHeader>
        {error && (
          <DialogBody>
            <FormError message={error} />
          </DialogBody>
        )}
        <DialogFooter>
          <DialogClose asChild>
            <Button size="sm">Annuler</Button>
          </DialogClose>
          <Button
            size="sm"
            variant="danger"
            disabled={pending}
            onClick={() =>
              startTransition(async () => {
                const result = await archiveProject({ workspaceSlug, projectId });
                if (!result.ok) return setError(result.error);
                router.push(`/${workspaceSlug}/projects`);
              })
            }
          >
            Archiver
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
