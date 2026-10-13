import type { Priority } from "@prisma/client";
import {
  OctagonAlert,
  SignalHigh,
  SignalLow,
  SignalMedium,
  Minus,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

export const PRIORITIES: Record<Priority, { label: string; icon: LucideIcon; className: string }> =
  {
    URGENT: { label: "Urgente", icon: OctagonAlert, className: "text-prio-urgent" },
    HIGH: { label: "Haute", icon: SignalHigh, className: "text-prio-high" },
    MEDIUM: { label: "Moyenne", icon: SignalMedium, className: "text-prio-medium" },
    LOW: { label: "Basse", icon: SignalLow, className: "text-prio-low" },
    NONE: { label: "Aucune", icon: Minus, className: "text-prio-none" },
  };

export function PriorityIcon({ priority, className }: { priority: Priority; className?: string }) {
  const { icon: Icon, label, className: color } = PRIORITIES[priority];
  return (
    <Icon aria-label={`Priorité : ${label}`} className={cn("size-4 shrink-0", color, className)} />
  );
}
