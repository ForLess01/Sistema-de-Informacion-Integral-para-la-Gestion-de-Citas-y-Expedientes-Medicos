/**
 * Servicio de integración entre módulos
 * Facilita la comunicación y el intercambio de datos entre diferentes módulos del sistema
 */

class ModuleIntegrationService {
  constructor() {
    this.moduleEventListeners = new Map();
    this.sharedData = new Map();
    this.crossModuleCache = new Map();
  }

  /**
   * Registra un listener para eventos de integración entre módulos
   */
  subscribeToModuleEvents(moduleId, eventType, callback) {
    const key = `${moduleId}-${eventType}`;
    if (!this.moduleEventListeners.has(key)) {
      this.moduleEventListeners.set(key, []);
    }
    this.moduleEventListeners.get(key).push(callback);
  }

  /**
   * Emite un evento de integración entre módulos
   */
  emitModuleEvent(moduleId, eventType, data) {
    const key = `${moduleId}-${eventType}`;
    const listeners = this.moduleEventListeners.get(key) || [];
    listeners.forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error(`Error en listener de evento ${key}:`, error);
      }
    });
  }

  /**
   * Obtiene datos relevantes de un paciente para diferentes módulos
   */
  async getPatientCrossModuleData(patientId, requestingModule) {
    const cacheKey = `patient-${patientId}-${requestingModule}`;
    
    // Verificar caché primero
    if (this.crossModuleCache.has(cacheKey)) {
      const cached = this.crossModuleCache.get(cacheKey);
      if (Date.now() - cached.timestamp < 300000) { // 5 minutos de caché
        return cached.data;
      }
    }

    try {
      const data = await this.fetchPatientDataFromModules(patientId, requestingModule);
      
      // Guardar en caché
      this.crossModuleCache.set(cacheKey, {
        data,
        timestamp: Date.now()
      });

      return data;
    } catch (error) {
      console.error('Error obteniendo datos cross-módulo:', error);
      throw error;
    }
  }

  /**
   * Obtiene datos específicos de diferentes módulos para un paciente
   */
  async fetchPatientDataFromModules(patientId, requestingModule) {
    const integrationData = {
      patientId,
      requestingModule,
      medical: null,
      dental: null,
      pharmacy: null,
      emergency: null,
      obstetrics: null
    };

    const promises = [];

    // Datos médicos generales (siempre relevantes)
    promises.push(
      this.fetchMedicalData(patientId).then(data => {
        integrationData.medical = data;
      }).catch(err => console.warn('Error cargando datos médicos:', err))
    );

    // Datos dentales (relevante para médicos generales y especialistas)
    if (['doctor', 'odontologo', 'admin'].includes(requestingModule)) {
      promises.push(
        this.fetchDentalData(patientId).then(data => {
          integrationData.dental = data;
        }).catch(err => console.warn('Error cargando datos dentales:', err))
      );
    }

    // Datos de farmacia (relevante para prescripciones)
    if (['doctor', 'odontologo', 'pharmacist', 'admin'].includes(requestingModule)) {
      promises.push(
        this.fetchPharmacyData(patientId).then(data => {
          integrationData.pharmacy = data;
        }).catch(err => console.warn('Error cargando datos de farmacia:', err))
      );
    }

    // Datos de emergencias (relevante para historial crítico)
    if (['doctor', 'nurse', 'emergency', 'admin'].includes(requestingModule)) {
      promises.push(
        this.fetchEmergencyData(patientId).then(data => {
          integrationData.emergency = data;
        }).catch(err => console.warn('Error cargando datos de emergencia:', err))
      );
    }

    // Datos obstétricos (relevante para mujeres)
    if (['doctor', 'obstetriz', 'admin'].includes(requestingModule)) {
      promises.push(
        this.fetchObstetricsData(patientId).then(data => {
          integrationData.obstetrics = data;
        }).catch(err => console.warn('Error cargando datos obstétricos:', err))
      );
    }

    await Promise.all(promises);
    return integrationData;
  }

  /**
   * Obtiene datos médicos básicos
   */
  async fetchMedicalData(patientId) {
    const response = await fetch(`/api/patients/${patientId}/medical-summary`);
    if (!response.ok) throw new Error('Error fetching medical data');
    return await response.json();
  }

  /**
   * Obtiene resumen de datos dentales
   */
  async fetchDentalData(patientId) {
    const response = await fetch(`/api/patients/${patientId}/dental-summary`);
    if (!response.ok) throw new Error('Error fetching dental data');
    return await response.json();
  }

  /**
   * Obtiene datos de prescripciones y medicamentos
   */
  async fetchPharmacyData(patientId) {
    const response = await fetch(`/api/patients/${patientId}/pharmacy-summary`);
    if (!response.ok) throw new Error('Error fetching pharmacy data');
    return await response.json();
  }

  /**
   * Obtiene historial de emergencias
   */
  async fetchEmergencyData(patientId) {
    const response = await fetch(`/api/patients/${patientId}/emergency-summary`);
    if (!response.ok) throw new Error('Error fetching emergency data');
    return await response.json();
  }

  /**
   * Obtiene datos obstétricos
   */
  async fetchObstetricsData(patientId) {
    const response = await fetch(`/api/patients/${patientId}/obstetrics-summary`);
    if (!response.ok) throw new Error('Error fetching obstetrics data');
    return await response.json();
  }

  /**
   * Obtiene estadísticas inter-módulos para dashboards
   */
  async getCrossModuleStats(userRole) {
    try {
      const stats = {
        totalPatients: 0,
        activeAppointments: 0,
        pendingPrescriptions: 0,
        criticalCases: 0,
        lowStockItems: 0,
        dentalAppointments: 0,
        emergencyToday: 0,
        obstetricsControls: 0
      };

      const promises = [];

      // Stats básicas (todos los roles)
      promises.push(
        fetch('/api/stats/patients/total').then(res => res.json())
          .then(data => stats.totalPatients = data.count)
          .catch(err => console.warn('Error obteniendo total pacientes:', err))
      );

      // Stats de citas (roles con acceso a citas)
      if (['admin', 'doctor', 'nurse', 'receptionist', 'odontologo'].includes(userRole)) {
        promises.push(
          fetch('/api/stats/appointments/active').then(res => res.json())
            .then(data => stats.activeAppointments = data.count)
            .catch(err => console.warn('Error obteniendo citas activas:', err))
        );
      }

      // Stats de farmacia
      if (['admin', 'pharmacist', 'doctor'].includes(userRole)) {
        promises.push(
          fetch('/api/stats/pharmacy/pending-prescriptions').then(res => res.json())
            .then(data => stats.pendingPrescriptions = data.count)
            .catch(err => console.warn('Error obteniendo prescripciones pendientes:', err)),
          
          fetch('/api/stats/pharmacy/low-stock').then(res => res.json())
            .then(data => stats.lowStockItems = data.count)
            .catch(err => console.warn('Error obteniendo stock bajo:', err))
        );
      }

      // Stats de emergencias
      if (['admin', 'doctor', 'nurse', 'emergency'].includes(userRole)) {
        promises.push(
          fetch('/api/stats/emergency/critical-cases').then(res => res.json())
            .then(data => stats.criticalCases = data.count)
            .catch(err => console.warn('Error obteniendo casos críticos:', err)),
          
          fetch('/api/stats/emergency/today').then(res => res.json())
            .then(data => stats.emergencyToday = data.count)
            .catch(err => console.warn('Error obteniendo emergencias hoy:', err))
        );
      }

      // Stats dentales
      if (['admin', 'odontologo'].includes(userRole)) {
        promises.push(
          fetch('/api/stats/dental/appointments').then(res => res.json())
            .then(data => stats.dentalAppointments = data.count)
            .catch(err => console.warn('Error obteniendo citas dentales:', err))
        );
      }

      // Stats obstétricas
      if (['admin', 'obstetriz'].includes(userRole)) {
        promises.push(
          fetch('/api/stats/obstetrics/controls').then(res => res.json())
            .then(data => stats.obstetricsControls = data.count)
            .catch(err => console.warn('Error obteniendo controles obstétricos:', err))
        );
      }

      await Promise.all(promises);
      return stats;
    } catch (error) {
      console.error('Error obteniendo estadísticas cross-módulo:', error);
      throw error;
    }
  }

  /**
   * Notifica cambios importantes entre módulos
   */
  notifyModuleUpdate(sourceModule, targetModule, updateType, data) {
    const notification = {
      source: sourceModule,
      target: targetModule,
      type: updateType,
      data,
      timestamp: new Date().toISOString()
    };

    // Emitir evento para listeners
    this.emitModuleEvent(targetModule, 'update', notification);

    // También almacenar en datos compartidos si es relevante
    if (data.patientId) {
      const sharedKey = `${targetModule}-updates-${data.patientId}`;
      if (!this.sharedData.has(sharedKey)) {
        this.sharedData.set(sharedKey, []);
      }
      
      const updates = this.sharedData.get(sharedKey);
      updates.unshift(notification);
      
      // Mantener solo los últimos 10 updates
      if (updates.length > 10) {
        updates.length = 10;
      }
    }
  }

  /**
   * Obtiene notificaciones pendientes para un módulo
   */
  getModuleNotifications(moduleId, patientId = null) {
    if (patientId) {
      const sharedKey = `${moduleId}-updates-${patientId}`;
      return this.sharedData.get(sharedKey) || [];
    }

    // Obtener todas las notificaciones del módulo
    const allNotifications = [];
    for (const [key, value] of this.sharedData.entries()) {
      if (key.startsWith(`${moduleId}-updates-`)) {
        allNotifications.push(...value);
      }
    }

    return allNotifications.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  }

  /**
   * Limpia caché y datos antiguos
   */
  cleanup() {
    const now = Date.now();
    const maxAge = 600000; // 10 minutos

    // Limpiar caché expirado
    for (const [key, value] of this.crossModuleCache.entries()) {
      if (now - value.timestamp > maxAge) {
        this.crossModuleCache.delete(key);
      }
    }

    // Limpiar notificaciones antiguas
    for (const [key, notifications] of this.sharedData.entries()) {
      if (key.includes('-updates-')) {
        const filteredNotifications = notifications.filter(notification => 
          now - new Date(notification.timestamp).getTime() < maxAge
        );
        
        if (filteredNotifications.length === 0) {
          this.sharedData.delete(key);
        } else {
          this.sharedData.set(key, filteredNotifications);
        }
      }
    }
  }
}

// Exportar una instancia singleton
export const moduleIntegrationService = new ModuleIntegrationService();

// Configurar limpieza automática cada 5 minutos
setInterval(() => {
  moduleIntegrationService.cleanup();
}, 300000);

export default moduleIntegrationService;
