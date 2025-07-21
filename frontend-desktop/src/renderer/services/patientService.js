import api from './api';

export const patientService = {
  // Obtener todos los pacientes
  getPatients: async (filters = {}) => {
    try {
      const params = new URLSearchParams();
      
      // Parámetros de paginación
      params.append('page', (filters.page || 1).toString());
      params.append('page_size', (filters.page_size || 20).toString());
      
      // Filtros
      if (filters.search) {
        params.append('search', filters.search);
      }
      if (filters.age_range && filters.age_range !== 'all') {
        params.append('age_range', filters.age_range);
      }
      if (filters.gender && filters.gender !== 'all') {
        params.append('gender', filters.gender);
      }
      
      const response = await api.get(`/auth/patients/?${params}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching patients:', error);
      throw error;
    }
  },

  // Obtener paciente por ID
  getPatientById: async (patientId) => {
    try {
      const response = await api.get(`/auth/patients/${patientId}/`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching patient ${patientId}:`, error);
      throw error;
    }
  },

  // Crear nuevo paciente
  createPatient: async (patientData) => {
    try {
      const response = await api.post('/auth/patients/', patientData);
      return response.data;
    } catch (error) {
      console.error('Error creating patient:', error);
      throw error;
    }
  },

  // Actualizar paciente
  updatePatient: async (patientId, patientData) => {
    try {
      const response = await api.put(`/auth/patients/${patientId}/`, patientData);
      return response.data;
    } catch (error) {
      console.error(`Error updating patient ${patientId}:`, error);
      throw error;
    }
  },

  // Eliminar paciente
  deletePatient: async (patientId) => {
    try {
      const response = await api.delete(`/auth/patients/${patientId}/`);
      return response.data;
    } catch (error) {
      console.error(`Error deleting patient ${patientId}:`, error);
      throw error;
    }
  },

  // Buscar pacientes por nombre o DNI
  searchPatients: async (query) => {
    try {
      const response = await api.get(`/auth/patients/search/?q=${encodeURIComponent(query)}`);
      return response.data;
    } catch (error) {
      console.error('Error searching patients:', error);
      throw error;
    }
  },

  // Obtener citas de hoy para check-in
  getTodayAppointments: async (filters = {}) => {
    try {
      const params = new URLSearchParams();
      
      if (filters.search) {
        params.append('search', filters.search);
      }
      if (filters.status) {
        params.append('status', filters.status);
      }
      if (filters.specialty) {
        params.append('specialty', filters.specialty);
      }
      
      const response = await api.get(`/appointments/today/?${params}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching today appointments:', error);
      throw error;
    }
  },

  // Realizar check-in de paciente
  checkInPatient: async (checkInData) => {
    try {
      const response = await api.post('/appointments/check-in/', checkInData);
      return response.data;
    } catch (error) {
      console.error('Error checking in patient:', error);
      throw error;
    }
  },

  // Obtener historial de check-ins
  getCheckInHistory: async (filters = {}) => {
    try {
      const params = new URLSearchParams();
      
      if (filters.date) {
        params.append('date', filters.date);
      }
      if (filters.patient_id) {
        params.append('patient_id', filters.patient_id);
      }
      
      const response = await api.get(`/appointments/check-ins/?${params}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching check-in history:', error);
      throw error;
    }
  },

  // Obtener pacientes dentales (especializado para odontología)
  getDentalPatients: async (search = '', filters = {}) => {
    try {
      const params = new URLSearchParams();
      
      if (search) {
        params.append('search', search);
      }
      if (filters.has_dental_history) {
        params.append('has_dental_history', filters.has_dental_history);
      }
      if (filters.active_treatments) {
        params.append('active_treatments', filters.active_treatments);
      }
      if (filters.risk_level) {
        params.append('risk_level', filters.risk_level);
      }
      
      const response = await api.get(`/auth/patients/dental/?${params}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching dental patients:', error);
      // Retornar datos mock mientras no esté el backend
      return {
        results: [
          {
            id: 1,
            first_name: 'María',
            last_name: 'González',
            dni: '12345678',
            age: 35,
            phone: '987654321',
            last_dental_visit: '2024-01-15',
            active_treatments: 1,
            risk_level: 'low',
          },
          {
            id: 2,
            first_name: 'Carlos',
            last_name: 'Ruiz',
            dni: '87654321',
            age: 42,
            phone: '123456789',
            last_dental_visit: '2024-01-10',
            active_treatments: 0,
            risk_level: 'medium',
          },
          {
            id: 3,
            first_name: 'Ana',
            last_name: 'Torres',
            dni: '11223344',
            age: 28,
            phone: '555666777',
            last_dental_visit: '2024-01-20',
            active_treatments: 2,
            risk_level: 'high',
          },
        ],
        total: 3,
        page: 1,
        pages: 1,
      };
    }
  },
  
  // Alias para compatibilidad con componentes existentes
  getPatientDetail: async (patientId) => {
    return patientService.getPatientById(patientId);
  },
  
  // Obtener historial médico del paciente
  getPatientMedicalHistory: async (patientId) => {
    try {
      const response = await api.get(`/medical-records/patients/${patientId}/history/`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching patient medical history ${patientId}:`, error);
      // Retornar datos mock mientras no esté implementado el backend
      return {
        consultations: [],
        prescriptions: [],
        lab_results: [],
        diagnoses: []
      };
    }
  },
  
  // Obtener citas del paciente
  getPatientAppointments: async (patientId) => {
    try {
      const response = await api.get(`/appointments/?patient=${patientId}`);
      // Si la respuesta tiene una estructura de paginación, extraer los resultados
      if (response.data && response.data.results) {
        return response.data.results;
      }
      // Si es un array directo, devolverlo
      if (Array.isArray(response.data)) {
        return response.data;
      }
      // Si no es ninguno de los anteriores, devolver array vacío
      return [];
    } catch (error) {
      console.error(`Error fetching patient appointments ${patientId}:`, error);
      // Retornar datos mock mientras no esté implementado el backend
      return [];
    }
  }
};

export default patientService;
