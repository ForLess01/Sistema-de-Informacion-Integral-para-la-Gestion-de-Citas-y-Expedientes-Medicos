import api from './api';

const appointmentService = {
  // Obtener todas las citas del paciente
  getMyAppointments: async (params = {}) => {
    const response = await api.get('/appointments/', { params });
    return response.data;
  },

  // Obtener detalle de una cita
  getAppointment: async (id) => {
    const response = await api.get(`/appointments/${id}/`);
    return response.data;
  },

  // Crear nueva cita
  createAppointment: async (appointmentData) => {
    const response = await api.post('/appointments/', appointmentData);
    return response.data;
  },

  // Cancelar cita
  cancelAppointment: async (id, reason) => {
    const response = await api.post(`/appointments/${id}/cancel/`, { reason });
    return response.data;
  },

  // Reprogramar cita
  rescheduleAppointment: async (id, newDateTime) => {
    const response = await api.post(`/appointments/${id}/reschedule/`, { 
      new_date_time: newDateTime 
    });
    return response.data;
  },

  // Obtener especialidades disponibles
  getSpecialties: async () => {
    const response = await api.get('/appointments/specialties/');
    return response.data;
  },

  // Obtener doctores por especialidad
  getDoctorsBySpecialty: async (specialtyId) => {
    const response = await api.get(`/appointments/specialties/${specialtyId}/doctors/`);
    return response.data;
  },

  // Obtener horarios disponibles
  getAvailableSlots: async (doctorId, date) => {
    const response = await api.get('/appointments/available-slots/', {
      params: { doctor_id: doctorId, date }
    });
    return response.data;
  },

  // Obtener historial de citas
  getAppointmentHistory: async (params = {}) => {
    const response = await api.get('/appointments/history/', { params });
    return response.data;
  },

  // Confirmar asistencia a cita
  confirmAttendance: async (id) => {
    const response = await api.post(`/appointments/${id}/confirm/`);
    return response.data;
  },

  // Obtener próximas citas
  getUpcomingAppointments: async () => {
    try {
      const response = await api.get('/appointments/upcoming/');
      return response.data;
    } catch (error) {
      console.error('Error al obtener citas próximas:', error);
      return [];
    }
  },

  // Buscar citas por criterios
  searchAppointments: async (criteria) => {
    const response = await api.get('/appointments/search/', { params: criteria });
    return response.data;
  },
};

export default appointmentService;
