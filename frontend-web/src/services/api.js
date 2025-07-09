import axios from 'axios';

// Configuración base de la API
const API_URL = 'http://localhost:8000/api/v1';

// Crear instancia de axios con configuración base
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para agregar el token de autenticación a todas las peticiones
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para manejar respuestas y errores
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Si el error es 401 (no autorizado), limpiar el token y redirigir al login
    if (error.response?.status === 401) {
      // Solo redirigir si no estamos en una ruta pública
      const publicPaths = ['/login', '/register', '/', '/api/v1/appointments/upcoming/', '/api/v1/medical-records/summary/'];
      const currentPath = window.location.pathname;
      const isPublicPath = publicPaths.some(path => currentPath.includes(path));
      
      // Si es una llamada específica al dashboard, no redirigir
      const isDashboardCall = error.config?.url?.includes('/appointments/upcoming/') || 
                            error.config?.url?.includes('/medical-records/summary/');
      
      if (!isPublicPath && !isDashboardCall) {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
