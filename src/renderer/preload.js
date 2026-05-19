const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("workpet", {
  askAI: (question) => ipcRenderer.invoke("ai:chat", question),
  captureScreenshot: () => ipcRenderer.invoke("screenshot:capture"),
  cancelScreenshotSelection: () => ipcRenderer.invoke("screenshot:cancel-selection"),
  completeScreenshotSelection: (payload) => ipcRenderer.invoke("screenshot:complete-selection", payload),
  copyScreenshot: (dataUrl) => ipcRenderer.invoke("screenshot:copy", dataUrl),
  getLatestScreenshot: () => ipcRenderer.invoke("screenshot:get-latest"),
  hidePet: () => ipcRenderer.invoke("pet:hide"),
  movePetBy: (dx, dy) => ipcRenderer.invoke("pet:move-by", { dx, dy }),
  ocrImage: (imageDataUrl) => ipcRenderer.invoke("ai:ocr", imageDataUrl),
  openTool: (tool) => ipcRenderer.invoke("tool:open", tool),
  quit: () => ipcRenderer.invoke("app:quit"),
  setPetState: (state) => ipcRenderer.invoke("pet:set-state", state),
  showPet: (options) => ipcRenderer.invoke("pet:show", options),
  translateImage: (imageDataUrl) => ipcRenderer.invoke("ai:translate-screenshot", imageDataUrl),
  translateText: (text) => ipcRenderer.invoke("ai:translate", text),
  onPetSettings: (callback) => ipcRenderer.on("pet:settings", (_event, settings) => callback(settings)),
  onPetState: (callback) => ipcRenderer.on("pet:state", (_event, state) => callback(state))
});
