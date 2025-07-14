const { app, BrowserWindow, ipcMain, dialog, Menu } = require('electron')
const fs = require('fs').promises // Changed to promises for async operations
const path = require('path')

const DatabaseManager = require('./database/DatabaseManager')

let mainWindow; // This will hold our window reference
let dbManager;

const createWindow = () => {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      preload: path.join(__dirname, 'preload.js'),
      webSecurity: false
    },
    titleBarStyle: 'default',
    show: false
  });

  const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;
  
  // Set up menu based on environment
  if (isDev) {
    // Keep default menu in development
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    // Create minimal menu for production or no menu at all
    const template = [
      {
        label: 'File',
        submenu: [
          {
            label: 'Quit',
            accelerator: process.platform === 'darwin' ? 'Cmd+Q' : 'Ctrl+Q',
            click: () => {
              app.quit();
            }
          }
        ]
      }
    ];

    const menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);
    
    // Or completely remove menu:
    // Menu.setApplicationMenu(null);
    
    const indexPath = path.join(__dirname, 'renderer', 'dist', 'index.html');
    mainWindow.loadFile(indexPath).catch(err => {
      console.error('Failed to load:', err);
      mainWindow.loadURL('data:text/html,<h1>TypeWriter</h1><p>Error loading app: ' + err.message + '</p>');
    });
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  return mainWindow;
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

// Add fullscreen handlers - Fix: Use mainWindow variable
ipcMain.handle('toggle-fullscreen', () => {
  if (mainWindow) {
    const isFullScreen = mainWindow.isFullScreen();
    mainWindow.setFullScreen(!isFullScreen);
    return !isFullScreen;
  }
  return false;
});

ipcMain.handle('is-fullscreen', () => {
  return mainWindow ? mainWindow.isFullScreen() : false;
});

ipcMain.handle('exit-fullscreen', () => {
  if (mainWindow && mainWindow.isFullScreen()) {
    mainWindow.setFullScreen(false);
    return true;
  }
  return false;
});

// Add file save functionality - Fix: Use proper fs.promises
ipcMain.handle('save-file', async (event, filename, content) => {
  try {
    const { filePath } = await dialog.showSaveDialog(mainWindow, {
      defaultPath: filename,
      filters: [
        { name: 'All Files', extensions: ['*'] },
        { name: 'Markdown', extensions: ['md'] },
        { name: 'HTML', extensions: ['html'] },
        { name: 'Text', extensions: ['txt'] }
      ]
    });
    
    if (filePath) {
      // Fix: Use fs.promises.writeFile
      await fs.writeFile(filePath, content, 'utf8');
      return { success: true, path: filePath };
    }
    
    return { success: false, error: 'Save cancelled' };
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