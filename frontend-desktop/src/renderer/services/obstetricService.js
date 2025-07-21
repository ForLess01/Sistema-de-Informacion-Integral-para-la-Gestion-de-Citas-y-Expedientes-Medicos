import api from './api';

class ObstetricService {
  // =====================================
  // PREGNANCY TRACKING
  // =====================================
  
  /**
   * Obtener resumen general de embarazos
   */
  async getPregnancyOverview() {
    try {
      const response = await api.get('/obstetric/pregnancy/overview/');
      return response.data;
    } catch (error) {
      console.error('Error fetching pregnancy overview:', error);
      // Fallback data for development
      return {
        total_pregnancies: 45,
        active_pregnancies: 38,
        high_risk: 7,
        due_this_month: 12,
        recent_births: 6,
        completed_this_month: 4
      };
    }
  }

  /**
   * Obtener lista de embarazos activos
   */
  async getActivePregnancies(filters = {}) {
    try {
      const params = new URLSearchParams();
      if (filters.risk_level) params.append('risk_level', filters.risk_level);
      if (filters.trimester) params.append('trimester', filters.trimester);
      if (filters.search) params.append('search', filters.search);
      
      const response = await api.get(`/obstetric/pregnancies/active/?${params}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching active pregnancies:', error);
      // Fallback data for development
      return [
        {
          id: 1,
          patient_id: 101,
          patient_name: "María García López",
          patient_dni: "12345678",
          age: 28,
          lmp: "2024-03-15",
          edd: "2024-12-20",
          weeks_pregnant: 32,
          trimester: 3,
          risk_level: "low",
          next_appointment: "2024-12-25",
          blood_pressure: "120/80",
          weight_gain: 12.5,
          fetal_heart_rate: 145,
          recent_notes: "Desarrollo normal, sin complicaciones",
          last_checkup: "2024-12-10",
          phone: "+51 987654321",
          emergency_contact: "Juan García - 987123456"
        },
        {
          id: 2,
          patient_id: 102,
          patient_name: "Ana Rodríguez Martín",
          patient_dni: "87654321",
          age: 34,
          lmp: "2024-04-10",
          edd: "2025-01-15",
          weeks_pregnant: 28,
          trimester: 2,
          risk_level: "medium",
          next_appointment: "2024-12-28",
          blood_pressure: "130/85",
          weight_gain: 10.2,
          fetal_heart_rate: 150,
          recent_notes: "Monitorear presión arterial",
          last_checkup: "2024-12-08",
          phone: "+51 987654322",
          emergency_contact: "Carlos Rodríguez - 987123457"
        },
        {
          id: 3,
          patient_id: 103,
          patient_name: "Carmen Fernández Silva",
          patient_dni: "11223344",
          age: 22,
          lmp: "2024-01-20",
          edd: "2024-10-25",
          weeks_pregnant: 40,
          trimester: 3,
          risk_level: "high",
          next_appointment: "2024-12-22",
          blood_pressure: "140/90",
          weight_gain: 18.3,
          fetal_heart_rate: 140,
          recent_notes: "Posible preeclampsia - seguimiento estricto",
          last_checkup: "2024-12-15",
          phone: "+51 987654323",
          emergency_contact: "Luis Fernández - 987123458"
        }
      ];
    }
  }

  /**
   * Obtener detalles de un embarazo específico
   */
  async getPregnancyDetail(pregnancyId) {
    try {
      const response = await api.get(`/obstetric/pregnancies/${pregnancyId}/`);
      return response.data;
    } catch (error) {
      console.error('Error fetching pregnancy detail:', error);
      throw error;
    }
  }

  /**
   * Actualizar seguimiento de embarazo
   */
  async updatePregnancyTracking(pregnancyId, data) {
    try {
      const response = await api.patch(`/obstetric/pregnancies/${pregnancyId}/`, data);
      return response.data;
    } catch (error) {
      console.error('Error updating pregnancy tracking:', error);
      throw error;
    }
  }

  /**
   * Obtener citas prenatales próximas
   */
  async getUpcomingPrenatalAppointments() {
    try {
      const response = await api.get('/obstetric/appointments/upcoming/');
      return response.data;
    } catch (error) {
      console.error('Error fetching upcoming appointments:', error);
      return [
        {
          id: 1,
          patient_name: "María García López",
          date: "2024-12-25",
          time: "10:00",
          type: "Control prenatal",
          weeks_pregnant: 32,
          is_high_risk: false
        },
        {
          id: 2,
          patient_name: "Carmen Fernández Silva", 
          date: "2024-12-22",
          time: "14:30",
          type: "Control de riesgo",
          weeks_pregnant: 40,
          is_high_risk: true
        }
      ];
    }
  }

  // =====================================
  // BIRTH PLANS
  // =====================================

  /**
   * Obtener todos los planes de parto
   */
  async getBirthPlans(filters = {}) {
    try {
      const params = new URLSearchParams();
      if (filters.search) params.append('search', filters.search);
      if (filters.status) params.append('status', filters.status);
      
      const response = await api.get(`/obstetric/birth-plans/?${params}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching birth plans:', error);
      return [
        {
          id: 1,
          patient_id: 101,
          patient_name: "María García López",
          patient_dni: "12345678",
          pregnancy_id: 1,
          plan_type: "Natural",
          birth_preference: "water_birth",
          pain_management: "natural",
          birth_position: "upright",
          support_person: "Juan García (Esposo)",
          special_requests: "Labor en agua, sin anestesia epidural",
          medical_notes: "Monitorizar continuamente, paciente informada",
          estimated_due_date: "2024-12-20",
          created_date: "2024-11-01",
          last_updated: "2024-12-10",
          status: "active",
          doctor_approved: true,
          weeks_pregnant: 32
        },
        {
          id: 2,
          patient_id: 102,
          patient_name: "Ana Rodríguez Martín",
          patient_dni: "87654321",
          pregnancy_id: 2,
          plan_type: "Cesárea",
          birth_preference: "cesarean_planned",
          pain_management: "epidural",
          birth_position: "supine",
          support_person: "Carlos Rodríguez (Esposo)",
          special_requests: "Cesárea programada por indicación médica",
          medical_notes: "Placenta previa confirmada - cesárea obligatoria",
          estimated_due_date: "2025-01-15",
          created_date: "2024-10-15",
          last_updated: "2024-12-08",
          status: "approved",
          doctor_approved: true,
          weeks_pregnant: 28
        }
      ];
    }
  }

  /**
   * Obtener detalles de un plan de parto
   */
  async getBirthPlanDetail(planId) {
    try {
      const response = await api.get(`/obstetric/birth-plans/${planId}/`);
      return response.data;
    } catch (error) {
      console.error('Error fetching birth plan detail:', error);
      throw error;
    }
  }

  /**
   * Crear un nuevo plan de parto
   */
  async createBirthPlan(data) {
    try {
      const response = await api.post('/obstetric/birth-plans/', data);
      return response.data;
    } catch (error) {
      console.error('Error creating birth plan:', error);
      throw error;
    }
  }

  /**
   * Actualizar un plan de parto
   */
  async updateBirthPlan(planId, data) {
    try {
      const response = await api.patch(`/obstetric/birth-plans/${planId}/`, data);
      return response.data;
    } catch (error) {
      console.error('Error updating birth plan:', error);
      throw error;
    }
  }

  // =====================================
  // POSTPARTUM CARE
  // =====================================

  /**
   * Obtener registros de cuidado postparto
   */
  async getPostpartumRecords(filters = {}) {
    try {
      const params = new URLSearchParams();
      if (filters.search) params.append('search', filters.search);
      if (filters.status) params.append('status', filters.status);
      
      const response = await api.get(`/obstetric/postpartum/?${params}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching postpartum records:', error);
      return [
        {
          id: 1,
          patient_id: 104,
          patient_name: "María García López",
          patient_dni: "12345678",
          birth_date: "2024-11-15",
          birth_type: "Natural",
          birth_weight: 3.2,
          birth_complications: false,
          current_day: 25,
          baby_status: "Saludable",
          baby_weight: 3.8,
          baby_feeding: "Lactancia exclusiva",
          mother_status: "Recuperación normal",
          mother_weight: 68.5,
          breastfeeding_status: "Exclusiva",
          lochia_status: "Normal",
          episiotomy_healing: "Buena",
          mood_assessment: "Estable",
          next_appointment: "2024-12-20",
          complications: false,
          notes: "Evolución favorable, continuar lactancia exclusiva",
          last_checkup: "2024-12-05",
          support_system: "Excelente",
          contraception_counseling: "Pendiente"
        },
        {
          id: 2,
          patient_id: 105,
          patient_name: "Ana Rodríguez Martín",
          patient_dni: "87654321",
          birth_date: "2024-10-28",
          birth_type: "Cesárea",
          birth_weight: 2.9,
          birth_complications: true,
          current_day: 43,
          baby_status: "Saludable",
          baby_weight: 3.5,
          baby_feeding: "Lactancia mixta",
          mother_status: "Recuperación lenta",
          mother_weight: 72.1,
          breastfeeding_status: "Mixta",
          lochia_status: "Prolongada",
          episiotomy_healing: "N/A",
          mood_assessment: "Leve ansiedad",
          next_appointment: "2024-12-18",
          complications: true,
          notes: "Cicatrización lenta de cesárea, control semanal requerido",
          last_checkup: "2024-12-01",
          support_system: "Regular",
          contraception_counseling: "Realizada"
        }
      ];
    }
  }

  /**
   * Obtener estadísticas de cuidado postparto
   */
  async getPostpartumStatistics() {
    try {
      const response = await api.get('/obstetric/postpartum/statistics/');
      return response.data;
    } catch (error) {
      console.error('Error fetching postpartum statistics:', error);
      return {
        total_patients: 24,
        critical_cases: 3,
        scheduled_visits: 8,
        breastfeeding_success: 89,
        average_recovery_days: 21,
        complication_rate: 12.5
      };
    }
  }

  /**
   * Crear un nuevo registro postparto
   */
  async createPostpartumRecord(data) {
    try {
      const response = await api.post('/obstetric/postpartum/', data);
      return response.data;
    } catch (error) {
      console.error('Error creating postpartum record:', error);
      throw error;
    }
  }

  /**
   * Actualizar registro postparto
   */
  async updatePostpartumRecord(recordId, data) {
    try {
      const response = await api.patch(`/obstetric/postpartum/${recordId}/`, data);
      return response.data;
    } catch (error) {
      console.error('Error updating postpartum record:', error);
      throw error;
    }
  }

  // =====================================
  // GENERAL OBSTETRIC SERVICES
  // =====================================

  /**
   * Obtener estadísticas del dashboard de obstetricia
   */
  async getObstetricDashboardStats() {
    try {
      const response = await api.get('/obstetric/dashboard/stats/');
      return response.data;
    } catch (error) {
      console.error('Error fetching obstetric dashboard stats:', error);
      return {
        appointments_today: 8,
        appointments_change: '+12%',
        pregnant_patients: 38,
        pregnant_change: '+3%',
        scheduled_births: 5,
        prenatal_controls: 12,
        controls_change: '+8%',
        high_risk_pregnancies: 7,
        postpartum_follow_ups: 15
      };
    }
  }

  /**
   * Obtener citas del día para obstetricia
   */
  async getTodayObstetricAppointments() {
    try {
      const response = await api.get('/obstetric/appointments/today/');
      return response.data;
    } catch (error) {
      console.error('Error fetching today obstetric appointments:', error);
      return [
        {
          id: 1,
          patient_name: "María García López",
          time: "09:00",
          appointment_type: "Control prenatal",
          weeks_pregnant: 32,
          status: "confirmed",
          risk_level: "low"
        },
        {
          id: 2,
          patient_name: "Carmen Fernández Silva",
          time: "10:30",
          appointment_type: "Control de alto riesgo",
          weeks_pregnant: 40,
          status: "confirmed",
          risk_level: "high"
        },
        {
          id: 3,
          patient_name: "Ana Rodríguez Martín",
          time: "14:00",
          appointment_type: "Ecografía",
          weeks_pregnant: 28,
          status: "pending",
          risk_level: "medium"
        }
      ];
    }
  }

  /**
   * Obtener pacientes embarazadas en seguimiento
   */
  async getPregnantPatientsForDashboard() {
    try {
      const response = await api.get('/obstetric/patients/dashboard/');
      return response.data;
    } catch (error) {
      console.error('Error fetching pregnant patients for dashboard:', error);
      return [
        {
          id: 1,
          name: "María García López",
          weeks_pregnant: 32,
          trimester: 3,
          next_appointment: "2024-12-25",
          risk_level: "low"
        },
        {
          id: 2,
          name: "Ana Rodríguez Martín",
          weeks_pregnant: 28,
          trimester: 2,
          next_appointment: "2024-12-28",
          risk_level: "medium"
        },
        {
          id: 3,
          name: "Carmen Fernández Silva",
          weeks_pregnant: 40,
          trimester: 3,
          next_appointment: "2024-12-22",
          risk_level: "high"
        }
      ];
    }
  }

  /**
   * Buscar pacientes para crear planes de parto o seguimiento
   */
  async searchPatients(query) {
    try {
      const response = await api.get(`/patients/search/?q=${query}`);
      return response.data;
    } catch (error) {
      console.error('Error searching patients:', error);
      throw error;
    }
  }

  /**
   * Generar reporte de obstetricia
   */
  async generateObstetricReport(type, filters = {}) {
    try {
      const params = new URLSearchParams();
      Object.keys(filters).forEach(key => {
        if (filters[key]) params.append(key, filters[key]);
      });
      
      const response = await api.get(`/obstetric/reports/${type}/?${params}`);
      return response.data;
    } catch (error) {
      console.error('Error generating obstetric report:', error);
      throw error;
    }
  }
}

export default new ObstetricService();
