
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
  // Database operations
  dbInitialize: (password) => ipcRenderer.invoke('db-initialize', password),
  dbGetAllData: () => ipcRenderer.invoke('db-get-all-data'),
  
  // Section operations
  dbCreateSection: (id, name) => ipcRenderer.invoke('db-create-section', id, name),
  dbUpdateSection: (id, updates) => ipcRenderer.invoke('db-update-section', id, updates),
  dbDeleteSection: (id) => ipcRenderer.invoke('db-delete-section', id),
  
  // Note operations
  dbCreateNote: (id, sectionId, title, content) => ipcRenderer.invoke('db-create-note', id, sectionId, title, content),
  dbUpdateNote: (id, updates) => ipcRenderer.invoke('db-update-note', id, updates),
  dbDeleteNote: (id) => ipcRenderer.invoke('db-delete-note', id),
});