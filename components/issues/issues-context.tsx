"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { IssueDTO, ProjectMeta } from "@/lib/issues/types";

export type NewIssueDefaults = Partial<
  Pick<IssueDTO, "stateId" | "priority" | "assigneeIds" | "labelIds" | "parentId">
>;

type IssuesContextValue = {
  workspaceSlug: string;
  meta: ProjectMeta;
  canEdit: boolean;
  /** Ouvre la modale de création, éventuellement pré-remplie (ex. l'état d'une colonne). */
  openCreate: (defaults?: NewIssueDefaults) => void;
};

const IssuesContext = createContext<IssuesContextValue | null>(null);

export function IssuesProvider({
  value,
  children,
}: {
  value: IssuesContextValue;
  children: ReactNode;
}) {
  return <IssuesContext.Provider value={value}>{children}</IssuesContext.Provider>;
}

export function useIssuesContext() {
  const ctx = useContext(IssuesContext);
  if (!ctx) throw new Error("useIssuesContext doit être utilisé dans <IssuesProvider>");
  return ctx;
}
