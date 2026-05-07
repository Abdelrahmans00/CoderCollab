import type * as Monaco from "monaco-editor";
import type { MutableRefObject } from "react";

export const makeApplyCode = (
  editor: Monaco.editor.IStandaloneCodeEditor,
  isApplyingRemote: MutableRefObject<boolean>
) => {
  return (newCode: string) => {
    const model = editor.getModel();
    if (!model) return;
    if (model.getValue() === newCode) return;

    isApplyingRemote.current = true;
    const selections = editor.getSelections() ?? [];

    model.pushEditOperations(
      selections,
      [{ range: model.getFullModelRange(), text: newCode }],
      () => selections
    );

    void Promise.resolve().then(() => {
      isApplyingRemote.current = false;
    });
  };
};