import api from './api';

// Obtener todas las configuraciones del sistema
export const getSystemSettings = async () => {
  const response = await api.get('/system-settings/');
  return response.data;
};

// Obtener configuración específica por categoría
export const getSettingsByCategory = async (category) => {
  const response = await api.get(`/system-settings/${category}/`);
  return response.data;
};

// Actualizar configuración general del sistema
export const updateGeneralSettings = async (settings) => {
  const response = await api.put('/system-settings/general/', settings);
  return response.data;
};

// Actualizar configuración de citas
export const updateAppointmentSettings = async (settings) => {
  const response = await api.put('/system-settings/appointments/', settings);
  return response.data;
};

// Actualizar configuración de usuarios
export const updateUserSettings = async (settings) => {
  const response = await api.put('/system-settings/users/', settings);
  return response.data;
};

// Actualizar configuración de notificaciones
export const updateNotificationSettings = async (settings) => {
  const response = await api.put('/system-settings/notifications/', settings);
  return response.data;
};

// Actualizar configuración de seguridad
export const updateSecuritySettings = async (settings) => {
  const response = await api.put('/system-settings/security/', settings);
  return response.data;
};

// Actualizar configuración de farmacia
export const updatePharmacySettings = async (settings) => {
  const response = await api.put('/system-settings/pharmacy/', settings);
  return response.data;
};

// Obtener configuración de backup
export const getBackupSettings = async () => {
  const response = await api.get('/system-settings/backup/');
  return response.data;
};

// Actualizar configuración de backup
export const updateBackupSettings = async (settings) => {
  const response = await api.put('/system-settings/backup/', settings);
  return response.data;
};

// Realizar backup manual
export const createManualBackup = async () => {
  const response = await api.post('/system-settings/backup/create/');
  return response.data;
};

// Obtener lista de backups disponibles
export const getBackupHistory = async () => {
  const response = await api.get('/system-settings/backup/history/');
  return response.data;
};

// Restaurar backup
export const restoreBackup = async (backupId) => {
  const response = await api.post(`/system-settings/backup/restore/${backupId}/`);
  return response.data;
};

// Obtener logs del sistema
export const getSystemLogs = async (params = {}) => {
  const response = await api.get('/system-settings/logs/', { params });
  return response.data;
};

// Limpiar logs antiguos
export const clearOldLogs = async (daysOld = 30) => {
  const response = await api.post('/system-settings/logs/clear/', { days: daysOld });
  return response.data;
};

// Obtener estadísticas del sistema
export const getSystemStats = async () => {
  const response = await api.get('/system-settings/stats/');
  return response.data;
};

// Reiniciar servicio específico
export const restartService = async (serviceName) => {
  const response = await api.post(`/system-settings/services/${serviceName}/restart/`);
  return response.data;
};

// Obtener estado de servicios
export const getServicesStatus = async () => {
  const response = await api.get('/system-settings/services/status/');
  return response.data;
};

// Exportar configuraciones
export const exportSettings = async () => {
  const response = await api.get('/system-settings/export/', {
    responseType: 'blob'
  });
  return response.data;
};

// Importar configuraciones
export const importSettings = async (file) => {
  const formData = new FormData();
  formData.append('settings_file', file);
  const response = await api.post('/system-settings/import/', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });
  return response.data;
};

// Resetear configuraciones a valores por defecto
export const resetToDefaults = async (category) => {
  const response = await api.post(`/system-settings/${category}/reset/`);
  return response.data;
};

export default {
  getSystemSettings,
  getSettingsByCategory,
  updateGeneralSettings,
  updateAppointmentSettings,
  updateUserSettings,
  updateNotificationSettings,
  updateSecuritySettings,
  updatePharmacySettings,
  getBackupSettings,
  updateBackupSettings,
  createManualBackup,
  getBackupHistory,
  restoreBackup,
  getSystemLogs,
  clearOldLogs,
  getSystemStats,
  restartService,
  getServicesStatus,
  exportSettings,
  importSettings,
  resetToDefaults
};
