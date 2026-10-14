"use client";

import type { ReactNode } from "react";
import type { IssueDTO } from "@/lib/issues/types";
import type { IssuePatch } from "@/lib/issues/view";
import {
  AssigneesPicker,
  DatePicker,
  LabelsPicker,
  PriorityPicker,
  StatePicker,
} from "../properties";

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex min-h-8 items-center gap-3">
      <span className="text-text-dim w-24 shrink-0 text-xs">{label}</span>
      <div className="flex min-w-0 flex-wrap items-center gap-1">{children}</div>
    </div>
  );
}

export function PropertiesPanel({
  issue,
  onChange,
}: {
  issue: IssueDTO;
  onChange: (patch: IssuePatch) => void;
}) {
  return (
    <div className="flex flex-col gap-1">
      <Row label="État">
        <StatePicker
          variant="full"
          value={issue.stateId}
          onChange={(stateId) => onChange({ stateId })}
        />
      </Row>
      <Row label="Priorité">
        <PriorityPicker
          variant="full"
          value={issue.priority}
          onChange={(priority) => onChange({ priority })}
        />
      </Row>
      <Row label="Assignés">
        <AssigneesPicker
          variant="full"
          value={issue.assigneeIds}
          onChange={(assigneeIds) => onChange({ assigneeIds })}
        />
      </Row>
      <Row label="Labels">
        <LabelsPicker
          variant="full"
          value={issue.labelIds}
          onChange={(labelIds) => onChange({ labelIds })}
        />
      </Row>
      <Row label="Début">
        <DatePicker
          variant="full"
          label="Date de début"
          value={issue.startDate}
          onChange={(startDate) => onChange({ startDate })}
        />
      </Row>
      <Row label="Échéance">
        <DatePicker
          variant="full"
          label="Échéance"
          value={issue.dueDate}
          onChange={(dueDate) => onChange({ dueDate })}
          highlightOverdue
        />
      </Row>
    </div>
  );
}
