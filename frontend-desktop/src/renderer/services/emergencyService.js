import api from './api';

const emergencyService = {
  // Pacientes de emergencia
  getEmergencyPatients: async (status = 'active') => {
    const response = await api.get('/emergency/patients/', { params: { status } });
    return response.data;
  },

  getEmergencyPatient: async (id) => {
    const response = await api.get(`/emergency/patients/${id}/`);
    return response.data;
  },

  createEmergencyPatient: async (data) => {
    const response = await api.post('/emergency/patients/', data);
    return response.data;
  },

  updateEmergencyPatient: async (id, data) => {
    const response = await api.patch(`/emergency/patients/${id}/`, data);
    return response.data;
  },

  // Triaje
  getTriageCategories: async () => {
    const response = await api.get('/emergency/triage-categories/');
    return response.data;
  },

  createTriageAssessment: async (patientId, data) => {
    const response = await api.post(`/emergency/patients/${patientId}/triage/`, data);
    return response.data;
  },

  updateTriage: async (patientId, data) => {
    const response = await api.patch(`/emergency/patients/${patientId}/triage/`, data);
    return response.data;
  },

  // Tratamientos de emergencia
  getEmergencyTreatments: async (patientId) => {
    const response = await api.get(`/emergency/patients/${patientId}/treatments/`);
    return response.data;
  },

  createEmergencyTreatment: async (patientId, data) => {
    const response = await api.post(`/emergency/patients/${patientId}/treatments/`, data);
    return response.data;
  },

  // Recursos de emergencia
  getEmergencyResources: async () => {
    const response = await api.get('/emergency/resources/');
    return response.data;
  },

  allocateResource: async (resourceId, patientId) => {
    const response = await api.post(`/emergency/resources/${resourceId}/allocate/`, { patient_id: patientId });
    return response.data;
  },

  releaseResource: async (resourceId) => {
    const response = await api.post(`/emergency/resources/${resourceId}/release/`);
    return response.data;
  },

  // Alta de emergencia
  createDischarge: async (patientId, data) => {
    const response = await api.post(`/emergency/patients/${patientId}/discharge/`, data);
    return response.data;
  },

  // Estadísticas de emergencia
  getEmergencyStats: async () => {
    const response = await api.get('/emergency/stats/');
    return response.data;
  },

  getWaitingTimes: async () => {
    const response = await api.get('/emergency/stats/waiting-times/');
    return response.data;
  },

  // Signos vitales de emergencia
  recordVitalSigns: async (patientId, data) => {
    const response = await api.post(`/emergency/patients/${patientId}/vital-signs/`, data);
    return response.data;
  },

  getVitalSignsHistory: async (patientId) => {
    const response = await api.get(`/emergency/patients/${patientId}/vital-signs/`);
    return response.data;
  },
};

export default emergencyService;
