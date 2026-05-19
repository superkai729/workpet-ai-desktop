const { app, BrowserWindow, ipcMain, screen, Tray, Menu, nativeImage } = require("electron");
const fs = require("fs");
const path = require("path");

let mainWindow;
let petWindow;
let toolWindow;
let tray;
let isQuitting = false;

const rendererPath = (...parts) => path.join(__dirname, "..", "renderer", ...parts);
const settingsPath = () => path.join(app.getPath("userData"), "settings.json");

const defaultSettings = {
  petPosition: null
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

function savePetPosition() {
  if (!petWindow || petWindow.isDestroyed()) return;

  const { x, y } = petWindow.getBounds();
  writeSettings({
    ...readSettings(),
    petPosition: { x, y }
  });
}

function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 980,
    height: 680,
    minWidth: 840,
    minHeight: 600,
    title: "工位小宠",
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

function createPetWindow() {
  if (petWindow && !petWindow.isDestroyed()) {
    petWindow.show();
    petWindow.focus();
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
  petWindow.on("moved", savePetPosition);
  petWindow.on("close", savePetPosition);
}

function createToolWindow(tool = "chat") {
  if (toolWindow && !toolWindow.isDestroyed()) {
    toolWindow.close();
  }

  toolWindow = new BrowserWindow({
    width: 460,
    height: 540,
    title: tool === "translate" ? "翻译" : "问问它",
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

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">
      <rect width="32" height="32" rx="7" fill="#F4A261"/>
      <path d="M9 12 13 6 16 12 19 6 23 12v10H9z" fill="#FFF9F0"/>
      <circle cx="14" cy="17" r="2" fill="#2F3136"/>
      <circle cx="20" cy="17" r="2" fill="#2F3136"/>
      <rect x="14" y="22" width="4" height="2" fill="#2F3136"/>
    </svg>`;
  const icon = nativeImage.createFromDataURL(`data:image/svg+xml;utf8,${encodeURIComponent(svg)}`);

  tray = new Tray(icon);
  tray.setToolTip("工位小宠");
  tray.setContextMenu(
    Menu.buildFromTemplate([
      { label: "显示桌宠", click: () => createPetWindow() },
      {
        label: "隐藏桌宠",
        click: () => {
          if (petWindow && !petWindow.isDestroyed()) petWindow.hide();
        }
      },
      { type: "separator" },
      {
        label: "打开主界面",
        click: () => {
          if (!mainWindow || mainWindow.isDestroyed()) createMainWindow();
          mainWindow.show();
          mainWindow.focus();
        }
      },
      { type: "separator" },
      {
        label: "退出",
        click: () => {
          isQuitting = true;
          app.quit();
        }
      }
    ])
  );
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

ipcMain.handle("pet:show", () => {
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

ipcMain.handle("app:quit", () => {
  app.quit();
});
