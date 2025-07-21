import api from './api';

// Obtener todas las notificaciones del usuario
export const getNotifications = async (params = {}) => {
  const response = await api.get('/notifications/', { params });
  return response.data;
};

// Obtener notificaciones no leídas
export const getUnreadNotifications = async () => {
  const response = await api.get('/notifications/unread/');
  return response.data;
};

// Obtener contador de notificaciones no leídas
export const getUnreadCount = async () => {
  const response = await api.get('/notifications/unread/count/');
  return response.data;
};

// Marcar notificación como leída
export const markAsRead = async (notificationId) => {
  const response = await api.patch(`/notifications/${notificationId}/read/`);
  return response.data;
};

// Marcar todas las notificaciones como leídas
export const markAllAsRead = async () => {
  const response = await api.patch('/notifications/mark-all-read/');
  return response.data;
};

// Eliminar notificación
export const deleteNotification = async (notificationId) => {
  const response = await api.delete(`/notifications/${notificationId}/`);
  return response.data;
};

// Eliminar todas las notificaciones leídas
export const deleteAllRead = async () => {
  const response = await api.delete('/notifications/delete-read/');
  return response.data;
};

// Crear nueva notificación (para testing o admin)
export const createNotification = async (notificationData) => {
  const response = await api.post('/notifications/', notificationData);
  return response.data;
};

// Obtener preferencias de notificaciones del usuario
export const getNotificationPreferences = async () => {
  const response = await api.get('/notifications/preferences/');
  return response.data;
};

// Actualizar preferencias de notificaciones
export const updateNotificationPreferences = async (preferences) => {
  const response = await api.put('/notifications/preferences/', preferences);
  return response.data;
};

// Obtener tipos de notificaciones disponibles
export const getNotificationTypes = async () => {
  const response = await api.get('/notifications/types/');
  return response.data;
};

// Suscribirse a notificaciones push
export const subscribeToNotifications = async (subscription) => {
  const response = await api.post('/notifications/subscribe/', subscription);
  return response.data;
};

// Desuscribirse de notificaciones push
export const unsubscribeFromNotifications = async () => {
  const response = await api.delete('/notifications/unsubscribe/');
  return response.data;
};

// Obtener notificaciones por tipo
export const getNotificationsByType = async (type, params = {}) => {
  const response = await api.get(`/notifications/type/${type}/`, { params });
  return response.data;
};

// Obtener notificaciones por prioridad
export const getNotificationsByPriority = async (priority) => {
  const response = await api.get(`/notifications/priority/${priority}/`);
  return response.data;
};

// Archivar notificación
export const archiveNotification = async (notificationId) => {
  const response = await api.patch(`/notifications/${notificationId}/archive/`);
  return response.data;
};

// Obtener notificaciones archivadas
export const getArchivedNotifications = async (params = {}) => {
  const response = await api.get('/notifications/archived/', { params });
  return response.data;
};

// Snooze notificación (posponer)
export const snoozeNotification = async (notificationId, snoozeUntil) => {
  const response = await api.patch(`/notifications/${notificationId}/snooze/`, {
    snooze_until: snoozeUntil
  });
  return response.data;
};

// Obtener estadísticas de notificaciones
export const getNotificationStats = async () => {
  const response = await api.get('/notifications/stats/');
  return response.data;
};

export default {
  getNotifications,
  getUnreadNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  deleteAllRead,
  createNotification,
  getNotificationPreferences,
  updateNotificationPreferences,
  getNotificationTypes,
  subscribeToNotifications,
  unsubscribeFromNotifications,
  getNotificationsByType,
  getNotificationsByPriority,
  archiveNotification,
  getArchivedNotifications,
  snoozeNotification,
  getNotificationStats
};
