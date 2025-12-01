// Theme Editor - Main module for managing theme projects

import {
  createThemeProject,
  loadThemeFromZip,
  saveThemeToZip,
} from "./themeProject.js";
import { createCodeEditor } from "./codeEditor.js";
import darkTheme1 from "../files/darkTheme/theme1.css?raw";
import darkTheme2 from "../files/darkTheme/theme2.css?raw";
import darkTheme3 from "../files/darkTheme/theme3.css?raw";
import lightTheme from "../files/lightTheme/theme.css?raw";

let currentProject = null;
let currentTab = "info";
let fileSystemHandle = null;

// State persistence keys
const STORAGE_KEY_PROJECT = "theme-editor-project";
const STORAGE_KEY_HANDLE = "theme-editor-file-handle";

// Theme Editor Color Variables
// Customize these to change the theme editor's appearance
const THEME_COLORS = {
  // Primary colors
  primary: "var(--turquoise, #29f3d0)",
  secondary: "var(--blue, #38e1ff)",
  success: "var(--green, #3ff276)",
  danger: "var(--red, #ff465f)",

  // Backgrounds
  bgDarkest: "var(--gray9, #474747)",
  bgDarker: "var(--gray11, #575757)",
  bgDark: "var(--gray13, #696969)",
  bgMedium: "var(--gray15, #787878)",

  // Borders
  borderDark: "var(--gray7, #383838)",
  borderMedium: "var(--gray9, #474747)",
  borderLight: "var(--gray11, #575757)",

  // Text
  textPrimary: "var(--gray32, #fff)",
  textSecondary: "var(--gray21, #a8a8a8)",
  textOnPrimary: "var(--gray0, #000)",

  // Interactive states
  hoverBg: "var(--gray9, #474747)",
  inputBg: "var(--gray9, #474747)",
  inputBorder: "var(--gray9, #474747)",
  inputBorderFocus: "var(--gray11, #575757)",
};

// Create and inject the stylesheet for theme editor
function injectThemeEditorStyles() {
  const styleId = "theme-editor-styles";

  // Check if stylesheet already exists
  if (document.getElementById(styleId)) {
    return;
  }

  const style = document.createElement("style");
  style.id = styleId;
  style.textContent = `
    /* Theme Editor Styles */
    .theme-editor-root {
      width: 100%;
      height: 100%;
      display: flex;
      flex-direction: column;
      background: transparent;
      color: ${THEME_COLORS.textPrimary};
      font-size: 13px;
    }

    .theme-editor-welcome {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }

    .theme-editor-welcome h3 {
      margin-bottom: 15px;
      color: ${THEME_COLORS.primary};
      font-size: 16px;
    }

    .theme-editor-button-group {
      display: flex;
      gap: 10px;
      flex-wrap: wrap;
      justify-content: center;
    }

    .theme-editor-btn {
      padding: 8px 16px;
      border: none;
      border-radius: 3px;
      cursor: pointer;
      font-size: 13px;
    }

    .theme-editor-btn-primary {
      background: ${THEME_COLORS.primary};
      color: ${THEME_COLORS.textOnPrimary};
    }

    .theme-editor-btn-secondary {
      background: ${THEME_COLORS.secondary};
      color: ${THEME_COLORS.textOnPrimary};
    }

    .theme-editor-btn-success {
      background: ${THEME_COLORS.success};
      color: ${THEME_COLORS.textOnPrimary};
    }

    .theme-editor-btn-danger {
      background: ${THEME_COLORS.danger};
      color: ${THEME_COLORS.textPrimary};
    }

    .theme-editor-btn-small {
      padding: 4px 8px;
      font-size: 11px;
      white-space: nowrap;
      display: flex;
      align-items: center;
      gap: 4px;
    }

    .theme-editor-btn-back {
      padding: 6px 12px;
      background: ${THEME_COLORS.borderLight};
      color: ${THEME_COLORS.textPrimary};
      border: none;
      border-radius: 3px;
      cursor: pointer;
      font-size: 12px;
      margin-top: 10px;
    }

    .theme-editor-container {
      display: flex;
      flex-direction: column;
      width: 100%;
      height: 100%;
      font-size: 12px;
    }

    .theme-editor-toolbar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: ${THEME_COLORS.bgDarkest};
      border-bottom: 1px solid ${THEME_COLORS.borderDark};
      padding: 4px 8px;
    }

    .theme-editor-tab-bar {
      display: flex;
      overflow-x: auto;
      flex: 1;
      gap: 4px;
    }

    .theme-editor-tab-btn {
      padding: 6px 12px;
      background: ${THEME_COLORS.bgMedium};
      border: none;
      color: ${THEME_COLORS.textPrimary};
      cursor: pointer;
      font-size: 11px;
      white-space: nowrap;
      display: flex;
      align-items: center;
      gap: 4px;
    }

    .theme-editor-tab-btn.active {
      background: ${THEME_COLORS.primary};
      color: ${THEME_COLORS.textOnPrimary};
    }

    .theme-editor-toolbar-actions {
      display: flex;
      gap: 4px;
      margin-left: 8px;
    }

    .theme-editor-content {
      flex: 1;
      overflow: auto;
      background: ${THEME_COLORS.bgDarker};
    }

    .theme-editor-info-panel {
      padding: 12px;
    }

    .theme-editor-info-panel h3 {
      color: ${THEME_COLORS.primary};
      margin: 0 0 10px 0;
      font-size: 13px;
    }

    .theme-editor-form {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .theme-editor-form-group {
      display: flex;
      flex-direction: column;
    }

    .theme-editor-form-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 8px;
    }

    .theme-editor-label {
      display: block;
      margin-bottom: 2px;
      color: ${THEME_COLORS.textSecondary};
      font-size: 11px;
    }

    .theme-editor-input {
      width: calc(100% - 12px);
      padding: 4px 6px;
      background: ${THEME_COLORS.inputBg};
      border: 1px solid ${THEME_COLORS.inputBorder};
      border-radius: 3px;
      color: ${THEME_COLORS.textPrimary};
      font-size: 12px;
    }

    .theme-editor-textarea {
      width: calc(100% - 12px);
      padding: 4px 6px;
      background: ${THEME_COLORS.inputBg};
      border: 1px solid ${THEME_COLORS.inputBorder};
      border-radius: 3px;
      color: ${THEME_COLORS.textPrimary};
      font-size: 12px;
      resize: vertical;
    }

    .theme-editor-file-list {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .theme-editor-file-item {
      display: flex;
      align-items: center;
      gap: 4px;
      padding: 4px;
      background: ${THEME_COLORS.inputBg};
      border: 1px solid ${THEME_COLORS.inputBorder};
      border-radius: 3px;
    }

    .theme-editor-file-input {
      flex: 1;
      padding: 3px 6px;
      background: transparent;
      border: 1px solid ${THEME_COLORS.inputBorderFocus};
      border-radius: 2px;
      color: ${THEME_COLORS.textPrimary};
      font-size: 11px;
    }

    .theme-editor-template-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 8px;
    }

    .theme-editor-template-btn {
      padding: 10px;
      background: ${THEME_COLORS.bgMedium};
      border: 1px solid ${THEME_COLORS.borderLight};
      border-radius: 4px;
      color: ${THEME_COLORS.textPrimary};
      cursor: pointer;
      font-size: 11px;
      text-align: center;
    }

    .theme-editor-template-btn:hover {
      border-color: ${THEME_COLORS.primary};
      background: ${THEME_COLORS.hoverBg};
    }

    .theme-editor-template-icon {
      margin-bottom: 4px;
    }

    .theme-editor-template-title {
      font-weight: 600;
      margin-bottom: 2px;
      font-size: 12px;
    }

    .theme-editor-template-desc {
      font-size: 10px;
      color: ${THEME_COLORS.textSecondary};
    }

    .theme-editor-dialog-container {
      flex: 1;
      display: flex;
      flex-direction: column;
      padding: 15px;
      overflow: auto;
    }

    .theme-editor-dialog-header {
      margin: 0 0 10px 0;
      color: ${THEME_COLORS.primary};
      font-size: 14px;
    }

    .theme-editor-file-editor {
      width: 100%;
      height: 100%;
      display: flex;
      flex-direction: column;
    }

    .theme-editor-code-container {
      flex: 1;
      width: 100%;
      height: 100%;
    }
  `;

  document.head.appendChild(style);
}

export function openThemeEditorDialog() {
  const DialogManager = globalThis.SDKExtensions.EditorDialogManager;

  // Inject stylesheet if it doesn't exist
  injectThemeEditorStyles();

  // Check if a window with this ID already exists
  const existingWindow = DialogManager.getWindow("theme-editor");
  if (existingWindow) {
    DialogManager.focusWindow("theme-editor");
    if (existingWindow.isMinimized) {
      DialogManager.restoreWindow("theme-editor");
    }
    return;
  }

  // Create dialog
  DialogManager.createWindow({
    id: "theme-editor",
    title: "Theme Editor",
    width: 600,
    height: 500,
    content: createInitialContent(),
    onInit: (dialogElement) => {
      initializeThemeEditor(dialogElement);
    },
    onClose: () => {
      // Save state when closing
      saveState();
    },
  });
}

function createInitialContent() {
  return `
    <div id="theme-editor-root" class="theme-editor-root">
      <div id="theme-editor-welcome" class="theme-editor-welcome">
        <div class="theme-editor-button-group">
          <button id="theme-editor-btn-new-theme" class="theme-editor-btn theme-editor-btn-primary">
            New Theme
          </button>
          <button id="theme-editor-btn-open-theme" class="theme-editor-btn theme-editor-btn-secondary">
            Open .c3addon
          </button>
        </div>
      </div>
    </div>
  `;
}

function initializeThemeEditor(dialogElement) {
  const root = dialogElement.querySelector("#theme-editor-root");

  // Try to restore previous state
  restoreState(dialogElement);

  // If no project was restored, show welcome screen
  if (!currentProject) {
    const welcomeScreen = dialogElement.querySelector("#theme-editor-welcome");

    // Setup welcome screen buttons
    const btnNew = dialogElement.querySelector("#theme-editor-btn-new-theme");
    const btnOpen = dialogElement.querySelector("#theme-editor-btn-open-theme");

    btnNew.addEventListener("click", () => showNewThemeDialog(dialogElement));
    btnOpen.addEventListener("click", () => openExistingTheme(dialogElement));
  }
}

async function showNewThemeDialog(dialogElement) {
  const root = dialogElement.querySelector("#theme-editor-root");

  // SVG icons for templates
  const emptyIconSvg =
    '<svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor"><path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/></svg>';
  const darkIconSvg =
    '<svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor"><path d="M9 2c-1.05 0-2.05.16-3 .46 4.06 1.27 7 5.06 7 9.54 0 4.48-2.94 8.27-7 9.54.95.3 1.95.46 3 .46 5.52 0 10-4.48 10-10S14.52 2 9 2z"/></svg>';
  const lightIconSvg =
    '<svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor"><path d="M6.76 4.84l-1.8-1.79-1.41 1.41 1.79 1.79 1.42-1.41zM4 10.5H1v2h3v-2zm9-9.95h-2V3.5h2V.55zm7.45 3.91l-1.41-1.41-1.79 1.79 1.41 1.41 1.79-1.79zm-3.21 13.7l1.79 1.8 1.41-1.41-1.8-1.79-1.4 1.4zM20 10.5v2h3v-2h-3zm-8-5c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6-2.69-6-6-6zm-1 16.95h2V19.5h-2v2.95zm-7.45-3.91l1.41 1.41 1.79-1.8-1.41-1.41-1.79 1.8z"/></svg>';
  const importIconSvg =
    '<svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor"><path d="M10 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z"/></svg>';

  const newThemeDialog = `
    <div class="theme-editor-dialog-container">
      <h3 class="theme-editor-dialog-header">Choose Starting Point</h3>
      <div class="theme-editor-template-grid">
        <button class="theme-editor-template-btn" data-template="empty">
          <div class="theme-editor-template-icon">${emptyIconSvg}</div>
          <div class="theme-editor-template-title">Empty</div>
          <div class="theme-editor-template-desc">Start from scratch</div>
        </button>
        <button class="theme-editor-template-btn" data-template="dark">
          <div class="theme-editor-template-icon">${darkIconSvg}</div>
          <div class="theme-editor-template-title">Dark</div>
          <div class="theme-editor-template-desc">3 files</div>
        </button>
        <button class="theme-editor-template-btn" data-template="light">
          <div class="theme-editor-template-icon">${lightIconSvg}</div>
          <div class="theme-editor-template-title">Light</div>
          <div class="theme-editor-template-desc">Light mode</div>
        </button>
        <button class="theme-editor-template-btn" data-template="custom">
          <div class="theme-editor-template-icon">${importIconSvg}</div>
          <div class="theme-editor-template-title">Import</div>
          <div class="theme-editor-template-desc">From .c3addon</div>
        </button>
      </div>
      <button id="theme-editor-btn-back" class="theme-editor-btn-back">
        ← Back
      </button>
    </div>
  `;

  root.innerHTML = newThemeDialog;

  // Setup template button handlers
  const templateBtns = root.querySelectorAll(".theme-editor-template-btn");
  templateBtns.forEach((btn) => {
    btn.addEventListener("click", async () => {
      const template = btn.dataset.template;
      await createNewTheme(template, dialogElement);
    });
  });

  root.querySelector("#theme-editor-btn-back").addEventListener("click", () => {
    root.innerHTML = createInitialContent();
    initializeThemeEditor(dialogElement);
  });
}

async function createNewTheme(template, dialogElement) {
  try {
    switch (template) {
      case "empty":
        currentProject = createThemeProject("");
        fileSystemHandle = null; // Clear file handle for new projects
        break;
      case "dark":
        // Dark theme has 3 files
        currentProject = createThemeProject("");
        currentProject.stylesheets = [
          { name: "exampleBrowser.css", content: darkTheme1 },
          { name: "editorUI.css", content: darkTheme2 },
          { name: "startPage.css", content: darkTheme3 },
        ];
        fileSystemHandle = null; // Clear file handle for new projects
        break;
      case "light":
        currentProject = createThemeProject(lightTheme);
        fileSystemHandle = null; // Clear file handle for new projects
        break;
      case "custom":
        await openExistingTheme(dialogElement);
        return;
    }

    saveState(); // Save state after creating project
    renderEditor(dialogElement);
  } catch (error) {
    console.error("Error creating theme:", error);
    alert("Error creating theme: " + error.message);
  }
}

async function openExistingTheme(dialogElement) {
  try {
    const [fileHandle] = await window.showOpenFilePicker({
      types: [
        {
          description: "Construct 3 Addon",
          accept: { "application/zip": [".c3addon"] },
        },
      ],
    });

    fileSystemHandle = fileHandle;
    const file = await fileHandle.getFile();
    currentProject = await loadThemeFromZip(file);
    saveState(); // Save state after opening project
    renderEditor(dialogElement);
  } catch (error) {
    if (error.name !== "AbortError") {
      console.error("Error opening theme:", error);
      alert("Error opening theme: " + error.message);
    }
  }
}

function renderEditor(dialogElement) {
  const root = dialogElement.querySelector("#theme-editor-root");

  // SVG icons
  const infoIconSvg =
    '<svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M11 7h2v2h-2zm0 4h2v6h-2zm1-9C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/></svg>';
  const fileIconSvg =
    '<svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/></svg>';
  const saveIconSvg =
    '<svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M17 3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V7l-4-4zm-5 16c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3zm3-10H5V5h10v4z"/></svg>';
  const closeIconSvg =
    '<svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>';

  root.innerHTML = `
    <div class="theme-editor-container">
      <div class="theme-editor-toolbar">
        <div id="theme-editor-tab-bar" class="theme-editor-tab-bar">
          <button class="theme-editor-tab-btn active" data-tab="info">
            ${infoIconSvg} Info
          </button>
          ${currentProject.stylesheets
            .map(
              (file, index) => `
            <button class="theme-editor-tab-btn" data-tab="file-${index}">
              ${fileIconSvg} ${file.name}
            </button>
          `
            )
            .join("")}
        </div>
        <div class="theme-editor-toolbar-actions">
          <button id="theme-editor-btn-save" class="theme-editor-btn theme-editor-btn-success theme-editor-btn-small">
            ${saveIconSvg} Save
          </button>
          <button id="theme-editor-btn-close-project" class="theme-editor-btn theme-editor-btn-danger theme-editor-btn-small">
            ${closeIconSvg} Close
          </button>
        </div>
      </div>
      <div id="theme-editor-tab-content" class="theme-editor-content">
        ${renderInfoTab()}
      </div>
    </div>
  `;

  setupTabHandlers(dialogElement);
  setupCloseProjectHandler(dialogElement);
  setupSaveHandler(dialogElement);
}

function renderInfoTab() {
  const addIconSvg =
    '<svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg>';

  return `
    <div class="theme-editor-info-panel">
      <h3>Addon Information</h3>
      
      <div class="theme-editor-form">
        <div class="theme-editor-form-group">
          <label class="theme-editor-label">Name</label>
          <input type="text" id="theme-editor-input-name" value="${
            currentProject.name
          }" class="theme-editor-input">
        </div>
        
        <div class="theme-editor-form-row">
          <div class="theme-editor-form-group">
            <label class="theme-editor-label">Version</label>
            <input type="text" id="theme-editor-input-version" value="${
              currentProject.version
            }" class="theme-editor-input">
          </div>
          
          <div class="theme-editor-form-group">
            <label class="theme-editor-label">Author</label>
            <input type="text" id="theme-editor-input-author" value="${
              currentProject.author
            }" class="theme-editor-input">
          </div>
        </div>
        
        <div class="theme-editor-form-group">
          <label class="theme-editor-label">Website</label>
          <input type="url" id="theme-editor-input-website" value="${
            currentProject.website
          }" class="theme-editor-input">
        </div>
        
        <div class="theme-editor-form-group">
          <label class="theme-editor-label">Documentation</label>
          <input type="url" id="theme-editor-input-documentation" value="${
            currentProject.documentation
          }" class="theme-editor-input">
        </div>
        
        <div class="theme-editor-form-group">
          <label class="theme-editor-label">Description</label>
          <textarea id="theme-editor-input-description" rows="2" class="theme-editor-textarea">${
            currentProject.description
          }</textarea>
        </div>
        
        <div class="theme-editor-form-group">
          <label class="theme-editor-label">Files</label>
          <div id="theme-editor-file-list" class="theme-editor-file-list">
            ${renderFileList()}
          </div>
          <button id="theme-editor-btn-add-file" class="theme-editor-btn theme-editor-btn-primary theme-editor-btn-small" style="margin-top: 4px;">
            ${addIconSvg} Add
          </button>
        </div>
      </div>
    </div>
  `;
}

function renderFileList() {
  const deleteIconSvg =
    '<svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>';

  return currentProject.stylesheets
    .map(
      (file, index) => `
    <div class="theme-editor-file-item">
      <input type="text" data-file-index="${index}" class="file-name-input theme-editor-file-input" value="${file.name}">
      <button class="btn-remove-file theme-editor-btn theme-editor-btn-danger theme-editor-btn-small" data-file-index="${index}">
        ${deleteIconSvg}
      </button>
    </div>
  `
    )
    .join("");
}

function setupTabHandlers(dialogElement) {
  const tabBtns = dialogElement.querySelectorAll(".theme-editor-tab-btn");
  const tabContent = dialogElement.querySelector("#theme-editor-tab-content");

  tabBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      const tab = btn.dataset.tab;
      currentTab = tab;

      // Update active tab
      tabBtns.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");

      if (tab === "info") {
        tabContent.innerHTML = renderInfoTab();
        setupInfoTabHandlers(dialogElement);
      } else {
        const fileIndex = parseInt(tab.split("-")[1]);
        tabContent.innerHTML = renderFileEditor(fileIndex);
        setupFileEditorHandlers(dialogElement, fileIndex);
      }
    });
  });

  setupInfoTabHandlers(dialogElement);
}

function setupInfoTabHandlers(dialogElement) {
  // Input handlers
  const inputs = {
    name: dialogElement.querySelector("#theme-editor-input-name"),
    version: dialogElement.querySelector("#theme-editor-input-version"),
    author: dialogElement.querySelector("#theme-editor-input-author"),
    website: dialogElement.querySelector("#theme-editor-input-website"),
    documentation: dialogElement.querySelector(
      "#theme-editor-input-documentation"
    ),
    description: dialogElement.querySelector("#theme-editor-input-description"),
  };

  Object.entries(inputs).forEach(([key, input]) => {
    input?.addEventListener("input", () => {
      currentProject[key] = input.value;
    });
  });

  // File name inputs
  const fileNameInputs = dialogElement.querySelectorAll(".file-name-input");
  fileNameInputs.forEach((input) => {
    input.addEventListener("input", () => {
      const index = parseInt(input.dataset.fileIndex);
      currentProject.stylesheets[index].name = input.value;
    });
  });

  // Remove file buttons
  const removeButtons = dialogElement.querySelectorAll(".btn-remove-file");
  removeButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const index = parseInt(btn.dataset.fileIndex);
      if (
        confirm(
          `Are you sure you want to remove "${currentProject.stylesheets[index].name}"?`
        )
      ) {
        currentProject.stylesheets.splice(index, 1);
        renderEditor(dialogElement);
      }
    });
  });

  // Add file button
  dialogElement
    .querySelector("#theme-editor-btn-add-file")
    ?.addEventListener("click", () => {
      const fileName = prompt("Enter file name:", "newfile.css");
      if (fileName) {
        currentProject.stylesheets.push({ name: fileName, content: "" });
        renderEditor(dialogElement);
      }
    });
}

function setupSaveHandler(dialogElement) {
  dialogElement
    .querySelector("#theme-editor-btn-save")
    ?.addEventListener("click", async () => {
      await saveCurrentProject();
    });
}

function renderFileEditor(fileIndex) {
  const file = currentProject.stylesheets[fileIndex];
  return `
    <div class="theme-editor-file-editor">
      <div id="code-editor-${fileIndex}" class="theme-editor-code-container"></div>
    </div>
  `;
}

function setupFileEditorHandlers(dialogElement, fileIndex) {
  const container = dialogElement.querySelector(`#code-editor-${fileIndex}`);
  const file = currentProject.stylesheets[fileIndex];

  createCodeEditor(container, file.content, (newContent) => {
    currentProject.stylesheets[fileIndex].content = newContent;
  });
}

async function saveCurrentProject() {
  try {
    const newHandle = await saveThemeToZip(currentProject, fileSystemHandle);
    // Update file handle if user selected a new location
    if (newHandle) {
      fileSystemHandle = newHandle;
      saveState(); // Update state with new file handle
    }
  } catch (error) {
    console.error("Error saving theme:", error);
    alert("Error saving theme: " + error.message);
  }
}

function setupCloseProjectHandler(dialogElement) {
  dialogElement
    .querySelector("#theme-editor-btn-close-project")
    ?.addEventListener("click", () => {
      if (confirm("Close current project? Any unsaved changes will be lost.")) {
        closeProject(dialogElement);
      }
    });
}

function closeProject(dialogElement) {
  currentProject = null;
  fileSystemHandle = null;
  currentTab = "info";
  clearState();

  const root = dialogElement.querySelector("#theme-editor-root");
  root.innerHTML = createInitialContent();
  initializeThemeEditor(dialogElement);
}

// State persistence functions
function saveState() {
  try {
    if (currentProject) {
      localStorage.setItem(STORAGE_KEY_PROJECT, JSON.stringify(currentProject));
    }
    // Note: FileSystemHandle cannot be serialized, so we can't persist it across browser restarts
    // But we keep it in memory for the current session
  } catch (error) {
    console.error("Failed to save state:", error);
  }
}

function restoreState(dialogElement) {
  try {
    const savedProject = localStorage.getItem(STORAGE_KEY_PROJECT);
    if (savedProject) {
      currentProject = JSON.parse(savedProject);
      renderEditor(dialogElement);
    }
  } catch (error) {
    console.error("Failed to restore state:", error);
    clearState();
  }
}

function clearState() {
  try {
    localStorage.removeItem(STORAGE_KEY_PROJECT);
  } catch (error) {
    console.error("Failed to clear state:", error);
  }
}
