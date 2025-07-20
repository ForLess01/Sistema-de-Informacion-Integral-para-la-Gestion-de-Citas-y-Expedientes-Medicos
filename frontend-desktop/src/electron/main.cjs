const { app, BrowserWindow, Menu, ipcMain, dialog, shell } = require('electron');
const path = require('path');
const isDev = process.env.NODE_ENV !== 'production';

// Habilitar live reload para Electron
if (isDev) {
  try {
    require('electron-reload')(__dirname, {
      electron: path.join(__dirname, '..', '..', 'node_modules', '.bin', 'electron'),
      hardResetMethod: 'exit'
    });
  } catch (e) {
    // electron-reload no está instalado, continuar sin él
  }
}

let mainWindow;
let loginWindow;
let isProcessingLogin = false; // Flag global para evitar múltiples procesos de login
let isMainWindowCreating = false; // Flag para evitar múltiples creaciones de ventana principal

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

// Función para obtener la ruta del dashboard según el rol
const getDashboardRoute = (userRole) => {
  const roleRoutes = {
    'doctor': '/doctor-dashboard',
    'nurse': '/nurse-dashboard',
    'admin': '/admin-dashboard',
    'receptionist': '/admin-dashboard',
    'pharmacist': '/pharmacy-dashboard',
    'emergency': '/emergency-dashboard',
    'obstetriz': '/obstetriz-dashboard',
    'odontologo': '/odontologo-dashboard'
  };
  
  return roleRoutes[userRole] || '/general-dashboard';
};

// Crear ventana principal
const createMainWindow = (userData = null) => {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1200,
    minHeight: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.cjs')
    },
    show: false
  });

  // Determinar la ruta a cargar
  let targetRoute = '/';
  if (userData && userData.role) {
    targetRoute = getDashboardRoute(userData.role);
    console.log(`🎯 ROUTING: Dirigiendo a ${userData.role} -> ${targetRoute}`);
  }

  // Cargar la aplicación
  if (isDev) {
    mainWindow.loadURL(`http://localhost:5173${targetRoute}`);
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '..', '..', 'dist', 'index.html'), {
      hash: targetRoute
    });
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
    width: 500,           // 🔧 Ajusta el ancho (era 500)
    height: 780,          // 🔧 Ajusta el alto (era 700)
    resizable: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.cjs')
    },
    frame: false,
    transparent: true
  });

  if (isDev) {
    loginWindow.loadURL('http://localhost:5173/login');
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
ipcMain.handle('login-success', async (event, userData) => {
  console.log('🔐 LOGIN SUCCESS: Handler llamado con userData:', userData);
  
  // PROTECCIÓN 1: Verificar si ya estamos procesando un login
  if (isProcessingLogin) {
    console.log('⚠️  BLOCKED: Ya estamos procesando un login, ignorando llamada');
    return { success: false, message: 'Login already in progress' };
  }
  
  // PROTECCIÓN 2: Establecer flag de procesamiento
  isProcessingLogin = true;
  
  try {
    // PROTECCIÓN 3: Verificar si ya existe ventana principal
    if (mainWindow && !mainWindow.isDestroyed()) {
      console.log('✅ MAIN WINDOW EXISTS: Mostrando ventana existente');
      mainWindow.show();
      mainWindow.focus();
      
      // Cerrar ventana de login
      if (loginWindow && !loginWindow.isDestroyed()) {
        loginWindow.close();
      }
      
      isProcessingLogin = false;
      return { success: true, message: 'Existing window shown' };
    }
    
    // PROTECCIÓN 4: Verificar si ya estamos creando una ventana principal
    if (isMainWindowCreating) {
      console.log('⚠️  BLOCKED: Ya estamos creando ventana principal');
      isProcessingLogin = false;
      return { success: false, message: 'Main window creation in progress' };
    }
    
    // PROTECCIÓN 5: Establecer flag de creación
    isMainWindowCreating = true;
    
    // Crear ventana principal ANTES de cerrar login
    console.log('🏗️  CREATING: Nueva ventana principal con role:', userData?.role);
    createMainWindow(userData);
    
    // Esperar a que la ventana principal esté lista antes de cerrar login
    return new Promise((resolve) => {
      const onMainWindowReady = () => {
        console.log('✅ MAIN WINDOW READY: Ventana principal mostrada');
        
        // Ahora cerrar ventana de login
        if (loginWindow && !loginWindow.isDestroyed()) {
          console.log('🚪 CLOSING: Cerrando ventana de login');
          loginWindow.close();
          loginWindow = null;
        }
        
        // Resetear flags después de completar todo
        isMainWindowCreating = false;
        isProcessingLogin = false;
        
        console.log('✅ SUCCESS: Transición completada exitosamente');
        resolve({ success: true, message: 'Window transition completed' });
      };
      
      // Si la ventana ya está lista, proceder inmediatamente
      if (mainWindow && mainWindow.isVisible()) {
        onMainWindowReady();
      } else {
        // Esperar al evento ready-to-show
        mainWindow.once('ready-to-show', onMainWindowReady);
        
        // Timeout de seguridad por si algo falla
        setTimeout(() => {
          console.log('⏰ TIMEOUT: Forzando cierre de login por timeout');
          if (loginWindow && !loginWindow.isDestroyed()) {
            loginWindow.close();
            loginWindow = null;
          }
          isMainWindowCreating = false;
          isProcessingLogin = false;
          resolve({ success: true, message: 'Window transition completed with timeout' });
        }, 5000); // 5 segundos de timeout
      }
    });
    
  } catch (error) {
    console.error('❌ ERROR en login-success:', error);
    // Resetear flags en caso de error
    isProcessingLogin = false;
    isMainWindowCreating = false;
    return { success: false, message: 'Error creating window', error: error.message };
  }
});

ipcMain.handle('logout', () => {
  // Resetear flags al hacer logout
  isProcessingLogin = false;
  isMainWindowCreating = false;
  
  if (mainWindow) {
    mainWindow.close();
  }
  createLoginWindow();
});

// Handler para resetear flags en caso de emergencia
ipcMain.handle('reset-login-flags', () => {
  console.log('🔄 RESET: Reseteando flags de login');
  isProcessingLogin = false;
  isMainWindowCreating = false;
  return { success: true, message: 'Flags reset' };
});

// Handler para verificar estado de ventanas
ipcMain.handle('get-window-status', () => {
  return {
    hasMainWindow: mainWindow && !mainWindow.isDestroyed(),
    hasLoginWindow: loginWindow && !loginWindow.isDestroyed(),
    isProcessingLogin,
    isMainWindowCreating,
    totalWindows: BrowserWindow.getAllWindows().length
  };
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
