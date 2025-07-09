import api from './api';

const medicalRecordService = {
  // Obtener resumen del expediente médico
  getMedicalSummary: async () => {
    try {
      const response = await api.get('/medical-records/summary/');
      return response.data;
    } catch (error) {
      console.error('Error al obtener resumen del expediente médico:', error);
      return null;
    }
  },

  // Obtener expediente completo
  getMedicalRecord: async () => {
    const response = await api.get('/medical-records/my-record/');
    return response.data;
  },

  // Obtener historial de diagnósticos
  getDiagnoses: async (params = {}) => {
    const response = await api.get('/medical-records/diagnoses/', { params });
    return response.data;
  },

  // Obtener historial de prescripciones
  getPrescriptions: async (params = {}) => {
    const response = await api.get('/medical-records/prescriptions/', { params });
    return response.data;
  },

  // Obtener prescripciones activas
  getActivePrescriptions: async () => {
    const response = await api.get('/medical-records/prescriptions/active/');
    return response.data;
  },

  // Obtener historial de exámenes de laboratorio
  getLabResults: async (params = {}) => {
    const response = await api.get('/medical-records/lab-results/', { params });
    return response.data;
  },

  // Obtener exámenes pendientes
  getPendingLabResults: async () => {
    const response = await api.get('/medical-records/lab-results/pending/');
    return response.data;
  },

  // Obtener documentos médicos
  getMedicalDocuments: async (params = {}) => {
    const response = await api.get('/medical-records/documents/', { params });
    return response.data;
  },

  // Subir documento médico
  uploadDocument: async (formData) => {
    const response = await api.post('/medical-records/documents/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Descargar documento médico
  downloadDocument: async (documentId) => {
    const response = await api.get(`/medical-records/documents/${documentId}/download/`, {
      responseType: 'blob',
    });
    return response.data;
  },

  // Obtener signos vitales
  getVitalSigns: async (params = {}) => {
    const response = await api.get('/medical-records/vital-signs/', { params });
    return response.data;
  },

  // Obtener alergias
  getAllergies: async () => {
    const response = await api.get('/medical-records/allergies/');
    return response.data;
  },

  // Obtener línea de tiempo médica
  getMedicalTimeline: async (params = {}) => {
    const response = await api.get('/medical-records/timeline/', { params });
    return response.data;
  },

  // Obtener estadísticas de salud
  getHealthStats: async () => {
    const response = await api.get('/medical-records/stats/');
    return response.data;
  },
};

export default medicalRecordService;
