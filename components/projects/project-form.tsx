"use client";

import { useState, useTransition, type FormEvent } from "react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Field, FormError, Label } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { ActionResult } from "@/lib/action";
import { PROJECT_ICONS, type ProjectIconName } from "@/lib/project-icons";
import { cn } from "@/lib/utils";
import { projectFormSchema, suggestIdentifier } from "@/lib/validators/project";
import { PROJECT_ICON_COMPONENTS } from "./project-icon";

type Values = z.output<typeof projectFormSchema>;

type ProjectFormProps = {
  initial?: { name: string; identifier: string; description: string | null; icon: string | null };
  submitLabel: string;
  disabled?: boolean;
  onSubmit: (values: Values) => Promise<ActionResult<unknown>>;
  onSuccess?: () => void;
};

export function ProjectForm({
  initial,
  submitLabel,
  disabled,
  onSubmit,
  onSuccess,
}: ProjectFormProps) {
  const [pending, startTransition] = useTransition();
  const [name, setName] = useState(initial?.name ?? "");
  const [identifier, setIdentifier] = useState(initial?.identifier ?? "");
  const [identifierTouched, setIdentifierTouched] = useState(!!initial);
  const [description, setDescription] = useState(initial?.description ?? "");
  const [icon, setIcon] = useState<ProjectIconName>(
    PROJECT_ICONS.find((i) => i === initial?.icon) ?? "box",
  );
  const [errors, setErrors] = useState<Record<string, string[] | undefined>>({});
  const [formError, setFormError] = useState<string | null>(null);

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const parsed = projectFormSchema.safeParse({ name, identifier, description, icon });
    if (!parsed.success) {
      setErrors(z.flattenError(parsed.error).fieldErrors);
      return;
    }
    setErrors({});
    setFormError(null);
    startTransition(async () => {
      const result = await onSubmit(parsed.data);
      if (!result.ok) {
        setFormError(result.error);
        return;
      }
      onSuccess?.();
    });
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
      <FormError message={formError} />
      <fieldset disabled={disabled} className="flex flex-col gap-4">
        <div className="flex gap-3">
          <Field label="Nom" htmlFor="project-name" error={errors.name?.[0]} className="flex-1">
            <Input
              id="project-name"
              value={name}
              autoFocus={!initial}
              aria-invalid={!!errors.name}
              onChange={(e) => {
                setName(e.target.value);
                if (!identifierTouched) setIdentifier(suggestIdentifier(e.target.value));
              }}
            />
          </Field>
          <Field
            label="Identifiant"
            htmlFor="project-identifier"
            error={errors.identifier?.[0]}
            className="w-28"
          >
            <Input
              id="project-identifier"
              value={identifier}
              maxLength={5}
              className="font-mono uppercase"
              aria-invalid={!!errors.identifier}
              onChange={(e) => {
                setIdentifierTouched(true);
                setIdentifier(e.target.value.toUpperCase());
              }}
            />
          </Field>
        </div>
        <p className="text-text-dim -mt-2 text-xs">
          Les tâches seront numérotées{" "}
          <span className="text-text-muted font-mono">{identifier || "ORB"}-1</span>,{" "}
          <span className="text-text-muted font-mono">{identifier || "ORB"}-2</span>…
        </p>

        <div className="flex flex-col gap-1.5">
          <Label>Icône</Label>
          <div role="radiogroup" aria-label="Icône" className="flex flex-wrap gap-1">
            {PROJECT_ICONS.map((name) => {
              const Icon = PROJECT_ICON_COMPONENTS[name];
              return (
                <button
                  key={name}
                  type="button"
                  role="radio"
                  aria-checked={icon === name}
                  aria-label={name}
                  onClick={() => setIcon(name)}
                  className={cn(
                    "border-border text-text-muted hover:bg-surface-2 flex size-8 cursor-pointer items-center justify-center border",
                    icon === name && "border-accent bg-surface-3 text-text",
                  )}
                >
                  <Icon className="size-4" />
                </button>
              );
            })}
          </div>
        </div>

        <Field label="Description" htmlFor="project-description" error={errors.description?.[0]}>
          <Textarea
            id="project-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </Field>
      </fieldset>
      {!disabled && (
        <div className="flex justify-end">
          <Button type="submit" variant="primary" disabled={pending}>
            {submitLabel}
          </Button>
        </div>
      )}
    </form>
  );
}
