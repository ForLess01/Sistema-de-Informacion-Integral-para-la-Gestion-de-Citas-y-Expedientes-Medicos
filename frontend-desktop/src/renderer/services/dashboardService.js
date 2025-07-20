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

  // ===== SERVICIOS ESPECÍFICOS POR ROL =====
  
  // Servicios para Doctor
  getDoctorDashboardStats: async () => {
    const response = await api.get('/dashboard/doctor/stats/');
    return response.data;
  },
  
  getDoctorTodayAppointments: async () => {
    const response = await api.get('/dashboard/doctor/appointments/');
    return response.data;
  },
  
  getDoctorTriageQueue: async () => {
    const response = await api.get('/dashboard/doctor/triage-queue/');
    return response.data;
  },
  
  getPatientsWaitingConsultation: async () => {
    const response = await api.get('/dashboard/doctor/waiting-patients/');
    return response.data;
  },

  // Servicios para Enfermero
  getNurseDashboardStats: async () => {
    const response = await api.get('/dashboard/nurse/stats/');
    return response.data;
  },
  
  getNurseTriageQueue: async () => {
    const response = await api.get('/dashboard/nurse/triage-queue/');
    return response.data;
  },
  
  getCompletedTriage: async () => {
    const response = await api.get('/dashboard/nurse/completed-triage/');
    return response.data;
  },
  
  getNurseAppointments: async () => {
    const response = await api.get('/dashboard/nurse/appointments/');
    return response.data;
  },

  // Servicios para Farmacia
  getPharmacyDashboardStats: async () => {
    const response = await api.get('/dashboard/pharmacy/stats/');
    return response.data;
  },
  
  getLowStockMedicines: async () => {
    const response = await api.get('/dashboard/pharmacy/low-stock/');
    return response.data;
  },
  
  getPendingPrescriptions: async () => {
    const response = await api.get('/dashboard/pharmacy/pending-prescriptions/');
    return response.data;
  },
  
  getRecentMedicineMovements: async () => {
    const response = await api.get('/dashboard/pharmacy/recent-movements/');
    return response.data;
  },

  // Servicios para Admin/Recepcionista
  getAdminDashboardStats: async () => {
    const response = await api.get('/dashboard/admin/stats/');
    return response.data;
  },
  
  getRecentAppointmentActivity: async () => {
    const response = await api.get('/dashboard/admin/recent-appointments/');
    return response.data;
  },
  
  getNewPatients: async () => {
    const response = await api.get('/dashboard/admin/new-patients/');
    return response.data;
  },

  // Servicios para Emergencias
  getEmergencyDashboardStats: async () => {
    const response = await api.get('/dashboard/emergency/stats/');
    return response.data;
  },
  
  getCriticalCases: async () => {
    const response = await api.get('/dashboard/emergency/critical-cases/');
    return response.data;
  },
  
  getEmergencyResponseStats: async () => {
    const response = await api.get('/dashboard/emergency/response-stats/');
    return response.data;
  },

  // Servicios para Obstetricia (ya existentes pero los incluyo para completitud)
  getObstetrizDashboardStats: async () => {
    const response = await api.get('/dashboard/obstetriz/stats/');
    return response.data;
  },
  
  getObstetrizTodayAppointments: async () => {
    const response = await api.get('/dashboard/obstetriz/appointments/');
    return response.data;
  },
  
  getPregnantPatients: async () => {
    const response = await api.get('/dashboard/obstetriz/pregnant-patients/');
    return response.data;
  },

  // Servicios para Odontología (ya existentes pero los incluyo para completitud)
  getOdontologoDashboardStats: async () => {
    const response = await api.get('/dashboard/odontologo/stats/');
    return response.data;
  },
  
  getOdontologoTodayAppointments: async () => {
    const response = await api.get('/dashboard/odontologo/appointments/');
    return response.data;
  },
  
  getActiveTreatments: async () => {
    const response = await api.get('/dashboard/odontologo/active-treatments/');
    return response.data;
  },
};

export default dashboardService;
