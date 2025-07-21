import api from './api';

const ambulanceService = {
  // Obtener todas las ambulancias
  getAllAmbulances: async () => {
    try {
      const response = await api.get('/ambulances');
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Error al obtener ambulancias');
    }
  },

  // Obtener ambulancia por ID
  getAmbulanceById: async (id) => {
    try {
      const response = await api.get(`/ambulances/${id}`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Error al obtener ambulancia');
    }
  },

  // Crear nueva ambulancia
  createAmbulance: async (ambulanceData) => {
    try {
      const response = await api.post('/ambulances', ambulanceData);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Error al crear ambulancia');
    }
  },

  // Actualizar ambulancia
  updateAmbulance: async (id, ambulanceData) => {
    try {
      const response = await api.put(`/ambulances/${id}`, ambulanceData);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Error al actualizar ambulancia');
    }
  },

  // Alternar disponibilidad
  toggleAvailability: async (id) => {
    try {
      const response = await api.patch(`/ambulances/${id}/toggle-availability`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Error al cambiar disponibilidad');
    }
  },

  // Asignar ambulancia a emergencia
  assignToEmergency: async (ambulanceId, emergencyId) => {
    try {
      const response = await api.post(`/ambulances/${ambulanceId}/assign`, {
        emergency_id: emergencyId
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Error al asignar ambulancia');
    }
  },

  // Obtener ambulancias disponibles
  getAvailableAmbulances: async () => {
    try {
      const response = await api.get('/ambulances/available');
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Error al obtener ambulancias disponibles');
    }
  },

  // Actualizar ubicación de ambulancia
  updateLocation: async (id, locationData) => {
    try {
      const response = await api.patch(`/ambulances/${id}/location`, locationData);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Error al actualizar ubicación');
    }
  },

  // Obtener historial de asignaciones
  getAssignmentHistory: async (id) => {
    try {
      const response = await api.get(`/ambulances/${id}/history`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Error al obtener historial');
    }
  },

  // Eliminar ambulancia
  deleteAmbulance: async (id) => {
    try {
      const response = await api.delete(`/ambulances/${id}`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Error al eliminar ambulancia');
    }
  }
};

export { ambulanceService };
export default ambulanceService;
