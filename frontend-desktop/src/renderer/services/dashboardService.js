import api from './api';

const dashboardService = {
  // Obtener estadísticas del dashboard
  getDashboardStats: async () => {
    const response = await api.get('/dashboard/stats/');
    return response.data;
  },

  // Obtener citas del día
  getTodayAppointments: async () => {
    const response = await api.get('/dashboard/today-appointments/');
    return response.data;
  },

  // Obtener pacientes en emergencia
  getEmergencyPatients: async () => {
    const response = await api.get('/dashboard/emergency-patients/');
    return response.data;
  },

  // Obtener actividad reciente
  getRecentActivity: async () => {
    const response = await api.get('/dashboard/recent-activity/');
    return response.data;
  },

  // Obtener estadísticas de ocupación
  getBedOccupancy: async () => {
    const response = await api.get('/dashboard/bed-occupancy/');
    return response.data;
  },

  // Obtener métricas de rendimiento
  getPerformanceMetrics: async () => {
    const response = await api.get('/dashboard/performance-metrics/');
    return response.data;
  },

  // Obtener alertas y notificaciones
  getAlerts: async () => {
    const response = await api.get('/dashboard/alerts/');
    return response.data;
  },

  // Marcar alerta como leída
  markAlertAsRead: async (alertId) => {
    const response = await api.post(`/dashboard/alerts/${alertId}/read/`);
    return response.data;
  },

  // Obtener resumen de farmacia
  getPharmacySummary: async () => {
    const response = await api.get('/dashboard/pharmacy-summary/');
    return response.data;
  },

  // Obtener estadísticas de laboratorio
  getLabStats: async () => {
    const response = await api.get('/dashboard/lab-stats/');
    return response.data;
  },
};

export default dashboardService;
