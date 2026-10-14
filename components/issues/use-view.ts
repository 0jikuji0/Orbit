"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useMemo } from "react";
import { parseViewParams, serializeViewParams, type ViewState } from "@/lib/issues/view";

/** Disposition, regroupement et filtres sont stockés dans l'URL (partageables, conservés au rechargement). */
export function useView() {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const view = useMemo(() => parseViewParams(new URLSearchParams(params.toString())), [params]);

  const setView = useCallback(
    (next: Partial<ViewState>) => {
      const query = serializeViewParams({ ...view, ...next }).toString();
      router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
    },
    [view, router, pathname],
  );

  return [view, setView] as const;
}
