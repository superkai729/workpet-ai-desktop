const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("workpet", {
  showPet: () => ipcRenderer.invoke("pet:show"),
  hidePet: () => ipcRenderer.invoke("pet:hide"),
  setPetState: (state) => ipcRenderer.invoke("pet:set-state", state),
  movePetBy: (dx, dy) => ipcRenderer.invoke("pet:move-by", { dx, dy }),
  openTool: (tool) => ipcRenderer.invoke("tool:open", tool),
  quit: () => ipcRenderer.invoke("app:quit"),
  onPetState: (callback) => ipcRenderer.on("pet:state", (_event, state) => callback(state))
});
