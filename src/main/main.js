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
let screenshotWindow;
let toolWindow;
let tray;
let isQuitting = false;
let latestScreenshot = null;
let selectionBaseScreenshot = null;

const rendererPath = (...parts) => path.join(__dirname, "..", "renderer", ...parts);
const projectPath = path.join(__dirname, "..", "..");
const settingsPath = () => path.join(app.getPath("userData"), "settings.json");

function loadLocalEnv() {
  const envPath = path.join(projectPath, ".env");
  if (!fs.existsSync(envPath)) return;

  const lines = fs.readFileSync(envPath, "utf8").split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const separatorIndex = trimmed.indexOf("=");
    if (separatorIndex === -1) continue;

    const key = trimmed.slice(0, separatorIndex).trim();
    const value = trimmed.slice(separatorIndex + 1).trim().replace(/^["']|["']$/g, "");
    if (key && !process.env[key]) {
      process.env[key] = value;
    }
  }
}

loadLocalEnv();

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
  const width = 32;
  const height = 32;
  const buffer = Buffer.alloc(width * height * 4);

  function hexToRgb(hex) {
    const value = hex.replace("#", "");
    return {
      r: parseInt(value.slice(0, 2), 16),
      g: parseInt(value.slice(2, 4), 16),
      b: parseInt(value.slice(4, 6), 16)
    };
  }

  function setPixel(x, y, hex, alpha = 255) {
    if (x < 0 || y < 0 || x >= width || y >= height) return;
    const { r, g, b } = hexToRgb(hex);
    const index = (y * width + x) * 4;
    buffer[index] = b;
    buffer[index + 1] = g;
    buffer[index + 2] = r;
    buffer[index + 3] = alpha;
  }

  function rect(x, y, w, h, hex, alpha = 255) {
    for (let row = y; row < y + h; row += 1) {
      for (let col = x; col < x + w; col += 1) {
        setPixel(col, row, hex, alpha);
      }
    }
  }

  const primary = theme.primary;
  const secondary = theme.secondary;
  const outline = theme.outline;
  const ink = "#2F3136";

  rect(9, 10, 14, 3, outline);
  rect(7, 13, 18, 12, outline);
  rect(10, 7, 4, 6, outline);
  rect(19, 7, 4, 6, outline);
  rect(9, 13, 7, 10, secondary);
  rect(16, 13, 7, 10, primary);
  rect(12, 16, 2, 2, ink);
  rect(19, 16, 2, 2, ink);
  rect(15, 21, 4, 2, ink);
  rect(23, 20, 5, 3, outline);
  rect(25, 18, 3, 2, outline);
  rect(10, 25, 12, 2, "#000000", 45);

  return nativeImage.createFromBitmap(buffer, { width, height, scaleFactor: 1 });
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
    width: 240,
    height: 380,
    x: savedPosition?.x ?? width - 250,
    y: savedPosition?.y ?? height - 400,
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

async function createScreenshotWindow() {
  if (screenshotWindow && !screenshotWindow.isDestroyed()) {
    screenshotWindow.close();
  }

  if (toolWindow && !toolWindow.isDestroyed()) {
    toolWindow.close();
  }

  selectionBaseScreenshot = await capturePrimaryScreen();
  const { bounds } = screen.getPrimaryDisplay();
  screenshotWindow = new BrowserWindow({
    ...bounds,
    frame: false,
    fullscreen: true,
    resizable: false,
    movable: false,
    alwaysOnTop: true,
    skipTaskbar: true,
    backgroundColor: "#000000",
    webPreferences: {
      preload: rendererPath("preload.js")
    }
  });

  screenshotWindow.loadFile(rendererPath("screenshot-select.html"));
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

function getOpenAIConfig() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OpenAI API key is missing. Create .env with OPENAI_API_KEY.");
  }

  return {
    apiKey,
    model: process.env.OPENAI_MODEL || "gpt-5-mini"
  };
}

function extractResponseText(payload) {
  if (typeof payload?.output_text === "string" && payload.output_text.trim()) {
    return payload.output_text.trim();
  }

  const textParts = [];
  for (const outputItem of payload?.output || []) {
    for (const contentItem of outputItem?.content || []) {
      if (contentItem?.type === "output_text" && contentItem.text) {
        textParts.push(contentItem.text);
      }
      if (contentItem?.type === "text" && contentItem.text) {
        textParts.push(contentItem.text);
      }
    }
  }

  return textParts.join("\n").trim();
}

async function callOpenAI({ instructions, content, maxOutputTokens = 1200 }) {
  const { apiKey, model } = getOpenAIConfig();
  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model,
      instructions,
      input: [
        {
          role: "user",
          content
        }
      ],
      max_output_tokens: maxOutputTokens
    })
  });

  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    const message = payload?.error?.message || `OpenAI request failed: ${response.status}`;
    throw new Error(message);
  }

  const text = extractResponseText(payload);
  if (!text) {
    throw new Error("OpenAI returned an empty response.");
  }

  return text;
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

ipcMain.handle("tool:open", async (_event, tool) => {
  if (tool === "screenshot") {
    await createScreenshotWindow();
    if (petWindow && !petWindow.isDestroyed()) {
      petWindow.webContents.send("pet:state", "thinking");
    }
    return true;
  }

  createToolWindow(tool);
  if (petWindow && !petWindow.isDestroyed()) {
    petWindow.webContents.send("pet:state", "thinking");
  }
  return true;
});

ipcMain.handle("screenshot:capture", async () => {
  if (screenshotWindow && !screenshotWindow.isDestroyed() && selectionBaseScreenshot) {
    return selectionBaseScreenshot;
  }

  return capturePrimaryScreen();
});

ipcMain.handle("screenshot:copy", (_event, dataUrl) => {
  const image = nativeImage.createFromDataURL(dataUrl);
  clipboard.writeImage(image);
  return true;
});

ipcMain.handle("screenshot:complete-selection", (_event, payload) => {
  const image = nativeImage.createFromDataURL(payload.dataUrl);
  clipboard.writeImage(image);
  latestScreenshot = {
    ...payload,
    copiedAt: new Date().toISOString()
  };

  if (screenshotWindow && !screenshotWindow.isDestroyed()) {
    screenshotWindow.close();
  }
  selectionBaseScreenshot = null;

  createToolWindow("screenshot");
  return true;
});

ipcMain.handle("screenshot:cancel-selection", () => {
  if (screenshotWindow && !screenshotWindow.isDestroyed()) {
    screenshotWindow.close();
  }
  selectionBaseScreenshot = null;
  return true;
});

ipcMain.handle("screenshot:get-latest", () => latestScreenshot);

ipcMain.handle("ai:chat", async (_event, question) => {
  return callOpenAI({
    instructions:
      "你是工位小宠里的轻量工作助手。回答要简洁、直接、友好。除非用户要求展开，否则优先给可执行结论。",
    content: [{ type: "input_text", text: question }],
    maxOutputTokens: 1400
  });
});

ipcMain.handle("ai:translate", async (_event, text) => {
  return callOpenAI({
    instructions:
      "你是专业翻译助手。自动识别输入语言：中文翻译成自然英文；非中文翻译成自然中文。只输出译文，不要解释。",
    content: [{ type: "input_text", text }],
    maxOutputTokens: 1600
  });
});

ipcMain.handle("ai:ocr", async (_event, imageDataUrl) => {
  return callOpenAI({
    instructions:
      "你是 OCR 助手。请准确识别图片中的可见文字，保持原文语言和换行。只输出识别到的文字；如果没有文字，输出“未识别到文字”。",
    content: [
      { type: "input_text", text: "识别这张截图里的文字。" },
      { type: "input_image", image_url: imageDataUrl }
    ],
    maxOutputTokens: 2200
  });
});

ipcMain.handle("ai:translate-screenshot", async (_event, imageDataUrl) => {
  return callOpenAI({
    instructions:
      "你是截图翻译助手。先识别图片中的文字，再翻译。中文翻译成自然英文；非中文翻译成自然中文。输出格式：先给“识别文字：”，再给“翻译结果：”。",
    content: [
      { type: "input_text", text: "识别并翻译这张截图中的文字。" },
      { type: "input_image", image_url: imageDataUrl }
    ],
    maxOutputTokens: 2600
  });
});

ipcMain.handle("app:quit", () => {
  isQuitting = true;
  app.quit();
});
