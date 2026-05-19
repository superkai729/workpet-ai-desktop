const { app, BrowserWindow, ipcMain, screen } = require("electron");
const path = require("path");

let mainWindow;
let petWindow;
let toolWindow;

const rendererPath = (...parts) => path.join(__dirname, "..", "renderer", ...parts);

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
}

function createPetWindow() {
  if (petWindow && !petWindow.isDestroyed()) {
    petWindow.show();
    petWindow.focus();
    return;
  }

  const display = screen.getPrimaryDisplay();
  const { width, height } = display.workAreaSize;

  petWindow = new BrowserWindow({
    width: 220,
    height: 260,
    x: width - 250,
    y: height - 290,
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

app.whenReady().then(() => {
  createMainWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
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
