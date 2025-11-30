const SDK = globalThis.SDK;

function initializeUI() {
  // Continuously watch for the ui-menu to appear in the DOM
  // Don't disconnect the observer so it catches every time the menu is opened
  const observer = new MutationObserver((mutations) => {
    const menu = document.querySelector("body > ui-menu");
    if (menu) {
      addThemeMenuItem(menu);
    }
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });

  // Check if menu already exists
  const existingMenu = document.querySelector("body > ui-menu");
  if (existingMenu) {
    addThemeMenuItem(existingMenu);
  }
}

function addThemeMenuItem(menu) {
  // Check if our menu item already exists
  if (menu.querySelector(".theme-editor-menuitem")) {
    return;
  }

  // Create the menu item
  const menuItem = document.createElement("ui-menuitem");
  menuItem.setAttribute("role", "menuitem");
  menuItem.setAttribute(
    "title",
    "Open the theme editor to customize the editor appearance."
  );
  menuItem.classList.add("theme-editor-menuitem");

  // Add icon (using a palette/theme icon)
  menuItem.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" fill="rgb(184,184,184)" height="40" viewBox="0 0 24 24" width="40">
      <path d="M12 3c-4.97 0-9 4.03-9 9s4.03 9 9 9c.83 0 1.5-.67 1.5-1.5 0-.39-.15-.74-.39-1.01-.23-.26-.38-.61-.38-.99 0-.83.67-1.5 1.5-1.5H16c2.76 0 5-2.24 5-5 0-4.42-4.03-8-9-8zm-5.5 9c-.83 0-1.5-.67-1.5-1.5S5.67 9 6.5 9 8 9.67 8 10.5 7.33 12 6.5 12zm3-4C8.67 8 8 7.33 8 6.5S8.67 5 9.5 5s1.5.67 1.5 1.5S10.33 8 9.5 8zm5 0c-.83 0-1.5-.67-1.5-1.5S13.67 5 14.5 5s1.5.67 1.5 1.5S15.33 8 14.5 8zm3 4c-.83 0-1.5-.67-1.5-1.5S16.67 9 17.5 9s1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"/>
      <path d="M0 0h24v24H0z" fill="none"/>
    </svg>
    <span class="menu-item-text">Theme Editor</span>
  `;

  // Add click handler
  menuItem.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    openThemeEditorDialog();
  });

  // Add to menu (before the last separator or at the end)
  const lastSeparator = Array.from(
    menu.querySelectorAll("ui-menuseparator")
  ).pop();
  if (lastSeparator) {
    menu.insertBefore(menuItem, lastSeparator);
  } else {
    menu.appendChild(menuItem);
  }
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

export default function (parentClass) {
  // Initialize UI when the module loads
  if (typeof document !== "undefined") {
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
