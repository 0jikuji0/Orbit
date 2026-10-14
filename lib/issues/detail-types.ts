import type { RichNode } from "@/lib/rich-text";
import type { IssueDTO } from "./types";

export type AttachmentDTO = {
  id: string;
  filename: string;
  mime: string;
  size: number;
  uploadedBy: string;
};

export type IssueDetailDTO = IssueDTO & {
  descriptionJson: RichNode | null;
  createdBy: { id: string; name: string };
  parent: { id: string; sequenceId: number; title: string } | null;
  children: IssueDTO[];
  attachments: AttachmentDTO[];
};

export type TimelineEntry =
  | {
      kind: "activity";
      id: string;
      createdAt: Date;
      actor: { id: string; name: string; avatarUrl: string | null };
      field: string;
      oldValue: string | null;
      newValue: string | null;
    }
  | {
      kind: "comment";
      id: string;
      createdAt: Date;
      editedAt: Date | null;
      author: { id: string; name: string; avatarUrl: string | null };
      bodyJson: RichNode;
    };
