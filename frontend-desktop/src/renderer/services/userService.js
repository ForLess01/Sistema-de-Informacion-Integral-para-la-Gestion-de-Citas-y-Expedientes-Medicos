import api from './api';

// Obtener lista de usuarios con filtros y paginación
export const getUsers = async (params = {}) => {
  const response = await api.get('/users/', { params });
  return response.data;
};

// Obtener detalles de un usuario específico
export const getUser = async (userId) => {
  const response = await api.get(`/users/${userId}/`);
  return response.data;
};

// Crear nuevo usuario
export const createUser = async (userData) => {
  const response = await api.post('/users/', userData);
  return response.data;
};

// Actualizar usuario existente
export const updateUser = async (userId, userData) => {
  const response = await api.put(`/users/${userId}/`, userData);
  return response.data;
};

// Eliminar usuario
export const deleteUser = async (userId) => {
  const response = await api.delete(`/users/${userId}/`);
  return response.data;
};

// Cambiar estado de usuario (activar/desactivar)
export const toggleUserStatus = async (userId) => {
  const response = await api.patch(`/users/${userId}/toggle-status/`);
  return response.data;
};

// Resetear contraseña de usuario
export const resetUserPassword = async (userId) => {
  const response = await api.post(`/users/${userId}/reset-password/`);
  return response.data;
};

// Obtener roles disponibles
export const getRoles = async () => {
  const response = await api.get('/roles/');
  return response.data;
};

// Obtener especialidades médicas
export const getSpecialties = async () => {
  const response = await api.get('/specialties/');
  return response.data;
};

// Obtener estadísticas de usuarios
export const getUserStats = async () => {
  const response = await api.get('/users/stats/');
  return response.data;
};

// Buscar usuarios por término
export const searchUsers = async (searchTerm) => {
  const response = await api.get('/users/search/', {
    params: { q: searchTerm }
  });
  return response.data;
};

// Cambiar permisos de usuario
export const updateUserPermissions = async (userId, permissions) => {
  const response = await api.patch(`/users/${userId}/permissions/`, {
    permissions
  });
  return response.data;
};

// Obtener historial de actividad de usuario
export const getUserActivity = async (userId, params = {}) => {
  const response = await api.get(`/users/${userId}/activity/`, { params });
  return response.data;
};

export default {
  getUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser,
  toggleUserStatus,
  resetUserPassword,
  getRoles,
  getSpecialties,
  getUserStats,
  searchUsers,
  updateUserPermissions,
  getUserActivity
};
