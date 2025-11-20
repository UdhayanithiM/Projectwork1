// main.js
const { app, BrowserWindow, globalShortcut, session } = require('electron');
const path = require('path');

const isDev = process.env.NODE_ENV !== 'production';

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1280,
    height: 720,
    fullscreen: true,
    kiosk: !isDev,
    alwaysOnTop: !isDev,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      devTools: isDev,
    },
  });

  // --- SECURITY FEATURES ---
  mainWindow.setMenu(null);

  mainWindow.on('leave-full-screen', (event) => {
    event.preventDefault();
    mainWindow.setFullScreen(true);
  });

  mainWindow.webContents.setWindowOpenHandler(() => {
    return { action: 'deny' };
  });

  const startUrl = isDev ? 'http://localhost:3000' : `file://${path.join(__dirname, '../out/index.html')}`;
  mainWindow.loadURL(startUrl);

  if (isDev) {
    mainWindow.webContents.openDevTools();
  }
}

app.whenReady().then(() => {
  // Set a Content Security Policy
  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': ["script-src 'self' 'unsafe-inline' https://prod.spline.design; object-src 'self'"]
      }
    })
  });

  // Register and block global shortcuts
  globalShortcut.register('CommandOrControl+R', () => {
    console.log('Reload blocked');
    return false;
  });
  globalShortcut.register('CommandOrControl+Shift+I', () => {
    console.log('DevTools blocked');
    return false;
  });
  globalShortcut.register('F11', () => {
    console.log('Toggle Fullscreen blocked');
    return false;
  });

  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('will-quit', () => {
  globalShortcut.unregisterAll();
});