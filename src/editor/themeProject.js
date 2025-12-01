// Theme Project Management
import JSZip from "jszip";

export function createThemeProject(initialCss = "") {
  return {
    name: "New Theme",
    id: "NewTheme",
    version: "1.0.0.0",
    author: "",
    website: "",
    documentation: "",
    description: "",
    stylesheets: [
      {
        name: "theme.css",
        content: initialCss,
      },
    ],
  };
}

export async function loadThemeFromZip(file) {
  const zip = await JSZip.loadAsync(file);

  // Read addon.json
  const addonJsonFile = zip.file("addon.json");
  if (!addonJsonFile) {
    throw new Error("Invalid theme file: missing addon.json at root");
  }

  const addonJsonText = await addonJsonFile.async("text");
  const addonJson = JSON.parse(addonJsonText);

  // Validate it's a C3 addon
  if (addonJson["is-c3-addon"] !== true) {
    throw new Error(
      'Invalid theme file: addon.json must have "is-c3-addon": true'
    );
  }

  // Validate it's a theme type
  if (addonJson.type !== "theme") {
    throw new Error('Invalid theme file: addon.json must have "type": "theme"');
  }

  // Validate stylesheets array exists
  if (
    !Array.isArray(addonJson.stylesheets) ||
    addonJson.stylesheets.length === 0
  ) {
    throw new Error(
      'Invalid theme file: addon.json must have a "stylesheets" array with at least one file'
    );
  }

  // Read stylesheets from the stylesheets array
  const stylesheets = [];
  for (const styleFilename of addonJson.stylesheets) {
    const styleFile = zip.file(styleFilename);
    if (!styleFile) {
      throw new Error(
        `Missing stylesheet file: ${styleFilename} (declared in addon.json but not found in .c3addon)`
      );
    }
    const content = await styleFile.async("text");
    stylesheets.push({
      name: styleFilename,
      content,
    });
  }

  return {
    name: addonJson.name || "Unnamed Theme",
    id: addonJson.id || "UnnamedTheme",
    version: addonJson.version || "1.0.0.0",
    author: addonJson.author || "",
    website: addonJson.website || "",
    documentation: addonJson.documentation || "",
    description: addonJson.description || "",
    stylesheets,
  };
}

export async function saveThemeToZip(project, fileSystemHandle = null) {
  const zip = new JSZip();

  // Create addon.json
  const addonJson = {
    "is-c3-addon": true,
    type: "theme",
    name: project.name,
    id: project.id,
    version: project.version,
    author: project.author,
    "icon-type": "image/svg+xml",
    website: project.website,
    documentation: project.documentation,
    description: project.description,
    stylesheets: project.stylesheets.map((f) => f.name),
    "file-list": [
      "lang/en-US.json",
      "addon.json",
      "icon.svg",
      ...project.stylesheets.map((f) => f.name),
    ],
  };

  zip.file("addon.json", JSON.stringify(addonJson, null, 2));

  // Add stylesheets
  for (const stylesheet of project.stylesheets) {
    zip.file(stylesheet.name, stylesheet.content);
  }

  // Add default icon.svg
  const defaultIcon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
    <rect width="100" height="100" fill="#4a9eff"/>
    <text x="50" y="50" font-size="48" text-anchor="middle" dominant-baseline="middle" fill="white">T</text>
  </svg>`;
  zip.file("icon.svg", defaultIcon);

  // Add lang file
  const langJson = {
    languageTag: "en-US",
    fileDescription: `Strings for ${project.name}.`,
    text: {
      themes: {
        [project.id.toLowerCase()]: {
          name: project.name,
          description: project.description,
          "help-url": project.documentation || project.website,
        },
      },
    },
  };

  zip.file("lang/en-US.json", JSON.stringify(langJson, null, 2));

  // Generate the zip file
  const blob = await zip.generateAsync({ type: "blob" });

  // Try to use File System Access API if available
  if (window.showSaveFilePicker) {
    try {
      let handle = fileSystemHandle;

      // If we don't have a handle, prompt for one
      if (!handle) {
        handle = await window.showSaveFilePicker({
          suggestedName: `${project.id}.c3addon`,
          types: [
            {
              description: "Construct 3 Addon",
              accept: { "application/zip": [".c3addon"] },
            },
          ],
        });
      }

      const writable = await handle.createWritable();
      await writable.write(blob);
      await writable.close();

      return handle;
    } catch (error) {
      if (error.name === "AbortError") {
        throw error;
      }
      // Fall back to download
      console.warn(
        "File System Access API failed, falling back to download:",
        error
      );
    }
  }

  // Fallback: trigger download
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${project.id}.c3addon`;
  a.click();
  URL.revokeObjectURL(url);
}
