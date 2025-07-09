import api from './api';

const pharmacyService = {
  // Inventario
  getInventory: async () => {
    const response = await api.get('/pharmacy/inventory/');
    return response.data;
  },

  updateInventory: async (medicationId, data) => {
    const response = await api.patch(`/pharmacy/inventory/${medicationId}/`, data);
    return response.data;
  },

  // Medicamentos
  getMedications: async () => {
    const response = await api.get('/pharmacy/medications/');
    return response.data;
  },

  getMedication: async (id) => {
    const response = await api.get(`/pharmacy/medications/${id}/`);
    return response.data;
  },

  createMedication: async (data) => {
    const response = await api.post('/pharmacy/medications/', data);
    return response.data;
  },

  updateMedication: async (id, data) => {
    const response = await api.patch(`/pharmacy/medications/${id}/`, data);
    return response.data;
  },

  // Dispensación
  createDispensation: async (data) => {
    const response = await api.post('/pharmacy/dispensations/', data);
    return response.data;
  },

  getDispensations: async (filters = {}) => {
    const response = await api.get('/pharmacy/dispensations/', { params: filters });
    return response.data;
  },

  // Órdenes de compra
  getPurchaseOrders: async () => {
    const response = await api.get('/pharmacy/purchase-orders/');
    return response.data;
  },

  createPurchaseOrder: async (data) => {
    const response = await api.post('/pharmacy/purchase-orders/', data);
    return response.data;
  },

  // Movimientos de inventario
  getInventoryMovements: async (medicationId) => {
    const response = await api.get(`/pharmacy/inventory/${medicationId}/movements/`);
    return response.data;
  },

  // Reportes
  getLowStockReport: async () => {
    const response = await api.get('/pharmacy/reports/low-stock/');
    return response.data;
  },

  getExpiringMedications: async (days = 30) => {
    const response = await api.get('/pharmacy/reports/expiring/', { params: { days } });
    return response.data;
  },
};

export default pharmacyService;
