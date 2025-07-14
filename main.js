const { app, BrowserWindow, ipcMain, dialog } = require('electron')
const fs = require('fs')
const path = require('path')

const DatabaseManager = require('./database/DatabaseManager') // Add this line

let mainWindow;
let dbManager;
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

// Database operations
ipcMain.handle('db-initialize', async (event, password) => {
  try {
    console.log('Initializing database...');
    dbManager = new DatabaseManager();
    const result = await dbManager.initialize(password);
    console.log('Database initialization result:', result);
    return result;
  } catch (error) {
    console.error('Database initialization error:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('db-get-all-data', async () => {
  try {
    console.log('Getting all data...');
    
    if (!dbManager) {
      throw new Error('Database manager not initialized');
    }
    
    const data = dbManager.getAllData();
    console.log('Retrieved data:', data);
    return data;
  } catch (error) {
    console.error('Error getting data:', error);
    throw error;
  }
});

ipcMain.handle('db-create-section', async (event, id, name) => {
  try {
    dbManager.createSection(id, name);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('db-update-section', async (event, id, updates) => {
  try {
    dbManager.updateSection(id, updates);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('db-delete-section', async (event, id) => {
  try {
    dbManager.deleteSection(id);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('db-create-note', async (event, id, sectionId, title, content) => {
  try {
    dbManager.createNote(id, sectionId, title, content);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('db-update-note', async (event, id, updates) => {
  try {
    dbManager.updateNote(id, updates);
    console.log(`Note with ID ${id} updated successfully.`);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('db-delete-note', async (event, id) => {
  try {
    dbManager.deleteNote(id);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});


app.whenReady().then(() => {
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (dbManager) {
    dbManager.close();
  }
  if (process.platform !== 'darwin') {
    app.quit();
  }
});