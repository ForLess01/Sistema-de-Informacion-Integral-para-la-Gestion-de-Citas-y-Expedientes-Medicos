import api from './api';
import authService from './authService';
import toast from 'react-hot-toast';

const validationService = {
  // Validar conexión con el backend
  validateBackendConnection: async () => {
    try {
      const response = await api.get('/');
      console.log('✅ Conexión con backend establecida:', response.data);
      return {
        success: true,
        message: 'Backend conectado correctamente',
        data: response.data
      };
    } catch (error) {
      console.error('❌ Error de conexión con backend:', error);
      return {
        success: false,
        message: 'Error de conexión con el backend',
        error: error.message
      };
    }
  },

  // Validar autenticación
  validateAuthentication: async () => {
    try {
      if (!authService.isAuthenticated()) {
        return {
          success: false,
          message: 'Usuario no autenticado'
        };
      }

      const user = await authService.getCurrentUser();
      console.log('✅ Usuario autenticado:', user);
      
      return {
        success: true,
        message: 'Autenticación válida',
        user: user
      };
    } catch (error) {
      console.error('❌ Error en autenticación:', error);
      return {
        success: false,
        message: 'Error en autenticación',
        error: error.message
      };
    }
  },

  // Validar endpoints críticos
  validateCriticalEndpoints: async () => {
    const endpoints = [
      { name: 'Dashboard Stats', url: '/dashboard/stats/' },
      { name: 'Appointments', url: '/appointments/' },
      { name: 'Users', url: '/auth/users/' },
      { name: 'Pharmacy Medications', url: '/pharmacy/medications/' },
      { name: 'Emergency', url: '/emergency/' },
      { name: 'Reports', url: '/reports/' }
    ];

    const results = [];

    for (const endpoint of endpoints) {
      try {
        await api.get(endpoint.url);
        results.push({
          name: endpoint.name,
          url: endpoint.url,
          status: '✅ OK'
        });
        console.log(`✅ ${endpoint.name}: OK`);
      } catch (error) {
        results.push({
          name: endpoint.name,
          url: endpoint.url,
          status: `❌ Error: ${error.response?.status || error.message}`,
          error: error.response?.data || error.message
        });
        console.error(`❌ ${endpoint.name}:`, error.response?.status || error.message);
      }
    }

    return results;
  },

  // Validar configuración del sistema
  validateSystemConfig: async () => {
    const config = {
      apiUrl: import.meta.env.VITE_API_URL,
      environment: import.meta.env.VITE_NODE_ENV || import.meta.env.NODE_ENV,
      debug: import.meta.env.VITE_DEBUG,
      appName: import.meta.env.VITE_APP_NAME,
      version: import.meta.env.VITE_APP_VERSION,
      isElectron: import.meta.env.VITE_IS_ELECTRON
    };

    console.log('🔧 Configuración del sistema:', config);

    const issues = [];
    
    if (!config.apiUrl) {
      issues.push('VITE_API_URL no está definida');
    }
    
    if (!config.apiUrl?.startsWith('http')) {
      issues.push('VITE_API_URL debe comenzar con http:// o https://');
    }

    return {
      config,
      issues,
      valid: issues.length === 0
    };
  },

  // Validar permisos del usuario actual
  validateUserPermissions: async () => {
    try {
      const user = authService.getUser();
      if (!user) {
        return {
          success: false,
          message: 'No hay usuario autenticado'
        };
      }

      const permissions = {
        role: user.role,
        canAccessDashboard: true,
        canManagePatients: ['admin', 'doctor', 'nurse', 'receptionist'].includes(user.role),
        canAccessPharmacy: ['admin', 'pharmacist'].includes(user.role),
        canAccessEmergency: ['admin', 'emergency', 'doctor', 'nurse'].includes(user.role),
        canViewReports: ['admin', 'doctor', 'pharmacist'].includes(user.role),
        canManageUsers: user.role === 'admin'
      };

      console.log('👤 Permisos de usuario:', permissions);

      return {
        success: true,
        user: user,
        permissions: permissions
      };
    } catch (error) {
      return {
        success: false,
        message: 'Error al validar permisos',
        error: error.message
      };
    }
  },

  // Prueba completa de integración
  runFullIntegrationTest: async () => {
    console.log('🚀 Iniciando prueba completa de integración...');
    
    const results = {
      timestamp: new Date().toISOString(),
      tests: {}
    };

    // Test 1: Conexión con backend
    console.log('Test 1/5: Validando conexión con backend...');
    results.tests.backendConnection = await validationService.validateBackendConnection();

    // Test 2: Configuración del sistema
    console.log('Test 2/5: Validando configuración del sistema...');
    results.tests.systemConfig = validationService.validateSystemConfig();

    // Test 3: Autenticación (solo si hay usuario logueado)
    console.log('Test 3/5: Validando autenticación...');
    results.tests.authentication = await validationService.validateAuthentication();

    // Test 4: Permisos de usuario (solo si está autenticado)
    console.log('Test 4/5: Validando permisos de usuario...');
    if (results.tests.authentication.success) {
      results.tests.userPermissions = await validationService.validateUserPermissions();
    } else {
      results.tests.userPermissions = { success: false, message: 'Saltado: usuario no autenticado' };
    }

    // Test 5: Endpoints críticos (solo si está autenticado)
    console.log('Test 5/5: Validando endpoints críticos...');
    if (results.tests.authentication.success) {
      results.tests.criticalEndpoints = await validationService.validateCriticalEndpoints();
    } else {
      results.tests.criticalEndpoints = [{ name: 'Saltado', status: 'Usuario no autenticado' }];
    }

    // Calcular resumen
    const totalTests = Object.keys(results.tests).length;
    const passedTests = Object.values(results.tests).filter(test => 
      test.success !== false && !test.some?.(t => t.status?.includes('❌'))
    ).length;

    results.summary = {
      totalTests,
      passedTests,
      failedTests: totalTests - passedTests,
      successRate: Math.round((passedTests / totalTests) * 100),
      overallStatus: passedTests === totalTests ? '✅ TODOS LOS TESTS PASARON' : '⚠️ ALGUNOS TESTS FALLARON'
    };

    console.log('📊 Resumen de tests:', results.summary);
    console.log('🎯 Prueba completa finalizada.');

    return results;
  },

  // Mostrar resultado de tests con toast notifications
  showTestResults: (results) => {
    if (results.summary.successRate === 100) {
      toast.success(`✅ Integración completa: ${results.summary.successRate}% de tests pasaron`);
    } else if (results.summary.successRate >= 80) {
      toast.success(`⚠️ Integración parcial: ${results.summary.successRate}% de tests pasaron`);
    } else {
      toast.error(`❌ Problemas de integración: Solo ${results.summary.successRate}% de tests pasaron`);
    }
  },

  // Test rápido de conectividad (para usar en componentes)
  quickConnectivityTest: async () => {
    try {
      await api.get('/', { timeout: 5000 });
      return true;
    } catch (error) {
      console.error('Quick connectivity test failed:', error);
      return false;
    }
  },

  // Diagnóstico de problemas comunes
  diagnoseCommonIssues: async () => {
    const issues = [];
    
    // Verificar configuración de API
    const apiUrl = import.meta.env.VITE_API_URL;
    if (!apiUrl) {
      issues.push({
        type: 'config',
        severity: 'high',
        message: 'VITE_API_URL no está configurada',
        solution: 'Agregar VITE_API_URL=http://localhost:8000/api/v1 al archivo .env'
      });
    }

    // Verificar conectividad
    try {
      await api.get('/', { timeout: 3000 });
    } catch (error) {
      if (error.code === 'ECONNREFUSED') {
        issues.push({
          type: 'connectivity',
          severity: 'high',
          message: 'No se puede conectar al backend',
          solution: 'Verificar que el servidor Django esté corriendo en puerto 8000'
        });
      } else if (error.response?.status === 403) {
        issues.push({
          type: 'cors',
          severity: 'medium',
          message: 'Error de CORS',
          solution: 'Verificar configuración CORS en el backend'
        });
      }
    }

    // Verificar autenticación
    const token = localStorage.getItem('access_token');
    if (!token && authService.isAuthenticated()) {
      issues.push({
        type: 'auth',
        severity: 'medium',
        message: 'Estado de autenticación inconsistente',
        solution: 'Recargar la aplicación o hacer login nuevamente'
      });
    }

    return issues;
  },

  // Limpiar datos corruptos
  cleanupCorruptedData: () => {
    const keysToClean = ['access_token', 'refresh_token', 'user'];
    let cleaned = 0;

    keysToClean.forEach(key => {
      const value = localStorage.getItem(key);
      if (value) {
        try {
          if (key === 'user') {
            JSON.parse(value); // Test if valid JSON
          }
        } catch (error) {
          localStorage.removeItem(key);
          cleaned++;
          console.log(`🧹 Cleaned corrupted ${key} from localStorage`);
        }
      }
    });

    if (cleaned > 0) {
      toast.success(`🧹 Limpiados ${cleaned} elementos corruptos del almacenamiento`);
    }

    return cleaned;
  }
};

export default validationService;
