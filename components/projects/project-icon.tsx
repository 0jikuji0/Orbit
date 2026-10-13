import {
  Book,
  Box,
  Briefcase,
  Code,
  Flag,
  Globe,
  Heart,
  Layers,
  Orbit,
  Rocket,
  Star,
  Zap,
  type LucideIcon,
} from "lucide-react";
import type { ProjectIconName } from "@/lib/project-icons";
import { cn } from "@/lib/utils";

export const PROJECT_ICON_COMPONENTS: Record<ProjectIconName, LucideIcon> = {
  orbit: Orbit,
  rocket: Rocket,
  box: Box,
  code: Code,
  globe: Globe,
  layers: Layers,
  zap: Zap,
  flag: Flag,
  book: Book,
  briefcase: Briefcase,
  heart: Heart,
  star: Star,
};

export function ProjectIcon({ icon, className }: { icon: string | null; className?: string }) {
  const Icon = (icon && PROJECT_ICON_COMPONENTS[icon as ProjectIconName]) || Box;
  return (
    <span
      className={cn(
        "border-border bg-surface-2 text-text-muted flex size-5 shrink-0 items-center justify-center border",
        className,
      )}
    >
      <Icon className="size-3" />
    </span>
  );
}
