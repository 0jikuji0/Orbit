"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Field, FormError } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { slugify } from "@/lib/slug";
import { createWorkspaceSchema } from "@/lib/validators/workspace";
import { createWorkspace } from "@/server/actions/workspaces";
import { z } from "zod";

export function CreateWorkspaceForm() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [errors, setErrors] = useState<Record<string, string[] | undefined>>({});
  const [formError, setFormError] = useState<string | null>(null);

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    const parsed = createWorkspaceSchema.safeParse({ name, slug });
    if (!parsed.success) {
      setErrors(z.flattenError(parsed.error).fieldErrors);
      return;
    }
    setErrors({});
    setFormError(null);
    startTransition(async () => {
      const result = await createWorkspace(parsed.data);
      if (!result.ok) {
        setFormError(result.error);
        return;
      }
      router.push(`/${result.data.slug}`);
    });
  }

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
      <FormError message={formError} />
      <Field label="Nom de l'espace" htmlFor="ws-name" error={errors.name?.[0]}>
        <Input
          id="ws-name"
          value={name}
          autoFocus
          aria-invalid={!!errors.name}
          onChange={(e) => {
            setName(e.target.value);
            if (!slugTouched) setSlug(slugify(e.target.value));
          }}
        />
      </Field>
      <Field
        label="Adresse"
        htmlFor="ws-slug"
        error={errors.slug?.[0]}
        hint={<span className="font-mono">/{slug || "mon-equipe"}</span>}
      >
        <Input
          id="ws-slug"
          value={slug}
          className="font-mono"
          aria-invalid={!!errors.slug}
          onChange={(e) => {
            setSlugTouched(true);
            setSlug(e.target.value.toLowerCase());
          }}
        />
      </Field>
      <Button type="submit" variant="primary" disabled={pending}>
        Créer l&apos;espace de travail
      </Button>
    </form>
  );
}
