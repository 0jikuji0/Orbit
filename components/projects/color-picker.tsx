"use client";

import { StateDot } from "@/components/issues/state-dot";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { DATA_COLORS } from "@/lib/colors";
import { cn } from "@/lib/utils";

export function ColorPicker({
  value,
  onChange,
  disabled,
  round = false,
}: {
  value: string;
  onChange: (color: string) => void;
  disabled?: boolean;
  /** Pastille ronde (états) plutôt que carrée (labels). */
  round?: boolean;
}) {
  return (
    <Popover>
      <PopoverTrigger
        disabled={disabled}
        aria-label="Couleur"
        className="border-border hover:bg-surface-2 flex size-7 shrink-0 cursor-pointer items-center justify-center border disabled:cursor-default"
      >
        {round ? (
          <StateDot color={value} className="size-3" />
        ) : (
          <span className="size-3" style={{ backgroundColor: value }} />
        )}
      </PopoverTrigger>
      <PopoverContent className="grid w-auto min-w-0 grid-cols-8 gap-1 p-2">
        {DATA_COLORS.map((color) => (
          <button
            key={color}
            type="button"
            aria-label={color}
            aria-pressed={color === value}
            onClick={() => onChange(color)}
            className={cn(
              "hover:border-border-strong flex size-6 cursor-pointer items-center justify-center border border-transparent",
              color === value && "border-text",
            )}
          >
            <span className="size-3.5" style={{ backgroundColor: color }} />
          </button>
        ))}
      </PopoverContent>
    </Popover>
  );
}
