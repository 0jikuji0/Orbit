"use client";

import { Download, File, FileImage, Paperclip, Trash2 } from "lucide-react";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { FormError } from "@/components/ui/field";
import { Tooltip } from "@/components/ui/tooltip";
import type { AttachmentDTO } from "@/lib/issues/detail-types";
import { MAX_UPLOAD_BYTES, formatBytes, isImageMime } from "@/lib/uploads";
import { useIssuesContext } from "../issues-context";
import { useDeleteAttachment, useUploadAttachments } from "../use-issue-detail";

export function Attachments({ issueId, items }: { issueId: string; items: AttachmentDTO[] }) {
  const { canEdit } = useIssuesContext();
  const upload = useUploadAttachments(issueId);
  const remove = useDeleteAttachment(issueId);
  const input = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);

  function send(files: File[]) {
    setError(null);
    const tooBig = files.find((f) => f.size > MAX_UPLOAD_BYTES);
    if (tooBig) return setError(`${tooBig.name} : 20 Mo maximum`);
    if (files.length) upload.mutate(files, { onError: (e) => setError(e.message) });
  }

  return (
    <section
      aria-label="Pièces jointes"
      className="flex flex-col gap-2"
      onDragOver={(e) => canEdit && e.preventDefault()}
      onDrop={(e) => {
        if (!canEdit) return;
        e.preventDefault();
        send([...e.dataTransfer.files]);
      }}
    >
      <div className="flex items-center justify-between">
        <h3 className="text-text-muted text-xs font-medium">Pièces jointes</h3>
        {canEdit && (
          <>
            <Button
              size="sm"
              variant="ghost"
              disabled={upload.isPending}
              onClick={() => input.current?.click()}
            >
              <Paperclip />
              {upload.isPending ? "Envoi…" : "Joindre"}
            </Button>
            <input
              ref={input}
              type="file"
              multiple
              hidden
              aria-label="Fichiers à joindre"
              onChange={(e) => {
                send([...(e.target.files ?? [])]);
                e.target.value = "";
              }}
            />
          </>
        )}
      </div>
      <FormError message={error} />
      {items.length > 0 ? (
        <div className="border-border border">
          {items.map((a) => {
            const href = `/api/uploads/${a.id}`;
            const Icon = isImageMime(a.mime) ? FileImage : File;
            return (
              <div
                key={a.id}
                className="group border-border flex items-center gap-2 border-b px-2 py-1.5 last:border-b-0"
              >
                {isImageMime(a.mime) ? (
                  // eslint-disable-next-line @next/next/no-img-element -- fichier privé servi par l'API
                  <img
                    src={href}
                    alt=""
                    className="border-border size-8 shrink-0 border object-cover"
                  />
                ) : (
                  <Icon className="text-text-dim size-4 shrink-0" />
                )}
                <a
                  href={href}
                  target="_blank"
                  rel="noreferrer"
                  className="min-w-0 flex-1 truncate hover:underline"
                >
                  {a.filename}
                </a>
                <span className="text-text-dim shrink-0 font-mono text-xs">
                  {formatBytes(a.size)}
                </span>
                <Tooltip content="Télécharger">
                  <a
                    href={href}
                    download={a.filename}
                    aria-label={`Télécharger ${a.filename}`}
                    className="text-text-dim hover:bg-surface-3 hover:text-text flex size-6 items-center justify-center"
                  >
                    <Download className="size-3.5" />
                  </a>
                </Tooltip>
                {canEdit && (
                  <Tooltip content="Supprimer">
                    <button
                      type="button"
                      aria-label={`Supprimer ${a.filename}`}
                      onClick={() => remove.mutate(a.id)}
                      className="text-text-dim hover:bg-surface-3 hover:text-danger flex size-6 cursor-pointer items-center justify-center"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </Tooltip>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        canEdit && (
          <p className="border-border text-text-dim border border-dashed px-3 py-3 text-center text-xs">
            Glissez des fichiers ici (20 Mo max.)
          </p>
        )
      )}
    </section>
  );
}
