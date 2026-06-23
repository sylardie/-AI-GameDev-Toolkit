const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("aiGameDevToolkit", {
  runtime: "electron",
  platform: process.platform,
  chooseFolder: (options = {}) => ipcRenderer.invoke("dialog:choose-folder", options),
  showItemInFolder: (filePath) => ipcRenderer.invoke("shell:show-item-in-folder", filePath),
  versions: {
    chrome: process.versions.chrome,
    electron: process.versions.electron,
    node: process.versions.node,
  },
});
