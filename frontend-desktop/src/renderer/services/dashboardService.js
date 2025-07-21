import api from './api';

const dashboardService = {
  // Obtener estadísticas para el dashboard del doctor
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

  // Servicios adicionales para Nurse Station
  getNurseAssignedPatients: async () => {
    const response = await api.get('/dashboard/nurse/assigned-patients/');
    return response.data;
  },
  
  getScheduledMedications: async () => {
    const response = await api.get('/dashboard/nurse/scheduled-medications/');
    return response.data;
  },
  
  getNurseShiftTasks: async () => {
    const response = await api.get('/dashboard/nurse/shift-tasks/');
    return response.data;
  },
  
  getNurseActiveAlerts: async () => {
    const response = await api.get('/dashboard/nurse/active-alerts/');
    return response.data;
  },
  
  completeNurseTask: async (taskId) => {
    const response = await api.post(`/dashboard/nurse/tasks/${taskId}/complete/`);
    return response.data;
  },

  // Servicios para Patient Monitoring
  getMonitoringPatients: async () => {
    const response = await api.get('/dashboard/nurse/monitoring-patients/');
    return response.data;
  },
  
  getCriticalAlerts: async () => {
    const response = await api.get('/dashboard/nurse/critical-alerts/');
    return response.data;
  },
  
  getVitalsHistory: async (patientId, hours) => {
    const response = await api.get(`/dashboard/nurse/vitals-history/${patientId}/?hours=${hours}`);
    return response.data;
  },
  
  acknowledgeAlert: async (alertId) => {
    const response = await api.post(`/dashboard/nurse/alerts/${alertId}/acknowledge/`);
    return response.data;
  },
  
  updatePatientMonitoringConfig: async (config) => {
    const response = await api.patch('/dashboard/nurse/monitoring-config/', config);
    return response.data;
  },
};

export default dashboardService;