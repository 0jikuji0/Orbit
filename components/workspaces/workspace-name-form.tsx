"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Field, FormError } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { workspaceNameSchema } from "@/lib/validators/workspace";
import { updateWorkspace } from "@/server/actions/workspaces";

export function WorkspaceNameForm({
  slug,
  name: initialName,
  canEdit,
}: {
  slug: string;
  name: string;
  canEdit: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [name, setName] = useState(initialName);
  const [error, setError] = useState<string | null>(null);

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    const parsed = workspaceNameSchema.safeParse(name);
    if (!parsed.success) return setError(parsed.error.issues[0]?.message ?? "Nom invalide");
    setError(null);
    startTransition(async () => {
      const result = await updateWorkspace({ slug, name: parsed.data });
      if (!result.ok) return setError(result.error);
      router.refresh();
    });
  }

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
      <FormError message={error} />
      <div className="flex items-end gap-2">
        <Field label="Nom" htmlFor="ws-name" className="flex-1">
          <Input
            id="ws-name"
            value={name}
            disabled={!canEdit}
            onChange={(e) => setName(e.target.value)}
          />
        </Field>
        {canEdit && (
          <Button type="submit" variant="primary" disabled={pending || name === initialName}>
            Enregistrer
          </Button>
        )}
      </div>
      <Field label="Adresse" htmlFor="ws-slug" hint="L'adresse ne peut pas être modifiée.">
        <Input id="ws-slug" value={`/${slug}`} disabled className="font-mono" />
      </Field>
    </form>
  );
}
