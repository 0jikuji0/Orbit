"use client";

import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { createProject } from "@/server/actions/projects";
import { ProjectForm } from "./project-form";

export function CreateProjectDialog({ workspaceSlug }: { workspaceSlug: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="primary">
          <Plus />
          Nouveau projet
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nouveau projet</DialogTitle>
          <DialogDescription>Vous en serez administrateur.</DialogDescription>
        </DialogHeader>
        <DialogBody>
          <ProjectForm
            submitLabel="Créer le projet"
            onSubmit={async (values) => {
              const result = await createProject({ workspaceSlug, ...values });
              if (result.ok) {
                setOpen(false);
                router.push(`/${workspaceSlug}/projects/${result.data.id}/issues`);
              }
              return result;
            }}
          />
        </DialogBody>
      </DialogContent>
    </Dialog>
  );
}
