"use client";

import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { Dropdown, DropdownContent, DropdownItem, DropdownTrigger } from "@/components/ui/dropdown";

export function RowMenu({
  label,
  onEdit,
  onDelete,
}: {
  label: string;
  onEdit?: () => void;
  onDelete?: () => void;
}) {
  if (!onEdit && !onDelete) return null;
  return (
    // Les clics dans le menu (rendu en portail) remontent l'arbre React jusqu'au lien de la ligne.
    <span
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
      }}
    >
      <Dropdown>
        <DropdownTrigger
          aria-label={`Actions : ${label}`}
          onClick={(e) => e.preventDefault()}
          className="text-text-dim hover:bg-surface-3 hover:text-text flex size-6 shrink-0 cursor-pointer items-center justify-center outline-none"
        >
          <MoreHorizontal className="size-4" />
        </DropdownTrigger>
        <DropdownContent align="end">
          {onEdit && (
            <DropdownItem onSelect={onEdit}>
              <Pencil />
              Modifier
            </DropdownItem>
          )}
          {onDelete && (
            <DropdownItem onSelect={onDelete} className="text-danger">
              <Trash2 />
              Supprimer
            </DropdownItem>
          )}
        </DropdownContent>
      </Dropdown>
    </span>
  );
}
