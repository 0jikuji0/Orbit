"use client";

import type { Editor } from "@tiptap/react";
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { useRef, useState } from "react";
import { RichEditor } from "@/components/editor/rich-editor";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Dropdown, DropdownContent, DropdownItem, DropdownTrigger } from "@/components/ui/dropdown";
import { FormError } from "@/components/ui/field";
import { Kbd } from "@/components/ui/kbd";
import { describeActivity, timeAgo } from "@/lib/issues/activity-format";
import type { TimelineEntry } from "@/lib/issues/detail-types";
import { isDocEmpty, toPlainDoc, type RichNode } from "@/lib/rich-text";
import { useIssuesContext } from "../issues-context";
import {
  useCreateComment,
  useDeleteComment,
  useTimeline,
  useUpdateComment,
} from "../use-issue-detail";

type Comment = Extract<TimelineEntry, { kind: "comment" }>;

function When({ date }: { date: Date }) {
  return (
    <time
      dateTime={date.toISOString()}
      title={date.toLocaleString("fr-FR")}
      className="text-text-dim"
    >
      {timeAgo(date)}
    </time>
  );
}

function CommentItem({
  issueId,
  comment,
  currentUserId,
}: {
  issueId: string;
  comment: Comment;
  currentUserId: string | null;
}) {
  const { meta, canEdit } = useIssuesContext();
  const update = useUpdateComment(issueId);
  const remove = useDeleteComment(issueId);
  const [editing, setEditing] = useState(false);
  const draft = useRef<RichNode>(comment.bodyJson);
  const mine = comment.author.id === currentUserId;

  return (
    <div className="border-border bg-surface-2 border" data-testid="comment">
      <div className="border-border flex items-center gap-2 border-b px-3 py-1.5 text-xs">
        <Avatar name={comment.author.name} src={comment.author.avatarUrl} size="xs" />
        <span className="text-text font-medium">{comment.author.name}</span>
        <When date={comment.createdAt} />
        {comment.editedAt && <span className="text-text-dim">(modifié)</span>}
        {canEdit && (
          <Dropdown>
            <DropdownTrigger
              aria-label="Actions du commentaire"
              className="text-text-dim hover:bg-surface-3 hover:text-text ml-auto flex size-5 cursor-pointer items-center justify-center outline-none"
            >
              <MoreHorizontal className="size-3.5" />
            </DropdownTrigger>
            <DropdownContent align="end">
              {mine && (
                <DropdownItem onSelect={() => setEditing(true)}>
                  <Pencil />
                  Modifier
                </DropdownItem>
              )}
              <DropdownItem onSelect={() => remove.mutate(comment.id)}>
                <Trash2 />
                Supprimer
              </DropdownItem>
            </DropdownContent>
          </Dropdown>
        )}
      </div>
      {editing ? (
        <div className="flex flex-col gap-2 p-2">
          <RichEditor
            content={comment.bodyJson}
            members={meta.members}
            autofocus
            toolbar={false}
            onChange={(doc) => (draft.current = doc)}
          />
          <div className="flex justify-end gap-2">
            <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>
              Annuler
            </Button>
            <Button
              size="sm"
              variant="primary"
              onClick={() => {
                if (isDocEmpty(draft.current)) return;
                update.mutate({ commentId: comment.id, bodyJson: draft.current });
                setEditing(false);
              }}
            >
              Enregistrer
            </Button>
          </div>
        </div>
      ) : (
        <div className="px-3 py-2">
          <RichEditor
            key={JSON.stringify(comment.bodyJson)}
            content={comment.bodyJson}
            editable={false}
          />
        </div>
      )}
    </div>
  );
}

function CommentComposer({ issueId }: { issueId: string }) {
  const { meta } = useIssuesContext();
  const create = useCreateComment(issueId);
  const editor = useRef<Editor | null>(null);
  const [error, setError] = useState<string | null>(null);

  const submit = () => {
    const json = editor.current?.getJSON();
    const doc = json ? toPlainDoc(json) : undefined;
    if (!doc || isDocEmpty(doc)) return;
    setError(null);
    create.mutate(doc, {
      onSuccess: () => editor.current?.commands.clearContent(),
      onError: (e) => setError(e.message),
    });
  };

  return (
    <div className="flex flex-col gap-2">
      <FormError message={error} />
      <RichEditor
        ariaLabel="Nouveau commentaire"
        content={null}
        editorRef={editor}
        members={meta.members}
        toolbar={false}
        placeholder="Écrire un commentaire… (@ pour mentionner)"
        onSubmit={submit}
        className="min-h-20"
      />
      <div className="flex items-center justify-end gap-2">
        <span className="text-text-dim flex items-center gap-1 text-xs">
          <Kbd>Ctrl</Kbd>
          <Kbd>Entrée</Kbd>
        </span>
        <Button size="sm" variant="primary" disabled={create.isPending} onClick={submit}>
          Commenter
        </Button>
      </div>
    </div>
  );
}

export function Timeline({
  issueId,
  currentUserId,
}: {
  issueId: string;
  currentUserId: string | null;
}) {
  const { canEdit } = useIssuesContext();
  const { data: entries = [], isLoading } = useTimeline(issueId);

  return (
    <section aria-label="Activité" className="flex flex-col gap-3">
      <h3 className="text-text-muted text-xs font-medium">Activité</h3>
      {isLoading && <p className="text-text-dim text-xs">Chargement…</p>}
      <ol className="flex flex-col gap-2">
        {entries.map((entry) =>
          entry.kind === "comment" ? (
            <li key={entry.id}>
              <CommentItem issueId={issueId} comment={entry} currentUserId={currentUserId} />
            </li>
          ) : (
            <li
              key={entry.id}
              className="text-text-muted flex items-center gap-2 px-1 text-xs"
              data-testid="activity"
            >
              <Avatar name={entry.actor.name} src={entry.actor.avatarUrl} size="xs" />
              <span className="min-w-0">
                <span className="text-text">{entry.actor.name}</span>{" "}
                {describeActivity(entry.field, entry.oldValue, entry.newValue)} ·{" "}
                <When date={entry.createdAt} />
              </span>
            </li>
          ),
        )}
      </ol>
      {canEdit && <CommentComposer issueId={issueId} />}
    </section>
  );
}
