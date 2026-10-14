"use client";

import { Command } from "cmdk";
import {
  BarChart3,
  Boxes,
  CircleDot,
  FolderKanban,
  Inbox,
  Keyboard,
  Layers,
  Plus,
  RefreshCcw,
  Search,
  Settings,
  UserCheck,
} from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { StateDot } from "@/components/issues/state-dot";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Kbd } from "@/components/ui/kbd";
import { NEW_ISSUE_EVENT, SHORTCUTS, goToTarget, isTypingTarget } from "@/lib/shortcuts";
import { quickSearchIssues } from "@/server/actions/search";

type Project = { id: string; identifier: string; name: string };
type Hit = {
  id: string;
  key: string;
  title: string;
  projectId: string;
  sequenceId: number;
  stateColor: string;
};

const itemClass =
  "flex h-8 cursor-pointer items-center gap-2 px-2 text-sm text-text-muted data-[selected=true]:bg-surface-2 data-[selected=true]:text-text [&_svg]:size-4 [&_svg]:shrink-0";
const groupClass =
  "[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:text-text-dim";

function Item({
  onSelect,
  icon,
  children,
  hint,
}: {
  onSelect: () => void;
  icon: ReactNode;
  children: ReactNode;
  hint?: string[];
}) {
  return (
    <Command.Item onSelect={onSelect} className={itemClass}>
      {icon}
      <span className="min-w-0 flex-1 truncate">{children}</span>
      {hint && (
        <span className="flex gap-1">
          {hint.map((k) => (
            <Kbd key={k}>{k}</Kbd>
          ))}
        </span>
      )}
    </Command.Item>
  );
}

function useSearch(workspaceSlug: string, query: string) {
  const [hits, setHits] = useState<Hit[]>([]);
  useEffect(() => {
    if (!query.trim()) {
      setHits([]);
      return;
    }
    let cancelled = false;
    const timer = setTimeout(async () => {
      const result = await quickSearchIssues({ workspaceSlug, query });
      if (!cancelled && result.ok) setHits(result.data);
    }, 150);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [workspaceSlug, query]);
  return hits;
}

export function CommandPalette({
  workspaceSlug,
  projects,
}: {
  workspaceSlug: string;
  projects: Project[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [help, setHelp] = useState(false);
  const [query, setQuery] = useState("");
  const hits = useSearch(workspaceSlug, query);

  const workspaceBase = `/${workspaceSlug}`;
  const currentProjectId = /\/projects\/([^/]+)/.exec(pathname)?.[1] ?? null;
  const currentProject = projects.find((p) => p.id === currentProjectId) ?? null;
  const projectBase = currentProject ? `${workspaceBase}/projects/${currentProject.id}` : null;

  /**
   * Une vue de tâches affichée (liste, cycle, module) intercepte l'événement et ouvre la création.
   * Sinon, on va aux tâches du projet courant (ou du premier) avec la création ouverte.
   */
  const createIssue = () => {
    const handled = !window.dispatchEvent(new Event(NEW_ISSUE_EVENT, { cancelable: true }));
    if (handled) return;
    const target = currentProject ?? projects[0];
    router.push(
      target ? `${workspaceBase}/projects/${target.id}/issues?new=1` : `${workspaceBase}/projects`,
    );
  };
  const createIssueRef = useRef(createIssue);
  useEffect(() => {
    createIssueRef.current = createIssue;
  });

  // Raccourcis globaux
  useEffect(() => {
    let pendingG: ReturnType<typeof setTimeout> | null = null;
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => !o);
        return;
      }
      if (e.metaKey || e.ctrlKey || e.altKey || isTypingTarget(e.target)) return;
      if (document.querySelector("[role=dialog],[role=menu]")) return;
      if (e.key === "/") {
        e.preventDefault();
        setOpen(true);
      } else if (e.key === "?") {
        e.preventDefault();
        setHelp(true);
      } else if (pendingG) {
        clearTimeout(pendingG);
        pendingG = null;
        const target = goToTarget(e.key, workspaceBase, projectBase);
        if (target) {
          e.preventDefault();
          router.push(target);
        }
      } else if (e.key.toLowerCase() === "c") {
        e.preventDefault();
        createIssueRef.current();
      } else if (e.key.toLowerCase() === "g") {
        pendingG = setTimeout(() => (pendingG = null), 1000);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      if (pendingG) clearTimeout(pendingG);
    };
  }, [router, workspaceBase, projectBase]);

  const run = (action: () => void) => {
    setOpen(false);
    setQuery("");
    action();
  };
  const go = (href: string) => run(() => router.push(href));

  const newIssue = () => run(createIssue);

  return (
    <>
      <Dialog open={open} onOpenChange={(o) => (setOpen(o), o || setQuery(""))}>
        <DialogContent className="max-w-xl p-0" aria-describedby={undefined}>
          <DialogTitle className="sr-only">Palette de commandes</DialogTitle>
          <Command label="Palette de commandes" shouldFilter loop className="flex flex-col">
            <div className="border-border flex h-12 items-center gap-2 border-b px-3">
              <Search className="text-text-dim size-4" />
              <Command.Input
                value={query}
                onValueChange={setQuery}
                placeholder="Rechercher une tâche, un projet, une action…"
                className="text-text placeholder:text-text-dim flex-1 bg-transparent text-sm outline-none"
              />
            </div>
            <Command.List className="max-h-96 overflow-y-auto p-1">
              <Command.Empty className="text-text-dim px-3 py-6 text-center text-sm">
                Aucun résultat.
              </Command.Empty>

              {hits.length > 0 && (
                <Command.Group heading="Tâches" className={groupClass}>
                  {hits.map((h) => (
                    <Command.Item
                      key={h.id}
                      forceMount
                      value={`${h.key} ${h.title}`}
                      onSelect={() =>
                        go(`${workspaceBase}/projects/${h.projectId}/issues/${h.sequenceId}`)
                      }
                      className={itemClass}
                    >
                      <StateDot color={h.stateColor} />
                      <span className="text-text-dim w-16 shrink-0 font-mono text-xs">{h.key}</span>
                      <span className="truncate">{h.title}</span>
                    </Command.Item>
                  ))}
                </Command.Group>
              )}

              {query.trim() && (
                <Command.Group heading="Recherche" className={groupClass}>
                  <Command.Item
                    forceMount
                    value={`rechercher ${query}`}
                    onSelect={() =>
                      go(`${workspaceBase}/search?q=${encodeURIComponent(query.trim())}`)
                    }
                    className={itemClass}
                  >
                    <Search />
                    <span className="truncate">
                      Rechercher « {query.trim()} » dans tout l&apos;espace
                    </span>
                  </Command.Item>
                </Command.Group>
              )}

              <Command.Group heading="Actions" className={groupClass}>
                <Item onSelect={newIssue} icon={<Plus />} hint={["C"]}>
                  Nouvelle tâche{currentProject ? ` dans ${currentProject.name}` : ""}
                </Item>
                <Item onSelect={() => run(() => setHelp(true))} icon={<Keyboard />} hint={["?"]}>
                  Raccourcis clavier
                </Item>
              </Command.Group>

              {currentProject && projectBase && (
                <Command.Group heading={currentProject.name} className={groupClass}>
                  <Item
                    onSelect={() => go(`${projectBase}/issues`)}
                    icon={<CircleDot />}
                    hint={["G", "I"]}
                  >
                    Tâches
                  </Item>
                  <Item
                    onSelect={() => go(`${projectBase}/cycles`)}
                    icon={<RefreshCcw />}
                    hint={["G", "C"]}
                  >
                    Cycles
                  </Item>
                  <Item
                    onSelect={() => go(`${projectBase}/modules`)}
                    icon={<Boxes />}
                    hint={["G", "M"]}
                  >
                    Modules
                  </Item>
                  <Item
                    onSelect={() => go(`${projectBase}/views`)}
                    icon={<Layers />}
                    hint={["G", "V"]}
                  >
                    Vues
                  </Item>
                  <Item onSelect={() => go(`${projectBase}/analytics`)} icon={<BarChart3 />}>
                    Statistiques
                  </Item>
                  <Item onSelect={() => go(`${projectBase}/settings`)} icon={<Settings />}>
                    Réglages du projet
                  </Item>
                </Command.Group>
              )}

              <Command.Group heading="Projets" className={groupClass}>
                {projects.map((p) => (
                  <Item
                    key={p.id}
                    onSelect={() => go(`${workspaceBase}/projects/${p.id}/issues`)}
                    icon={<FolderKanban />}
                  >
                    {p.name} <span className="text-text-dim font-mono text-xs">{p.identifier}</span>
                  </Item>
                ))}
              </Command.Group>

              <Command.Group heading="Espace de travail" className={groupClass}>
                <Item
                  onSelect={() => go(`${workspaceBase}/projects`)}
                  icon={<FolderKanban />}
                  hint={["G", "P"]}
                >
                  Tous les projets
                </Item>
                <Item onSelect={() => go(`${workspaceBase}/my-issues`)} icon={<UserCheck />}>
                  Mes tâches
                </Item>
                <Item onSelect={() => go(`${workspaceBase}/inbox`)} icon={<Inbox />}>
                  Inbox
                </Item>
                <Item
                  onSelect={() => go(`${workspaceBase}/settings`)}
                  icon={<Settings />}
                  hint={["G", "S"]}
                >
                  Réglages de l&apos;espace
                </Item>
              </Command.Group>
            </Command.List>
          </Command>
        </DialogContent>
      </Dialog>

      <Dialog open={help} onOpenChange={setHelp}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Raccourcis clavier</DialogTitle>
          </DialogHeader>
          <ul className="flex flex-col p-2">
            {SHORTCUTS.map((s) => (
              <li key={s.label} className="flex h-8 items-center justify-between px-2 text-sm">
                <span className="text-text-muted">{s.label}</span>
                <span className="flex items-center gap-1">
                  {s.keys.map((k, i) => (
                    <span key={k} className="flex items-center gap-1">
                      {i > 0 && s.keys[0] === "G" && (
                        <span className="text-text-dim text-xs">puis</span>
                      )}
                      <Kbd>{k}</Kbd>
                    </span>
                  ))}
                </span>
              </li>
            ))}
          </ul>
        </DialogContent>
      </Dialog>
    </>
  );
}
