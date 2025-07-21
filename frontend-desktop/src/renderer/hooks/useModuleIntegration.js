import { useState, useEffect, useCallback } from 'react';
import { moduleIntegrationService } from '../services/moduleIntegrationService';
import { useAuth } from './useAuth';

/**
 * Hook personalizado para facilitar la integración entre módulos
 */
export const useModuleIntegration = (currentModule) => {
  const { user } = useAuth();
  const [crossModuleData, setCrossModuleData] = useState({});
  const [crossModuleStats, setCrossModuleStats] = useState({});
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Cargar datos cross-módulo para un paciente específico
   */
  const loadPatientCrossModuleData = useCallback(async (patientId) => {
    if (!patientId || !user?.role) return;

    setLoading(true);
    setError(null);

    try {
      const data = await moduleIntegrationService.getPatientCrossModuleData(
        patientId,
        user.role
      );
      
      setCrossModuleData(prev => ({
        ...prev,
        [patientId]: data
      }));
    } catch (err) {
      console.error('Error cargando datos cross-módulo:', err);
      setError('Error al cargar datos integrados del paciente');
    } finally {
      setLoading(false);
    }
  }, [user?.role]);

  /**
   * Cargar estadísticas cross-módulo para el dashboard
   */
  const loadCrossModuleStats = useCallback(async () => {
    if (!user?.role) return;

    setLoading(true);
    setError(null);

    try {
      const stats = await moduleIntegrationService.getCrossModuleStats(user.role);
      setCrossModuleStats(stats);
    } catch (err) {
      console.error('Error cargando estadísticas cross-módulo:', err);
      setError('Error al cargar estadísticas integradas');
    } finally {
      setLoading(false);
    }
  }, [user?.role]);

  /**
   * Cargar notificaciones del módulo actual
   */
  const loadNotifications = useCallback((patientId = null) => {
    if (!currentModule) return;

    const moduleNotifications = moduleIntegrationService.getModuleNotifications(
      currentModule,
      patientId
    );
    
    setNotifications(moduleNotifications);
  }, [currentModule]);

  /**
   * Notificar una actualización a otros módulos
   */
  const notifyOtherModules = useCallback((targetModule, updateType, data) => {
    if (!currentModule) return;

    moduleIntegrationService.notifyModuleUpdate(
      currentModule,
      targetModule,
      updateType,
      data
    );
  }, [currentModule]);

  /**
   * Suscribirse a eventos de otros módulos
   */
  const subscribeToModuleEvents = useCallback((eventType, callback) => {
    if (!currentModule) return;

    moduleIntegrationService.subscribeToModuleEvents(
      currentModule,
      eventType,
      callback
    );

    // Retornar función de cleanup
    return () => {
      // Nota: En una implementación completa, necesitaríamos un método unsubscribe
      console.log(`Unsubscribing from ${currentModule}-${eventType}`);
    };
  }, [currentModule]);

  /**
   * Limpiar datos de un paciente específico del caché
   */
  const clearPatientData = useCallback((patientId) => {
    setCrossModuleData(prev => {
      const newData = { ...prev };
      delete newData[patientId];
      return newData;
    });
  }, []);

  /**
   * Refrescar datos después de una actualización
   */
  const refreshData = useCallback(async (patientId = null) => {
    if (patientId) {
      await loadPatientCrossModuleData(patientId);
    }
    await loadCrossModuleStats();
    loadNotifications(patientId);
  }, [loadPatientCrossModuleData, loadCrossModuleStats, loadNotifications]);

  // Cargar estadísticas iniciales
  useEffect(() => {
    if (user?.role) {
      loadCrossModuleStats();
      loadNotifications();
    }
  }, [user?.role, loadCrossModuleStats, loadNotifications]);

  // Configurar listeners para actualizaciones en tiempo real
  useEffect(() => {
    if (!currentModule) return;

    const handleModuleUpdate = (notification) => {
      console.log('Actualización recibida:', notification);
      
      // Refrescar datos relevantes
      if (notification.data?.patientId) {
        loadPatientCrossModuleData(notification.data.patientId);
      }
      
      // Actualizar notificaciones
      loadNotifications(notification.data?.patientId);
      
      // Refrescar stats si es necesario
      if (['appointment', 'prescription', 'emergency'].includes(notification.type)) {
        loadCrossModuleStats();
      }
    };

    const unsubscribe = subscribeToModuleEvents('update', handleModuleUpdate);
    
    return unsubscribe;
  }, [currentModule, subscribeToModuleEvents, loadPatientCrossModuleData, loadNotifications, loadCrossModuleStats]);

  return {
    // Datos
    crossModuleData,
    crossModuleStats,
    notifications,
    loading,
    error,

    // Métodos
    loadPatientCrossModuleData,
    loadCrossModuleStats,
    loadNotifications,
    notifyOtherModules,
    subscribeToModuleEvents,
    clearPatientData,
    refreshData,

    // Utilidades
    getPatientData: (patientId) => crossModuleData[patientId] || null,
    hasPatientData: (patientId) => !!crossModuleData[patientId],
    getNotificationCount: () => notifications.length,
    getUnreadNotifications: () => notifications.filter(n => !n.read),
  };
};

export default useModuleIntegration;
