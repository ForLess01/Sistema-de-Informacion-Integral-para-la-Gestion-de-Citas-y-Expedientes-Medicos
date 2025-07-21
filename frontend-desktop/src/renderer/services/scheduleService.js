import api from './api';

// Obtener horarios con filtros
export const getSchedules = async (params = {}) => {
  const response = await api.get('/schedules/', { params });
  return response.data;
};

// Obtener horarios de un doctor específico
export const getDoctorSchedule = async (doctorId, params = {}) => {
  const response = await api.get(`/schedules/doctor/${doctorId}/`, { params });
  return response.data;
};

// Obtener disponibilidad de un doctor
export const getDoctorAvailability = async (doctorId, date) => {
  const response = await api.get(`/schedules/doctor/${doctorId}/availability/`, {
    params: { date }
  });
  return response.data;
};

// Crear nuevo horario
export const createSchedule = async (scheduleData) => {
  const response = await api.post('/schedules/', scheduleData);
  return response.data;
};

// Actualizar horario
export const updateSchedule = async (scheduleId, scheduleData) => {
  const response = await api.put(`/schedules/${scheduleId}/`, scheduleData);
  return response.data;
};

// Eliminar horario
export const deleteSchedule = async (scheduleId) => {
  const response = await api.delete(`/schedules/${scheduleId}/`);
  return response.data;
};

// Duplicar horario
export const duplicateSchedule = async (scheduleId, targetDate) => {
  const response = await api.post(`/schedules/${scheduleId}/duplicate/`, {
    target_date: targetDate
  });
  return response.data;
};

// Crear horario recurrente
export const createRecurringSchedule = async (scheduleData) => {
  const response = await api.post('/schedules/recurring/', scheduleData);
  return response.data;
};

// Obtener plantillas de horario
export const getScheduleTemplates = async () => {
  const response = await api.get('/schedules/templates/');
  return response.data;
};

// Crear plantilla de horario
export const createScheduleTemplate = async (templateData) => {
  const response = await api.post('/schedules/templates/', templateData);
  return response.data;
};

// Aplicar plantilla a fecha
export const applyScheduleTemplate = async (templateId, targetDate, doctorId) => {
  const response = await api.post(`/schedules/templates/${templateId}/apply/`, {
    target_date: targetDate,
    doctor_id: doctorId
  });
  return response.data;
};

// Obtener conflictos de horario
export const getScheduleConflicts = async (params = {}) => {
  const response = await api.get('/schedules/conflicts/', { params });
  return response.data;
};

// Resolver conflicto de horario
export const resolveScheduleConflict = async (conflictId, resolution) => {
  const response = await api.patch(`/schedules/conflicts/${conflictId}/resolve/`, {
    resolution
  });
  return response.data;
};

// Obtener horarios por rango de fechas
export const getSchedulesByDateRange = async (startDate, endDate, params = {}) => {
  const response = await api.get('/schedules/date-range/', {
    params: {
      start_date: startDate,
      end_date: endDate,
      ...params
    }
  });
  return response.data;
};

// Obtener estadísticas de horarios
export const getScheduleStats = async (params = {}) => {
  const response = await api.get('/schedules/stats/', { params });
  return response.data;
};

// Bloquear tiempo (vacaciones, ausencias)
export const createTimeBlock = async (blockData) => {
  const response = await api.post('/schedules/time-blocks/', blockData);
  return response.data;
};

// Obtener bloques de tiempo
export const getTimeBlocks = async (params = {}) => {
  const response = await api.get('/schedules/time-blocks/', { params });
  return response.data;
};

// Eliminar bloque de tiempo
export const deleteTimeBlock = async (blockId) => {
  const response = await api.delete(`/schedules/time-blocks/${blockId}/`);
  return response.data;
};

// Obtener slots de tiempo disponibles
export const getAvailableTimeSlots = async (doctorId, date, duration = 30) => {
  const response = await api.get('/schedules/available-slots/', {
    params: {
      doctor_id: doctorId,
      date,
      duration
    }
  });
  return response.data;
};

// Obtener horarios de múltiples doctores
export const getMultipleDoctorsSchedule = async (doctorIds, startDate, endDate) => {
  const response = await api.get('/schedules/multiple-doctors/', {
    params: {
      doctor_ids: doctorIds.join(','),
      start_date: startDate,
      end_date: endDate
    }
  });
  return response.data;
};

// Intercambiar horarios entre doctores
export const swapSchedules = async (schedule1Id, schedule2Id) => {
  const response = await api.post('/schedules/swap/', {
    schedule1_id: schedule1Id,
    schedule2_id: schedule2Id
  });
  return response.data;
};

// Obtener doctores disponibles
export const getAvailableDoctors = async () => {
  const response = await api.get('/schedules/available-doctors/');
  return response.data;
};

// Obtener especialidades para horarios
export const getScheduleSpecialties = async () => {
  const response = await api.get('/schedules/specialties/');
  return response.data;
};

// Validar horario antes de crear
export const validateSchedule = async (scheduleData) => {
  const response = await api.post('/schedules/validate/', scheduleData);
  return response.data;
};

// Obtener configuración de horarios
export const getScheduleSettings = async () => {
  const response = await api.get('/schedules/settings/');
  return response.data;
};

// Actualizar configuración de horarios
export const updateScheduleSettings = async (settings) => {
  const response = await api.put('/schedules/settings/', settings);
  return response.data;
};

// Exportar horarios
export const exportSchedules = async (params = {}) => {
  const response = await api.get('/schedules/export/', {
    params,
    responseType: 'blob'
  });
  return response.data;
};

// Importar horarios
export const importSchedules = async (file) => {
  const formData = new FormData();
  formData.append('schedule_file', file);
  const response = await api.post('/schedules/import/', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });
  return response.data;
};

export default {
  getSchedules,
  getDoctorSchedule,
  getDoctorAvailability,
  createSchedule,
  updateSchedule,
  deleteSchedule,
  duplicateSchedule,
  createRecurringSchedule,
  getScheduleTemplates,
  createScheduleTemplate,
  applyScheduleTemplate,
  getScheduleConflicts,
  resolveScheduleConflict,
  getSchedulesByDateRange,
  getScheduleStats,
  createTimeBlock,
  getTimeBlocks,
  deleteTimeBlock,
  getAvailableTimeSlots,
  getMultipleDoctorsSchedule,
  swapSchedules,
  getAvailableDoctors,
  getScheduleSpecialties,
  validateSchedule,
  getScheduleSettings,
  updateScheduleSettings,
  exportSchedules,
  importSchedules
};
