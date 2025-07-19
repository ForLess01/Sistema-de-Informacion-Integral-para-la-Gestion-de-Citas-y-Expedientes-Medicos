const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  platform: process.platform,
  versions: process.versions,
  
  // Funciones de autenticación
  loginSuccess: () => ipcRenderer.invoke('login-success'),
  logout: () => ipcRenderer.invoke('logout'),
  
  // Funciones de debug para login
  resetLoginFlags: () => ipcRenderer.invoke('reset-login-flags'),
  getWindowStatus: () => ipcRenderer.invoke('get-window-status'),
  
  // Funciones de impresión y archivos
  printDocument: (content) => ipcRenderer.invoke('print-document', content),
  saveFile: (data) => ipcRenderer.invoke('save-file', data),
  
  // Información del sistema
  getSystemInfo: () => ipcRenderer.invoke('get-system-info'),
  
  // Navegación (escuchar eventos del menú)
  onNavigate: (callback) => ipcRenderer.on('navigate', callback),
  removeNavigateListener: (callback) => ipcRenderer.removeListener('navigate', callback)
});
