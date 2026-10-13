"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { FormError } from "@/components/ui/field";
import { acceptInvite } from "@/server/actions/workspace-members";

export function AcceptInvite({ token }: { token: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="flex flex-col gap-3">
      <FormError message={error} />
      <Button
        variant="primary"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            const result = await acceptInvite({ token });
            if (!result.ok) return setError(result.error);
            router.push(`/${result.data.slug}`);
          })
        }
      >
        Rejoindre l&apos;espace
      </Button>
    </div>
  );
}
