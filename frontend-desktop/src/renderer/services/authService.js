import api from './api';

const authService = {
  // Login inicial
  login: async (credentials) => {
    const response = await api.post('/auth/login/', credentials);
    return response.data;
  },

  // Verificación 2FA
  verify2FA: async (data) => {
    const response = await api.post('/auth/2fa/verify/', data);
    return response.data;
  },

  // Logout
  logout: async () => {
    const token = localStorage.getItem('refresh_token');
    if (token) {
      try {
        await api.post('/auth/logout/', { refresh: token });
      } catch (error) {
        console.error('Error durante logout:', error);
      }
    }
    // Limpiar almacenamiento local
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
  },

  // Refrescar token
  refreshToken: async () => {
    const refresh = localStorage.getItem('refresh_token');
    if (!refresh) {
      throw new Error('No refresh token available');
    }
    
    const response = await api.post('/auth/token/refresh/', { refresh });
    localStorage.setItem('access_token', response.data.access);
    return response.data;
  },

  // Obtener usuario actual
  getCurrentUser: async () => {
    const response = await api.get('/auth/profile/');
    return response.data;
  },

  // Verificar si el usuario está autenticado
  isAuthenticated: () => {
    const token = localStorage.getItem('access_token');
    const user = localStorage.getItem('user');
    return !!(token && user);
  },

  // Obtener usuario del localStorage
  getUser: () => {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  },

  // Verificar si el usuario tiene un rol específico
  hasRole: (requiredRole) => {
    const user = authService.getUser();
    if (!user) return false;
    
    // El admin puede acceder a todo
    if (user.role === 'admin') return true;
    
    // Verificar rol específico
    if (Array.isArray(requiredRole)) {
      return requiredRole.includes(user.role);
    }
    
    return user.role === requiredRole;
  },

  // Verificar si el usuario puede acceder a una especialidad
  canAccessSpecialty: (specialtyId) => {
    const user = authService.getUser();
    if (!user) return false;
    
    // Admin puede acceder a todas las especialidades
    if (user.role === 'admin') return true;
    
    // Doctores solo pueden acceder a sus especialidades
    if (user.role === 'doctor' && user.doctor_profile) {
      return user.doctor_profile.specialties.includes(specialtyId);
    }
    
    // Obstetriz puede acceder a especialidad de Obstetricia (ID: 7)
    if (user.role === 'obstetriz') {
      return specialtyId === 7;
    }
    
    // Odontólogo puede acceder a especialidad de Odontología (ID: 8)
    if (user.role === 'odontologo') {
      return specialtyId === 8;
    }
    
    // Personal administrativo y enfermeras pueden acceder a todas
    return ['nurse', 'receptionist'].includes(user.role);
  },

  // Habilitar 2FA
  enable2FA: async () => {
    const response = await api.post('/auth/enable-2fa/');
    return response.data;
  },

  // Deshabilitar 2FA
  disable2FA: async (token) => {
    const response = await api.post('/auth/disable-2fa/', { token });
    return response.data;
  },

  // Generar tokens de respaldo
  generateBackupTokens: async () => {
    const response = await api.post('/auth/generate-backup-tokens/');
    return response.data;
  }
};

export default authService;
