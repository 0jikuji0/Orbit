"use client";

import {
  ChevronDown,
  ChevronRight,
  CircleDot,
  Inbox,
  Layers,
  LogOut,
  Plus,
  RefreshCcw,
  Settings,
  SquareStack,
  UserCheck,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ComponentType } from "react";
import { ProjectIcon } from "@/components/projects/project-icon";
import { Avatar } from "@/components/ui/avatar";
import {
  Dropdown,
  DropdownContent,
  DropdownItem,
  DropdownLabel,
  DropdownSeparator,
  DropdownTrigger,
} from "@/components/ui/dropdown";
import { Tooltip } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { signOut } from "@/server/actions/auth";

type SidebarProject = { id: string; identifier: string; name: string; icon: string | null };

type SidebarProps = {
  workspace: { slug: string; name: string };
  workspaces: { slug: string; name: string }[];
  projects: SidebarProject[];
  user: { name: string; email: string; image?: string | null };
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

function ProjectNav({ base, project }: { base: string; project: SidebarProject }) {
  const pathname = usePathname();
  const href = `${base}/projects/${project.id}`;
  const [open, setOpen] = useState(() => pathname.startsWith(href));
  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="text-text hover:bg-surface-2 flex h-7 w-full cursor-pointer items-center gap-1.5 px-2 text-sm"
      >
        {open ? (
          <ChevronDown className="text-text-dim size-3.5 shrink-0" />
        ) : (
          <ChevronRight className="text-text-dim size-3.5 shrink-0" />
        )}
        <ProjectIcon icon={project.icon} className="size-4" />
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
          <NavLink href={`${href}/settings`} icon={Settings} indent>
            Réglages
          </NavLink>
        </div>
      )}
    </div>
  );
}

export function Sidebar({ workspace, workspaces, projects, user }: SidebarProps) {
  const base = `/${workspace.slug}`;
  return (
    <aside className="border-border bg-surface flex w-60 shrink-0 flex-col border-r">
      <div className="border-border flex h-12 shrink-0 items-center border-b px-2">
        <Dropdown>
          <DropdownTrigger className="hover:bg-surface-2 flex h-8 w-full cursor-pointer items-center gap-2 px-2 text-sm font-medium outline-none">
            <span className="bg-accent text-accent-fg flex size-5 shrink-0 items-center justify-center text-xs">
              {workspace.name[0]?.toUpperCase()}
            </span>
            <span className="truncate">{workspace.name}</span>
            <ChevronDown className="text-text-dim ml-auto size-4 shrink-0" />
          </DropdownTrigger>
          <DropdownContent className="w-56">
            <DropdownLabel>Espaces de travail</DropdownLabel>
            {workspaces.map((w) => (
              <DropdownItem key={w.slug} asChild>
                <Link href={`/${w.slug}`}>
                  <span className="truncate">{w.name}</span>
                </Link>
              </DropdownItem>
            ))}
            <DropdownSeparator />
            <DropdownItem asChild>
              <Link href="/onboarding">
                <Plus />
                Nouvel espace
              </Link>
            </DropdownItem>
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
          <div className="flex h-7 items-center justify-between px-2">
            <Link
              href={`${base}/projects`}
              className="text-text-dim hover:text-text text-xs font-medium tracking-wide uppercase"
            >
              Projets
            </Link>
            <Tooltip content="Tous les projets">
              <Link
                href={`${base}/projects`}
                aria-label="Tous les projets"
                className="text-text-dim hover:bg-surface-2 hover:text-text flex size-5 items-center justify-center"
              >
                <Plus className="size-3.5" />
              </Link>
            </Tooltip>
          </div>
          {projects.length === 0 && (
            <p className="text-text-dim px-2 py-1 text-xs">Aucun projet pour l&apos;instant.</p>
          )}
          {projects.map((p) => (
            <ProjectNav key={p.id} base={base} project={p} />
          ))}
        </div>
      </nav>

      <div className="border-border flex flex-col gap-1 border-t p-2">
        <NavLink href={`${base}/settings`} icon={Settings}>
          Réglages
        </NavLink>
        <Dropdown>
          <DropdownTrigger className="hover:bg-surface-2 flex h-8 w-full cursor-pointer items-center gap-2 px-2 text-sm outline-none">
            <Avatar name={user.name} src={user.image} size="sm" />
            <span className="truncate">{user.name}</span>
          </DropdownTrigger>
          <DropdownContent side="top" className="w-56">
            <DropdownLabel className="truncate">{user.email}</DropdownLabel>
            <DropdownSeparator />
            <form action={signOut}>
              <DropdownItem asChild>
                <button type="submit" className="w-full">
                  <LogOut />
                  Se déconnecter
                </button>
              </DropdownItem>
            </form>
          </DropdownContent>
        </Dropdown>
      </div>
    </aside>
  );
}
