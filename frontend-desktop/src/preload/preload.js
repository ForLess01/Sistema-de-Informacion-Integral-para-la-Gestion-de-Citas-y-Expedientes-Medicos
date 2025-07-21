const { contextBridge, ipcRenderer } = require('electron');

// Exponer APIs seguras al contexto del renderer
contextBridge.exposeInMainWorld('electronAPI', {
  // Autenticación
  loginSuccess: (userData) => ipcRenderer.invoke('login-success', userData),
  logout: () => ipcRenderer.invoke('logout'),

  // Navegación
  onNavigate: (callback) => {
    ipcRenderer.on('navigate', (event, route) => callback(route));
  },

  // Impresión
  printDocument: (content) => ipcRenderer.invoke('print-document', content),

  // Manejo de archivos
  saveFile: (data) => ipcRenderer.invoke('save-file', data),
  
  // Sistema
  getSystemInfo: () => ipcRenderer.invoke('get-system-info'),

  // Notificaciones
  showNotification: (title, body) => {
    new Notification(title, { body });
  },

  // Base de datos local (para caché offline)
  store: {
    get: (key) => ipcRenderer.invoke('store-get', key),
    set: (key, value) => ipcRenderer.invoke('store-set', key, value),
    delete: (key) => ipcRenderer.invoke('store-delete', key),
    clear: () => ipcRenderer.invoke('store-clear')
  },

  // Ventana
  window: {
    minimize: () => ipcRenderer.send('window-minimize'),
    maximize: () => ipcRenderer.send('window-maximize'),
    close: () => ipcRenderer.send('window-close')
  }
});
