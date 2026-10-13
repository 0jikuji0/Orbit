import { Orbit } from "lucide-react";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-dvh flex-1 items-center justify-center p-4">
      <div className="flex w-full max-w-sm flex-col items-center gap-3 text-center">
        <Orbit className="text-text-dim size-8" />
        <p className="text-text-dim font-mono text-xs">404</p>
        <h1 className="text-base font-medium">Page introuvable</h1>
        <p className="text-text-muted text-sm">
          Cette page n&apos;existe pas, ou vous n&apos;y avez pas accès.
        </p>
        <Link href="/" className={buttonVariants({ variant: "primary" })}>
          Retour à l&apos;accueil
        </Link>
      </div>
    </div>
  );
}
