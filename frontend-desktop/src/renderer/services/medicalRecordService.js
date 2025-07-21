import api from './api';

const medicalRecordService = {
  // Consultas médicas
  getConsultations: async (params) => {
    const response = await api.get('/medical-records/consultations/', { params });
    return response.data;
  },

  getConsultationById: async (consultationId) => {
    const response = await api.get(`/medical-records/consultations/${consultationId}/`);
    return response.data;
  },

  // Alias para ConsultationDetail
  getConsultationDetail: async (consultationId) => {
    const response = await api.get(`/medical-records/${consultationId}/`);
    return response.data;
  },

  // Actualizar consulta
  updateConsultation: async ({ id, data }) => {
    const response = await api.patch(`/medical-records/${id}/`, data);
    return response.data;
  },

  // Expedientes médicos
  getPatientRecord: async (patientId) => {
    const response = await api.get(`/medical-records/patients/${patientId}/record/`);
    return response.data;
  },

  updateRecord: async (patientId, data) => {
    const response = await api.patch(`/medical-records/patients/${patientId}/record/`, data);
    return response.data;
  },

  // Crear registro médico (consulta completa)
  createMedicalRecord: async (patientId, data) => {
    const response = await api.post('/medical-records/medical-records/', {
      patient: patientId,
      ...data
    });
    return response.data;
  },

  // Diagnósticos
  getDiagnoses: async (patientId) => {
    const response = await api.get(`/medical-records/patients/${patientId}/diagnoses/`);
    return response.data;
  },

  diagnoses: async () => {
    const response = await api.get('/medical-records/diagnoses/');
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

  saveVitalSigns: async (patientId, data) => {
    const response = await api.post(`/medical-records/patients/${patientId}/vital-signs/`, data);
    return response.data;
  },

  // Recetas
  getPrescriptions: async (patientId) => {
    console.log('getPrescriptions - Patient ID:', patientId);
    console.log('getPrescriptions - URL:', `/medical-records/patients/${patientId}/prescriptions/`);
    
    try {
      const response = await api.get(`/medical-records/patients/${patientId}/prescriptions/`);
      console.log('getPrescriptions - Respuesta completa:', response);
      console.log('getPrescriptions - Respuesta data:', response.data);
      console.log('getPrescriptions - Tipo de data:', typeof response.data);
      console.log('getPrescriptions - Es array?:', Array.isArray(response.data));
      
      // Si la respuesta tiene una estructura anidada, intentar extraer el array
      if (response.data && typeof response.data === 'object') {
        if (Array.isArray(response.data)) {
          console.log('getPrescriptions - Devolviendo array directo:', response.data);
          return response.data;
        } else if (response.data.results && Array.isArray(response.data.results)) {
          console.log('getPrescriptions - Devolviendo results:', response.data.results);
          return response.data.results;
        } else {
          console.log('getPrescriptions - Estructura inesperada, devolviendo array vacío');
          return [];
        }
      }
      
      console.log('getPrescriptions - Data no es objeto, devolviendo array vacío');
      return [];
    } catch (error) {
      console.error('getPrescriptions - Error:', error);
      console.error('getPrescriptions - Error response:', error.response?.data);
      return [];
    }
  },

  createPrescription: async (patientId, data) => {
    console.log('Servicio - Patient ID:', patientId);
    console.log('Servicio - Data a enviar:', JSON.stringify(data, null, 2));
    console.log('Servicio - URL:', `/medical-records/patients/${patientId}/prescriptions/`);
    
    try {
      const response = await api.post(`/medical-records/patients/${patientId}/prescriptions/`, data);
      console.log('Servicio - Respuesta exitosa:', response.data);
      return response.data;
    } catch (error) {
      console.error('Servicio - Error completo:', error);
      console.error('Servicio - Error response data:', JSON.stringify(error.response?.data, null, 2));
      console.error('Servicio - Error response status:', error.response?.status);
      console.error('Servicio - Error response headers:', error.response?.headers);
      throw error;
    }
  },

  updatePrescription: async (prescriptionId, data) => {
    console.log('Actualizando receta:', prescriptionId);
    console.log('Datos a actualizar:', data);
    
    try {
      const response = await api.patch(`/medical-records/prescriptions/${prescriptionId}/`, data);
      console.log('Receta actualizada:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error al actualizar receta:', error);
      console.error('Error response:', error.response?.data);
      throw error;
    }
  },

  deletePrescription: async (prescriptionId) => {
    console.log('Eliminando receta:', prescriptionId);
    
    try {
      const response = await api.delete(`/medical-records/prescriptions/${prescriptionId}/`);
      console.log('Receta eliminada');
      return response.data;
    } catch (error) {
      console.error('Error al eliminar receta:', error);
      throw error;
    }
  },

  // Obtener recetas del doctor actual
  getDoctorPrescriptions: async () => {
    try {
      const response = await api.get('/medical-records/doctor/prescriptions/');
      console.log('getDoctorPrescriptions - Response:', response.data);
      
      // Asegurar que siempre devolvamos un array
      if (Array.isArray(response.data)) {
        return response.data;
      } else if (response.data?.results && Array.isArray(response.data.results)) {
        return response.data.results;
      } else if (response.data?.data && Array.isArray(response.data.data)) {
        return response.data.data;
      }
      
      console.warn('getDoctorPrescriptions - Formato inesperado:', response.data);
      return [];
    } catch (error) {
      console.error('Error al obtener recetas del doctor:', error);
      return [];
    }
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

  // Administración de medicamentos (para enfermería)
  administerMedication: async (data) => {
    const response = await api.post('/medical-records/medication-administration/', data);
    return response.data;
  },

  // Historial de administración de medicamentos
  getMedicationHistory: async (patientId) => {
    const response = await api.get(`/medical-records/patients/${patientId}/medication-history/`);
    return response.data;
  },
};

export default medicalRecordService;
