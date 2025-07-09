import api from './api';

const medicalRecordService = {
  // Expedientes médicos
  getPatientRecord: async (patientId) => {
    const response = await api.get(`/medical-records/patients/${patientId}/record/`);
    return response.data;
  },

  updateRecord: async (patientId, data) => {
    const response = await api.patch(`/medical-records/patients/${patientId}/record/`, data);
    return response.data;
  },

  // Diagnósticos
  getDiagnoses: async (patientId) => {
    const response = await api.get(`/medical-records/patients/${patientId}/diagnoses/`);
    return response.data;
  },

  createDiagnosis: async (patientId, data) => {
    const response = await api.post(`/medical-records/patients/${patientId}/diagnoses/`, data);
    return response.data;
  },

  // Documentos médicos
  getDocuments: async (patientId) => {
    const response = await api.get(`/medical-records/patients/${patientId}/documents/`);
    return response.data;
  },

  uploadDocument: async (patientId, formData) => {
    const response = await api.post(`/medical-records/patients/${patientId}/documents/`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  deleteDocument: async (documentId) => {
    const response = await api.delete(`/medical-records/documents/${documentId}/`);
    return response.data;
  },

  // Signos vitales
  getVitalSigns: async (patientId) => {
    const response = await api.get(`/medical-records/patients/${patientId}/vital-signs/`);
    return response.data;
  },

  createVitalSign: async (patientId, data) => {
    const response = await api.post(`/medical-records/patients/${patientId}/vital-signs/`, data);
    return response.data;
  },

  // Recetas
  getPrescriptions: async (patientId) => {
    const response = await api.get(`/medical-records/patients/${patientId}/prescriptions/`);
    return response.data;
  },

  createPrescription: async (patientId, data) => {
    const response = await api.post(`/medical-records/patients/${patientId}/prescriptions/`, data);
    return response.data;
  },

  // Exámenes de laboratorio
  getLabResults: async (patientId) => {
    const response = await api.get(`/medical-records/patients/${patientId}/lab-results/`);
    return response.data;
  },

  createLabResult: async (patientId, data) => {
    const response = await api.post(`/medical-records/patients/${patientId}/lab-results/`, data);
    return response.data;
  },

  // Alergias
  getAllergies: async (patientId) => {
    const response = await api.get(`/medical-records/patients/${patientId}/allergies/`);
    return response.data;
  },

  createAllergy: async (patientId, data) => {
    const response = await api.post(`/medical-records/patients/${patientId}/allergies/`, data);
    return response.data;
  },

  deleteAllergy: async (allergyId) => {
    const response = await api.delete(`/medical-records/allergies/${allergyId}/`);
    return response.data;
  },
};

export default medicalRecordService;
