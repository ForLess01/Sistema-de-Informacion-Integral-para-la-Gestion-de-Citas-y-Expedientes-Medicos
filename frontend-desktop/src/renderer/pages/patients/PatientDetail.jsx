import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { 
  User, Edit3, Save, X, ArrowLeft, AlertCircle, 
  Phone, Mail, MapPin, Calendar, Activity, 
  Heart, FileText, Clock, Plus, Eye
} from 'lucide-react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { format, differenceInYears } from 'date-fns';
import { es } from 'date-fns/locale';
import patientService from '../../services/patientService';

const PatientDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [editableData, setEditableData] = useState({});
  const [errors, setErrors] = useState({});

  // Obtener detalles del paciente
  const { data: patient, isLoading, isError } = useQuery({
    queryKey: ['patientDetail', id],
    queryFn: () => patientService.getPatientDetail(id),
  });

  // Obtener historial médico del paciente
  const { data: medicalHistory, isLoading: loadingHistory } = useQuery({
    queryKey: ['patientMedicalHistory', id],
    queryFn: () => patientService.getPatientMedicalHistory(id),
  });

  // Obtener citas del paciente
  const { data: patientAppointments, isLoading: loadingAppointments } = useQuery({
    queryKey: ['patientAppointments', id],
    queryFn: () => patientService.getPatientAppointments(id),
  });

  // Actualizar paciente
  const updatePatientMutation = useMutation({
    mutationFn: ({ id, data }) => patientService.updatePatient(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['patientDetail', id]);
      queryClient.invalidateQueries(['patients']);
      setIsEditing(false);
      setErrors({});
    },
    onError: (error) => {
      const errorData = error.response?.data;
      if (errorData) {
        setErrors(errorData);
      }
    },
  });

  const handleEditToggle = () => {
    if (isEditing) {
      setIsEditing(false);
      setErrors({});
      return;
    }
    
    setIsEditing(true);
    setEditableData({
      first_name: patient?.first_name || '',
      last_name: patient?.last_name || '',
      phone: patient?.phone || '',
      email: patient?.email || '',
      address: patient?.address || '',
      emergency_contact_name: patient?.emergency_contact_name || '',
      emergency_contact_phone: patient?.emergency_contact_phone || '',
      allergies: patient?.allergies || '',
      chronic_conditions: patient?.chronic_conditions || '',
      insurance_provider: patient?.insurance_provider || '',
      insurance_number: patient?.insurance_number || '',
    });
  };

  const handleInputChange = (field, value) => {
    setEditableData(prev => ({
      ...prev,
      [field]: value
    }));
    
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: null
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!editableData.first_name?.trim()) newErrors.first_name = 'El nombre es requerido';
    if (!editableData.last_name?.trim()) newErrors.last_name = 'El apellido es requerido';
    if (!editableData.phone?.trim()) newErrors.phone = 'El teléfono es requerido';
    
    // Validar formato de email si se proporciona
    if (editableData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(editableData.email)) {
      newErrors.email = 'El formato del email no es válido';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSaveChanges = () => {
    if (!validateForm()) {
      return;
    }
    
    updatePatientMutation.mutate({
      id,
      data: editableData
    });
  };

  const getAge = (birthDate) => {
    if (!birthDate) return 'N/A';
    return differenceInYears(new Date(), new Date(birthDate));
  };

  const genderLabels = {
    'M': 'Masculino',
    'F': 'Femenino',
    'O': 'Otro'
  };

  if (isLoading) return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-800 to-indigo-900 flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
    </div>
  );

  if (isError) return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-800 to-indigo-900 flex items-center justify-center">
      <div className="text-center">
        <AlertCircle className="h-16 w-16 text-red-400 mx-auto mb-4" />
        <h3 className="text-xl font-medium text-white mb-2">Error al cargar el paciente</h3>
        <p className="text-slate-400">No se pudo encontrar la información del paciente.</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-800 to-indigo-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-8"
        >
          <div className="flex items-center">
            <Link 
              to="/patients" 
              className="p-2 text-slate-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors mr-4"
            >
              <ArrowLeft className="h-6 w-6" />
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-white">
                {patient?.first_name} {patient?.last_name}
              </h1>
              <p className="text-slate-200">DNI: {patient?.dni}</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <Link to={`/appointments/new?patient=${id}`}>
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center">
                <Plus className="h-4 w-4 mr-2" />
                Nueva Cita
              </button>
            </Link>
            <button 
              onClick={handleEditToggle} 
              className="px-4 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors flex items-center border border-white/20"
            >
              {isEditing ? (
                <>
                  <X className="h-4 w-4 mr-2" />
                  Cancelar
                </>
              ) : (
                <>
                  <Edit3 className="h-4 w-4 mr-2" />
                  Editar
                </>
              )}
            </button>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Información Personal */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="lg:col-span-2 backdrop-blur-lg bg-white/10 rounded-2xl p-6 border border-white/20"
          >
            <h3 className="text-xl font-semibold text-white mb-6 flex items-center">
              <User className="h-5 w-5 mr-2 text-green-400" />
              Información Personal
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-white mb-2">Nombres</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={editableData.first_name}
                    onChange={(e) => handleInputChange('first_name', e.target.value)}
                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                ) : (
                  <p className="text-slate-200">{patient?.first_name}</p>
                )}
                {errors.first_name && (
                  <p className="mt-1 text-red-400 text-sm">{errors.first_name}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-2">Apellidos</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={editableData.last_name}
                    onChange={(e) => handleInputChange('last_name', e.target.value)}
                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                ) : (
                  <p className="text-slate-200">{patient?.last_name}</p>
                )}
                {errors.last_name && (
                  <p className="mt-1 text-red-400 text-sm">{errors.last_name}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-2">DNI</label>
                <p className="text-slate-200">{patient?.dni}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-2">Edad</label>
                <p className="text-slate-200">{getAge(patient?.date_of_birth)} años</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-2">Fecha de Nacimiento</label>
                <p className="text-slate-200">
                  {patient?.date_of_birth ? format(new Date(patient.date_of_birth), 'dd/MM/yyyy') : 'N/D'}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-2">Género</label>
                <p className="text-slate-200">{genderLabels[patient?.gender] || 'N/E'}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-2">Tipo de Sangre</label>
                <p className="text-slate-200">{patient?.blood_type || 'N/D'}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-2">Teléfono</label>
                {isEditing ? (
                  <input
                    type="tel"
                    value={editableData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                ) : (
                  <p className="text-slate-200 flex items-center">
                    <Phone className="h-4 w-4 mr-2 text-green-400" />
                    {patient?.phone || 'N/D'}
                  </p>
                )}
                {errors.phone && (
                  <p className="mt-1 text-red-400 text-sm">{errors.phone}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-2">Email</label>
                {isEditing ? (
                  <input
                    type="email"
                    value={editableData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                ) : (
                  <p className="text-slate-200 flex items-center">
                    <Mail className="h-4 w-4 mr-2 text-green-400" />
                    {patient?.email || 'N/D'}
                  </p>
                )}
                {errors.email && (
                  <p className="mt-1 text-red-400 text-sm">{errors.email}</p>
                )}
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-white mb-2">Dirección</label>
                {isEditing ? (
                  <textarea
                    value={editableData.address}
                    onChange={(e) => handleInputChange('address', e.target.value)}
                    rows={2}
                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
                  />
                ) : (
                  <p className="text-slate-200 flex items-start">
                    <MapPin className="h-4 w-4 mr-2 text-green-400 mt-0.5" />
                    {patient?.address || 'N/D'}
                  </p>
                )}
              </div>
            </div>

            {isEditing && (
              <div className="flex justify-end mt-6">
                <button 
                  onClick={handleSaveChanges}
                  disabled={updatePatientMutation.isLoading}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center disabled:opacity-50"
                >
                  {updatePatientMutation.isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Guardando...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Guardar Cambios
                    </>
                  )}
                </button>
              </div>
            )}
          </motion.div>

          {/* Contacto de Emergencia e Información Médica */}
          <div className="space-y-6">
            {/* Contacto de Emergencia */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="backdrop-blur-lg bg-white/10 rounded-2xl p-6 border border-white/20"
            >
              <h3 className="text-lg font-semibold text-white mb-4">Contacto de Emergencia</h3>
              
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-white mb-1">Nombre</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={editableData.emergency_contact_name}
                      onChange={(e) => handleInputChange('emergency_contact_name', e.target.value)}
                      className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  ) : (
                    <p className="text-slate-200">{patient?.emergency_contact_name || 'N/D'}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-white mb-1">Teléfono</label>
                  {isEditing ? (
                    <input
                      type="tel"
                      value={editableData.emergency_contact_phone}
                      onChange={(e) => handleInputChange('emergency_contact_phone', e.target.value)}
                      className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  ) : (
                    <p className="text-slate-200">{patient?.emergency_contact_phone || 'N/D'}</p>
                  )}
                </div>
              </div>
            </motion.div>

            {/* Información Médica */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="backdrop-blur-lg bg-white/10 rounded-2xl p-6 border border-white/20"
            >
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                <Heart className="h-5 w-5 mr-2 text-red-400" />
                Información Médica
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-white mb-2">Alergias</label>
                  {isEditing ? (
                    <textarea
                      value={editableData.allergies}
                      onChange={(e) => handleInputChange('allergies', e.target.value)}
                      rows={2}
                      className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
                    />
                  ) : (
                    <p className="text-slate-200 text-sm">{patient?.allergies || 'Ninguna registrada'}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-white mb-2">Condiciones Crónicas</label>
                  {isEditing ? (
                    <textarea
                      value={editableData.chronic_conditions}
                      onChange={(e) => handleInputChange('chronic_conditions', e.target.value)}
                      rows={2}
                      className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
                    />
                  ) : (
                    <p className="text-slate-200 text-sm">{patient?.chronic_conditions || 'Ninguna registrada'}</p>
                  )}
                </div>
              </div>
            </motion.div>

            {/* Información de Seguro */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="backdrop-blur-lg bg-white/10 rounded-2xl p-6 border border-white/20"
            >
              <h3 className="text-lg font-semibold text-white mb-4">Información de Seguro</h3>
              
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-white mb-1">Proveedor</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={editableData.insurance_provider}
                      onChange={(e) => handleInputChange('insurance_provider', e.target.value)}
                      className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  ) : (
                    <p className="text-slate-200">{patient?.insurance_provider || 'N/D'}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-white mb-1">Número de Póliza</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={editableData.insurance_number}
                      onChange={(e) => handleInputChange('insurance_number', e.target.value)}
                      className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  ) : (
                    <p className="text-slate-200">{patient?.insurance_number || 'N/D'}</p>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Historial de Citas */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-6 backdrop-blur-lg bg-white/10 rounded-2xl p-6 border border-white/20"
        >
          <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
            <Calendar className="h-5 w-5 mr-2 text-blue-400" />
            Historial de Citas
          </h3>

          {loadingAppointments ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
            </div>
          ) : patientAppointments?.length === 0 ? (
            <p className="text-slate-400 text-center py-8">No hay citas registradas</p>
          ) : (
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {patientAppointments?.map((appointment) => (
                <div
                  key={appointment.id}
                  className="bg-white/5 rounded-xl p-4 border border-white/10 hover:bg-white/10 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-white font-medium">{appointment.specialty_name || appointment.reason || 'Consulta'}</h4>
                      <p className="text-slate-300 text-sm">Dr. {appointment.doctor_name || 'Por asignar'}</p>
                      <p className="text-slate-400 text-sm">
                        {appointment.appointment_date && appointment.appointment_time ? 
                          `${format(new Date(appointment.appointment_date), 'dd/MM/yyyy', { locale: es })} ${appointment.appointment_time}` :
                          appointment.datetime ? format(new Date(appointment.datetime), 'dd/MM/yyyy HH:mm', { locale: es }) : 
                          'Fecha no disponible'
                        }
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        appointment.status === 'completed' ? 'bg-green-500/20 text-green-300' :
                        appointment.status === 'confirmed' ? 'bg-blue-500/20 text-blue-300' :
                        appointment.status === 'cancelled' ? 'bg-red-500/20 text-red-300' :
                        'bg-yellow-500/20 text-yellow-300'
                      }`}>
                        {appointment.status === 'completed' ? 'Completada' :
                         appointment.status === 'confirmed' ? 'Confirmada' :
                         appointment.status === 'cancelled' ? 'Cancelada' :
                         'Pendiente'}
                      </span>
                      <Link to={`/appointments/${appointment.id}`}>
                        <button className="p-1 text-blue-400 hover:text-blue-300">
                          <Eye className="h-4 w-4" />
                        </button>
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default PatientDetail;
