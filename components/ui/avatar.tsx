import { cn } from "@/lib/utils";

const sizes = {
  xs: "size-4 text-[9px]",
  sm: "size-5 text-[10px]",
  md: "size-6 text-xs",
  lg: "size-8 text-sm",
};

type AvatarProps = {
  name: string;
  src?: string | null;
  size?: keyof typeof sizes;
  className?: string;
};

export function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const letters = parts.length > 1 ? [parts[0], parts[parts.length - 1]] : [parts[0]];
  return letters
    .map((p) => p?.[0] ?? "")
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function Avatar({ name, src, size = "md", className }: AvatarProps) {
  return (
    <span
      title={name}
      className={cn(
        "border-border bg-surface-3 text-text-muted inline-flex shrink-0 items-center justify-center overflow-hidden border font-medium",
        sizes[size],
        className,
      )}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element -- avatars servis localement, pas d'optimisation nécessaire
        <img src={src} alt={name} className="size-full object-cover" />
      ) : (
        initials(name)
      )}
    </span>
  );
}
