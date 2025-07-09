import React, { createContext, useState, useContext, useEffect } from 'react';
import authService from '../services/authService';
import toast from 'react-hot-toast';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Cargar usuario al iniciar
    const loadUser = () => {
      const currentUser = authService.getCurrentUser();
      setUser(currentUser);
      setLoading(false);
    };
    loadUser();
  }, []);

  const login = async (credentials) => {
    try {
      const data = await authService.login(credentials);
      setUser(data.user);
      toast.success('¡Bienvenido!');
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.detail || 'Error al iniciar sesión' 
      };
    }
  };

  const register = async (userData) => {
    try {
      const data = await authService.register(userData);
      toast.success('Registro exitoso. Por favor inicia sesión.');
      return { success: true, data };
    } catch (error) {
      // Intentar obtener el mensaje de error más específico
      let errorMessage = 'Error al registrar usuario';
      
      if (error.response?.data) {
        // Si es un objeto con múltiples errores
        if (typeof error.response.data === 'object' && !error.response.data.detail) {
          const errors = Object.entries(error.response.data)
            .map(([field, messages]) => `${field}: ${Array.isArray(messages) ? messages.join(', ') : messages}`)
            .join('; ');
          errorMessage = errors || errorMessage;
        } else {
          errorMessage = error.response.data.detail || error.response.data.message || errorMessage;
        }
      }
      
      console.error('Error de registro:', errorMessage);
      return { 
        success: false, 
        error: errorMessage
      };
    }
  };

  const logout = async () => {
    await authService.logout();
    setUser(null);
    toast.success('Sesión cerrada exitosamente');
  };

  const updateProfile = async (profileData) => {
    try {
      const updatedUser = await authService.updateProfile(profileData);
      setUser(updatedUser);
      toast.success('Perfil actualizado exitosamente');
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.detail || 'Error al actualizar perfil' 
      };
    }
  };

  const changePassword = async (passwordData) => {
    try {
      await authService.changePassword(passwordData);
      toast.success('Contraseña cambiada exitosamente');
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.detail || 'Error al cambiar contraseña' 
      };
    }
  };

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    updateProfile,
    changePassword,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
