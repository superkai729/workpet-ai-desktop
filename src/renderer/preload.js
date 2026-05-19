const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("workpet", {
  captureScreenshot: () => ipcRenderer.invoke("screenshot:capture"),
  copyScreenshot: (dataUrl) => ipcRenderer.invoke("screenshot:copy", dataUrl),
  hidePet: () => ipcRenderer.invoke("pet:hide"),
  movePetBy: (dx, dy) => ipcRenderer.invoke("pet:move-by", { dx, dy }),
  openTool: (tool) => ipcRenderer.invoke("tool:open", tool),
  quit: () => ipcRenderer.invoke("app:quit"),
  setPetState: (state) => ipcRenderer.invoke("pet:set-state", state),
  showPet: (options) => ipcRenderer.invoke("pet:show", options),
  onPetSettings: (callback) => ipcRenderer.on("pet:settings", (_event, settings) => callback(settings)),
  onPetState: (callback) => ipcRenderer.on("pet:state", (_event, state) => callback(state))
});
