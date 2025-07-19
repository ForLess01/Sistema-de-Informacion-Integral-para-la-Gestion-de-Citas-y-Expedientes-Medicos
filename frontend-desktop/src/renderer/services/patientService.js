import axios from 'axios';

const API_URL = 'http://localhost:8000/api';

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  timeout: 10000,
});

// Interceptor para agregar token de autenticación
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para manejar errores de respuesta
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const patientService = {
  // Obtener todos los pacientes
  getPatients: async (search = '', page = 1, limit = 10) => {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString()
      });
      
      if (search) {
        params.append('search', search);
      }
      
      const response = await api.get(`/patients/?${params}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching patients:', error);
      throw error;
    }
  },

  // Obtener paciente por ID
  getPatientById: async (patientId) => {
    try {
      const response = await api.get(`/patients/${patientId}/`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching patient ${patientId}:`, error);
      throw error;
    }
  },

  // Crear nuevo paciente
  createPatient: async (patientData) => {
    try {
      const response = await api.post('/patients/', patientData);
      return response.data;
    } catch (error) {
      console.error('Error creating patient:', error);
      throw error;
    }
  },

  // Actualizar paciente
  updatePatient: async (patientId, patientData) => {
    try {
      const response = await api.put(`/patients/${patientId}/`, patientData);
      return response.data;
    } catch (error) {
      console.error(`Error updating patient ${patientId}:`, error);
      throw error;
    }
  },

  // Eliminar paciente
  deletePatient: async (patientId) => {
    try {
      const response = await api.delete(`/patients/${patientId}/`);
      return response.data;
    } catch (error) {
      console.error(`Error deleting patient ${patientId}:`, error);
      throw error;
    }
  },

  // Buscar pacientes por nombre o DNI
  searchPatients: async (query) => {
    try {
      const response = await api.get(`/patients/search/?q=${encodeURIComponent(query)}`);
      return response.data;
    } catch (error) {
      console.error('Error searching patients:', error);
      throw error;
    }
  }
};

export default patientService;
