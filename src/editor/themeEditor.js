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
  });
}

function createInitialContent() {
  return `
    <div id="theme-editor-root" style="width: 100%; height: 100%; display: flex; flex-direction: column; background: #1a1a1a; color: #fff; font-size: 13px;">
      <div id="theme-editor-welcome" style="flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 20px;">
        <h3 style="margin-bottom: 15px; color: #4a9eff; font-size: 16px;">Create or Open Theme</h3>
        <div style="display: flex; gap: 10px; flex-wrap: wrap; justify-content: center;">
          <button id="btn-new-theme" style="padding: 8px 16px; background: #4a9eff; border: none; border-radius: 3px; color: #fff; cursor: pointer; font-size: 13px;">
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
  const welcomeScreen = dialogElement.querySelector("#theme-editor-welcome");

  // Setup welcome screen buttons
  const btnNew = dialogElement.querySelector("#btn-new-theme");
  const btnOpen = dialogElement.querySelector("#btn-open-theme");

  btnNew.addEventListener("click", () => showNewThemeDialog(dialogElement));
  btnOpen.addEventListener("click", () => openExistingTheme(dialogElement));
}

async function showNewThemeDialog(dialogElement) {
  const root = dialogElement.querySelector("#theme-editor-root");

  const newThemeDialog = `
    <div style="flex: 1; display: flex; flex-direction: column; padding: 15px; overflow: auto;">
      <h3 style="margin: 0 0 10px 0; color: #4a9eff; font-size: 14px;">Choose Starting Point</h3>
      <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px;">
        <button class="template-btn" data-template="empty" style="padding: 10px; background: #333; border: 1px solid #555; border-radius: 4px; color: #fff; cursor: pointer; font-size: 11px; text-align: center;">
          <div style="font-size: 24px; margin-bottom: 4px;">📄</div>
          <div style="font-weight: 600; margin-bottom: 2px; font-size: 12px;">Empty</div>
          <div style="font-size: 10px; color: #aaa;">Start from scratch</div>
        </button>
        <button class="template-btn" data-template="dark" style="padding: 10px; background: #333; border: 1px solid #555; border-radius: 4px; color: #fff; cursor: pointer; font-size: 11px; text-align: center;">
          <div style="font-size: 24px; margin-bottom: 4px;">🌙</div>
          <div style="font-weight: 600; margin-bottom: 2px; font-size: 12px;">Dark</div>
          <div style="font-size: 10px; color: #aaa;">3 files</div>
        </button>
        <button class="template-btn" data-template="light" style="padding: 10px; background: #333; border: 1px solid #555; border-radius: 4px; color: #fff; cursor: pointer; font-size: 11px; text-align: center;">
          <div style="font-size: 24px; margin-bottom: 4px;">☀️</div>
          <div style="font-weight: 600; margin-bottom: 2px; font-size: 12px;">Light</div>
          <div style="font-size: 10px; color: #aaa;">Light mode</div>
        </button>
        <button class="template-btn" data-template="custom" style="padding: 10px; background: #333; border: 1px solid #555; border-radius: 4px; color: #fff; cursor: pointer; font-size: 11px; text-align: center;">
          <div style="font-size: 24px; margin-bottom: 4px;">📦</div>
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
      btn.style.borderColor = "#4a9eff";
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
        break;
      case "dark":
        // Dark theme has 3 files
        currentProject = createThemeProject("");
        currentProject.stylesheets = [
          { name: "exampleBrowser.css", content: darkTheme1 },
          { name: "editorUI.css", content: darkTheme2 },
          { name: "startPage.css", content: darkTheme3 },
        ];
        break;
      case "light":
        currentProject = createThemeProject(lightTheme);
        break;
      case "custom":
        await openExistingTheme(dialogElement);
        return;
    }

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

  root.innerHTML = `
    <div style="display: flex; flex-direction: column; width: 100%; height: 100%; font-size: 12px;">
      <div id="tab-bar" style="display: flex; background: #252525; border-bottom: 1px solid #1a1a1a; overflow-x: auto;">
        <button class="tab-btn" data-tab="info" style="padding: 6px 12px; background: #4a9eff; border: none; border-right: 1px solid #1a1a1a; color: #fff; cursor: pointer; font-size: 11px; white-space: nowrap;">
          📋 Info
        </button>
        ${currentProject.stylesheets
          .map(
            (file, index) => `
          <button class="tab-btn" data-tab="file-${index}" style="padding: 6px 12px; background: #333; border: none; border-right: 1px solid #1a1a1a; color: #fff; cursor: pointer; font-size: 11px; white-space: nowrap;">
            📄 ${file.name}
          </button>
        `
          )
          .join("")}
      </div>
      <div id="tab-content" style="flex: 1; overflow: auto; background: #1e1e1e;">
        ${renderInfoTab()}
      </div>
    </div>
  `;

  setupTabHandlers(dialogElement);
}

function renderInfoTab() {
  return `
    <div style="padding: 12px;">
      <h3 style="color: #4a9eff; margin: 0 0 10px 0; font-size: 13px;">Addon Information</h3>
      
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
          <button id="btn-add-file" style="margin-top: 4px; padding: 4px 8px; background: #4a9eff; border: none; border-radius: 3px; color: #fff; cursor: pointer; font-size: 11px;">
            + Add
          </button>
        </div>
        
        <div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid #444;">
          <button id="btn-save" style="padding: 6px 16px; background: #4caf50; border: none; border-radius: 3px; color: #fff; cursor: pointer; font-size: 12px; width: 100%;">
            💾 Save to .c3addon
          </button>
        </div>
      </div>
    </div>
  `;
}

function renderFileList() {
  return currentProject.stylesheets
    .map(
      (file, index) => `
    <div style="display: flex; align-items: center; gap: 4px; padding: 4px; background: #2a2a2a; border: 1px solid #444; border-radius: 3px;">
      <input type="text" data-file-index="${index}" class="file-name-input" value="${file.name}" style="flex: 1; padding: 3px 6px; background: #1a1a1a; border: 1px solid #555; border-radius: 2px; color: #fff; font-size: 11px;">
      <button class="btn-remove-file" data-file-index="${index}" style="padding: 3px 6px; background: #f44336; border: none; border-radius: 2px; color: #fff; cursor: pointer; font-size: 11px;">
        🗑️
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
      btn.style.background = "#4a9eff";

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

  // Save button
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
      <div style="padding: 4px 8px; background: #252525; border-bottom: 1px solid #1a1a1a;">
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
    await saveThemeToZip(currentProject, fileSystemHandle);
    alert("Theme saved successfully!");
  } catch (error) {
    console.error("Error saving theme:", error);
    alert("Error saving theme: " + error.message);
  }
}
