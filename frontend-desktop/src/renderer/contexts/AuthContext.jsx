import React, { createContext, useContext, useReducer, useEffect } from 'react';
import authService from '../services/authService';

// Estados de autenticación
const authReducer = (state, action) => {
  switch (action.type) {
    case 'LOGIN_START':
      return { ...state, loading: true, error: null };
    case 'LOGIN_SUCCESS':
      return {
        ...state,
        loading: false,
        isAuthenticated: true,
        user: action.payload,
        error: null
      };
    case 'LOGIN_FAILURE':
      return {
        ...state,
        loading: false,
        isAuthenticated: false,
        user: null,
        error: action.payload
      };
    case 'LOGOUT':
      return {
        ...state,
        isAuthenticated: false,
        user: null,
        error: null
      };
    case 'SET_USER':
      return {
        ...state,
        isAuthenticated: true,
        user: action.payload
      };
    case 'CLEAR_ERROR':
      return { ...state, error: null };
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    default:
      return state;
  }
};

const initialState = {
  isAuthenticated: false,
  user: null,
  loading: true, // Iniciar con loading true para verificar token existente
  error: null
};

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser usado dentro de AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Verificar si hay un usuario autenticado al iniciar la aplicación
  useEffect(() => {
    const checkAuth = async () => {
      try {
        if (authService.isAuthenticated()) {
          const user = authService.getUser();
          if (user) {
            // Verificar que el token siga siendo válido
            try {
              const currentUser = await authService.getCurrentUser();
              dispatch({ type: 'SET_USER', payload: currentUser });
            } catch (error) {
              // Token inválido, limpiar datos
              authService.logout();
              dispatch({ type: 'LOGOUT' });
            }
          } else {
            dispatch({ type: 'LOGOUT' });
          }
        } else {
          dispatch({ type: 'LOGOUT' });
        }
      } catch (error) {
        console.error('Error verificando autenticación:', error);
        dispatch({ type: 'LOGOUT' });
      } finally {
        // Finalizar loading - cambiar loading a false sin modificar otros estados
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    };

    checkAuth();
  }, []);

  const login = async (credentials) => {
    dispatch({ type: 'LOGIN_START' });
    try {
      const response = await authService.login(credentials);
      
      if (response.requires_2fa) {
        // Devolver respuesta para manejar 2FA en el componente
        return response;
      } else {
        // Login exitoso sin 2FA
        localStorage.setItem('access_token', response.access);
        localStorage.setItem('refresh_token', response.refresh);
        localStorage.setItem('user', JSON.stringify(response.user));
        
        dispatch({ type: 'LOGIN_SUCCESS', payload: response.user });
        return response;
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Error de autenticación';
      dispatch({ type: 'LOGIN_FAILURE', payload: errorMessage });
      throw error;
    }
  };

  const verify2FA = async (data) => {
    try {
      const response = await authService.verify2FA(data);
      
      localStorage.setItem('access_token', response.access);
      localStorage.setItem('refresh_token', response.refresh);
      localStorage.setItem('user', JSON.stringify(response.user));
      
      dispatch({ type: 'LOGIN_SUCCESS', payload: response.user });
      return response;
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Código de verificación incorrecto';
      dispatch({ type: 'LOGIN_FAILURE', payload: errorMessage });
      throw error;
    }
  };

  const logout = async () => {
    try {
      await authService.logout();
    } catch (error) {
      console.error('Error durante logout:', error);
    } finally {
      dispatch({ type: 'LOGOUT' });
    }
  };

  const clearError = () => {
    dispatch({ type: 'CLEAR_ERROR' });
  };

  // Verificar si el usuario tiene un rol específico
  const hasRole = (role) => {
    return authService.hasRole(role);
  };

  // Verificar si el usuario puede acceder a una especialidad
  const canAccessSpecialty = (specialtyId) => {
    return authService.canAccessSpecialty(specialtyId);
  };

  // Obtener el rol del usuario
  const getUserRole = () => {
    return state.user?.role || null;
  };

  // Verificar si es doctor
  const isDoctor = () => {
    return state.user?.role === 'doctor';
  };

  // Verificar si es admin
  const isAdmin = () => {
    return state.user?.role === 'admin';
  };

  // Verificar si es personal administrativo
  const isAdminStaff = () => {
    return ['admin', 'receptionist'].includes(state.user?.role);
  };

  // Verificar si es farmacéutico
  const isPharmacist = () => {
    return state.user?.role === 'pharmacist';
  };

  const value = {
    ...state,
    login,
    verify2FA,
    logout,
    clearError,
    hasRole,
    canAccessSpecialty,
    getUserRole,
    isDoctor,
    isAdmin,
    isAdminStaff,
    isPharmacist
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
