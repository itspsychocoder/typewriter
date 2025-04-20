const { app, BrowserWindow, ipcMain, dialog } = require('electron')
const fs = require('fs')
const path = require('path')

const createWindow = () => {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'), // Preload script for renderer process communication
      nodeIntegration: true
    }
  })

  win.loadURL('http://localhost:5173') // This assumes you're using Vite for your frontend
}

// Listen for requests from renderer process to save notes to a file
ipcMain.handle('save-notes', async (event, notesData) => {
  const result = await dialog.showSaveDialog({
    title: 'Save Notes',
    defaultPath: 'notes.json',
    filters: [{ name: 'JSON Files', extensions: ['json'] }]
  })

  if (result.canceled) return null

  // Save the notes to the selected file
  const filePath = result.filePath
  fs.writeFileSync(filePath, JSON.stringify(notesData, null, 2))
  return filePath
})

// Listen for requests from renderer process to load notes from a file
ipcMain.handle('load-notes', async () => {
  const result = await dialog.showOpenDialog({
    title: 'Open Notes',
    filters: [{ name: 'JSON Files', extensions: ['json'] }],
    properties: ['openFile']
  })

  if (result.canceled) return null

  const filePath = result.filePaths[0]
  const notesData = fs.readFileSync(filePath, 'utf-8')
  return JSON.parse(notesData)
})

app.whenReady().then(() => {
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
