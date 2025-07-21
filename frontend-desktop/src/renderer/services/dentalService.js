import api from './api';

const dentalService = {
  // Obtener historial dental completo de un paciente
  async getPatientDentalHistory(patientId) {
    try {
      const response = await api.get(`/dental/history/${patientId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching dental history:', error);
      throw error;
    }
  },

  // Obtener odontograma de un paciente
  async getPatientOdontogram(patientId) {
    try {
      const response = await api.get(`/dental/odontogram/${patientId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching odontogram:', error);
      // Retornar datos mock mientras no esté el backend
      return {
        patient_id: patientId,
        teeth: [
          { number: 18, condition: 'healthy' },
          { number: 17, condition: 'restoration' },
          { number: 16, condition: 'caries' },
          { number: 15, condition: 'healthy' },
          { number: 14, condition: 'crown' },
          { number: 13, condition: 'healthy' },
          { number: 12, condition: 'healthy' },
          { number: 11, condition: 'healthy' },
          { number: 21, condition: 'healthy' },
          { number: 22, condition: 'healthy' },
          { number: 23, condition: 'healthy' },
          { number: 24, condition: 'restoration' },
          { number: 25, condition: 'healthy' },
          { number: 26, condition: 'caries' },
          { number: 27, condition: 'healthy' },
          { number: 28, condition: 'missing' },
          { number: 48, condition: 'root_canal' },
          { number: 47, condition: 'healthy' },
          { number: 46, condition: 'restoration' },
          { number: 45, condition: 'healthy' },
          { number: 44, condition: 'healthy' },
          { number: 43, condition: 'healthy' },
          { number: 42, condition: 'healthy' },
          { number: 41, condition: 'healthy' },
          { number: 31, condition: 'healthy' },
          { number: 32, condition: 'healthy' },
          { number: 33, condition: 'healthy' },
          { number: 34, condition: 'healthy' },
          { number: 35, condition: 'restoration' },
          { number: 36, condition: 'crown' },
          { number: 37, condition: 'healthy' },
          { number: 38, condition: 'missing' },
        ],
        last_updated: new Date().toISOString(),
      };
    }
  },

  // Actualizar estado de un diente en el odontograma
  async updateToothCondition(patientId, toothNumber, condition, notes = '') {
    try {
      const response = await api.put(`/dental/odontogram/${patientId}/tooth/${toothNumber}`, {
        condition,
        notes,
        updated_at: new Date().toISOString(),
      });
      return response.data;
    } catch (error) {
      console.error('Error updating tooth condition:', error);
      throw error;
    }
  },

  // Obtener tratamientos dentales de un paciente
  async getPatientTreatments(patientId) {
    try {
      const response = await api.get(`/dental/treatments/${patientId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching dental treatments:', error);
      // Retornar datos mock mientras no esté el backend
      return [
        {
          id: 1,
          patient_id: patientId,
          name: 'Endodoncia',
          tooth_number: 16,
          description: 'Tratamiento de conducto radicular en molar superior derecho',
          status: 'in_progress',
          progress: 75,
          start_date: '2024-01-15',
          estimated_duration: '3 sesiones',
          cost: 450.00,
          doctor_name: 'Dr. Martinez',
          sessions: [
            {
              date: '2024-01-15',
              description: 'Primera sesión - Apertura cameral',
              completed: true,
            },
            {
              date: '2024-01-22',
              description: 'Segunda sesión - Preparación conductos',
              completed: true,
            },
            {
              date: '2024-01-29',
              description: 'Tercera sesión - Obturación',
              completed: false,
            },
          ],
        },
        {
          id: 2,
          patient_id: patientId,
          name: 'Restauración Dental',
          tooth_number: 24,
          description: 'Obturación con resina compuesta en premolar',
          status: 'completed',
          progress: 100,
          start_date: '2024-01-08',
          estimated_duration: '1 sesión',
          cost: 120.00,
          doctor_name: 'Dr. Martinez',
          completion_date: '2024-01-08',
        },
        {
          id: 3,
          patient_id: patientId,
          name: 'Corona Dental',
          tooth_number: 36,
          description: 'Corona de porcelana en molar inferior',
          status: 'planned',
          progress: 0,
          start_date: '2024-02-05',
          estimated_duration: '2 sesiones',
          cost: 680.00,
          doctor_name: 'Dr. Martinez',
        },
      ];
    }
  },

  // Crear nuevo tratamiento dental
  async createTreatment(patientId, treatmentData) {
    try {
      const response = await api.post(`/dental/treatments/${patientId}`, treatmentData);
      return response.data;
    } catch (error) {
      console.error('Error creating treatment:', error);
      throw error;
    }
  },

  // Actualizar progreso de tratamiento
  async updateTreatmentProgress(treatmentId, progress, notes = '') {
    try {
      const response = await api.put(`/dental/treatments/${treatmentId}/progress`, {
        progress,
        notes,
        updated_at: new Date().toISOString(),
      });
      return response.data;
    } catch (error) {
      console.error('Error updating treatment progress:', error);
      throw error;
    }
  },

  // Obtener procedimientos realizados
  async getPatientProcedures(patientId) {
    try {
      const response = await api.get(`/dental/procedures/${patientId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching procedures:', error);
      // Datos mock con diversos estados y prioridades
      return [
        {
          id: 1,
          patient_id: patientId,
          name: 'Limpieza Dental Profunda',
          description: 'Profilaxis completa con eliminación de sarro y fluorización',
          tooth_number: 'Todos',
          status: 'completed',
          priority: 'medium',
          cost: 150,
          progress: 100,
          doctor_name: 'Martinez',
          estimated_duration: '45 min',
          created_at: '2024-01-10T09:00:00Z',
          scheduled_date: '2024-01-15T10:00:00Z',
          completed_at: '2024-01-15T10:45:00Z',
          notes: 'Procedimiento realizado sin complicaciones. Paciente tolera bien el tratamiento.',
        },
        {
          id: 2,
          patient_id: patientId,
          name: 'Endodoncia Molar',
          description: 'Tratamiento de conducto radicular en molar superior derecho',
          tooth_number: 16,
          status: 'in_progress',
          priority: 'high',
          cost: 450,
          progress: 65,
          doctor_name: 'Martinez',
          estimated_duration: '90 min',
          created_at: '2024-01-20T08:30:00Z',
          scheduled_date: '2024-01-25T14:00:00Z',
          started_at: '2024-01-25T14:05:00Z',
          notes: 'Primera fase completada. Apertura cameral realizada. Programar segunda sesión.',
        },
        {
          id: 3,
          patient_id: patientId,
          name: 'Obturación Compuesta',
          description: 'Restauración con resina compuesta en premolar',
          tooth_number: 24,
          status: 'scheduled',
          priority: 'medium',
          cost: 180,
          progress: 0,
          doctor_name: 'Martinez',
          estimated_duration: '30 min',
          created_at: '2024-01-22T11:15:00Z',
          scheduled_date: '2024-02-05T11:00:00Z',
          notes: 'Caries media en cara oclusal. Requiere anestesia local.',
        },
        {
          id: 4,
          patient_id: patientId,
          name: 'Corona de Porcelana',
          description: 'Corona completa de porcelana sobre molar tratado',
          tooth_number: 16,
          status: 'pending',
          priority: 'high',
          cost: 680,
          progress: 0,
          doctor_name: 'Martinez',
          estimated_duration: '60 min',
          created_at: '2024-01-22T11:20:00Z',
          scheduled_date: '2024-02-15T15:30:00Z',
          notes: 'Pendiente completar endodoncia antes de colocar corona. Toma de impresión programada.',
        },
        {
          id: 5,
          patient_id: patientId,
          name: 'Extracción Tercera Molar',
          description: 'Extracción de muela del juicio inferior izquierda',
          tooth_number: 38,
          status: 'cancelled',
          priority: 'low',
          cost: 120,
          progress: 0,
          doctor_name: 'Martinez',
          estimated_duration: '20 min',
          created_at: '2024-01-18T16:00:00Z',
          scheduled_date: '2024-01-30T16:00:00Z',
          cancelled_at: '2024-01-28T10:00:00Z',
          notes: 'Cancelado por solicitud del paciente. Reprogramar cuando lo considere necesario.',
        },
        {
          id: 6,
          patient_id: patientId,
          name: 'Control y Pulido',
          description: 'Control postoperatorio y pulido de restauraciones',
          tooth_number: 'Múltiples',
          status: 'scheduled',
          priority: 'low',
          cost: 80,
          progress: 0,
          doctor_name: 'Martinez',
          estimated_duration: '20 min',
          created_at: '2024-01-25T09:00:00Z',
          scheduled_date: '2024-03-01T09:00:00Z',
          notes: 'Control de restauraciones previas. Ajuste de oclusión si es necesario.',
        },
        {
          id: 7,
          patient_id: patientId,
          name: 'Aplicación de Flúor',
          description: 'Aplicación tópica de fluoruro para prevención',
          tooth_number: 'Todos',
          status: 'completed',
          priority: 'low',
          cost: 50,
          progress: 100,
          doctor_name: 'Martinez',
          estimated_duration: '15 min',
          created_at: '2024-01-15T10:45:00Z',
          scheduled_date: '2024-01-15T10:45:00Z',
          completed_at: '2024-01-15T11:00:00Z',
          notes: 'Aplicación de barniz fluorado. Recomendar no comer por 2 horas.',
        },
        {
          id: 8,
          patient_id: patientId,
          name: 'Radiografía Periapical',
          description: 'Radiografía para evaluación de tratamiento endodóntico',
          tooth_number: 16,
          status: 'completed',
          priority: 'urgent',
          cost: 35,
          progress: 100,
          doctor_name: 'Martinez',
          estimated_duration: '10 min',
          created_at: '2024-01-25T13:45:00Z',
          scheduled_date: '2024-01-25T13:50:00Z',
          completed_at: '2024-01-25T14:00:00Z',
          notes: 'Imagen clara. Conductos bien conformados. Proceder con obturación.',
        },
      ];
    }
  },

  // Registrar nuevo procedimiento dental
  async createProcedure(patientId, procedureData) {
    try {
      const response = await api.post(`/dental/procedures/${patientId}`, {
        ...procedureData,
        performed_at: new Date().toISOString(),
      });
      return response.data;
    } catch (error) {
      console.error('Error creating procedure:', error);
      throw error;
    }
  },

  // Obtener radiografías dentales
  async getPatientRadiographs(patientId) {
    try {
      const response = await api.get(`/dental/radiographs/${patientId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching radiographs:', error);
      return [];
    }
  },

  // Subir radiografía
  async uploadRadiograph(patientId, formData) {
    try {
      const response = await api.post(`/dental/radiographs/${patientId}/upload`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      console.error('Error uploading radiograph:', error);
      throw error;
    }
  },

  // Obtener plan de tratamiento detallado
  async getTreatmentPlan(patientId) {
    try {
      const response = await api.get(`/dental/treatment-plan/${patientId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching treatment plan:', error);
      return null;
    }
  },

  // Crear plan de tratamiento
  async createTreatmentPlan(patientId, planData) {
    try {
      const response = await api.post(`/dental/treatment-plan/${patientId}`, planData);
      return response.data;
    } catch (error) {
      console.error('Error creating treatment plan:', error);
      throw error;
    }
  },

  // Obtener información de un diente específico
  async getToothInfo(patientId, toothNumber) {
    try {
      const response = await api.get(`/dental/tooth/${patientId}/${toothNumber}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching tooth info:', error);
      // Datos mock
      return {
        tooth_number: toothNumber,
        condition: 'healthy',
        last_examination: '2024-01-15',
        treatment_status: 'En seguimiento',
        notes: 'Control rutinario',
        procedures: [],
        next_appointment: null,
      };
    }
  },

  // Obtener estadísticas dentales del paciente
  async getPatientDentalStats(patientId) {
    try {
      const response = await api.get(`/dental/stats/${patientId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching dental stats:', error);
      return {
        total_teeth: 32,
        healthy_teeth: 24,
        treated_teeth: 6,
        missing_teeth: 2,
        active_treatments: 1,
        completed_treatments: 3,
        last_visit: '2024-01-15',
        next_appointment: '2024-01-29',
      };
    }
  },

  // Buscar pacientes con criterios dentales específicos
  async searchDentalPatients(searchTerm = '', filters = {}) {
    try {
      const params = new URLSearchParams({
        search: searchTerm,
        ...filters,
      });
      
      const response = await api.get(`/dental/patients?${params}`);
      return response.data;
    } catch (error) {
      console.error('Error searching dental patients:', error);
      // Datos mock
      return {
        results: [
          {
            id: 1,
            first_name: 'María',
            last_name: 'González',
            dni: '12345678',
            age: 35,
            phone: '987654321',
            last_dental_visit: '2024-01-15',
            active_treatments: 1,
            risk_level: 'low',
          },
          {
            id: 2,
            first_name: 'Carlos',
            last_name: 'Ruiz',
            dni: '87654321',
            age: 42,
            phone: '123456789',
            last_dental_visit: '2024-01-10',
            active_treatments: 0,
            risk_level: 'medium',
          },
          {
            id: 3,
            first_name: 'Ana',
            last_name: 'Torres',
            dni: '11223344',
            age: 28,
            phone: '555666777',
            last_dental_visit: '2024-01-20',
            active_treatments: 2,
            risk_level: 'high',
          },
        ],
        total: 3,
        page: 1,
        pages: 1,
      };
    }
  },

  // Generar reporte dental de un paciente
  async generateDentalReport(patientId, reportType = 'complete') {
    try {
      const response = await api.get(`/dental/reports/${patientId}`, {
        params: { type: reportType },
        responseType: 'blob', // Para descargar PDF
      });
      return response.data;
    } catch (error) {
      console.error('Error generating dental report:', error);
      throw error;
    }
  },

  // Obtener alertas dentales (recordatorios, seguimientos)
  async getDentalAlerts(patientId) {
    try {
      const response = await api.get(`/dental/alerts/${patientId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching dental alerts:', error);
      return [];
    }
  },

  // Programar recordatorio dental
  async scheduleReminder(patientId, reminderData) {
    try {
      const response = await api.post(`/dental/reminders/${patientId}`, reminderData);
      return response.data;
    } catch (error) {
      console.error('Error scheduling reminder:', error);
      throw error;
    }
  },

  // ========== GESTIÓN DE PLANES DE TRATAMIENTO ==========

  // Obtener estadísticas de planes de tratamiento
  async getTreatmentPlanStats() {
    try {
      const response = await api.get('/dental/treatment-plans/stats');
      return response.data;
    } catch (error) {
      console.error('Error fetching treatment plan stats:', error);
      // Datos mock
      return {
        total_plans: 45,
        active_plans: 28,
        completion_rate: 85,
        avg_cost: 2150,
        plans_this_month: 12,
        success_rate: 92,
      };
    }
  },

  // Obtener plan de tratamiento específico (actualizado)
  async getTreatmentPlan(patientId) {
    try {
      const response = await api.get(`/dental/treatment-plan/${patientId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching treatment plan:', error);
      // Datos mock más completos para TreatmentPlan.jsx
      return {
        id: 1,
        patient_id: patientId,
        name: 'Plan Integral de Rehabilitación Dental',
        status: 'in_progress',
        priority: 'high',
        doctor_name: 'Dr. Martinez',
        created_date: '2024-01-15',
        start_date: '2024-01-20',
        estimated_duration: 12, // semanas
        amount_paid: 800,
        notes: 'Paciente requiere tratamiento integral debido a múltiples caries y necesidad de endodoncia. Plan estructurado en fases para optimizar resultados y comodidad del paciente.',
        procedures: [
          {
            id: 1,
            name: 'Limpieza Dental Profunda',
            description: 'Profilaxis y eliminación de sarro supragingival',
            tooth_number: 'Todos',
            status: 'completed',
            priority: 'high',
            cost: 150,
            progress: 100,
            scheduled_date: '2024-01-20',
            completed_date: '2024-01-20',
            estimated_duration: '1 sesión',
            payment_status: 'Pagado'
          },
          {
            id: 2,
            name: 'Endodoncia',
            description: 'Tratamiento de conducto radicular en molar superior',
            tooth_number: 16,
            status: 'in_progress',
            priority: 'urgent',
            cost: 450,
            progress: 65,
            scheduled_date: '2024-01-25',
            estimated_duration: '3 sesiones',
            payment_status: 'Parcial'
          },
          {
            id: 3,
            name: 'Obturación Compuesta',
            description: 'Restauración con resina en premolar',
            tooth_number: 24,
            status: 'scheduled',
            priority: 'medium',
            cost: 180,
            progress: 0,
            scheduled_date: '2024-02-10',
            estimated_duration: '1 sesión',
            payment_status: 'Pendiente'
          },
          {
            id: 4,
            name: 'Corona de Porcelana',
            description: 'Corona en molar tratado con endodoncia',
            tooth_number: 16,
            status: 'pending',
            priority: 'high',
            cost: 680,
            progress: 0,
            scheduled_date: '2024-02-15',
            estimated_duration: '2 sesiones',
            payment_status: 'Pendiente'
          },
          {
            id: 5,
            name: 'Obturación Posterior',
            description: 'Restauración en molar inferior',
            tooth_number: 36,
            status: 'pending',
            priority: 'medium',
            cost: 200,
            progress: 0,
            scheduled_date: '2024-02-20',
            estimated_duration: '1 sesión',
            payment_status: 'Pendiente'
          },
          {
            id: 6,
            name: 'Control y Pulido',
            description: 'Control final y pulido de restauraciones',
            tooth_number: 'Múltiples',
            status: 'pending',
            priority: 'low',
            cost: 100,
            progress: 0,
            scheduled_date: '2024-03-01',
            estimated_duration: '1 sesión',
            payment_status: 'Pendiente'
          }
        ],
        total_cost: 1760,
        sessions_completed: 2,
        sessions_remaining: 6,
        next_appointment: '2024-01-29',
        last_updated: new Date().toISOString(),
      };
    }
  },

  // Crear nuevo plan de tratamiento (actualizado)
  async createTreatmentPlan(patientId, planData) {
    try {
      const response = await api.post(`/dental/treatment-plan/${patientId}`, {
        ...planData,
        created_date: new Date().toISOString(),
        status: 'draft',
      });
      return response.data;
    } catch (error) {
      console.error('Error creating treatment plan:', error);
      throw error;
    }
  },

  // Actualizar plan de tratamiento
  async updateTreatmentPlan(planId, planData) {
    try {
      const response = await api.put(`/dental/treatment-plan/update/${planId}`, {
        ...planData,
        updated_date: new Date().toISOString(),
      });
      return response.data;
    } catch (error) {
      console.error('Error updating treatment plan:', error);
      throw error;
    }
  },

  // Eliminar plan de tratamiento
  async deleteTreatmentPlan(planId) {
    try {
      const response = await api.delete(`/dental/treatment-plan/${planId}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting treatment plan:', error);
      throw error;
    }
  },

  // Agregar procedimiento al plan
  async addProcedureToPlan(planId, procedureData) {
    try {
      const response = await api.post(`/dental/treatment-plan/${planId}/procedures`, procedureData);
      return response.data;
    } catch (error) {
      console.error('Error adding procedure to plan:', error);
      throw error;
    }
  },

  // Actualizar procedimiento del plan
  async updatePlanProcedure(procedureId, procedureData) {
    try {
      const response = await api.put(`/dental/treatment-plan/procedures/${procedureId}`, {
        ...procedureData,
        updated_date: new Date().toISOString(),
      });
      return response.data;
    } catch (error) {
      console.error('Error updating plan procedure:', error);
      throw error;
    }
  },

  // Eliminar procedimiento del plan
  async removeProcedureFromPlan(procedureId) {
    try {
      const response = await api.delete(`/dental/treatment-plan/procedures/${procedureId}`);
      return response.data;
    } catch (error) {
      console.error('Error removing procedure from plan:', error);
      throw error;
    }
  },

  // Marcar procedimiento como completado
  async completeProcedure(procedureId, completionData = {}) {
    try {
      const response = await api.post(`/dental/treatment-plan/procedures/${procedureId}/complete`, {
        ...completionData,
        completed_date: new Date().toISOString(),
        status: 'completed',
        progress: 100,
      });
      return response.data;
    } catch (error) {
      console.error('Error completing procedure:', error);
      throw error;
    }
  },

  // Actualizar progreso de procedimiento
  async updateProcedureProgress(procedureId, progress, notes = '') {
    try {
      const response = await api.put(`/dental/treatment-plan/procedures/${procedureId}/progress`, {
        progress,
        notes,
        updated_date: new Date().toISOString(),
      });
      return response.data;
    } catch (error) {
      console.error('Error updating procedure progress:', error);
      throw error;
    }
  },

  // Programar procedimiento
  async scheduleProcedure(procedureId, scheduleData) {
    try {
      const response = await api.post(`/dental/treatment-plan/procedures/${procedureId}/schedule`, {
        ...scheduleData,
        status: 'scheduled',
        scheduled_date: scheduleData.date,
      });
      return response.data;
    } catch (error) {
      console.error('Error scheduling procedure:', error);
      throw error;
    }
  },

  // Obtener cronograma del plan
  async getTreatmentSchedule(planId) {
    try {
      const response = await api.get(`/dental/treatment-plan/${planId}/schedule`);
      return response.data;
    } catch (error) {
      console.error('Error fetching treatment schedule:', error);
      return [];
    }
  },

  // Obtener presupuesto detallado
  async getTreatmentBudget(planId) {
    try {
      const response = await api.get(`/dental/treatment-plan/${planId}/budget`);
      return response.data;
    } catch (error) {
      console.error('Error fetching treatment budget:', error);
      return {
        total_cost: 0,
        paid_amount: 0,
        pending_amount: 0,
        payment_plan: [],
        procedures_cost: [],
      };
    }
  },

  // Registrar pago
  async recordPayment(planId, paymentData) {
    try {
      const response = await api.post(`/dental/treatment-plan/${planId}/payments`, {
        ...paymentData,
        payment_date: new Date().toISOString(),
      });
      return response.data;
    } catch (error) {
      console.error('Error recording payment:', error);
      throw error;
    }
  },

  // Obtener historial de pagos
  async getPaymentHistory(planId) {
    try {
      const response = await api.get(`/dental/treatment-plan/${planId}/payments`);
      return response.data;
    } catch (error) {
      console.error('Error fetching payment history:', error);
      return [];
    }
  },

  // Generar reporte del plan de tratamiento
  async generateTreatmentPlanReport(planId, reportType = 'complete') {
    try {
      const response = await api.get(`/dental/treatment-plan/${planId}/report`, {
        params: { type: reportType },
        responseType: 'blob',
      });
      return response.data;
    } catch (error) {
      console.error('Error generating treatment plan report:', error);
      throw error;
    }
  },

  // Duplicar plan de tratamiento
  async duplicateTreatmentPlan(planId, newPatientId) {
    try {
      const response = await api.post(`/dental/treatment-plan/${planId}/duplicate`, {
        new_patient_id: newPatientId,
        created_date: new Date().toISOString(),
      });
      return response.data;
    } catch (error) {
      console.error('Error duplicating treatment plan:', error);
      throw error;
    }
  },

  // Obtener plantillas de planes de tratamiento
  async getTreatmentPlanTemplates() {
    try {
      const response = await api.get('/dental/treatment-plan/templates');
      return response.data;
    } catch (error) {
      console.error('Error fetching treatment plan templates:', error);
      // Datos mock
      return [
        {
          id: 1,
          name: 'Plan Básico de Limpieza',
          description: 'Profilaxis y tratamiento básico',
          procedures: ['Limpieza dental', 'Fluorización'],
          estimated_cost: 200,
          duration: 2,
        },
        {
          id: 2,
          name: 'Plan Integral de Rehabilitación',
          description: 'Tratamiento completo con endodoncia y prótesis',
          procedures: ['Limpieza', 'Endodoncia', 'Corona', 'Obturaciones'],
          estimated_cost: 1500,
          duration: 8,
        },
        {
          id: 3,
          name: 'Plan de Ortodoncia',
          description: 'Corrección de malposiciones dentales',
          procedures: ['Estudio ortodóncico', 'Brackets', 'Controles mensuales'],
          estimated_cost: 3000,
          duration: 24,
        },
      ];
    }
  },

  // Aplicar plantilla a paciente
  async applyTreatmentTemplate(templateId, patientId, customizations = {}) {
    try {
      const response = await api.post(`/dental/treatment-plan/templates/${templateId}/apply`, {
        patient_id: patientId,
        customizations,
        created_date: new Date().toISOString(),
      });
      return response.data;
    } catch (error) {
      console.error('Error applying treatment template:', error);
      throw error;
    }
  },

  // Obtener planes de tratamiento por rango de fechas
  async getTreatmentPlansByDateRange(startDate, endDate, filters = {}) {
    try {
      const params = {
        start_date: startDate,
        end_date: endDate,
        ...filters,
      };
      const response = await api.get('/dental/treatment-plans/range', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching treatment plans by date range:', error);
      return [];
    }
  },

  // Obtener métricas de rendimiento de planes
  async getTreatmentPlanMetrics(period = 'month') {
    try {
      const response = await api.get('/dental/treatment-plan/metrics', {
        params: { period },
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching treatment plan metrics:', error);
      return {
        total_plans: 0,
        completed_plans: 0,
        success_rate: 0,
        avg_completion_time: 0,
        revenue_generated: 0,
        patient_satisfaction: 0,
      };
    }
  },

  // ========== GESTIÓN DE PROCEDIMIENTOS DENTALES ==========

  // Obtener estadísticas de procedimientos dentales
  async getDentalProcedureStats() {
    try {
      const response = await api.get('/dental/procedures/stats');
      return response.data;
    } catch (error) {
      console.error('Error fetching dental procedure stats:', error);
      // Datos mock
      return {
        total_procedures: 156,
        active_procedures: 23,
        completed_today: 8,
        success_rate: 94,
        avg_duration: 45, // minutos
        procedures_this_week: 34,
        procedures_this_month: 142,
        completion_rate: 87,
      };
    }
  },

  // Actualizar procedimiento
  async updateProcedure(procedureId, procedureData) {
    try {
      const response = await api.put(`/dental/procedures/${procedureId}`, {
        ...procedureData,
        updated_at: new Date().toISOString(),
      });
      return response.data;
    } catch (error) {
      console.error('Error updating procedure:', error);
      throw error;
    }
  },

  // Obtener procedimientos por rango de fechas
  async getProceduresByDateRange(startDate, endDate, filters = {}) {
    try {
      const params = {
        start_date: startDate,
        end_date: endDate,
        ...filters,
      };
      const response = await api.get('/dental/procedures/range', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching procedures by date range:', error);
      return [];
    }
  },

  // Buscar procedimientos por criterios específicos
  async searchProcedures(searchTerm = '', filters = {}) {
    try {
      const params = new URLSearchParams({
        search: searchTerm,
        ...filters,
      });
      
      const response = await api.get(`/dental/procedures/search?${params}`);
      return response.data;
    } catch (error) {
      console.error('Error searching procedures:', error);
      return [];
    }
  },

  // Obtener procedimientos del día
  async getTodayProcedures() {
    try {
      const response = await api.get('/dental/procedures/today');
      return response.data;
    } catch (error) {
      console.error('Error fetching today procedures:', error);
      return [];
    }
  },

  // Obtener procedimientos urgentes
  async getUrgentProcedures() {
    try {
      const response = await api.get('/dental/procedures/urgent');
      return response.data;
    } catch (error) {
      console.error('Error fetching urgent procedures:', error);
      return [];
    }
  },

  // Generar reporte de procedimientos
  async generateProceduresReport(filters = {}, reportType = 'complete') {
    try {
      const response = await api.get('/dental/procedures/report', {
        params: { ...filters, type: reportType },
        responseType: 'blob',
      });
      return response.data;
    } catch (error) {
      console.error('Error generating procedures report:', error);
      throw error;
    }
  },

  // Actualizar múltiples procedimientos
  async updateMultipleProcedures(procedureIds, updateData) {
    try {
      const response = await api.put('/dental/procedures/bulk-update', {
        procedure_ids: procedureIds,
        update_data: updateData,
        updated_at: new Date().toISOString(),
      });
      return response.data;
    } catch (error) {
      console.error('Error updating multiple procedures:', error);
      throw error;
    }
  },

  // Cancelar procedimiento
  async cancelProcedure(procedureId, reason = '') {
    try {
      const response = await api.post(`/dental/procedures/${procedureId}/cancel`, {
        reason,
        cancelled_at: new Date().toISOString(),
        status: 'cancelled',
      });
      return response.data;
    } catch (error) {
      console.error('Error cancelling procedure:', error);
      throw error;
    }
  },

  // Reprogramar procedimiento
  async rescheduleProcedure(procedureId, newDateTime, reason = '') {
    try {
      const response = await api.post(`/dental/procedures/${procedureId}/reschedule`, {
        new_scheduled_date: newDateTime,
        reschedule_reason: reason,
        rescheduled_at: new Date().toISOString(),
      });
      return response.data;
    } catch (error) {
      console.error('Error rescheduling procedure:', error);
      throw error;
    }
  },

  // Obtener historial de un procedimiento específico
  async getProcedureHistory(procedureId) {
    try {
      const response = await api.get(`/dental/procedures/${procedureId}/history`);
      return response.data;
    } catch (error) {
      console.error('Error fetching procedure history:', error);
      return [];
    }
  },

  // Agregar nota a procedimiento
  async addProcedureNote(procedureId, note) {
    try {
      const response = await api.post(`/dental/procedures/${procedureId}/notes`, {
        note,
        created_at: new Date().toISOString(),
      });
      return response.data;
    } catch (error) {
      console.error('Error adding procedure note:', error);
      throw error;
    }
  },

  // Obtener plantillas de procedimientos
  async getProcedureTemplates() {
    try {
      const response = await api.get('/dental/procedures/templates');
      return response.data;
    } catch (error) {
      console.error('Error fetching procedure templates:', error);
      // Datos mock
      return [
        {
          id: 1,
          name: 'Limpieza Dental Estándar',
          description: 'Profilaxis dental completa con fluorización',
          estimated_duration: 30,
          default_cost: 150,
          category: 'preventive',
        },
        {
          id: 2,
          name: 'Endodoncia Molar',
          description: 'Tratamiento de conducto radicular en molar',
          estimated_duration: 90,
          default_cost: 450,
          category: 'endodontics',
        },
        {
          id: 3,
          name: 'Obturación Compuesta',
          description: 'Restauración con resina compuesta',
          estimated_duration: 45,
          default_cost: 180,
          category: 'restorative',
        },
        {
          id: 4,
          name: 'Extracción Simple',
          description: 'Extracción dental simple',
          estimated_duration: 20,
          default_cost: 100,
          category: 'surgery',
        },
        {
          id: 5,
          name: 'Corona de Porcelana',
          description: 'Corona completa de porcelana',
          estimated_duration: 60,
          default_cost: 680,
          category: 'prosthetics',
        },
      ];
    }
  },

  // Crear procedimiento desde plantilla
  async createProcedureFromTemplate(templateId, patientId, customizations = {}) {
    try {
      const response = await api.post(`/dental/procedures/from-template/${templateId}`, {
        patient_id: patientId,
        customizations,
        created_at: new Date().toISOString(),
      });
      return response.data;
    } catch (error) {
      console.error('Error creating procedure from template:', error);
      throw error;
    }
  },
};

export default dentalService;
