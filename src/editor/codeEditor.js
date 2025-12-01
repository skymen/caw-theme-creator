// Simple Code Editor using CodeMirror
import { EditorView, basicSetup } from "codemirror";
import { css } from "@codemirror/lang-css";
import { oneDark } from "@codemirror/theme-one-dark";

export function createCodeEditor(container, initialContent, onChange) {
  try {
    // Create CodeMirror editor
    const editor = new EditorView({
      doc: initialContent,
      extensions: [
        basicSetup,
        css(),
        oneDark,
        EditorView.updateListener.of((update) => {
          if (update.docChanged) {
            onChange(update.state.doc.toString());
          }
        }),
      ],
      parent: container,
    });

    // Make editor fill container
    editor.dom.style.height = "100%";

    return editor;
  } catch (error) {
    console.error("Failed to create CodeMirror editor:", error);

    // Fallback to textarea
    container.innerHTML = `
      <textarea 
        style="width: 100%; height: 100%; padding: 10px; background: #1e1e1e; color: #fff; border: none; font-family: 'Courier New', monospace; font-size: 14px; resize: none;"
      >${initialContent}</textarea>
    `;

    const textarea = container.querySelector("textarea");
    textarea.addEventListener("input", () => {
      onChange(textarea.value);
    });

    return null;
  }
}
