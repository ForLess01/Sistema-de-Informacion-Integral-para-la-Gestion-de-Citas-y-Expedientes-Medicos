import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { 
  Calendar, Clock, User, Stethoscope, FileText, 
  AlertCircle, Edit3, Save, X, ArrowLeft, Activity,
  Heart, Thermometer, Clipboard,
  UserCheck, Phone, Mail
} from 'lucide-react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { format, isValid } from 'date-fns';
import { es } from 'date-fns/locale';
import medicalRecordService from '../../services/medicalRecordService';

const ConsultationDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [editableData, setEditableData] = useState({});

  // Obtener detalles de la consulta médica
  const { data: consultation, isLoading, isError } = useQuery({
    queryKey: ['consultationDetail', id],
    queryFn: () => medicalRecordService.getConsultationDetail(id),
  });

  // Actualizar consulta
  const updateConsultationMutation = useMutation({
    mutationFn: medicalRecordService.updateConsultation,
    onSuccess: () => {
      queryClient.invalidateQueries(['consultationDetail', id]);
      setIsEditing(false);
    },
    onError: (error) => {
      console.error('Error updating consultation:', error);
    },
  });

  const handleEditToggle = () => {
    setIsEditing((prev) => !prev);
    setEditableData({
      notes: consultation?.notes || '',
      diagnosis: consultation?.diagnosis || '',
      treatment: consultation?.treatment || '',
    });
  };

  const handleInputChange = (field, value) => {
    setEditableData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSaveChanges = () => {
    updateConsultationMutation.mutate({
      id,
      data: editableData,
    });
  };

  const statusLabels = {
    'pending': 'Pendiente',
    'in_progress': 'En Progreso', 
    'completed': 'Completada',
    'cancelled': 'Cancelada',
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30';
      case 'in_progress':
        return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
      case 'completed':
        return 'bg-green-500/20 text-green-300 border-green-500/30';
      case 'cancelled':
        return 'bg-red-500/20 text-red-300 border-red-500/30';
      default:
        return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Fecha no disponible';
    const date = new Date(dateString);
    return isValid(date) ? format(date, "d 'de' MMMM, yyyy", { locale: es }) : 'Fecha no disponible';
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-6 flex items-center justify-center">
        <div className="text-white">Cargando detalles de la consulta...</div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-6 flex items-center justify-center">
        <div className="backdrop-blur-lg bg-red-500/10 rounded-2xl p-6 border border-red-500/20">
          <div className="flex items-center space-x-3">
            <AlertCircle className="h-6 w-6 text-red-400" />
            <p className="text-red-300">Error al cargar los detalles de la consulta</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-8"
        >
          <div className="flex items-center">
            <Link 
              to="/consultations" 
              className="p-2 text-slate-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors mr-4"
            >
              <ArrowLeft className="h-6 w-6" />
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-white">Detalles de la Consulta</h1>
              <p className="text-slate-200">Información completa de la consulta médica</p>
            </div>
          </div>
          <button 
            onClick={handleEditToggle} 
            className="bg-white/10 text-white px-4 py-2 rounded-lg hover:bg-white/20 transition-colors flex items-center"
          >
            {isEditing ? (
              <>
                <X className="h-5 w-5 mr-2" />
                Cancelar
              </>
            ) : (
              <>
                <Edit3 className="h-5 w-5 mr-2" />
                Editar
              </>
            )}
          </button>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Información del Paciente */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="backdrop-blur-lg bg-white/10 rounded-2xl p-6 border border-white/20"
          >
            <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
              <User className="h-5 w-5 mr-2 text-blue-400" />
              Información del Paciente
            </h3>
            <div className="space-y-3">
              <div>
                <p className="text-slate-400 text-sm">Nombre Completo</p>
                <p className="text-white font-medium">{consultation?.patient_name || 'No disponible'}</p>
              </div>
              <div>
                <p className="text-slate-400 text-sm">DNI</p>
                <p className="text-white">{consultation?.patient_dni || 'No disponible'}</p>
              </div>
              <div>
                <p className="text-slate-400 text-sm">Edad</p>
                <p className="text-white">{consultation?.patient_age || 'No disponible'} años</p>
              </div>
              {consultation?.patient_phone && (
                <div>
                  <p className="text-slate-400 text-sm">Teléfono</p>
                  <p className="text-white flex items-center">
                    <Phone className="h-4 w-4 mr-1 text-green-400" />
                    {consultation.patient_phone}
                  </p>
                </div>
              )}
              {consultation?.patient_email && (
                <div>
                  <p className="text-slate-400 text-sm">Email</p>
                  <p className="text-white flex items-center">
                    <Mail className="h-4 w-4 mr-1 text-blue-400" />
                    {consultation.patient_email}
                  </p>
                </div>
              )}
            </div>
          </motion.div>

          {/* Información de la Cita */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="backdrop-blur-lg bg-white/10 rounded-2xl p-6 border border-white/20"
          >
            <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
              <Calendar className="h-5 w-5 mr-2 text-green-400" />
              Información de la Cita
            </h3>
            <div className="space-y-3">
              <div>
                <p className="text-slate-400 text-sm">Fecha</p>
                <p className="text-white">{formatDate(consultation?.appointment_date)}</p>
              </div>
              <div>
                <p className="text-slate-400 text-sm">Hora</p>
                <p className="text-white flex items-center">
                  <Clock className="h-4 w-4 mr-1 text-green-400" />
                  {consultation?.appointment_time || 'No disponible'}
                </p>
              </div>
              <div>
                <p className="text-slate-400 text-sm">Doctor</p>
                <p className="text-white flex items-center">
                  <UserCheck className="h-4 w-4 mr-1 text-blue-400" />
                  Dr. {consultation?.doctor_name || 'No asignado'}
                </p>
              </div>
              <div>
                <p className="text-slate-400 text-sm">Especialidad</p>
                <p className="text-white flex items-center">
                  <Stethoscope className="h-4 w-4 mr-1 text-purple-400" />
                  {consultation?.specialty || 'Medicina General'}
                </p>
              </div>
              <div>
                <p className="text-slate-400 text-sm">Estado</p>
                <span className={`inline-flex px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(consultation?.status)}`}>
                  {statusLabels[consultation?.status] || consultation?.status}
                </span>
              </div>
            </div>
          </motion.div>

          {/* Signos Vitales */}
          {consultation?.vital_signs && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="backdrop-blur-lg bg-white/10 rounded-2xl p-6 border border-white/20"
            >
              <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
                <Activity className="h-5 w-5 mr-2 text-red-400" />
                Signos Vitales
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white/5 rounded-lg p-3">
                  <div className="flex items-center mb-1">
                    <Heart className="h-4 w-4 mr-1 text-red-400" />
                    <span className="text-slate-400 text-xs">FC</span>
                  </div>
                  <p className="text-white font-medium">{consultation.vital_signs.heart_rate} bpm</p>
                </div>
                <div className="bg-white/5 rounded-lg p-3">
                  <div className="flex items-center mb-1">
                    <Activity className="h-4 w-4 mr-1 text-blue-400" />
                    <span className="text-slate-400 text-xs">PA</span>
                  </div>
                  <p className="text-white font-medium">{consultation.vital_signs.blood_pressure}</p>
                </div>
                <div className="bg-white/5 rounded-lg p-3">
                  <div className="flex items-center mb-1">
                    <Thermometer className="h-4 w-4 mr-1 text-orange-400" />
                    <span className="text-slate-400 text-xs">Temp</span>
                  </div>
                  <p className="text-white font-medium">{consultation.vital_signs.temperature}°C</p>
                </div>
                <div className="bg-white/5 rounded-lg p-3">
                  <div className="flex items-center mb-1">
                    <Activity className="h-4 w-4 mr-1 text-green-400" />
                    <span className="text-slate-400 text-xs">SpO₂</span>
                  </div>
                  <p className="text-white font-medium">{consultation.vital_signs.oxygen_saturation}%</p>
                </div>
              </div>
            </motion.div>
          )}
        </div>

        {/* Detalles Médicos */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="backdrop-blur-lg bg-white/10 rounded-2xl p-6 border border-white/20 mt-6"
        >
          <h3 className="text-xl font-semibold text-white mb-6 flex items-center">
            <Clipboard className="h-5 w-5 mr-2 text-green-400" />
            Detalles de la Consulta
          </h3>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Motivo de Consulta */}
            <div>
              <h4 className="text-lg font-medium text-white mb-3">Motivo de Consulta</h4>
              <div className="bg-white/5 rounded-lg p-4">
                <p className="text-slate-300">
                  {consultation?.chief_complaint || 'No especificado'}
                </p>
              </div>
            </div>

            {/* Diagnóstico */}
            <div>
              <h4 className="text-lg font-medium text-white mb-3">Diagnóstico</h4>
              {isEditing ? (
                <textarea
                  value={editableData.diagnosis}
                  onChange={(e) => handleInputChange('diagnosis', e.target.value)}
                  className="w-full px-3 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  rows="4"
                  placeholder="Ingrese el diagnóstico..."
                />
              ) : (
                <div className="bg-white/5 rounded-lg p-4">
                  <p className="text-slate-300">
                    {consultation?.diagnosis || 'Sin diagnóstico registrado'}
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="mt-6">
            <h4 className="text-lg font-medium text-white mb-3">Tratamiento</h4>
            {isEditing ? (
              <textarea
                value={editableData.treatment}
                onChange={(e) => handleInputChange('treatment', e.target.value)}
                className="w-full px-3 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                rows="4"
                placeholder="Ingrese el tratamiento..."
              />
            ) : (
              <div className="bg-white/5 rounded-lg p-4">
                <p className="text-slate-300">
                  {consultation?.treatment || 'Sin tratamiento especificado'}
                </p>
              </div>
            )}
          </div>

          <div className="mt-6">
            <h4 className="text-lg font-medium text-white mb-3">Notas Adicionales</h4>
            {isEditing ? (
              <textarea
                value={editableData.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                className="w-full px-3 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                rows="3"
                placeholder="Notas adicionales..."
              />
            ) : (
              <div className="bg-white/5 rounded-lg p-4">
                <p className="text-slate-300">
                  {consultation?.notes || 'Sin notas adicionales'}
                </p>
              </div>
            )}
          </div>

          {/* Botones de acción para edición */}
          {isEditing && (
            <div className="flex justify-end mt-6 space-x-3">
              <button 
                onClick={() => setIsEditing(false)}
                className="px-4 py-2 text-slate-300 hover:text-white border border-slate-600 hover:border-slate-500 rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button 
                onClick={handleSaveChanges}
                disabled={updateConsultationMutation.isLoading}
                className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition-colors flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {updateConsultationMutation.isLoading ? (
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
      </div>
    </div>
  );
};

export default ConsultationDetail;
