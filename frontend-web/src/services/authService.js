import api from './api';

const authService = {
  // Login de usuario
  login: async (credentials) => {
    const response = await api.post('/auth/login/', credentials);
    const { access, refresh, user } = response.data;
    
    localStorage.setItem('access_token', access);
    localStorage.setItem('refresh_token', refresh);
    localStorage.setItem('user', JSON.stringify(user));
    
    return response.data;
  },

  // Registro de nuevo paciente
  register: async (userData) => {
    try {
      // Transformar los datos para que coincidan con lo que espera el backend
      const transformedData = {
        ...userData,
        password_confirm: userData.confirm_password,
        role: 'patient' // Por defecto registramos pacientes
      };
      
      // Eliminar el campo confirm_password que no espera el backend
      delete transformedData.confirm_password;
      
      // Convertir la fecha al formato esperado por Django (YYYY-MM-DD)
      if (transformedData.birth_date) {
        const date = new Date(transformedData.birth_date);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        transformedData.birth_date = `${year}-${month}-${day}`;
      }
      
      console.log('Datos enviados al backend:', transformedData);
      
      const response = await api.post('/auth/register/', transformedData);
      return response.data;
    } catch (error) {
      console.error('Error completo del registro:', error.response?.data);
      throw error;
    }
  },

  // Logout
  logout: async () => {
    try {
      const refresh = localStorage.getItem('refresh_token');
      await api.post('/auth/logout/', { refresh });
    } catch (error) {
      console.error('Error during logout:', error);
    } finally {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
  },

  // Obtener usuario actual
  getCurrentUser: () => {
    const userStr = localStorage.getItem('user');
    if (!userStr) return null;
    
    try {
      return JSON.parse(userStr);
    } catch (error) {
      console.error('Error al parsear datos del usuario:', error);
      // Limpiar datos corruptos
      localStorage.removeItem('user');
      return null;
    }
  },

  // Verificar si el usuario está autenticado
  isAuthenticated: () => {
    return !!localStorage.getItem('access_token');
  },

  // Actualizar perfil
  updateProfile: async (profileData) => {
    const response = await api.put('/auth/profile/', profileData);
    localStorage.setItem('user', JSON.stringify(response.data));
    return response.data;
  },

  // Cambiar contraseña
  changePassword: async (passwordData) => {
    const response = await api.post('/auth/change-password/', passwordData);
    return response.data;
  },

  // Solicitar restablecimiento de contraseña
  requestPasswordReset: async (email) => {
    const response = await api.post('/auth/password-reset/', { email });
    return response.data;
  },

  // Confirmar restablecimiento de contraseña
  confirmPasswordReset: async (token, newPassword) => {
    const response = await api.post('/auth/password-reset/confirm/', {
      token,
      new_password: newPassword,
    });
    return response.data;
  },
};

export default authService;
