import api from './api';

// Obtener todas las salas con filtros
export const getRooms = async (params = {}) => {
  const response = await api.get('/rooms/', { params });
  return response.data;
};

// Obtener sala específica por ID
export const getRoom = async (roomId) => {
  const response = await api.get(`/rooms/${roomId}/`);
  return response.data;
};

// Crear nueva sala
export const createRoom = async (roomData) => {
  const response = await api.post('/rooms/', roomData);
  return response.data;
};

// Actualizar sala
export const updateRoom = async (roomId, roomData) => {
  const response = await api.put(`/rooms/${roomId}/`, roomData);
  return response.data;
};

// Eliminar sala
export const deleteRoom = async (roomId) => {
  const response = await api.delete(`/rooms/${roomId}/`);
  return response.data;
};

// Obtener disponibilidad de sala
export const getRoomAvailability = async (roomId, date) => {
  const response = await api.get(`/rooms/${roomId}/availability/`, {
    params: { date }
  });
  return response.data;
};

// Obtener disponibilidad de múltiples salas
export const getMultipleRoomsAvailability = async (roomIds, startDate, endDate) => {
  const response = await api.get('/rooms/availability/multiple/', {
    params: {
      room_ids: roomIds.join(','),
      start_date: startDate,
      end_date: endDate
    }
  });
  return response.data;
};

// Reservar sala
export const bookRoom = async (bookingData) => {
  const response = await api.post('/rooms/bookings/', bookingData);
  return response.data;
};

// Obtener reservas de sala
export const getRoomBookings = async (roomId, params = {}) => {
  const response = await api.get(`/rooms/${roomId}/bookings/`, { params });
  return response.data;
};

// Cancelar reserva
export const cancelBooking = async (bookingId) => {
  const response = await api.delete(`/rooms/bookings/${bookingId}/`);
  return response.data;
};

// Actualizar reserva
export const updateBooking = async (bookingId, bookingData) => {
  const response = await api.put(`/rooms/bookings/${bookingId}/`, bookingData);
  return response.data;
};

// Cambiar estado de sala
export const changeRoomStatus = async (roomId, status, reason = '') => {
  const response = await api.patch(`/rooms/${roomId}/status/`, {
    status,
    reason
  });
  return response.data;
};

// Obtener equipamiento de sala
export const getRoomEquipment = async (roomId) => {
  const response = await api.get(`/rooms/${roomId}/equipment/`);
  return response.data;
};

// Agregar equipamiento a sala
export const addRoomEquipment = async (roomId, equipmentData) => {
  const response = await api.post(`/rooms/${roomId}/equipment/`, equipmentData);
  return response.data;
};

// Actualizar equipamiento
export const updateRoomEquipment = async (roomId, equipmentId, equipmentData) => {
  const response = await api.put(`/rooms/${roomId}/equipment/${equipmentId}/`, equipmentData);
  return response.data;
};

// Remover equipamiento
export const removeRoomEquipment = async (roomId, equipmentId) => {
  const response = await api.delete(`/rooms/${roomId}/equipment/${equipmentId}/`);
  return response.data;
};

// Obtener tipos de sala disponibles
export const getRoomTypes = async () => {
  const response = await api.get('/rooms/types/');
  return response.data;
};

// Obtener pisos/ubicaciones
export const getFloors = async () => {
  const response = await api.get('/rooms/floors/');
  return response.data;
};

// Obtener salas por tipo
export const getRoomsByType = async (roomType) => {
  const response = await api.get(`/rooms/type/${roomType}/`);
  return response.data;
};

// Obtener salas por piso
export const getRoomsByFloor = async (floorId) => {
  const response = await api.get(`/rooms/floor/${floorId}/`);
  return response.data;
};

// Obtener salas disponibles en tiempo específico
export const getAvailableRooms = async (startTime, endTime, roomType = null) => {
  const response = await api.get('/rooms/available/', {
    params: {
      start_time: startTime,
      end_time: endTime,
      room_type: roomType
    }
  });
  return response.data;
};

// Programar mantenimiento
export const scheduleRoomMaintenance = async (roomId, maintenanceData) => {
  const response = await api.post(`/rooms/${roomId}/maintenance/`, maintenanceData);
  return response.data;
};

// Obtener historial de mantenimiento
export const getRoomMaintenanceHistory = async (roomId) => {
  const response = await api.get(`/rooms/${roomId}/maintenance/`);
  return response.data;
};

// Completar mantenimiento
export const completeRoomMaintenance = async (maintenanceId, completionData) => {
  const response = await api.patch(`/rooms/maintenance/${maintenanceId}/complete/`, completionData);
  return response.data;
};

// Obtener estadísticas de uso de salas
export const getRoomUsageStats = async (params = {}) => {
  const response = await api.get('/rooms/stats/usage/', { params });
  return response.data;
};

// Obtener estadísticas de ocupación
export const getRoomOccupancyStats = async (startDate, endDate) => {
  const response = await api.get('/rooms/stats/occupancy/', {
    params: {
      start_date: startDate,
      end_date: endDate
    }
  });
  return response.data;
};

// Obtener configuración de sala
export const getRoomSettings = async (roomId) => {
  const response = await api.get(`/rooms/${roomId}/settings/`);
  return response.data;
};

// Actualizar configuración de sala
export const updateRoomSettings = async (roomId, settings) => {
  const response = await api.put(`/rooms/${roomId}/settings/`, settings);
  return response.data;
};

// Buscar salas por criterios
export const searchRooms = async (criteria) => {
  const response = await api.get('/rooms/search/', {
    params: criteria
  });
  return response.data;
};

// Obtener capacidad máxima por tipo de sala
export const getRoomCapacities = async () => {
  const response = await api.get('/rooms/capacities/');
  return response.data;
};

// Validar disponibilidad antes de reservar
export const validateRoomBooking = async (bookingData) => {
  const response = await api.post('/rooms/validate-booking/', bookingData);
  return response.data;
};

// Obtener conflictos de reservas
export const getBookingConflicts = async (roomId, startTime, endTime) => {
  const response = await api.get(`/rooms/${roomId}/conflicts/`, {
    params: {
      start_time: startTime,
      end_time: endTime
    }
  });
  return response.data;
};

// Obtener próximas reservas
export const getUpcomingBookings = async (params = {}) => {
  const response = await api.get('/rooms/bookings/upcoming/', { params });
  return response.data;
};

// Extender reserva
export const extendBooking = async (bookingId, newEndTime) => {
  const response = await api.patch(`/rooms/bookings/${bookingId}/extend/`, {
    new_end_time: newEndTime
  });
  return response.data;
};

// Check-in en sala
export const checkInRoom = async (roomId, bookingId) => {
  const response = await api.post(`/rooms/${roomId}/checkin/`, {
    booking_id: bookingId
  });
  return response.data;
};

// Check-out de sala
export const checkOutRoom = async (roomId, bookingId, checkoutData = {}) => {
  const response = await api.post(`/rooms/${roomId}/checkout/`, {
    booking_id: bookingId,
    ...checkoutData
  });
  return response.data;
};

// Reportar incidencia en sala
export const reportRoomIncident = async (roomId, incidentData) => {
  const response = await api.post(`/rooms/${roomId}/incidents/`, incidentData);
  return response.data;
};

// Obtener incidencias de sala
export const getRoomIncidents = async (roomId) => {
  const response = await api.get(`/rooms/${roomId}/incidents/`);
  return response.data;
};

// Exportar datos de salas
export const exportRoomsData = async (params = {}) => {
  const response = await api.get('/rooms/export/', {
    params,
    responseType: 'blob'
  });
  return response.data;
};

export default {
  getRooms,
  getRoom,
  createRoom,
  updateRoom,
  deleteRoom,
  getRoomAvailability,
  getMultipleRoomsAvailability,
  bookRoom,
  getRoomBookings,
  cancelBooking,
  updateBooking,
  changeRoomStatus,
  getRoomEquipment,
  addRoomEquipment,
  updateRoomEquipment,
  removeRoomEquipment,
  getRoomTypes,
  getFloors,
  getRoomsByType,
  getRoomsByFloor,
  getAvailableRooms,
  scheduleRoomMaintenance,
  getRoomMaintenanceHistory,
  completeRoomMaintenance,
  getRoomUsageStats,
  getRoomOccupancyStats,
  getRoomSettings,
  updateRoomSettings,
  searchRooms,
  getRoomCapacities,
  validateRoomBooking,
  getBookingConflicts,
  getUpcomingBookings,
  extendBooking,
  checkInRoom,
  checkOutRoom,
  reportRoomIncident,
  getRoomIncidents,
  exportRoomsData
};
