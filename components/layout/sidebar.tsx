"use client";

import {
  ChevronDown,
  ChevronRight,
  CircleDot,
  Inbox,
  Layers,
  ListTodo,
  RefreshCcw,
  Settings,
  SquareStack,
  UserCheck,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ComponentType } from "react";
import {
  Dropdown,
  DropdownContent,
  DropdownItem,
  DropdownLabel,
  DropdownTrigger,
} from "@/components/ui/dropdown";
import { cn } from "@/lib/utils";

type SidebarProps = {
  workspace: { slug: string; name: string };
  workspaces: { slug: string; name: string }[];
  projects: { id: string; identifier: string; name: string }[];
};

function NavLink({
  href,
  icon: Icon,
  children,
  indent = false,
}: {
  href: string;
  icon: ComponentType<{ className?: string }>;
  children: string;
  indent?: boolean;
}) {
  const pathname = usePathname();
  const active = pathname === href || pathname.startsWith(`${href}/`);
  return (
    <Link
      href={href}
      className={cn(
        "text-text-muted hover:bg-surface-2 hover:text-text flex h-7 items-center gap-2 px-2 text-sm",
        indent && "pl-7",
        active && "bg-surface-3 text-text",
      )}
    >
      <Icon className="size-4 shrink-0" />
      <span className="truncate">{children}</span>
    </Link>
  );
}

function ProjectNav({
  base,
  project,
}: {
  base: string;
  project: SidebarProps["projects"][number];
}) {
  const [open, setOpen] = useState(true);
  const href = `${base}/projects/${project.id}`;
  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="text-text hover:bg-surface-2 flex h-7 w-full cursor-pointer items-center gap-1.5 px-2 text-sm"
      >
        {open ? (
          <ChevronDown className="text-text-dim size-3.5" />
        ) : (
          <ChevronRight className="text-text-dim size-3.5" />
        )}
        <span className="border-border text-text-muted flex size-4 items-center justify-center border font-mono text-[9px]">
          {project.identifier[0]}
        </span>
        <span className="truncate">{project.name}</span>
      </button>
      {open && (
        <div>
          <NavLink href={`${href}/issues`} icon={CircleDot} indent>
            Tâches
          </NavLink>
          <NavLink href={`${href}/cycles`} icon={RefreshCcw} indent>
            Cycles
          </NavLink>
          <NavLink href={`${href}/modules`} icon={SquareStack} indent>
            Modules
          </NavLink>
          <NavLink href={`${href}/views`} icon={Layers} indent>
            Vues
          </NavLink>
        </div>
      )}
    </div>
  );
}

export function Sidebar({ workspace, workspaces, projects }: SidebarProps) {
  const base = `/${workspace.slug}`;
  return (
    <aside className="border-border bg-surface flex w-60 shrink-0 flex-col border-r">
      <div className="border-border flex h-12 shrink-0 items-center border-b px-2">
        <Dropdown>
          <DropdownTrigger className="hover:bg-surface-2 flex h-8 w-full cursor-pointer items-center gap-2 px-2 text-sm font-medium outline-none">
            <span className="bg-accent text-accent-fg flex size-5 items-center justify-center text-xs">
              {workspace.name[0]}
            </span>
            <span className="truncate">{workspace.name}</span>
            <ChevronDown className="text-text-dim ml-auto size-4" />
          </DropdownTrigger>
          <DropdownContent className="w-56">
            <DropdownLabel>Espaces de travail</DropdownLabel>
            {workspaces.map((w) => (
              <DropdownItem key={w.slug} asChild>
                <Link href={`/${w.slug}`}>{w.name}</Link>
              </DropdownItem>
            ))}
          </DropdownContent>
        </Dropdown>
      </div>

      <nav className="flex flex-1 flex-col gap-4 overflow-y-auto p-2">
        <div className="flex flex-col">
          <NavLink href={`${base}/my-issues`} icon={UserCheck}>
            Mes tâches
          </NavLink>
          <NavLink href={`${base}/inbox`} icon={Inbox}>
            Inbox
          </NavLink>
        </div>

        <div className="flex flex-col">
          <div className="text-text-dim flex h-7 items-center gap-2 px-2 text-xs font-medium tracking-wide uppercase">
            <ListTodo className="size-3.5" />
            Projets
          </div>
          {projects.map((p) => (
            <ProjectNav key={p.id} base={base} project={p} />
          ))}
        </div>
      </nav>

      <div className="border-border border-t p-2">
        <NavLink href={`${base}/settings`} icon={Settings}>
          Réglages
        </NavLink>
      </div>
    </aside>
  );
}
