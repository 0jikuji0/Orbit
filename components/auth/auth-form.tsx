"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Field, FormError } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { authClient } from "@/lib/auth-client";
import { safeRedirectPath } from "@/lib/safe-redirect";
import { loginSchema, registerSchema } from "@/lib/validators/auth";
import type { z } from "zod";

type Mode = "login" | "register";
type Errors = Partial<Record<"name" | "email" | "password", string>>;
type AuthError = { status: number; code?: string; message?: string };

function errorMessage(error: AuthError): string {
  if (error.status === 401) return "E-mail ou mot de passe incorrect.";
  if (error.code?.startsWith("USER_ALREADY_EXISTS"))
    return "Un compte existe déjà avec cet e-mail.";
  return error.message ?? "Une erreur est survenue.";
}

const COPY = {
  login: {
    title: "Connexion",
    submit: "Se connecter",
    alt: "Pas encore de compte ?",
    altLink: "Créer un compte",
    altHref: "/register",
  },
  register: {
    title: "Créer un compte",
    submit: "Créer le compte",
    alt: "Déjà un compte ?",
    altLink: "Se connecter",
    altHref: "/login",
  },
} as const;

export function AuthForm({ mode, next }: { mode: Mode; next?: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [errors, setErrors] = useState<Errors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const copy = COPY[mode];
  const target = safeRedirectPath(next);
  const altHref = next ? `${copy.altHref}?next=${encodeURIComponent(target)}` : copy.altHref;

  function validate<T>(schema: z.ZodType<T>, raw: unknown): T | null {
    const parsed = schema.safeParse(raw);
    if (parsed.success) {
      setErrors({});
      return parsed.data;
    }
    const fieldErrors: Errors = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0] as keyof Errors;
      fieldErrors[key] ??= issue.message;
    }
    setErrors(fieldErrors);
    return null;
  }

  function submit(request: () => Promise<{ error: AuthError | null }>) {
    setFormError(null);
    startTransition(async () => {
      const { error } = await request();
      if (error) {
        setFormError(errorMessage(error));
        return;
      }
      router.replace(target);
      router.refresh();
    });
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const raw = Object.fromEntries(new FormData(event.currentTarget));
    if (mode === "login") {
      const data = validate(loginSchema, raw);
      if (data) submit(() => authClient.signIn.email(data));
    } else {
      const data = validate(registerSchema, raw);
      if (data) submit(() => authClient.signUp.email(data));
    }
  }

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
      <h1 className="text-base font-medium">{copy.title}</h1>
      <FormError message={formError} />
      {mode === "register" && (
        <Field label="Nom" htmlFor="name" error={errors.name}>
          <Input id="name" name="name" autoComplete="name" aria-invalid={!!errors.name} autoFocus />
        </Field>
      )}
      <Field label="E-mail" htmlFor="email" error={errors.email}>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          aria-invalid={!!errors.email}
          autoFocus={mode === "login"}
        />
      </Field>
      <Field label="Mot de passe" htmlFor="password" error={errors.password}>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete={mode === "login" ? "current-password" : "new-password"}
          aria-invalid={!!errors.password}
        />
      </Field>
      <Button type="submit" variant="primary" disabled={pending} className="mt-2">
        {pending ? "…" : copy.submit}
      </Button>
      <p className="text-text-dim text-center text-xs">
        {copy.alt}{" "}
        <Link href={altHref} className="text-text-muted hover:text-text underline">
          {copy.altLink}
        </Link>
      </p>
    </form>
  );
}
