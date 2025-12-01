// Store all registered menu buttons
const registeredButtons = [];

export function initializeMenuObserver() {
  // Continuously watch for the ui-menu to appear in the DOM
  // Don't disconnect the observer so it catches every time the menu is opened
  const observer = new MutationObserver((mutations) => {
    const menu = document.querySelector("body > ui-menu.mainmenu");
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

export function addButtonToMenu(config, onClick) {
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
