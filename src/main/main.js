const {
  app,
  BrowserWindow,
  clipboard,
  desktopCapturer,
  ipcMain,
  Menu,
  nativeImage,
  screen,
  Tray
} = require("electron");
const fs = require("fs");
const path = require("path");

let mainWindow;
let petWindow;
let toolWindow;
let tray;
let isQuitting = false;

const rendererPath = (...parts) => path.join(__dirname, "..", "renderer", ...parts);
const settingsPath = () => path.join(app.getPath("userData"), "settings.json");

const petThemes = {
  orange: {
    name: "\u6a58\u767d\u5c0f\u5ba0",
    primary: "#F4A261",
    secondary: "#FFF3DF",
    outline: "#C77946"
  },
  cream: {
    name: "\u5976\u6cb9\u5c0f\u5ba0",
    primary: "#F2D8A7",
    secondary: "#FFF9F0",
    outline: "#B98B52"
  },
  mint: {
    name: "\u8584\u8377\u9886\u7ed3",
    primary: "#8ECDB7",
    secondary: "#FFF9F0",
    outline: "#4D9A86"
  },
  blue: {
    name: "\u84dd\u8272\u5de5\u724c",
    primary: "#8AB6D6",
    secondary: "#FFF9F0",
    outline: "#4C82A8"
  }
};

const defaultSettings = {
  petName: "\u5e74\u7cd5",
  petPosition: null,
  petTheme: "orange"
};

function readSettings() {
  try {
    return { ...defaultSettings, ...JSON.parse(fs.readFileSync(settingsPath(), "utf8")) };
  } catch {
    return { ...defaultSettings };
  }
}

function writeSettings(nextSettings) {
  fs.mkdirSync(path.dirname(settingsPath()), { recursive: true });
  fs.writeFileSync(settingsPath(), JSON.stringify(nextSettings, null, 2));
}

function updateSettings(partialSettings) {
  const nextSettings = { ...readSettings(), ...partialSettings };
  writeSettings(nextSettings);
  return nextSettings;
}

function savePetPosition() {
  if (!petWindow || petWindow.isDestroyed()) return;

  const { x, y } = petWindow.getBounds();
  updateSettings({ petPosition: { x, y } });
}

function getCurrentTheme() {
  const settings = readSettings();
  return petThemes[settings.petTheme] || petThemes.orange;
}

function createPetIcon(theme = getCurrentTheme()) {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">
      <rect width="32" height="32" rx="7" fill="transparent"/>
      <path d="M8 12 12 6 16 11 20 6 24 12v10H8z" fill="${theme.secondary}" stroke="${theme.outline}" stroke-width="2"/>
      <path d="M8 12h16v10H8z" fill="${theme.secondary}" stroke="${theme.outline}" stroke-width="2"/>
      <path d="M16 11h8v11h-8z" fill="${theme.primary}" opacity="0.9"/>
      <circle cx="14" cy="17" r="2" fill="#2F3136"/>
      <circle cx="20" cy="17" r="2" fill="#2F3136"/>
      <rect x="15" y="22" width="3" height="2" fill="#2F3136"/>
      <rect x="24" y="20" width="5" height="3" rx="1" fill="${theme.outline}"/>
    </svg>`;
  return nativeImage.createFromDataURL(`data:image/svg+xml;utf8,${encodeURIComponent(svg)}`);
}

function updateTrayIcon() {
  if (!tray) return;
  tray.setImage(createPetIcon());
}

function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 980,
    height: 680,
    minWidth: 840,
    minHeight: 600,
    title: "\u5de5\u4f4d\u5c0f\u5ba0",
    backgroundColor: "#fff9f0",
    webPreferences: {
      preload: rendererPath("preload.js")
    }
  });

  mainWindow.loadFile(rendererPath("index.html"));

  mainWindow.on("close", (event) => {
    if (isQuitting) return;
    event.preventDefault();
    mainWindow.hide();
  });
}

function sendPetSettings() {
  if (!petWindow || petWindow.isDestroyed()) return;
  petWindow.webContents.send("pet:settings", readSettings());
}

function createPetWindow() {
  if (petWindow && !petWindow.isDestroyed()) {
    petWindow.show();
    petWindow.focus();
    sendPetSettings();
    return;
  }

  const display = screen.getPrimaryDisplay();
  const { width, height } = display.workAreaSize;
  const savedPosition = readSettings().petPosition;

  petWindow = new BrowserWindow({
    width: 220,
    height: 260,
    x: savedPosition?.x ?? width - 250,
    y: savedPosition?.y ?? height - 290,
    frame: false,
    transparent: true,
    resizable: false,
    hasShadow: false,
    alwaysOnTop: true,
    skipTaskbar: true,
    backgroundColor: "#00000000",
    webPreferences: {
      preload: rendererPath("preload.js")
    }
  });

  petWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
  petWindow.loadFile(rendererPath("pet.html"));
  petWindow.webContents.once("did-finish-load", sendPetSettings);
  petWindow.on("moved", savePetPosition);
  petWindow.on("close", savePetPosition);
}

function createToolWindow(tool = "chat") {
  if (toolWindow && !toolWindow.isDestroyed()) {
    toolWindow.close();
  }

  const titleByTool = {
    chat: "\u95ee\u95ee\u5b83",
    screenshot: "\u622a\u56fe",
    translate: "\u7ffb\u8bd1"
  };

  toolWindow = new BrowserWindow({
    width: tool === "screenshot" ? 760 : 460,
    height: tool === "screenshot" ? 620 : 540,
    title: titleByTool[tool] || titleByTool.chat,
    backgroundColor: "#fff9f0",
    alwaysOnTop: true,
    webPreferences: {
      preload: rendererPath("preload.js")
    }
  });

  toolWindow.loadFile(rendererPath("tool.html"), { query: { tool } });
}

function createTray() {
  if (tray) return;

  tray = new Tray(createPetIcon());
  tray.setToolTip("\u5de5\u4f4d\u5c0f\u5ba0");
  tray.setContextMenu(
    Menu.buildFromTemplate([
      { label: "\u663e\u793a\u684c\u5ba0", click: () => createPetWindow() },
      {
        label: "\u9690\u85cf\u684c\u5ba0",
        click: () => {
          if (petWindow && !petWindow.isDestroyed()) petWindow.hide();
        }
      },
      { type: "separator" },
      {
        label: "\u6253\u5f00\u4e3b\u754c\u9762",
        click: () => {
          if (!mainWindow || mainWindow.isDestroyed()) createMainWindow();
          mainWindow.show();
          mainWindow.focus();
        }
      },
      { type: "separator" },
      {
        label: "\u9000\u51fa",
        click: () => {
          isQuitting = true;
          app.quit();
        }
      }
    ])
  );
}

async function capturePrimaryScreen() {
  const primaryDisplay = screen.getPrimaryDisplay();
  const { width, height } = primaryDisplay.size;
  const sources = await desktopCapturer.getSources({
    types: ["screen"],
    thumbnailSize: { width, height }
  });

  const source =
    sources.find((item) => item.display_id === String(primaryDisplay.id)) ||
    sources.find((item) => item.name.toLowerCase().includes("screen")) ||
    sources[0];

  if (!source) {
    throw new Error("No screen source available.");
  }

  return {
    dataUrl: source.thumbnail.toDataURL(),
    displayName: source.name,
    width: source.thumbnail.getSize().width,
    height: source.thumbnail.getSize().height
  };
}

app.whenReady().then(() => {
  createMainWindow();
  createTray();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin" && isQuitting) {
    app.quit();
  }
});

ipcMain.handle("pet:show", (_event, options = {}) => {
  const petTheme = petThemes[options.petTheme] ? options.petTheme : readSettings().petTheme;
  const petName = options.petName?.trim() || readSettings().petName;

  updateSettings({ petName, petTheme });
  updateTrayIcon();
  createPetWindow();
  return true;
});

ipcMain.handle("pet:hide", () => {
  if (petWindow && !petWindow.isDestroyed()) {
    petWindow.hide();
  }
  return true;
});

ipcMain.handle("pet:set-state", (_event, state) => {
  if (petWindow && !petWindow.isDestroyed()) {
    petWindow.webContents.send("pet:state", state);
  }
  return true;
});

ipcMain.handle("pet:move-by", (_event, movement) => {
  if (!petWindow || petWindow.isDestroyed()) {
    return false;
  }

  const bounds = petWindow.getBounds();
  petWindow.setBounds({
    ...bounds,
    x: bounds.x + Math.round(movement.dx || 0),
    y: bounds.y + Math.round(movement.dy || 0)
  });
  savePetPosition();
  return true;
});

ipcMain.handle("tool:open", (_event, tool) => {
  createToolWindow(tool);
  if (petWindow && !petWindow.isDestroyed()) {
    petWindow.webContents.send("pet:state", "thinking");
  }
  return true;
});

ipcMain.handle("screenshot:capture", async () => {
  return capturePrimaryScreen();
});

ipcMain.handle("screenshot:copy", (_event, dataUrl) => {
  const image = nativeImage.createFromDataURL(dataUrl);
  clipboard.writeImage(image);
  return true;
});

ipcMain.handle("app:quit", () => {
  isQuitting = true;
  app.quit();
});
