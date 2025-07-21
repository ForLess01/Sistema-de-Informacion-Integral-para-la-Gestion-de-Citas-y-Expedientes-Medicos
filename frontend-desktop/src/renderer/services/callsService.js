import api from './api';

const callsService = {
  // ========== GESTIÓN BÁSICA DE LLAMADAS ==========

  // Obtener todas las llamadas con filtros
  getAllCalls: async (filters = {}) => {
    const queryParams = new URLSearchParams(filters).toString();
    const response = await api.get(`/calls/?${queryParams}`);
    return response.data;
  },

  // Obtener llamadas del día actual
  getTodayCalls: async () => {
    const response = await api.get('/calls/today/');
    return response.data;
  },

  // Obtener detalle completo de una llamada
  getCallDetail: async (callId) => {
    const response = await api.get(`/calls/${callId}/`);
    return response.data;
  },

  // Crear nueva llamada
  createCall: async (callData) => {
    const response = await api.post('/calls/', callData);
    return response.data;
  },

  // Actualizar llamada existente
  updateCall: async (callId, callData) => {
    const response = await api.put(`/calls/${callId}/`, callData);
    return response.data;
  },

  // Eliminar llamada
  deleteCall: async (callId) => {
    const response = await api.delete(`/calls/${callId}/`);
    return response.data;
  },

  // ========== ACCIONES ESPECÍFICAS SOBRE LLAMADAS ==========

  // Marcar llamada como completada
  completeCall: async (callId, resolution) => {
    const response = await api.post(`/calls/${callId}/complete/`, { resolution });
    return response.data;
  },

  // Marcar llamada como en progreso
  startCall: async (callId, assignedTo = null) => {
    const response = await api.post(`/calls/${callId}/start/`, { assigned_to: assignedTo });
    return response.data;
  },

  // Asignar llamada a un usuario
  assignCall: async (callId, userId) => {
    const response = await api.post(`/calls/${callId}/assign/`, { assigned_to: userId });
    return response.data;
  },

  // Cancelar llamada
  cancelCall: async (callId, reason = '') => {
    const response = await api.post(`/calls/${callId}/cancel/`, { reason });
    return response.data;
  },

  // Establecer prioridad de llamada
  setPriority: async (callId, priority) => {
    const response = await api.post(`/calls/${callId}/set-priority/`, { priority });
    return response.data;
  },

  // ========== BÚSQUEDA Y FILTROS ==========

  // Búsqueda de llamadas por múltiples criterios
  searchCalls: async (query) => {
    const response = await api.get(`/calls/search/?q=${encodeURIComponent(query)}`);
    return response.data;
  },

  // Obtener llamadas por estado
  getCallsByStatus: async (status) => {
    const response = await api.get(`/calls/?status=${status}`);
    return response.data;
  },

  // Obtener llamadas por tipo
  getCallsByType: async (type) => {
    const response = await api.get(`/calls/?type=${type}`);
    return response.data;
  },

  // Obtener llamadas por rango de fechas
  getCallsByDateRange: async (startDate, endDate, filters = {}) => {
    const params = {
      start_date: startDate,
      end_date: endDate,
      ...filters
    };
    const queryParams = new URLSearchParams(params).toString();
    const response = await api.get(`/calls/?${queryParams}`);
    return response.data;
  },

  // Obtener llamadas asignadas al usuario actual
  getMyCalls: async () => {
    const response = await api.get('/calls/my-calls/');
    return response.data;
  },

  // Obtener llamadas por paciente específico
  getPatientCalls: async (patientId) => {
    const response = await api.get(`/calls/?patient=${patientId}`);
    return response.data;
  },

  // ========== ESTADÍSTICAS Y REPORTES ==========

  // Estadísticas de llamadas para dashboard
  getCallsStats: async (period = 'today') => {
    const response = await api.get(`/calls/stats/?period=${period}`);
    return response.data;
  },

  // Métricas de rendimiento del equipo
  getTeamMetrics: async (userId = null) => {
    const params = userId ? `?user_id=${userId}` : '';
    const response = await api.get(`/calls/team-metrics/${params}`);
    return response.data;
  },

  // Reporte de llamadas por tipo
  getCallsReportByType: async (startDate, endDate) => {
    const params = new URLSearchParams({ start_date: startDate, end_date: endDate });
    const response = await api.get(`/calls/report/by-type/?${params}`);
    return response.data;
  },

  // ========== CONFIGURACIONES Y UTILIDADES ==========

  // Obtener tipos de llamada disponibles
  getCallTypes: async () => {
    const response = await api.get('/calls/types/');
    return response.data;
  },

  // Obtener estados de llamada disponibles
  getCallStatuses: async () => {
    const response = await api.get('/calls/statuses/');
    return response.data;
  },

  // Obtener prioridades disponibles
  getCallPriorities: async () => {
    const response = await api.get('/calls/priorities/');
    return response.data;
  },

  // Obtener usuarios disponibles para asignación
  getAvailableUsers: async (role = null) => {
    const params = role ? `?role=${role}` : '';
    const response = await api.get(`/calls/available-users/${params}`);
    return response.data;
  },

  // ========== NOTIFICACIONES Y SEGUIMIENTO ==========

  // Agregar nota de seguimiento
  addFollowUpNote: async (callId, note) => {
    const response = await api.post(`/calls/${callId}/notes/`, { note });
    return response.data;
  },

  // Obtener notas de seguimiento
  getCallNotes: async (callId) => {
    const response = await api.get(`/calls/${callId}/notes/`);
    return response.data;
  },

  // Programar llamada de seguimiento
  scheduleFollowUp: async (callId, followUpDate, notes = '') => {
    const response = await api.post(`/calls/${callId}/schedule-followup/`, {
      follow_up_date: followUpDate,
      notes
    });
    return response.data;
  },

  // Obtener llamadas pendientes de seguimiento
  getPendingFollowUps: async () => {
    const response = await api.get('/calls/pending-followups/');
    return response.data;
  }
};

export default callsService;
