"use client";

import { useRouter } from "next/navigation";
import { ProjectForm } from "./project-form";
import { updateProject } from "@/server/actions/projects";

type Props = {
  workspaceSlug: string;
  project: {
    id: string;
    name: string;
    identifier: string;
    description: string | null;
    icon: string | null;
  };
  canEdit: boolean;
};

export function ProjectSettingsForm({ workspaceSlug, project, canEdit }: Props) {
  const router = useRouter();
  return (
    <ProjectForm
      initial={project}
      disabled={!canEdit}
      submitLabel="Enregistrer"
      onSubmit={(values) => updateProject({ workspaceSlug, projectId: project.id, ...values })}
      onSuccess={() => router.refresh()}
    />
  );
}
