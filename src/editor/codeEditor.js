// Simple Code Editor using CodeMirror

let CodeMirror = null;

async function loadCodeMirror() {
  if (CodeMirror) return CodeMirror;
  
  // Load CodeMirror from local packages
  try {
    const { EditorView, basicSetup } = await import("codemirror");
    const { css } = await import("@codemirror/lang-css");
    const { oneDark } = await import("@codemirror/theme-one-dark");
    
    CodeMirror = { EditorView, basicSetup, css, oneDark };
    return CodeMirror;
  } catch (error) {
    console.error("Failed to load CodeMirror:", error);
    return null;
  }
}

export async function createCodeEditor(container, initialContent, onChange) {
  const cm = await loadCodeMirror();
  
  if (!cm) {
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
    
    return;
  }
  
  // Create CodeMirror editor
  const { EditorView, basicSetup, css, oneDark } = cm;
  
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
}
