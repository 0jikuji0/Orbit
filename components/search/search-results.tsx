"use client";

import { Search } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { StateDot } from "@/components/issues/state-dot";
import { Topbar } from "@/components/layout/topbar";
import { Input } from "@/components/ui/input";
import { splitHighlights } from "@/lib/search";

type Hit = {
  id: string;
  sequenceId: number;
  title: string;
  projectId: string;
  identifier: string;
  stateColor: string;
  snippet: string;
};

export function SearchResults({
  workspaceSlug,
  query,
  hits,
}: {
  workspaceSlug: string;
  query: string;
  hits: Hit[];
}) {
  const router = useRouter();
  const [value, setValue] = useState(query);
  const submit = (e: FormEvent) => {
    e.preventDefault();
    router.replace(`/${workspaceSlug}/search?q=${encodeURIComponent(value.trim())}`);
  };

  return (
    <>
      <Topbar
        breadcrumb={
          <>
            <Search className="text-text-muted size-4" />
            <span>Recherche</span>
          </>
        }
      />
      <div className="flex-1 overflow-y-auto">
        <form onSubmit={submit} className="border-border border-b p-4">
          <Input
            type="search"
            aria-label="Rechercher"
            autoFocus
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="Rechercher dans les titres et descriptions…"
          />
        </form>
        {query && (
          <p className="border-border text-text-dim border-b px-4 py-2 text-xs">
            {hits.length} résultat{hits.length > 1 ? "s" : ""} pour « {query} »
          </p>
        )}
        {hits.map((h) => (
          <Link
            key={h.id}
            href={`/${workspaceSlug}/projects/${h.projectId}/issues/${h.sequenceId}`}
            data-testid="search-hit"
            className="border-border hover:bg-surface-2 flex flex-col gap-1 border-b px-4 py-2.5"
          >
            <span className="flex items-center gap-2">
              <StateDot color={h.stateColor} />
              <span className="text-text-dim font-mono text-xs">
                {h.identifier}-{h.sequenceId}
              </span>
              <span className="truncate font-medium">{h.title}</span>
            </span>
            {h.snippet.trim() && (
              <span className="text-text-muted line-clamp-2 pl-4 text-xs">
                {splitHighlights(h.snippet).map((part, i) =>
                  part.hit ? (
                    <mark key={i} className="bg-surface-3 text-text">
                      {part.text}
                    </mark>
                  ) : (
                    <span key={i}>{part.text}</span>
                  ),
                )}
              </span>
            )}
          </Link>
        ))}
      </div>
    </>
  );
}
