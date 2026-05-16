import { useEffect, useCallback, useRef } from "react";
import MonacoEditor from "@monaco-editor/react";
import type { OnMount } from "@monaco-editor/react";
import type * as Monaco from "monaco-editor";
import type * as Y from "yjs";
import { MonacoBinding } from "y-monaco";
import { useRoomStore } from "../../store/roomStore";

interface Props {
  yText?: Y.Text | null;
  onModelChange?: (code: string) => void;
  onCursorMove: (line: number, column: number) => void;
  onEditorMount?: (editor: Monaco.editor.IStandaloneCodeEditor) => void;
  readOnly?: boolean;
}

export const CodeEditor = ({
  yText,
  onModelChange,
  onCursorMove,
  onEditorMount,
  readOnly = false,
}: Props) => {
  const { language } = useRoomStore();
  const editorRef = useRef<Monaco.editor.IStandaloneCodeEditor | null>(null);
  const monacoRef = useRef<typeof Monaco | null>(null);
  const bindingRef = useRef<MonacoBinding | null>(null);

  const destroyBinding = useCallback(() => {
    if (!bindingRef.current) return;
    bindingRef.current.destroy();
    bindingRef.current = null;
  }, []);

  const bindEditorToYText = useCallback(() => {
    const editor = editorRef.current;
    const model = editor?.getModel();
    if (!editor || !model || !yText) return;

    if (bindingRef.current) {

      if ((bindingRef.current as any).type === yText) return;
      destroyBinding();
    }

    const binding = new MonacoBinding(
      yText,
      model,
      new Set([editor]),

    );
    bindingRef.current = binding;


    onModelChange?.(model.getValue());
  }, [destroyBinding, onModelChange, yText]);

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

  useEffect(() => {

    if (!editorRef.current) return;
    bindEditorToYText();

    return () => {
      destroyBinding();
    };
  }, [bindEditorToYText, destroyBinding]);

  const handleMount: OnMount = (editor, monacoInstance) => {
    editorRef.current = editor;
    monacoRef.current = monacoInstance;

    editor.onDidChangeCursorPosition((e) => {
      onCursorMove(e.position.lineNumber, e.position.column);
    });

    bindEditorToYText();

    editor.focus();
    onEditorMount?.(editor);
  };

  return (
    <div style={{ width: "100%", height: "100%" }}>
      <MonacoEditor
        height="100%"
        defaultLanguage="javascript"
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