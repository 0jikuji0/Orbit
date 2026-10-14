"use client";

import { useEffect, useRef } from "react";
import { RichEditor } from "@/components/editor/rich-editor";
import type { RichNode } from "@/lib/rich-text";
import { useIssuesContext } from "../issues-context";

const SAVE_DELAY_MS = 800;

/** Description enregistrée automatiquement, 800 ms après la dernière frappe (et à la fermeture). */
export function IssueDescription({
  initial,
  onSave,
}: {
  initial: RichNode | null;
  onSave: (doc: RichNode) => void;
}) {
  const { meta, canEdit } = useIssuesContext();
  const pending = useRef<RichNode | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const saveRef = useRef(onSave);
  const unmounted = useRef(false);
  useEffect(() => {
    saveRef.current = onSave;
  });

  const flush = () => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
    if (pending.current) saveRef.current(pending.current);
    pending.current = null;
  };

  useEffect(
    () => () => {
      flush();
      unmounted.current = true;
    },
    [],
  );

  if (!canEdit && !initial) return <p className="text-text-dim text-sm">Pas de description.</p>;

  return (
    <RichEditor
      ariaLabel="Description"
      content={initial}
      editable={canEdit}
      members={meta.members}
      placeholder="Ajouter une description… (« / » pas nécessaire : ## titre, - liste, [] case à cocher, @ mention)"
      className="min-h-32"
      onChange={(doc) => {
        if (unmounted.current) return;
        pending.current = doc;
        if (timer.current) clearTimeout(timer.current);
        timer.current = setTimeout(flush, SAVE_DELAY_MS);
      }}
    />
  );
}
