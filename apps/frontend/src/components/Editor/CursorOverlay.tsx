import { useEffect, useRef } from "react";
import type * as Monaco from "monaco-editor";
import { useRoomStore } from "../../store/roomStore";

interface Props {
  editor: Monaco.editor.IStandaloneCodeEditor | null;
}

export const CursorOverlay = ({ editor }: Props) => {
  const { cursors } = useRoomStore();
  const widgetRefs = useRef<Record<string, Monaco.editor.IContentWidget>>({});
  const decorationRefs = useRef<Record<string, string[]>>({});

  useEffect(() => {
    if (!editor) return;

    const model = editor.getModel();
    if (!model) return;

    Object.entries(cursors).forEach(([userId, cursor]) => {
      const { position, color, userName } = cursor;

      // ── Cursor line decoration (colored vertical bar) ────────
      const cssClass = `cursor-user-${userId.replace(/[^a-zA-Z0-9]/g, "")}`;

      // Inject CSS for this user's color if not already injected
      if (!document.getElementById(cssClass)) {
        const style = document.createElement("style");
        style.id = cssClass;
        style.textContent = `
          .${cssClass} {
            border-left: 2px solid ${color};
            margin-left: -1px;
          }
        `;
        document.head.appendChild(style);
      }

      // Apply decoration at cursor position
      const newDecorations = editor.deltaDecorations(
        decorationRefs.current[userId] || [],
        [
          {
            range: new (window as any).monaco.Range(
              position.line,
              position.column,
              position.line,
              position.column
            ),
            options: {
              className: cssClass,
              stickiness: 1,
            },
          },
        ]
      );
      decorationRefs.current[userId] = newDecorations;

      // ── Name tag widget ──────────────────────────────────────
      // Remove old widget for this user if it exists
      if (widgetRefs.current[userId]) {
        editor.removeContentWidget(widgetRefs.current[userId]);
      }

      const widget: Monaco.editor.IContentWidget = {
        getId: () => `cursor-label-${userId}`,
        getDomNode: () => {
          const node = document.createElement("div");
          node.textContent = userName;
          node.style.cssText = `
            background: ${color};
            color: #fff;
            font-size: 11px;
            font-family: sans-serif;
            padding: 1px 6px;
            border-radius: 3px;
            white-space: nowrap;
            pointer-events: none;
            user-select: none;
            transform: translateY(-100%);
            opacity: 0.9;
          `;
          return node;
        },
        getPosition: () => ({
          position: { lineNumber: position.line, column: position.column },
          preference: [0], // EXACT position
        }),
      };

      editor.addContentWidget(widget);
      widgetRefs.current[userId] = widget;
    });

    // Clean up widgets for users who left
    Object.keys(widgetRefs.current).forEach((userId) => {
      if (!cursors[userId]) {
        editor.removeContentWidget(widgetRefs.current[userId]);
        editor.deltaDecorations(decorationRefs.current[userId] || [], []);
        delete widgetRefs.current[userId];
        delete decorationRefs.current[userId];
      }
    });
  }, [cursors, editor]);

  return null; // purely imperative, no JSX output
};