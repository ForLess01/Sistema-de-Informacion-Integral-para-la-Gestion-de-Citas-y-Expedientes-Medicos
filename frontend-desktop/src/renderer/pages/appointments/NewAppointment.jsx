import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { 
  Calendar, Clock, User, Stethoscope, Search, 
  Plus, Save, X, ArrowLeft, AlertCircle, CheckCircle
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { format, addDays, isBefore, startOfDay } from 'date-fns';
import { es } from 'date-fns/locale';
import appointmentService from '../../services/appointmentService';
import patientService from '../../services/patientService';

const NewAppointment = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  const [formData, setFormData] = useState({
    patient_id: '',
    doctor_id: '',
    specialty_id: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    time: '',
    reason: '',
    notes: '',
    priority: 'normal'
  });
  
  const [searchPatient, setSearchPatient] = useState('');
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [errors, setErrors] = useState({});
  const [availableSlots, setAvailableSlots] = useState([]);

  // Buscar pacientes
  const { data: patients, isLoading: loadingPatients } = useQuery({
    queryKey: ['patients', searchPatient],
    queryFn: () => patientService.searchPatients(searchPatient),
    enabled: searchPatient.length > 2,
  });

  // Obtener especialidades
  const { data: specialties } = useQuery({
    queryKey: ['specialties'],
    queryFn: appointmentService.getSpecialties,
  });

  // Obtener doctores por especialidad
  const { data: doctors } = useQuery({
    queryKey: ['doctors', formData.specialty_id],
    queryFn: () => appointmentService.getDoctorsBySpecialty(formData.specialty_id),
    enabled: !!formData.specialty_id,
  });

  // Obtener horarios disponibles
  const { data: timeSlots, refetch: refetchSlots } = useQuery({
    queryKey: ['available-slots', formData.doctor_id, formData.date],
    queryFn: () => appointmentService.getAvailableSlots({
      doctor_id: formData.doctor_id,
      date: formData.date
    }),
    enabled: !!(formData.doctor_id && formData.date),
  });

  // Crear cita
  const createAppointmentMutation = useMutation({
    mutationFn: appointmentService.createAppointment,
    onSuccess: () => {
      queryClient.invalidateQueries(['appointments']);
      queryClient.invalidateQueries(['dashboard-stats']);
      navigate('/appointments');
    },
    onError: (error) => {
      const errorData = error.response?.data;
      if (errorData) {
        setErrors(errorData);
      }
    },
  });

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Limpiar error del campo cuando el usuario empiece a escribir
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: null
      }));
    }
  };

  const handleSpecialtyChange = (specialtyId) => {
    setFormData(prev => ({
      ...prev,
      specialty_id: specialtyId,
      doctor_id: '', // Resetear doctor cuando cambie especialidad
      time: '' // Resetear tiempo
    }));
  };

  const handleDoctorChange = (doctorId) => {
    setFormData(prev => ({
      ...prev,
      doctor_id: doctorId,
      time: '' // Resetear tiempo cuando cambie doctor
    }));
  };

  const handlePatientSelect = (patient) => {
    setSelectedPatient(patient);
    setFormData(prev => ({
      ...prev,
      patient_id: patient.id
    }));
    setSearchPatient('');
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.patient_id) newErrors.patient_id = 'Debe seleccionar un paciente';
    if (!formData.specialty_id) newErrors.specialty_id = 'Debe seleccionar una especialidad';
    if (!formData.doctor_id) newErrors.doctor_id = 'Debe seleccionar un doctor';
    if (!formData.date) newErrors.date = 'Debe seleccionar una fecha';
    if (!formData.time) newErrors.time = 'Debe seleccionar una hora';
    if (!formData.reason?.trim()) newErrors.reason = 'Debe especificar el motivo de la consulta';
    
    // Validar que la fecha no sea en el pasado
    if (formData.date && isBefore(new Date(formData.date), startOfDay(new Date()))) {
      newErrors.date = 'La fecha no puede ser en el pasado';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    const appointmentData = {
      ...formData,
      datetime: `${formData.date}T${formData.time}:00`
    };
    
    createAppointmentMutation.mutate(appointmentData);
  };

  const minDate = format(new Date(), 'yyyy-MM-dd');
  const maxDate = format(addDays(new Date(), 90), 'yyyy-MM-dd'); // Hasta 3 meses adelante

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-800 to-indigo-900 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-8"
        >
          <div className="flex items-center">
            <Link 
              to="/appointments" 
              className="p-2 text-slate-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors mr-4"
            >
              <ArrowLeft className="h-6 w-6" />
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-white flex items-center">
                <Plus className="h-8 w-8 mr-3 text-blue-400" />
                Nueva Cita
              </h1>
              <p className="text-slate-200">Programar nueva cita médica</p>
            </div>
          </div>
        </motion.div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Selección de Paciente */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="backdrop-blur-lg bg-white/10 rounded-2xl p-6 border border-white/20"
          >
            <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
              <User className="h-5 w-5 mr-2 text-blue-400" />
              Seleccionar Paciente
            </h3>
            
            {selectedPatient ? (
              <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 flex items-center justify-center text-white font-semibold mr-4">
                      {selectedPatient.first_name?.charAt(0)}
                    </div>
                    <div>
                      <h4 className="text-white font-medium">
                        {selectedPatient.first_name} {selectedPatient.last_name}
                      </h4>
                      <p className="text-slate-300 text-sm">DNI: {selectedPatient.dni}</p>
                      <p className="text-slate-300 text-sm">Teléfono: {selectedPatient.phone}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedPatient(null);
                      setFormData(prev => ({ ...prev, patient_id: '' }));
                    }}
                    className="p-2 text-slate-400 hover:text-white hover:bg-red-500/10 rounded-lg transition-colors"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Buscar paciente por nombre o DNI..."
                  value={searchPatient}
                  onChange={(e) => setSearchPatient(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                
                {/* Resultados de búsqueda */}
                {searchPatient.length > 2 && patients && patients.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-slate-800 border border-slate-700 rounded-lg shadow-lg z-10 max-h-60 overflow-y-auto">
                    {patients.map((patient) => (
                      <button
                        key={patient.id}
                        type="button"
                        onClick={() => handlePatientSelect(patient)}
                        className="w-full px-4 py-3 text-left hover:bg-slate-700 border-b border-slate-700 last:border-b-0 transition-colors"
                      >
                        <div className="text-white font-medium">
                          {patient.first_name} {patient.last_name}
                        </div>
                        <div className="text-slate-400 text-sm">
                          DNI: {patient.dni} | Tel: {patient.phone}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
            
            {errors.patient_id && (
              <p className="mt-2 text-red-400 text-sm flex items-center">
                <AlertCircle className="h-4 w-4 mr-1" />
                {errors.patient_id}
              </p>
            )}
          </motion.div>

          {/* Especialidad y Doctor */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="backdrop-blur-lg bg-white/10 rounded-2xl p-6 border border-white/20"
          >
            <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
              <Stethoscope className="h-5 w-5 mr-2 text-blue-400" />
              Especialidad y Doctor
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Especialidad *
                </label>
                <select
                  value={formData.specialty_id}
                  onChange={(e) => handleSpecialtyChange(e.target.value)}
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Seleccionar especialidad</option>
                  {specialties?.map((specialty) => (
                    <option key={specialty.id} value={specialty.id}>
                      {specialty.name}
                    </option>
                  ))}
                </select>
                {errors.specialty_id && (
                  <p className="mt-1 text-red-400 text-sm">{errors.specialty_id}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Doctor *
                </label>
                <select
                  value={formData.doctor_id}
                  onChange={(e) => handleDoctorChange(e.target.value)}
                  disabled={!formData.specialty_id}
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <option value="">Seleccionar doctor</option>
                  {doctors?.map((doctor) => (
                    <option key={doctor.id} value={doctor.id}>
                      Dr. {doctor.first_name} {doctor.last_name}
                    </option>
                  ))}
                </select>
                {errors.doctor_id && (
                  <p className="mt-1 text-red-400 text-sm">{errors.doctor_id}</p>
                )}
              </div>
            </div>
          </motion.div>

          {/* Fecha y Hora */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="backdrop-blur-lg bg-white/10 rounded-2xl p-6 border border-white/20"
          >
            <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
              <Calendar className="h-5 w-5 mr-2 text-blue-400" />
              Fecha y Hora
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Fecha *
                </label>
                <input
                  type="date"
                  value={formData.date}
                  min={minDate}
                  max={maxDate}
                  onChange={(e) => handleInputChange('date', e.target.value)}
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                {errors.date && (
                  <p className="mt-1 text-red-400 text-sm">{errors.date}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Hora *
                </label>
                <select
                  value={formData.time}
                  onChange={(e) => handleInputChange('time', e.target.value)}
                  disabled={!formData.doctor_id || !formData.date}
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <option value="">Seleccionar hora</option>
                  {timeSlots?.map((slot) => (
                    <option key={slot.time} value={slot.time} disabled={!slot.available}>
                      {slot.time} {!slot.available && '(Ocupado)'}
                    </option>
                  ))}
                </select>
                {errors.time && (
                  <p className="mt-1 text-red-400 text-sm">{errors.time}</p>
                )}
              </div>
            </div>
          </motion.div>

          {/* Detalles de la Cita */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="backdrop-blur-lg bg-white/10 rounded-2xl p-6 border border-white/20"
          >
            <h3 className="text-xl font-semibold text-white mb-4">
              Detalles de la Cita
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Motivo de la consulta *
                </label>
                <textarea
                  value={formData.reason}
                  onChange={(e) => handleInputChange('reason', e.target.value)}
                  placeholder="Describa el motivo de la consulta..."
                  rows={3}
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                />
                {errors.reason && (
                  <p className="mt-1 text-red-400 text-sm">{errors.reason}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Prioridad
                </label>
                <select
                  value={formData.priority}
                  onChange={(e) => handleInputChange('priority', e.target.value)}
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="normal">Normal</option>
                  <option value="high">Alta</option>
                  <option value="urgent">Urgente</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Notas adicionales
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => handleInputChange('notes', e.target.value)}
                  placeholder="Información adicional (opcional)..."
                  rows={2}
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                />
              </div>
            </div>
          </motion.div>

          {/* Botones de Acción */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="flex justify-end space-x-4"
          >
            <Link to="/appointments">
              <button
                type="button"
                className="px-6 py-3 text-slate-300 hover:text-white border border-slate-600 hover:border-slate-500 rounded-xl transition duration-200"
              >
                Cancelar
              </button>
            </Link>
            <button
              type="submit"
              disabled={createAppointmentMutation.isLoading}
              className="px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-medium rounded-xl hover:from-blue-600 hover:to-indigo-700 transition duration-200 flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {createAppointmentMutation.isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Programando...
                </>
              ) : (
                <>
                  <Save className="h-5 w-5 mr-2" />
                  Programar Cita
                </>
              )}
            </button>
          </motion.div>
        </form>
      </div>
    </div>
  );
};

export default NewAppointment;
