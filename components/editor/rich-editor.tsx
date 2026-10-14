"use client";

import Mention from "@tiptap/extension-mention";
import { TaskItem, TaskList } from "@tiptap/extension-list";
import { Placeholder } from "@tiptap/extensions";
import { EditorContent, useEditor, useEditorState, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import {
  Bold,
  Code,
  Heading2,
  Heading3,
  Italic,
  List,
  ListChecks,
  ListOrdered,
  SquareCode,
  Strikethrough,
} from "lucide-react";
import { useEffect, useRef } from "react";
import { Tooltip } from "@/components/ui/tooltip";
import type { RichNode } from "@/lib/rich-text";
import { cn } from "@/lib/utils";
import type { MentionItem } from "./mention-list";
import { mentionSuggestion } from "./mention-suggestion";

type RichEditorProps = {
  content: RichNode | null;
  onChange?: (doc: RichNode) => void;
  editable?: boolean;
  placeholder?: string;
  members?: MentionItem[];
  autofocus?: boolean;
  /** ⌘/Ctrl + Entrée */
  onSubmit?: () => void;
  toolbar?: boolean;
  className?: string;
  /** Accès à l'instance (ex. vider l'éditeur après envoi). */
  editorRef?: React.RefObject<Editor | null>;
  ariaLabel?: string;
};

const TOOLS = [
  {
    label: "Gras",
    icon: Bold,
    active: "bold",
    run: (e: Editor) => e.chain().focus().toggleBold().run(),
  },
  {
    label: "Italique",
    icon: Italic,
    active: "italic",
    run: (e: Editor) => e.chain().focus().toggleItalic().run(),
  },
  {
    label: "Barré",
    icon: Strikethrough,
    active: "strike",
    run: (e: Editor) => e.chain().focus().toggleStrike().run(),
  },
  {
    label: "Code",
    icon: Code,
    active: "code",
    run: (e: Editor) => e.chain().focus().toggleCode().run(),
  },
  {
    label: "Titre",
    icon: Heading2,
    active: ["heading", { level: 2 }],
    run: (e: Editor) => e.chain().focus().toggleHeading({ level: 2 }).run(),
  },
  {
    label: "Sous-titre",
    icon: Heading3,
    active: ["heading", { level: 3 }],
    run: (e: Editor) => e.chain().focus().toggleHeading({ level: 3 }).run(),
  },
  {
    label: "Liste",
    icon: List,
    active: "bulletList",
    run: (e: Editor) => e.chain().focus().toggleBulletList().run(),
  },
  {
    label: "Liste numérotée",
    icon: ListOrdered,
    active: "orderedList",
    run: (e: Editor) => e.chain().focus().toggleOrderedList().run(),
  },
  {
    label: "Cases à cocher",
    icon: ListChecks,
    active: "taskList",
    run: (e: Editor) => e.chain().focus().toggleTaskList().run(),
  },
  {
    label: "Bloc de code",
    icon: SquareCode,
    active: "codeBlock",
    run: (e: Editor) => e.chain().focus().toggleCodeBlock().run(),
  },
] as const;

function Toolbar({ editor }: { editor: Editor }) {
  const active = useEditorState({
    editor,
    selector: ({ editor: e }) =>
      TOOLS.map((t) =>
        Array.isArray(t.active)
          ? e.isActive(t.active[0], t.active[1])
          : e.isActive(t.active as string),
      ),
  });
  return (
    <div
      role="toolbar"
      aria-label="Mise en forme"
      className="border-border flex flex-wrap gap-0.5 border-b p-1"
    >
      {TOOLS.map((tool, i) => (
        <Tooltip key={tool.label} content={tool.label}>
          <button
            type="button"
            aria-label={tool.label}
            aria-pressed={active[i]}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => tool.run(editor)}
            className={cn(
              "text-text-dim hover:bg-surface-3 hover:text-text flex size-7 cursor-pointer items-center justify-center",
              active[i] && "bg-surface-3 text-text",
            )}
          >
            <tool.icon className="size-4" />
          </button>
        </Tooltip>
      ))}
    </div>
  );
}

export function RichEditor({
  content,
  onChange,
  editable = true,
  placeholder,
  members = [],
  autofocus = false,
  onSubmit,
  toolbar = true,
  className,
  editorRef,
  ariaLabel,
}: RichEditorProps) {
  // Refs : l'éditeur est créé une seule fois, les callbacks restent à jour.
  const membersRef = useRef(members);
  const onChangeRef = useRef(onChange);
  const onSubmitRef = useRef(onSubmit);
  useEffect(() => {
    membersRef.current = members;
    onChangeRef.current = onChange;
    onSubmitRef.current = onSubmit;
  });

  const editor = useEditor({
    immediatelyRender: false,
    editable,
    autofocus: autofocus ? "end" : false,
    content: content ?? undefined,
    extensions: [
      StarterKit.configure({ heading: { levels: [1, 2, 3] }, link: { openOnClick: !editable } }),
      TaskList,
      TaskItem.configure({ nested: true }),
      Placeholder.configure({ placeholder: placeholder ?? "" }),
      Mention.configure({
        HTMLAttributes: { class: "mention" },
        suggestion: mentionSuggestion(() => membersRef.current),
      }),
    ],
    editorProps: {
      attributes: {
        class: "rich-text min-h-full outline-none",
        ...(ariaLabel && { "aria-label": ariaLabel }),
      },
      handleKeyDown: (_view, event) => {
        if (event.key === "Enter" && (event.metaKey || event.ctrlKey) && onSubmitRef.current) {
          onSubmitRef.current();
          return true;
        }
        return false;
      },
    },
    onUpdate: ({ editor: e }) => onChangeRef.current?.(e.getJSON() as RichNode),
  });

  useEffect(() => {
    if (editorRef) editorRef.current = editor;
  }, [editor, editorRef]);

  useEffect(() => {
    editor?.setEditable(editable);
  }, [editor, editable]);

  return (
    <div
      className={cn(
        "flex flex-col",
        editable && "border-border bg-surface-2 focus-within:border-border-strong border",
        className,
      )}
    >
      {editable && toolbar && editor && <Toolbar editor={editor} />}
      <EditorContent editor={editor} className={cn("flex-1", editable && "px-3 py-2")} />
    </div>
  );
}
