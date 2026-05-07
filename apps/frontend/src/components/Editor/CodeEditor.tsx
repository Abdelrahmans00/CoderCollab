import { useEffect, useRef, useCallback } from "react";
import MonacoEditor from "@monaco-editor/react";
import type { OnMount, OnChange } from "@monaco-editor/react";
import type * as Monaco from "monaco-editor";
import { useRoomStore } from "../../store/roomStore";

interface Props {
  onCodeChange: (code: string) => void;
  onCursorMove: (line: number, column: number) => void;
  onEditorMount?: (editor: Monaco.editor.IStandaloneCodeEditor) => void;
  readOnly?: boolean;
  isApplyingRemote?: React.MutableRefObject<boolean>;
}

export const CodeEditor = ({
  onCodeChange,
  onCursorMove,
  onEditorMount,
  readOnly = false,
  isApplyingRemote,
}: Props) => {
  const { language } = useRoomStore();
  const editorRef = useRef<Monaco.editor.IStandaloneCodeEditor | null>(null);
  const monacoRef = useRef<typeof Monaco | null>(null);
  const localApplyingRemote = useRef(false);
  const applyingRemoteRef = (isApplyingRemote as React.MutableRefObject<boolean>) ?? localApplyingRemote;

  // ── Sync language changes to Monaco imperatively ─────────────
  useEffect(() => {
    const editor = editorRef.current;
    const m = monacoRef.current;
    if (!editor || !m) return;
    const model = editor.getModel();
    if (!model) return;
    if (model.getLanguageId() !== language) {
      m.editor.setModelLanguage(model, language);
    }
  }, [language]);

  const handleMount: OnMount = (editor, monacoInstance) => {
    editorRef.current = editor;
    monacoRef.current = monacoInstance;

    editor.onDidChangeCursorPosition((e) => {
      onCursorMove(e.position.lineNumber, e.position.column);
    });

    editor.focus();
    onEditorMount?.(editor);
  };

  const handleChange: OnChange = useCallback(
    (value) => {
      // Skip — this change was applied programmatically, not by the user
      if (applyingRemoteRef.current) return; 
      onCodeChange(value ?? "");
    },
    [onCodeChange, applyingRemoteRef]
  );

  return (
    <div style={{ width: "100%", height: "100%" }}>
      <MonacoEditor
        height="100%"
        defaultLanguage="javascript"
        // No value/defaultValue prop — editor is fully uncontrolled
        // We write to it imperatively via applyCode (see Room.tsx)
        onChange={handleChange}
        onMount={handleMount}
        theme="vs-dark"
        options={{
          fontSize: 14,
          fontFamily:
            "'Cascadia Code', 'Fira Code', 'JetBrains Mono', 'Consolas', monospace",
          fontLigatures: true,
          minimap: { enabled: false },
          scrollBeyondLastLine: false,
          automaticLayout: true,
          tabSize: 2,
          wordWrap: "on",
          readOnly,
          cursorBlinking: "smooth",
          cursorStyle: "line",
          smoothScrolling: true,
          contextmenu: true,
          lineNumbers: "on",
          renderLineHighlight: "all",
          bracketPairColorization: { enabled: true },
          formatOnPaste: true,
          suggestOnTriggerCharacters: true,
          quickSuggestions: true,
          acceptSuggestionOnEnter: "on",
          renderWhitespace: "selection",
          guides: { bracketPairs: true, indentation: true },
          padding: { top: 12 },
          scrollbar: {
            verticalScrollbarSize: 8,
            horizontalScrollbarSize: 8,
          },
        }}
      />
    </div>
  );
};
