import { Orbit } from "lucide-react";
import type { ReactNode } from "react";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-dvh items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex items-center gap-2 text-lg font-medium">
          <Orbit className="text-accent size-5" />
          Orbit
        </div>
        <div className="border-border bg-surface border p-6">{children}</div>
      </div>
    </div>
  );
}
