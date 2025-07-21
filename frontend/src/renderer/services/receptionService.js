import api from './api';

class ReceptionService {
  // ===== PATIENT MANAGEMENT =====
  
  /**
   * Get all patients with pagination and search
   * @param {Object} params - Query parameters (page, search, status)
   */
  async getPatients(params = {}) {
    try {
      const response = await api.get('/patients/', { params });
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Error al obtener pacientes',
        details: error.response?.data
      };
    }
  }

  /**
   * Get patient by ID
   * @param {number} patientId 
   */
  async getPatientById(patientId) {
    try {
      const response = await api.get(`/patients/${patientId}/`);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Error al obtener paciente',
        details: error.response?.data
      };
    }
  }

  /**
   * Create new patient
   * @param {Object} patientData 
   */
  async createPatient(patientData) {
    try {
      const response = await api.post('/patients/', patientData);
      return {
        success: true,
        data: response.data,
        message: 'Paciente registrado exitosamente'
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Error al registrar paciente',
        details: error.response?.data
      };
    }
  }

  /**
   * Update patient information
   * @param {number} patientId 
   * @param {Object} patientData 
   */
  async updatePatient(patientId, patientData) {
    try {
      const response = await api.put(`/patients/${patientId}/`, patientData);
      return {
        success: true,
        data: response.data,
        message: 'Paciente actualizado exitosamente'
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Error al actualizar paciente',
        details: error.response?.data
      };
    }
  }

  // ===== APPOINTMENT SCHEDULING =====

  /**
   * Get available time slots for appointment scheduling
   * @param {Object} params - Query parameters (doctor_id, date, specialty_id)
   */
  async getAvailableSlots(params) {
    try {
      const response = await api.get('/appointments/available-slots/', { params });
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Error al obtener horarios disponibles',
        details: error.response?.data
      };
    }
  }

  /**
   * Schedule new appointment
   * @param {Object} appointmentData 
   */
  async scheduleAppointment(appointmentData) {
    try {
      const response = await api.post('/appointments/', appointmentData);
      return {
        success: true,
        data: response.data,
        message: 'Cita programada exitosamente'
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Error al programar cita',
        details: error.response?.data
      };
    }
  }

  /**
   * Update appointment
   * @param {number} appointmentId 
   * @param {Object} appointmentData 
   */
  async updateAppointment(appointmentId, appointmentData) {
    try {
      const response = await api.put(`/appointments/${appointmentId}/`, appointmentData);
      return {
        success: true,
        data: response.data,
        message: 'Cita actualizada exitosamente'
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Error al actualizar cita',
        details: error.response?.data
      };
    }
  }

  /**
   * Cancel appointment
   * @param {number} appointmentId 
   * @param {string} reason 
   */
  async cancelAppointment(appointmentId, reason) {
    try {
      const response = await api.patch(`/appointments/${appointmentId}/cancel/`, { 
        cancellation_reason: reason 
      });
      return {
        success: true,
        data: response.data,
        message: 'Cita cancelada exitosamente'
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Error al cancelar cita',
        details: error.response?.data
      };
    }
  }

  /**
   * Get appointments for reception with filters
   * @param {Object} params - Query parameters (date, status, patient, doctor)
   */
  async getReceptionAppointments(params = {}) {
    try {
      const response = await api.get('/appointments/reception/', { params });
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Error al obtener citas',
        details: error.response?.data
      };
    }
  }

  // ===== INSURANCE VERIFICATION =====

  /**
   * Verify patient insurance
   * @param {number} patientId 
   * @param {Object} insuranceData 
   */
  async verifyInsurance(patientId, insuranceData) {
    try {
      const response = await api.post(`/patients/${patientId}/verify-insurance/`, insuranceData);
      return {
        success: true,
        data: response.data,
        message: 'Seguro verificado exitosamente'
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Error al verificar seguro',
        details: error.response?.data
      };
    }
  }

  /**
   * Get insurance verification history
   * @param {number} patientId 
   */
  async getInsuranceVerificationHistory(patientId) {
    try {
      const response = await api.get(`/patients/${patientId}/insurance-history/`);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Error al obtener historial de seguro',
        details: error.response?.data
      };
    }
  }

  /**
   * Get insurance providers list
   */
  async getInsuranceProviders() {
    try {
      const response = await api.get('/insurance/providers/');
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Error al obtener proveedores de seguro',
        details: error.response?.data
      };
    }
  }

  // ===== BILLING MANAGEMENT =====

  /**
   * Get billing information for patient
   * @param {number} patientId 
   */
  async getPatientBilling(patientId) {
    try {
      const response = await api.get(`/billing/patient/${patientId}/`);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Error al obtener información de facturación',
        details: error.response?.data
      };
    }
  }

  /**
   * Create new bill/invoice
   * @param {Object} billingData 
   */
  async createBill(billingData) {
    try {
      const response = await api.post('/billing/', billingData);
      return {
        success: true,
        data: response.data,
        message: 'Factura creada exitosamente'
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Error al crear factura',
        details: error.response?.data
      };
    }
  }

  /**
   * Process payment
   * @param {number} billId 
   * @param {Object} paymentData 
   */
  async processPayment(billId, paymentData) {
    try {
      const response = await api.post(`/billing/${billId}/payment/`, paymentData);
      return {
        success: true,
        data: response.data,
        message: 'Pago procesado exitosamente'
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Error al procesar pago',
        details: error.response?.data
      };
    }
  }

  /**
   * Get pending bills
   * @param {Object} params - Query parameters for filtering
   */
  async getPendingBills(params = {}) {
    try {
      const response = await api.get('/billing/pending/', { params });
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Error al obtener facturas pendientes',
        details: error.response?.data
      };
    }
  }

  // ===== DOCTORS AND SPECIALTIES =====

  /**
   * Get all doctors
   */
  async getDoctors() {
    try {
      const response = await api.get('/doctors/');
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Error al obtener doctores',
        details: error.response?.data
      };
    }
  }

  /**
   * Get all specialties
   */
  async getSpecialties() {
    try {
      const response = await api.get('/appointments/specialties/');
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Error al obtener especialidades',
        details: error.response?.data
      };
    }
  }

  // ===== DASHBOARD STATISTICS =====

  /**
   * Get reception dashboard statistics
   */
  async getReceptionDashboardStats() {
    try {
      const response = await api.get('/dashboard/reception/');
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Error al obtener estadísticas del dashboard',
        details: error.response?.data
      };
    }
  }

  // ===== NOTIFICATIONS =====

  /**
   * Get reception notifications
   */
  async getNotifications() {
    try {
      const response = await api.get('/notifications/reception/');
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Error al obtener notificaciones',
        details: error.response?.data
      };
    }
  }

  /**
   * Mark notification as read
   * @param {number} notificationId 
   */
  async markNotificationAsRead(notificationId) {
    try {
      const response = await api.patch(`/notifications/${notificationId}/read/`);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Error al marcar notificación como leída',
        details: error.response?.data
      };
    }
  }

  // ===== REPORTS =====

  /**
   * Generate daily appointments report
   * @param {string} date - Date in YYYY-MM-DD format
   */
  async getDailyAppointmentsReport(date) {
    try {
      const response = await api.get('/reports/daily-appointments/', {
        params: { date }
      });
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Error al generar reporte diario',
        details: error.response?.data
      };
    }
  }

  /**
   * Generate patient registration report
   * @param {Object} params - Query parameters (start_date, end_date)
   */
  async getPatientRegistrationReport(params) {
    try {
      const response = await api.get('/reports/patient-registrations/', { params });
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Error al generar reporte de registros',
        details: error.response?.data
      };
    }
  }
}

export default new ReceptionService();
