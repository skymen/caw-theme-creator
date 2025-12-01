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

export function openThemeEditorDialog() {
  const DialogManager = globalThis.SDKExtensions.EditorDialogManager;

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
    <div id="theme-editor-root" style="width: 100%; height: 100%; display: flex; flex-direction: column; background: transparent; color: #fff; font-size: 13px;">
      <div id="theme-editor-welcome" style="flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 20px;">
        <h3 style="margin-bottom: 15px; color: var(--turquoise, #29f3d0); font-size: 16px;">Create or Open Theme</h3>
        <div style="display: flex; gap: 10px; flex-wrap: wrap; justify-content: center;">
          <button id="btn-new-theme" style="padding: 8px 16px; background: var(--turquoise, #29f3d0); border: none; border-radius: 3px; color: #fff; cursor: pointer; font-size: 13px;">
            New Theme
          </button>
          <button id="btn-open-theme" style="padding: 8px 16px; background: #2d7dd2; border: none; border-radius: 3px; color: #fff; cursor: pointer; font-size: 13px;">
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
    const btnNew = dialogElement.querySelector("#btn-new-theme");
    const btnOpen = dialogElement.querySelector("#btn-open-theme");

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
    <div style="flex: 1; display: flex; flex-direction: column; padding: 15px; overflow: auto;">
      <h3 style="margin: 0 0 10px 0; color: var(--turquoise, #29f3d0); font-size: 14px;">Choose Starting Point</h3>
      <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px;">
        <button class="template-btn" data-template="empty" style="padding: 10px; background: #333; border: 1px solid #555; border-radius: 4px; color: #fff; cursor: pointer; font-size: 11px; text-align: center;">
          <div style="margin-bottom: 4px;">${emptyIconSvg}</div>
          <div style="font-weight: 600; margin-bottom: 2px; font-size: 12px;">Empty</div>
          <div style="font-size: 10px; color: #aaa;">Start from scratch</div>
        </button>
        <button class="template-btn" data-template="dark" style="padding: 10px; background: #333; border: 1px solid #555; border-radius: 4px; color: #fff; cursor: pointer; font-size: 11px; text-align: center;">
          <div style="margin-bottom: 4px;">${darkIconSvg}</div>
          <div style="font-weight: 600; margin-bottom: 2px; font-size: 12px;">Dark</div>
          <div style="font-size: 10px; color: #aaa;">3 files</div>
        </button>
        <button class="template-btn" data-template="light" style="padding: 10px; background: #333; border: 1px solid #555; border-radius: 4px; color: #fff; cursor: pointer; font-size: 11px; text-align: center;">
          <div style="margin-bottom: 4px;">${lightIconSvg}</div>
          <div style="font-weight: 600; margin-bottom: 2px; font-size: 12px;">Light</div>
          <div style="font-size: 10px; color: #aaa;">Light mode</div>
        </button>
        <button class="template-btn" data-template="custom" style="padding: 10px; background: #333; border: 1px solid #555; border-radius: 4px; color: #fff; cursor: pointer; font-size: 11px; text-align: center;">
          <div style="margin-bottom: 4px;">${importIconSvg}</div>
          <div style="font-weight: 600; margin-bottom: 2px; font-size: 12px;">Import</div>
          <div style="font-size: 10px; color: #aaa;">From .c3addon</div>
        </button>
      </div>
      <button id="btn-back" style="margin-top: 10px; padding: 6px 12px; background: #555; border: none; border-radius: 3px; color: #fff; cursor: pointer; font-size: 12px;">
        ← Back
      </button>
    </div>
  `;

  root.innerHTML = newThemeDialog;

  // Add hover effect
  const templateBtns = root.querySelectorAll(".template-btn");
  templateBtns.forEach((btn) => {
    btn.addEventListener("mouseenter", () => {
      btn.style.borderColor = "var(--turquoise, #29f3d0)";
      btn.style.background = "#2a2a2a";
    });
    btn.addEventListener("mouseleave", () => {
      btn.style.borderColor = "#555";
      btn.style.background = "#333";
    });
    btn.addEventListener("click", async () => {
      const template = btn.dataset.template;
      await createNewTheme(template, dialogElement);
    });
  });

  root.querySelector("#btn-back").addEventListener("click", () => {
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
    <div style="display: flex; flex-direction: column; width: 100%; height: 100%; font-size: 12px;">
      <div style="display: flex; justify-content: space-between; align-items: center; background: #252525; border-bottom: 1px solid transparent; padding: 4px 8px;">
        <div id="tab-bar" style="display: flex; overflow-x: auto; flex: 1;">
          <button class="tab-btn" data-tab="info" style="padding: 6px 12px; background: var(--turquoise, #29f3d0); border: none; border-right: 1px solid transparent; color: #fff; cursor: pointer; font-size: 11px; white-space: nowrap; display: flex; align-items: center; gap: 4px;">
            ${infoIconSvg} Info
          </button>
          ${currentProject.stylesheets
            .map(
              (file, index) => `
            <button class="tab-btn" data-tab="file-${index}" style="padding: 6px 12px; background: #333; border: none; border-right: 1px solid transparent; color: #fff; cursor: pointer; font-size: 11px; white-space: nowrap; display: flex; align-items: center; gap: 4px;">
              ${fileIconSvg} ${file.name}
            </button>
          `
            )
            .join("")}
        </div>
        <div style="display: flex; gap: 4px; margin-left: 8px;">
          <button id="btn-save" style="padding: 4px 8px; background: #4caf50; border: none; border-radius: 3px; color: #fff; cursor: pointer; font-size: 11px; white-space: nowrap; display: flex; align-items: center; gap: 4px;">
            ${saveIconSvg} Save
          </button>
          <button id="btn-close-project" style="padding: 4px 8px; background: #f44336; border: none; border-radius: 3px; color: #fff; cursor: pointer; font-size: 11px; white-space: nowrap; display: flex; align-items: center; gap: 4px;">
            ${closeIconSvg} Close
          </button>
        </div>
      </div>
      <div id="tab-content" style="flex: 1; overflow: auto; background: #1e1e1e;">
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
    <div style="padding: 12px;">
      <h3 style="color: var(--turquoise, #29f3d0); margin: 0 0 10px 0; font-size: 13px;">Addon Information</h3>
      
      <div style="display: flex; flex-direction: column; gap: 8px;">
        <div>
          <label style="display: block; margin-bottom: 2px; color: #aaa; font-size: 11px;">Name</label>
          <input type="text" id="input-name" value="${
            currentProject.name
          }" style="width: 100%; padding: 4px 6px; background: #2a2a2a; border: 1px solid #444; border-radius: 3px; color: #fff; font-size: 12px;">
        </div>
        
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
          <div>
            <label style="display: block; margin-bottom: 2px; color: #aaa; font-size: 11px;">Version</label>
            <input type="text" id="input-version" value="${
              currentProject.version
            }" style="width: 100%; padding: 4px 6px; background: #2a2a2a; border: 1px solid #444; border-radius: 3px; color: #fff; font-size: 12px;">
          </div>
          
          <div>
            <label style="display: block; margin-bottom: 2px; color: #aaa; font-size: 11px;">Author</label>
            <input type="text" id="input-author" value="${
              currentProject.author
            }" style="width: 100%; padding: 4px 6px; background: #2a2a2a; border: 1px solid #444; border-radius: 3px; color: #fff; font-size: 12px;">
          </div>
        </div>
        
        <div>
          <label style="display: block; margin-bottom: 2px; color: #aaa; font-size: 11px;">Website</label>
          <input type="url" id="input-website" value="${
            currentProject.website
          }" style="width: 100%; padding: 4px 6px; background: #2a2a2a; border: 1px solid #444; border-radius: 3px; color: #fff; font-size: 12px;">
        </div>
        
        <div>
          <label style="display: block; margin-bottom: 2px; color: #aaa; font-size: 11px;">Documentation</label>
          <input type="url" id="input-documentation" value="${
            currentProject.documentation
          }" style="width: 100%; padding: 4px 6px; background: #2a2a2a; border: 1px solid #444; border-radius: 3px; color: #fff; font-size: 12px;">
        </div>
        
        <div>
          <label style="display: block; margin-bottom: 2px; color: #aaa; font-size: 11px;">Description</label>
          <textarea id="input-description" rows="2" style="width: 100%; padding: 4px 6px; background: #2a2a2a; border: 1px solid #444; border-radius: 3px; color: #fff; font-size: 12px; resize: vertical;">${
            currentProject.description
          }</textarea>
        </div>
        
        <div>
          <label style="display: block; margin-bottom: 4px; color: #aaa; font-size: 11px;">Files</label>
          <div id="file-list" style="display: flex; flex-direction: column; gap: 4px;">
            ${renderFileList()}
          </div>
          <button id="btn-add-file" style="margin-top: 4px; padding: 4px 8px; background: var(--turquoise, #29f3d0); border: none; border-radius: 3px; color: #fff; cursor: pointer; font-size: 11px; display: flex; align-items: center; gap: 4px;">
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
    <div style="display: flex; align-items: center; gap: 4px; padding: 4px; background: #2a2a2a; border: 1px solid #444; border-radius: 3px;">
      <input type="text" data-file-index="${index}" class="file-name-input" value="${file.name}" style="flex: 1; padding: 3px 6px; background: transparent; border: 1px solid #555; border-radius: 2px; color: #fff; font-size: 11px;">
      <button class="btn-remove-file" data-file-index="${index}" style="padding: 3px 6px; background: #f44336; border: none; border-radius: 2px; color: #fff; cursor: pointer; font-size: 11px; display: flex; align-items: center; gap: 2px;">
        ${deleteIconSvg}
      </button>
    </div>
  `
    )
    .join("");
}

function setupTabHandlers(dialogElement) {
  const tabBtns = dialogElement.querySelectorAll(".tab-btn");
  const tabContent = dialogElement.querySelector("#tab-content");

  tabBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      const tab = btn.dataset.tab;
      currentTab = tab;

      // Update active tab
      tabBtns.forEach((b) => (b.style.background = "#333"));
      btn.style.background = "var(--turquoise, #29f3d0)";

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
    name: dialogElement.querySelector("#input-name"),
    version: dialogElement.querySelector("#input-version"),
    author: dialogElement.querySelector("#input-author"),
    website: dialogElement.querySelector("#input-website"),
    documentation: dialogElement.querySelector("#input-documentation"),
    description: dialogElement.querySelector("#input-description"),
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
    .querySelector("#btn-add-file")
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
    .querySelector("#btn-save")
    ?.addEventListener("click", async () => {
      await saveCurrentProject();
    });
}

function renderFileEditor(fileIndex) {
  const file = currentProject.stylesheets[fileIndex];
  return `
    <div style="width: 100%; height: 100%; display: flex; flex-direction: column;">
      <div style="padding: 4px 8px; background: #252525; border-bottom: 1px solid transparent;">
        <div style="margin: 0; color: #aaa; font-size: 11px;">Editing: ${file.name}</div>
      </div>
      <div id="code-editor-${fileIndex}" style="flex: 1; width: 100%; height: 100%;"></div>
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
    alert("Theme saved successfully!");
  } catch (error) {
    console.error("Error saving theme:", error);
    alert("Error saving theme: " + error.message);
  }
}

function setupCloseProjectHandler(dialogElement) {
  dialogElement
    .querySelector("#btn-close-project")
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
