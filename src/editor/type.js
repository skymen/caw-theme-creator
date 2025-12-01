const SDK = globalThis.SDK;

// Store all registered menu buttons
const registeredButtons = [];

function initializeUI() {
  // Continuously watch for the ui-menu to appear in the DOM
  // Don't disconnect the observer so it catches every time the menu is opened
  const observer = new MutationObserver((mutations) => {
    const menu = document.querySelector("body > ui-menu");
    if (menu) {
      addRegisteredButtonsToMenu(menu);
    }
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });

  // Check if menu already exists
  const existingMenu = document.querySelector("body > ui-menu");
  if (existingMenu) {
    addRegisteredButtonsToMenu(existingMenu);
  }
}

function addRegisteredButtonsToMenu(menu) {
  // Add all registered buttons to the menu
  registeredButtons.forEach(({ config, onClick }) => {
    addButtonToMenuInternal(menu, config, onClick);
  });
}

function addButtonToMenu(config, onClick) {
  // config: { id, svg, title, text, appendToEnd: false }

  // Check if button with this ID is already registered
  if (registeredButtons.some((btn) => btn.config.id === config.id)) {
    return;
  }

  // Register the button
  registeredButtons.push({ config, onClick });

  // Add to menu if it exists
  const menu = document.querySelector("body > ui-menu");
  if (menu) {
    addButtonToMenuInternal(menu, config, onClick);
  }
}

function addButtonToMenuInternal(menu, config, onClick) {
  // Check if button with this ID already exists in the menu
  if (menu.querySelector(`[data-menu-button-id="${config.id}"]`)) {
    return;
  }

  // Get SVG styling from existing menu item
  const existingSvg = menu.querySelector("ui-menuitem svg");
  let svgFill = "rgb(184,184,184)";
  let svgWidth = "40";
  let svgHeight = "40";

  if (existingSvg) {
    const computedStyle = window.getComputedStyle(existingSvg);
    svgFill = existingSvg.getAttribute("fill") || computedStyle.fill || svgFill;
    svgWidth = existingSvg.getAttribute("width") || svgWidth;
    svgHeight = existingSvg.getAttribute("height") || svgHeight;
  }

  // Create the menu item
  const menuItem = document.createElement("ui-menuitem");
  menuItem.setAttribute("role", "menuitem");
  menuItem.setAttribute("title", config.title);
  menuItem.setAttribute("data-menu-button-id", config.id);

  // Add icon with dynamic styling
  menuItem.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" fill="${svgFill}" height="${svgHeight}" viewBox="0 0 24 24" width="${svgWidth}">
      ${config.svg}
    </svg>
    <span class="menu-item-text">${config.text}</span>
  `;

  // Add click handler
  menuItem.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    onClick();
  });

  // Add to menu
  if (config.appendToEnd) {
    menu.appendChild(menuItem);
  } else {
    // Insert before the last separator or at the end
    const lastSeparator = Array.from(
      menu.querySelectorAll("ui-menuseparator")
    ).pop();
    if (lastSeparator) {
      menu.insertBefore(menuItem, lastSeparator);
    } else {
      menu.appendChild(menuItem);
    }
  }
}

function registerMenuButtons() {
  // Register the Theme Editor menu item
  addButtonToMenu(
    {
      id: "theme-editor-button",
      svg: `
        <path d="M12 3c-4.97 0-9 4.03-9 9s4.03 9 9 9c.83 0 1.5-.67 1.5-1.5 0-.39-.15-.74-.39-1.01-.23-.26-.38-.61-.38-.99 0-.83.67-1.5 1.5-1.5H16c2.76 0 5-2.24 5-5 0-4.42-4.03-8-9-8zm-5.5 9c-.83 0-1.5-.67-1.5-1.5S5.67 9 6.5 9 8 9.67 8 10.5 7.33 12 6.5 12zm3-4C8.67 8 8 7.33 8 6.5S8.67 5 9.5 5s1.5.67 1.5 1.5S10.33 8 9.5 8zm5 0c-.83 0-1.5-.67-1.5-1.5S13.67 5 14.5 5s1.5.67 1.5 1.5S15.33 8 14.5 8zm3 4c-.83 0-1.5-.67-1.5-1.5S16.67 9 17.5 9s1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"/>
        <path d="M0 0h24v24H0z" fill="none"/>
      `,
      title: "Open the theme editor to customize the editor appearance.",
      text: "Theme Editor",
      appendToEnd: false,
    },
    openThemeEditorDialog
  );

  // Register the Test Window menu item
  addButtonToMenu(
    {
      id: "test-window-button",
      svg: `
        <path d="M0 0h24v24H0z" fill="none"/>
        <path d="M19 4H5c-1.11 0-2 .9-2 2v12c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 14H5V8h14v10z"/>
      `,
      title: "Create a test window to try multi-window functionality.",
      text: "New Test Window",
      appendToEnd: false,
    },
    openTestWindow
  );
}

function dialogManagerIsAvailable() {
  return !!globalThis?.SDKExtensions?.EditorDialogManager ?? false;
}

function openThemeEditorDialog() {
  if (!dialogManagerIsAvailable()) {
    if (
      confirm(
        "The Theme Editor requires the Editor Window Manager to be available. Open download page?"
      )
    ) {
      // open the link to install Editor Window Manager: https://github.com/skymen/editor-window-manager
      window.open("https://github.com/skymen/editor-window-manager", "_blank");
    }
    return;
  }

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
    content:
      '<div style="padding: 20px;">Theme editor content will go here...</div>',
    onInit: (dialogElement) => {
      console.log("Theme editor dialog initialized");
    },
  });
}

let testWindowCounter = 0;

function openTestWindow() {
  if (!dialogManagerIsAvailable()) {
    if (
      confirm(
        "The Test Window requires the Editor Window Manager to be available. Open download page?"
      )
    ) {
      window.open("https://github.com/skymen/editor-window-manager", "_blank");
    }
    return;
  }

  const DialogManager = globalThis.SDKExtensions.EditorDialogManager;

  // Generate unique ID for each test window
  testWindowCounter++;
  const windowId = `test-window-${testWindowCounter}`;

  // State for this window
  const windowState = {
    counter: 0,
    customTitle: `Test Window ${testWindowCounter}`,
  };

  // Create the window content
  const content = `
    <div style="padding: 20px; display: flex; flex-direction: column; gap: 15px;">
      <div style="background: #333; padding: 15px; border-radius: 8px;">
        <h3 style="margin: 0 0 10px 0; color: #4a9eff;">Window Information</h3>
        <p style="margin: 5px 0; color: #aaa;">Window ID: <strong style="color: #fff;">${windowId}</strong></p>
        <p style="margin: 5px 0; color: #aaa;">Created: <strong style="color: #fff;">${new Date().toLocaleString()}</strong></p>
      </div>
      
      <div style="background: #333; padding: 15px; border-radius: 8px;">
        <h3 style="margin: 0 0 10px 0; color: #4a9eff;">Rename Window</h3>
        <div style="display: flex; gap: 10px; align-items: center;">
          <input 
            type="text" 
            id="title-input-${windowId}" 
            value="${windowState.customTitle}"
            style="flex: 1; padding: 8px; background: #1a1a1a; border: 1px solid #555; border-radius: 4px; color: #fff; font-size: 14px;"
            placeholder="Enter window title"
          />
          <button 
            id="rename-btn-${windowId}"
            style="padding: 8px 16px; background: #4a9eff; border: none; border-radius: 4px; color: #fff; cursor: pointer; font-weight: 500;"
          >
            Rename
          </button>
        </div>
      </div>
      
      <div style="background: #333; padding: 15px; border-radius: 8px;">
        <h3 style="margin: 0 0 10px 0; color: #4a9eff;">State Counter</h3>
        <div style="display: flex; gap: 10px; align-items: center;">
          <button 
            id="decrement-btn-${windowId}"
            style="padding: 8px 16px; background: #f44336; border: none; border-radius: 4px; color: #fff; cursor: pointer; font-size: 18px; font-weight: bold;"
          >
            -
          </button>
          <div 
            id="counter-display-${windowId}"
            style="flex: 1; text-align: center; font-size: 24px; font-weight: bold; color: #fff; background: #1a1a1a; padding: 10px; border-radius: 4px;"
          >
            ${windowState.counter}
          </div>
          <button 
            id="increment-btn-${windowId}"
            style="padding: 8px 16px; background: #4caf50; border: none; border-radius: 4px; color: #fff; cursor: pointer; font-size: 18px; font-weight: bold;"
          >
            +
          </button>
        </div>
        <p style="margin: 10px 0 0 0; color: #888; text-align: center; font-size: 13px;">
          This counter maintains its state independently for each window
        </p>
      </div>
      
      <div style="background: #333; padding: 15px; border-radius: 8px;">
        <h3 style="margin: 0 0 10px 0; color: #4a9eff;">Actions</h3>
        <button 
          id="reset-btn-${windowId}"
          style="width: 100%; padding: 10px; background: #ff9800; border: none; border-radius: 4px; color: #fff; cursor: pointer; font-weight: 500;"
        >
          Reset Counter
        </button>
      </div>
    </div>
  `;

  // Create the window
  DialogManager.createWindow({
    id: windowId,
    title: windowState.customTitle,
    content: content,
    onInit: (dialogElement) => {
      // Get references to elements
      const titleInput = dialogElement.querySelector(
        `#title-input-${windowId}`
      );
      const renameBtn = dialogElement.querySelector(`#rename-btn-${windowId}`);
      const counterDisplay = dialogElement.querySelector(
        `#counter-display-${windowId}`
      );
      const incrementBtn = dialogElement.querySelector(
        `#increment-btn-${windowId}`
      );
      const decrementBtn = dialogElement.querySelector(
        `#decrement-btn-${windowId}`
      );
      const resetBtn = dialogElement.querySelector(`#reset-btn-${windowId}`);

      // Rename functionality
      const updateTitle = () => {
        windowState.customTitle =
          titleInput.value.trim() || `Test Window ${testWindowCounter}`;
        DialogManager.updateWindowTitle(windowId, windowState.customTitle);
      };

      renameBtn.addEventListener("click", updateTitle);
      titleInput.addEventListener("keypress", (e) => {
        if (e.key === "Enter") {
          updateTitle();
        }
      });

      // Counter functionality
      const updateCounter = () => {
        counterDisplay.textContent = windowState.counter;
      };

      incrementBtn.addEventListener("click", () => {
        windowState.counter++;
        updateCounter();
      });

      decrementBtn.addEventListener("click", () => {
        windowState.counter--;
        updateCounter();
      });

      resetBtn.addEventListener("click", () => {
        windowState.counter = 0;
        updateCounter();
      });

      console.log(
        `Test window ${windowId} initialized with state:`,
        windowState
      );
    },
  });
}

export default function (parentClass) {
  // Initialize UI when the module loads
  if (typeof document !== "undefined") {
    // Register menu buttons once
    registerMenuButtons();

    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", initializeUI);
    } else {
      initializeUI();
    }
  }
  return class extends parentClass {
    constructor(sdkPlugin, iObjectType) {
      super(sdkPlugin, iObjectType);
    }
  };
}
