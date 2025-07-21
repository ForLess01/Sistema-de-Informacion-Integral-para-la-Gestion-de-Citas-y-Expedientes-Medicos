import api from './api';

const reportsService = {
  // ===== REPORTES GENERALES =====
  
  // Obtener lista de reportes disponibles
  getAvailableReports: async () => {
    const response = await api.get('/reports/');
    return response.data;
  },

  // Generar reporte personalizado
  generateReport: async (reportConfig) => {
    const response = await api.post('/reports/generate/', reportConfig);
    return response.data;
  },

  // Obtener reporte por ID
  getReport: async (reportId) => {
    const response = await api.get(`/reports/${reportId}/`);
    return response.data;
  },

  // Descargar reporte en PDF
  downloadReportPDF: async (reportId) => {
    const response = await api.get(`/reports/${reportId}/pdf/`, {
      responseType: 'blob'
    });
    return response.data;
  },

  // Descargar reporte en Excel
  downloadReportExcel: async (reportId) => {
    const response = await api.get(`/reports/${reportId}/excel/`, {
      responseType: 'blob'
    });
    return response.data;
  },

  // ===== REPORTES DE CITAS =====
  
  // Reporte de citas por período
  getAppointmentsReport: async (startDate, endDate, filters = {}) => {
    const response = await api.get('/reports/appointments/', {
      params: {
        start_date: startDate,
        end_date: endDate,
        ...filters
      }
    });
    return response.data;
  },

  // Estadísticas de citas por especialidad
  getAppointmentsBySpecialty: async (startDate, endDate) => {
    const response = await api.get('/reports/appointments/by-specialty/', {
      params: { start_date: startDate, end_date: endDate }
    });
    return response.data;
  },

  // Reporte de cancelaciones
  getCancellationsReport: async (startDate, endDate) => {
    const response = await api.get('/reports/appointments/cancellations/', {
      params: { start_date: startDate, end_date: endDate }
    });
    return response.data;
  },

  // Reporte de no-shows
  getNoShowsReport: async (startDate, endDate) => {
    const response = await api.get('/reports/appointments/no-shows/', {
      params: { start_date: startDate, end_date: endDate }
    });
    return response.data;
  },

  // ===== REPORTES DE PACIENTES =====
  
  // Reporte general de pacientes
  getPatientsReport: async (filters = {}) => {
    const response = await api.get('/reports/patients/', { params: filters });
    return response.data;
  },

  // Estadísticas demográficas de pacientes
  getPatientDemographics: async () => {
    const response = await api.get('/reports/patients/demographics/');
    return response.data;
  },

  // Reporte de nuevos registros
  getNewPatientsReport: async (startDate, endDate) => {
    const response = await api.get('/reports/patients/new-registrations/', {
      params: { start_date: startDate, end_date: endDate }
    });
    return response.data;
  },

  // Reporte de actividad por paciente
  getPatientActivityReport: async (patientId, startDate, endDate) => {
    const response = await api.get(`/reports/patients/${patientId}/activity/`, {
      params: { start_date: startDate, end_date: endDate }
    });
    return response.data;
  },

  // ===== REPORTES MÉDICOS =====
  
  // Reporte de consultas médicas
  getMedicalConsultationsReport: async (startDate, endDate, filters = {}) => {
    const response = await api.get('/reports/medical/consultations/', {
      params: { start_date: startDate, end_date: endDate, ...filters }
    });
    return response.data;
  },

  // Estadísticas de diagnósticos más comunes
  getCommonDiagnosesReport: async (startDate, endDate) => {
    const response = await api.get('/reports/medical/common-diagnoses/', {
      params: { start_date: startDate, end_date: endDate }
    });
    return response.data;
  },

  // Reporte de prescripciones
  getPrescriptionsReport: async (startDate, endDate, filters = {}) => {
    const response = await api.get('/reports/medical/prescriptions/', {
      params: { start_date: startDate, end_date: endDate, ...filters }
    });
    return response.data;
  },

  // ===== REPORTES DE FARMACIA =====
  
  // Reporte de inventario
  getInventoryReport: async () => {
    const response = await api.get('/reports/pharmacy/inventory/');
    return response.data;
  },

  // Reporte de medicamentos con stock bajo
  getLowStockReport: async (threshold = 10) => {
    const response = await api.get('/reports/pharmacy/low-stock/', {
      params: { threshold }
    });
    return response.data;
  },

  // Reporte de movimientos de stock
  getStockMovementsReport: async (startDate, endDate) => {
    const response = await api.get('/reports/pharmacy/stock-movements/', {
      params: { start_date: startDate, end_date: endDate }
    });
    return response.data;
  },

  // Reporte de dispensaciones
  getDispensationsReport: async (startDate, endDate) => {
    const response = await api.get('/reports/pharmacy/dispensations/', {
      params: { start_date: startDate, end_date: endDate }
    });
    return response.data;
  },

  // Reporte de medicamentos más dispensados
  getTopDispensedMedicationsReport: async (startDate, endDate, limit = 20) => {
    const response = await api.get('/reports/pharmacy/top-dispensed/', {
      params: { start_date: startDate, end_date: endDate, limit }
    });
    return response.data;
  },

  // ===== REPORTES DE EMERGENCIAS =====
  
  // Reporte general de emergencias
  getEmergencyReport: async (startDate, endDate) => {
    const response = await api.get('/reports/emergency/', {
      params: { start_date: startDate, end_date: endDate }
    });
    return response.data;
  },

  // Estadísticas de tiempo de respuesta
  getResponseTimeReport: async (startDate, endDate) => {
    const response = await api.get('/reports/emergency/response-times/', {
      params: { start_date: startDate, end_date: endDate }
    });
    return response.data;
  },

  // Reporte de casos críticos
  getCriticalCasesReport: async (startDate, endDate) => {
    const response = await api.get('/reports/emergency/critical-cases/', {
      params: { start_date: startDate, end_date: endDate }
    });
    return response.data;
  },

  // ===== REPORTES FINANCIEROS =====
  
  // Reporte de ingresos
  getRevenueReport: async (startDate, endDate) => {
    const response = await api.get('/reports/financial/revenue/', {
      params: { start_date: startDate, end_date: endDate }
    });
    return response.data;
  },

  // Reporte de gastos
  getExpensesReport: async (startDate, endDate) => {
    const response = await api.get('/reports/financial/expenses/', {
      params: { start_date: startDate, end_date: endDate }
    });
    return response.data;
  },

  // Reporte de rentabilidad
  getProfitabilityReport: async (startDate, endDate) => {
    const response = await api.get('/reports/financial/profitability/', {
      params: { start_date: startDate, end_date: endDate }
    });
    return response.data;
  },

  // ===== REPORTES DE RENDIMIENTO =====
  
  // Reporte de rendimiento de doctores
  getDoctorPerformanceReport: async (doctorId = null, startDate, endDate) => {
    const params = { start_date: startDate, end_date: endDate };
    if (doctorId) params.doctor = doctorId;
    
    const response = await api.get('/reports/performance/doctors/', { params });
    return response.data;
  },

  // Métricas de tiempo de espera
  getWaitingTimeMetrics: async (startDate, endDate) => {
    const response = await api.get('/reports/performance/waiting-times/', {
      params: { start_date: startDate, end_date: endDate }
    });
    return response.data;
  },

  // Indicadores de calidad
  getQualityIndicators: async (startDate, endDate) => {
    const response = await api.get('/reports/performance/quality-indicators/', {
      params: { start_date: startDate, end_date: endDate }
    });
    return response.data;
  },

  // ===== REPORTES MENSUALES =====
  
  // Reporte mensual consolidado
  getMonthlyReport: async (year, month) => {
    const response = await api.get('/reports/monthly/', {
      params: { year, month }
    });
    return response.data;
  },

  // Comparativo mensual
  getMonthlyComparison: async (year1, month1, year2, month2) => {
    const response = await api.get('/reports/monthly/comparison/', {
      params: { 
        year1, month1, year2, month2 
      }
    });
    return response.data;
  },

  // Tendencias mensuales
  getMonthlyTrends: async (year, months) => {
    const response = await api.get('/reports/monthly/trends/', {
      params: { 
        year, 
        months: months.join(',') 
      }
    });
    return response.data;
  },

  // ===== FUNCIONES DE UTILIDAD =====
  
  // Programar reporte automático
  scheduleReport: async (reportConfig, schedule) => {
    const response = await api.post('/reports/schedule/', {
      ...reportConfig,
      schedule
    });
    return response.data;
  },

  // Obtener reportes programados
  getScheduledReports: async () => {
    const response = await api.get('/reports/scheduled/');
    return response.data;
  },

  // Cancelar reporte programado
  cancelScheduledReport: async (scheduleId) => {
    const response = await api.delete(`/reports/scheduled/${scheduleId}/`);
    return response.data;
  },

  // Obtener plantillas de reportes
  getReportTemplates: async () => {
    const response = await api.get('/reports/templates/');
    return response.data;
  },

  // Crear plantilla personalizada
  createReportTemplate: async (templateData) => {
    const response = await api.post('/reports/templates/', templateData);
    return response.data;
  },

  // ===== FUNCIONES PARA DASHBOARD =====
  
  // Obtener métricas clave para dashboard
  getDashboardMetrics: async () => {
    const response = await api.get('/reports/dashboard-metrics/');
    return response.data;
  },

  // Obtener datos para gráficos del dashboard
  getDashboardCharts: async (period = 'last_30_days') => {
    const response = await api.get('/reports/dashboard-charts/', {
      params: { period }
    });
    return response.data;
  },

  // ===== FUNCIONES AUXILIARES =====
  
  // Validar fechas del reporte
  validateReportDates: (startDate, endDate) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const today = new Date();
    
    if (start > end) {
      throw new Error('La fecha de inicio no puede ser mayor que la fecha final');
    }
    
    if (start > today) {
      throw new Error('La fecha de inicio no puede ser mayor que hoy');
    }
    
    const diffDays = (end - start) / (1000 * 60 * 60 * 24);
    if (diffDays > 365) {
      throw new Error('El período del reporte no puede ser mayor a un año');
    }
    
    return true;
  },

  // Formatear fecha para API
  formatDateForAPI: (date) => {
    return new Date(date).toISOString().split('T')[0];
  },

  // Obtener períodos predefinidos
  getPredefinedPeriods: () => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    const lastWeek = new Date(today);
    lastWeek.setDate(lastWeek.getDate() - 7);
    
    const lastMonth = new Date(today);
    lastMonth.setMonth(lastMonth.getMonth() - 1);
    
    const lastThreeMonths = new Date(today);
    lastThreeMonths.setMonth(lastThreeMonths.getMonth() - 3);
    
    return {
      today: {
        start: reportsService.formatDateForAPI(today),
        end: reportsService.formatDateForAPI(today)
      },
      yesterday: {
        start: reportsService.formatDateForAPI(yesterday),
        end: reportsService.formatDateForAPI(yesterday)
      },
      last_week: {
        start: reportsService.formatDateForAPI(lastWeek),
        end: reportsService.formatDateForAPI(today)
      },
      last_month: {
        start: reportsService.formatDateForAPI(lastMonth),
        end: reportsService.formatDateForAPI(today)
      },
      last_three_months: {
        start: reportsService.formatDateForAPI(lastThreeMonths),
        end: reportsService.formatDateForAPI(today)
      }
    };
  }
};

export default reportsService;
