import { useEffect, useRef } from "react";
import type * as Monaco from "monaco-editor";
import { useRoomStore } from "../../store/roomStore";

interface Props {
  editor: Monaco.editor.IStandaloneCodeEditor | null;
}

const injectedStyles = new Set<string>();

const injectCursorStyle = (cssClass: string, color: string): void => {
  if (injectedStyles.has(cssClass)) return;
  const style = document.createElement("style");
  style.id = cssClass;
  style.textContent = `
    .${cssClass} {
      border-left: 2px solid ${color};
      margin-left: -1px;
    }
  `;
  document.head.appendChild(style);
  injectedStyles.add(cssClass);
};

export const CursorOverlay = ({ editor }: Props) => {
  const { cursors } = useRoomStore();

  const decorationCollections = useRef<
    Record<string, Monaco.editor.IEditorDecorationsCollection>
  >({});

  const widgetRefs = useRef<
    Record<string, Monaco.editor.IContentWidget>
  >({});

  useEffect(() => {
    if (!editor) return;

    const model = editor.getModel();
    if (!model) return;

    const activeCursorIds = new Set(Object.keys(cursors));

    for (const [userId, cursor] of Object.entries(cursors)) {
      const { position, color, userName } = cursor;

      const safeId = userId.replace(/[^a-zA-Z0-9]/g, "");
      const cssClass = `cursor-remote-${safeId}`;

      injectCursorStyle(cssClass, color);

      const range = {
        startLineNumber: position.line,
        startColumn: position.column,
        endLineNumber: position.line,
        endColumn: position.column,
      };

      if (decorationCollections.current[userId]) {
        decorationCollections.current[userId].set([
          { range, options: { className: cssClass, stickiness: 1 } },
        ]);
      } else {
        decorationCollections.current[userId] =
          editor.createDecorationsCollection([
            { range, options: { className: cssClass, stickiness: 1 } },
          ]);
      }

      if (widgetRefs.current[userId]) {
        editor.removeContentWidget(widgetRefs.current[userId]);
      }

      const domNode = document.createElement("div");
      domNode.textContent = userName;
      Object.assign(domNode.style, {
        background: color,
        color: "#fff",
        fontSize: "11px",
        fontFamily: "sans-serif",
        padding: "1px 6px",
        borderRadius: "3px",
        whiteSpace: "nowrap",
        pointerEvents: "none",
        userSelect: "none",
        transform: "translateY(-100%)",
        opacity: "0.9",
      });

      const widget: Monaco.editor.IContentWidget = {
        getId: () => `cursor-label-${userId}`,
        getDomNode: () => domNode,
        getPosition: () => ({
          position: { lineNumber: position.line, column: position.column },
          preference: [
            0 as Monaco.editor.ContentWidgetPositionPreference,
          ],
        }),
      };

      editor.addContentWidget(widget);
      widgetRefs.current[userId] = widget;
    }

    for (const userId of Object.keys(widgetRefs.current)) {
      if (activeCursorIds.has(userId)) continue;

      editor.removeContentWidget(widgetRefs.current[userId]);
      delete widgetRefs.current[userId];

      if (decorationCollections.current[userId]) {
        decorationCollections.current[userId].clear();
        delete decorationCollections.current[userId];
      }
    }
  }, [cursors, editor]);

  useEffect(() => {
    return () => {
      if (!editor) return;

      for (const widget of Object.values(widgetRefs.current)) {
        editor.removeContentWidget(widget);
      }
      widgetRefs.current = {};

      for (const collection of Object.values(decorationCollections.current)) {
        collection.clear();
      }
      decorationCollections.current = {};
    };
  }, [editor]);

  return null;
};