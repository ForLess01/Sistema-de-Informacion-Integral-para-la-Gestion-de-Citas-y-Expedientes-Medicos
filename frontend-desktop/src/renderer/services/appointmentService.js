import api from './api';

const appointmentService = {
  // ========== GESTIÓN DE ESPECIALIDADES ==========
  getSpecialties: async () => {
    const response = await api.get('/appointments/specialties/');
    return response.data;
  },

  getDoctorsBySpecialty: async (specialtyId) => {
    const response = await api.get(`/appointments/specialties/${specialtyId}/doctors/`);
    return response.data;
  },

  // ========== GESTIÓN DE CITAS PARA PERSONAL MÉDICO ==========
  
  // Obtener todas las citas (con filtros para personal administrativo)
  getAllAppointments: async (filters = {}) => {
    const queryParams = new URLSearchParams(filters).toString();
    const response = await api.get(`/appointments/?${queryParams}`);
    return response.data;
  },

  // Obtener citas del día actual (para dashboard médico)
  getTodayAppointments: async () => {
    const response = await api.get('/appointments/today/');
    return response.data;
  },

  // Obtener citas por especialidad (para personal administrativo)
  getAppointmentsBySpecialty: async (specialtyId, params = {}) => {
    const queryParams = new URLSearchParams({
      specialty: specialtyId,
      ...params
    }).toString();
    const response = await api.get(`/appointments/?${queryParams}`);
    return response.data;
  },

  // Obtener citas del doctor actual (para doctores)
  getMyAppointments: async (date = null) => {
    const params = date ? `?date=${date}` : '';
    const response = await api.get(`/appointments/my-appointments/${params}`);
    return response.data;
  },

  // Obtener citas por doctor específico (para personal administrativo)
  getAppointmentsByDoctor: async (doctorId, date = null) => {
    const params = { doctor: doctorId };
    if (date) params.date = date;
    const queryParams = new URLSearchParams(params).toString();
    const response = await api.get(`/appointments/?${queryParams}`);
    return response.data;
  },

  // ========== ACCIONES SOBRE CITAS ==========

  // Crear nueva cita (personal administrativo)
  createAppointment: async (appointmentData) => {
    const response = await api.post('/appointments/', appointmentData);
    return response.data;
  },

  // Obtener detalle completo de cita
  getAppointmentDetail: async (appointmentId) => {
    const response = await api.get(`/appointments/${appointmentId}/`);
    return response.data;
  },

  // Confirmar cita (personal administrativo)
  confirmAppointment: async (appointmentId) => {
    const response = await api.post(`/appointments/${appointmentId}/confirm/`);
    return response.data;
  },

  // Cancelar cita (personal administrativo)
  cancelAppointment: async (appointmentId, reason = '') => {
    const response = await api.post(`/appointments/${appointmentId}/cancel/`, { reason });
    return response.data;
  },

  // Marcar cita como completada (doctores)
  completeAppointment: async (appointmentId, consultationNotes = '') => {
    const response = await api.post(`/appointments/${appointmentId}/complete/`, { 
      notes: consultationNotes 
    });
    return response.data;
  },

  // Reagendar cita (personal administrativo)
  rescheduleAppointment: async (appointmentId, newDateTime) => {
    const response = await api.post(`/appointments/${appointmentId}/reschedule/`, {
      new_date_time: newDateTime
    });
    return response.data;
  },

  // ========== HORARIOS Y DISPONIBILIDAD ==========

  // Obtener horarios disponibles para agendar
  getAvailableSlots: async (doctorId, date) => {
    const response = await api.get(`/appointments/available-slots/?doctor_id=${doctorId}&date=${date}`);
    return response.data;
  },

  // Obtener horarios del doctor (para doctores)
  getMySchedule: async (date = null) => {
    const params = date ? `?date=${date}` : '';
    const response = await api.get(`/appointments/my-schedule/${params}`);
    return response.data;
  },

  // ========== BÚSQUEDA Y FILTROS ==========

  // Búsqueda de citas por paciente, doctor, etc.
  searchAppointments: async (query) => {
    const response = await api.get(`/appointments/search/?q=${encodeURIComponent(query)}`);
    return response.data;
  },

  // Obtener citas por rango de fechas
  getAppointmentsByDateRange: async (startDate, endDate, filters = {}) => {
    const params = {
      start_date: startDate,
      end_date: endDate,
      ...filters
    };
    const queryParams = new URLSearchParams(params).toString();
    const response = await api.get(`/appointments/?${queryParams}`);
    return response.data;
  },

  // Obtener citas por paciente específico
  getPatientAppointments: async (patientId) => {
    const response = await api.get(`/appointments/?patient=${patientId}`);
    return response.data;
  },

  // ========== ESTADÍSTICAS Y REPORTES ==========

  // Estadísticas para el dashboard
  getAppointmentStats: async (period = 'today') => {
    const response = await api.get(`/appointments/stats/?period=${period}`);
    return response.data;
  },

  // Métricas del dashboard médico
  getDashboardMetrics: async () => {
    const response = await api.get('/appointments/dashboard-metrics/');
    return response.data;
  },

  // ========== RECORDATORIOS Y NOTIFICACIONES ==========

  // Obtener recordatorios pendientes
  getAppointmentReminders: async () => {
    const response = await api.get('/appointments/reminders/');
    return response.data;
  },

  // Enviar recordatorio manual
  sendReminder: async (appointmentId, type = 'email') => {
    const response = await api.post(`/appointments/${appointmentId}/send-reminder/`, { type });
    return response.data;
  },

  // ========== FUNCIONES ESPECÍFICAS POR ROL ==========

  // Para doctores: obtener próxima cita
  getNextAppointment: async () => {
    const response = await api.get('/appointments/next/');
    return response.data;
  },

  // Para personal administrativo: obtener citas pendientes de confirmación
  getPendingConfirmations: async () => {
    const response = await api.get('/appointments/?status=pending');
    return response.data;
  },

  // Para personal administrativo: obtener lista de espera
  getWaitingList: async (specialtyId = null) => {
    const params = specialtyId ? `?specialty=${specialtyId}` : '';
    const response = await api.get(`/appointments/waiting-list/${params}`);
    return response.data;
  }
};

export default appointmentService;
