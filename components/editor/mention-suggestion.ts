"use client";

import { ReactRenderer } from "@tiptap/react";
import type { SuggestionOptions, SuggestionProps } from "@tiptap/suggestion";
import { MentionList, type MentionItem, type MentionListHandle } from "./mention-list";

/** Suggestion « @ » : filtre les membres et affiche la liste sous le curseur. */
export function mentionSuggestion(
  getMembers: () => MentionItem[],
): Omit<SuggestionOptions<MentionItem>, "editor"> {
  return {
    items: ({ query }) => {
      const q = query.toLowerCase();
      return getMembers()
        .filter((m) => m.name.toLowerCase().includes(q))
        .slice(0, 8);
    },
    render: () => {
      let renderer: ReactRenderer<MentionListHandle> | null = null;
      let container: HTMLDivElement | null = null;

      const place = (props: SuggestionProps<MentionItem>) => {
        const rect = props.clientRect?.();
        if (!rect || !container) return;
        container.style.left = `${rect.left}px`;
        container.style.top = `${rect.bottom + 4}px`;
      };

      return {
        onStart: (props) => {
          renderer = new ReactRenderer(MentionList, { props, editor: props.editor });
          container = document.createElement("div");
          container.style.position = "fixed";
          container.style.zIndex = "60";
          container.appendChild(renderer.element);
          document.body.appendChild(container);
          place(props);
        },
        onUpdate: (props) => {
          renderer?.updateProps(props);
          place(props);
        },
        onKeyDown: ({ event }) => {
          if (event.key === "Escape") {
            container?.remove();
            return true;
          }
          return renderer?.ref?.onKeyDown(event) ?? false;
        },
        onExit: () => {
          container?.remove();
          renderer?.destroy();
          container = null;
          renderer = null;
        },
      };
    },
  };
}
