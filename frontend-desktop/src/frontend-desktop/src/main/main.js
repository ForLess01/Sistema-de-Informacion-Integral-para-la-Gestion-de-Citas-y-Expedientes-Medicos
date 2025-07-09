const { app, BrowserWindow, Menu, ipcMain, dialog, shell } = require('electron');
const path = require('path');
const isDev = process.env.NODE_ENV !== 'production';

// Habilitar live reload para Electron
if (isDev) {
  require('electron-reload')(__dirname, {
    electron: path.join(__dirname, '..', '..', 'node_modules', '.bin', 'electron'),
    hardResetMethod: 'exit'
  });
}

let mainWindow;
let loginWindow;

// Configuración del menú de la aplicación
const createMenu = () => {
  const template = [
    {
      label: 'Archivo',
      submenu: [
        {
          label: 'Nueva Cita',
          accelerator: 'CmdOrCtrl+N',
          click: () => {
            mainWindow.webContents.send('navigate', '/appointments/new');
          }
        },
        {
          label: 'Nuevo Paciente',
          accelerator: 'CmdOrCtrl+Shift+N',
          click: () => {
            mainWindow.webContents.send('navigate', '/patients/new');
          }
        },
        { type: 'separator' },
        {
          label: 'Imprimir',
          accelerator: 'CmdOrCtrl+P',
          click: () => {
            mainWindow.webContents.print();
          }
        },
        { type: 'separator' },
        {
          label: 'Salir',
          accelerator: process.platform === 'darwin' ? 'Cmd+Q' : 'Ctrl+Q',
          click: () => {
            app.quit();
          }
        }
      ]
    },
    {
      label: 'Editar',
      submenu: [
        { role: 'undo', label: 'Deshacer' },
        { role: 'redo', label: 'Rehacer' },
        { type: 'separator' },
        { role: 'cut', label: 'Cortar' },
        { role: 'copy', label: 'Copiar' },
        { role: 'paste', label: 'Pegar' }
      ]
    },
    {
      label: 'Ver',
      submenu: [
        { role: 'reload', label: 'Recargar' },
        { role: 'forceReload', label: 'Forzar Recarga' },
        { role: 'toggleDevTools', label: 'Herramientas de Desarrollo' },
        { type: 'separator' },
        { role: 'resetZoom', label: 'Tamaño Original' },
        { role: 'zoomIn', label: 'Acercar' },
        { role: 'zoomOut', label: 'Alejar' },
        { type: 'separator' },
        { role: 'togglefullscreen', label: 'Pantalla Completa' }
      ]
    },
    {
      label: 'Navegación',
      submenu: [
        {
          label: 'Dashboard',
          accelerator: 'CmdOrCtrl+D',
          click: () => {
            mainWindow.webContents.send('navigate', '/dashboard');
          }
        },
        {
          label: 'Pacientes',
          accelerator: 'CmdOrCtrl+1',
          click: () => {
            mainWindow.webContents.send('navigate', '/patients');
          }
        },
        {
          label: 'Citas',
          accelerator: 'CmdOrCtrl+2',
          click: () => {
            mainWindow.webContents.send('navigate', '/appointments');
          }
        },
        {
          label: 'Expedientes',
          accelerator: 'CmdOrCtrl+3',
          click: () => {
            mainWindow.webContents.send('navigate', '/medical-records');
          }
        },
        {
          label: 'Farmacia',
          accelerator: 'CmdOrCtrl+4',
          click: () => {
            mainWindow.webContents.send('navigate', '/pharmacy');
          }
        },
        {
          label: 'Emergencias',
          accelerator: 'CmdOrCtrl+5',
          click: () => {
            mainWindow.webContents.send('navigate', '/emergency');
          }
        }
      ]
    },
    {
      label: 'Ayuda',
      submenu: [
        {
          label: 'Documentación',
          click: () => {
            shell.openExternal('https://docs.medicalsystem.com');
          }
        },
        {
          label: 'Soporte',
          click: () => {
            shell.openExternal('https://support.medicalsystem.com');
          }
        },
        { type: 'separator' },
        {
          label: 'Acerca de',
          click: () => {
            dialog.showMessageBox(mainWindow, {
              type: 'info',
              title: 'Acerca de',
              message: 'Sistema de Información Hospitalaria',
              detail: 'Versión 1.0.0\n\nDesarrollado para la gestión integral de servicios médicos.',
              buttons: ['OK']
            });
          }
        }
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
};

// Crear ventana principal
const createMainWindow = () => {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1200,
    minHeight: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, '..', 'preload', 'preload.js')
    },
    icon: path.join(__dirname, '..', 'assets', 'icon.png'),
    show: false
  });

  // Cargar la aplicación
  if (isDev) {
    mainWindow.loadURL('http://localhost:3001');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '..', '..', 'dist', 'index.html'));
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Crear menú
  createMenu();
};

// Crear ventana de login
const createLoginWindow = () => {
  loginWindow = new BrowserWindow({
    width: 500,
    height: 700,
    resizable: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, '..', 'preload', 'preload.js')
    },
    icon: path.join(__dirname, '..', 'assets', 'icon.png'),
    frame: false,
    transparent: true
  });

  if (isDev) {
    loginWindow.loadURL('http://localhost:3001/login');
  } else {
    loginWindow.loadFile(path.join(__dirname, '..', '..', 'dist', 'index.html'), {
      hash: '/login'
    });
  }

  loginWindow.on('closed', () => {
    loginWindow = null;
  });
};

// Eventos de la aplicación
app.whenReady().then(() => {
  createLoginWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createLoginWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// IPC Handlers
ipcMain.handle('login-success', () => {
  if (loginWindow) {
    loginWindow.close();
  }
  createMainWindow();
});

ipcMain.handle('logout', () => {
  if (mainWindow) {
    mainWindow.close();
  }
  createLoginWindow();
});

// Manejo de impresión
ipcMain.handle('print-document', (event, content) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  win.webContents.print({
    silent: false,
    printBackground: true,
    color: true
  }, (success, errorType) => {
    if (!success) console.log(errorType);
  });
});

// Manejo de archivos
ipcMain.handle('save-file', async (event, data) => {
  const result = await dialog.showSaveDialog({
    filters: [
      { name: 'PDF', extensions: ['pdf'] },
      { name: 'Todos los archivos', extensions: ['*'] }
    ]
  });

  if (!result.canceled) {
    return result.filePath;
  }
  return null;
});

// Información del sistema
ipcMain.handle('get-system-info', () => {
  return {
    platform: process.platform,
    version: app.getVersion(),
    electron: process.versions.electron,
    node: process.versions.node
  };
});
