const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electron', {
  saveNotes: (notesData) => ipcRenderer.invoke('save-notes', notesData),
  loadNotes: () => ipcRenderer.invoke('load-notes')
})
