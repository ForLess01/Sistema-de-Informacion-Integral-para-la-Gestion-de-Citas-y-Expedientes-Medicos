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
  const [twoFactorRequired, setTwoFactorRequired] = useState(false);
  const [twoFactorEmail, setTwoFactorEmail] = useState(null);

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
      console.log('🔐 Iniciando login...', credentials.email);
      const data = await authService.login(credentials);
      console.log('📝 Respuesta del backend:', data);
      
      // Verificar si requiere 2FA
      if (data.requires_2fa) {
        console.log('🔑 Se requiere 2FA');
        setTwoFactorRequired(true);
        setTwoFactorEmail(credentials.email);
        return { 
          success: false, 
          requires2FA: true, 
          message: data.message || 'Se requiere autenticación de dos factores' 
        };
      }
      
      // Login exitoso sin 2FA
      console.log('✅ Login exitoso sin 2FA, usuario:', data.user);
      setUser(data.user);
      setTwoFactorRequired(false);
      setTwoFactorEmail(null);
      toast.success('¡Bienvenido!');
      return { success: true };
    } catch (error) {
      console.error('❌ Error en login:', error);
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

  // Métodos de 2FA
  const verify2FA = async (token) => {
    try {
      console.log('🔐 AuthContext verify2FA - enviando:', { email: twoFactorEmail, token });
      const data = await authService.verify2FA(twoFactorEmail, token);
      console.log('📋 AuthContext verify2FA - respuesta:', data);
      
      // Guardar tokens y usuario tras verificación exitosa
      const { access, refresh, user } = data;
      console.log('💾 Guardando tokens y usuario:', { hasAccess: !!access, hasRefresh: !!refresh, user });
      
      localStorage.setItem('access_token', access);
      localStorage.setItem('refresh_token', refresh);
      localStorage.setItem('user', JSON.stringify(user));
      
      setUser(user);
      setTwoFactorRequired(false);
      setTwoFactorEmail(null);
      console.log('✅ AuthContext - estado actualizado, usuario establecido');
      toast.success('¡Bienvenido!');
      return { success: true };
    } catch (error) {
      console.error('❌ AuthContext verify2FA error:', error);
      return { 
        success: false, 
        error: error.response?.data?.detail || 'Código inválido o expirado' 
      };
    }
  };

  const enable2FA = async () => {
    try {
      const data = await authService.enable2FA();
      return { success: true, data };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.detail || 'Error al habilitar 2FA' 
      };
    }
  };

  const confirm2FA = async (token) => {
    try {
      const data = await authService.confirm2FA(token);
      // Actualizar usuario local para reflejar que 2FA está habilitado
      const updatedUser = { ...user, two_factor_enabled: true };
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
      toast.success('Autenticación de dos factores habilitada exitosamente');
      return { success: true, data };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.detail || 'Error al confirmar 2FA' 
      };
    }
  };

  const disable2FA = async (password) => {
    try {
      await authService.disable2FA(password);
      // Actualizar usuario local para reflejar que 2FA está deshabilitado
      const updatedUser = { ...user, two_factor_enabled: false };
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
      toast.success('Autenticación de dos factores deshabilitada');
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.detail || 'Error al deshabilitar 2FA' 
      };
    }
  };

  const regenerateBackupTokens = async () => {
    try {
      const data = await authService.regenerateBackupTokens();
      toast.success('Tokens de respaldo regenerados');
      return { success: true, data };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.detail || 'Error al regenerar tokens' 
      };
    }
  };

  const resetTwoFactor = () => {
    setTwoFactorRequired(false);
    setTwoFactorEmail(null);
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
    // 2FA properties
    twoFactorRequired,
    twoFactorEmail,
    // 2FA methods
    verify2FA,
    enable2FA,
    confirm2FA,
    disable2FA,
    regenerateBackupTokens,
    resetTwoFactor,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
