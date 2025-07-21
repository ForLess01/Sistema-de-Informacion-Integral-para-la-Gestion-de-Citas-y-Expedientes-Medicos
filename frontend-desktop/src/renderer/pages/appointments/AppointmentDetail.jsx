import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { 
  Calendar, Clock, User, Stethoscope, FileText, 
  AlertCircle, Edit3, Save, X, ArrowLeft
} from 'lucide-react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import appointmentService from '../../services/appointmentService';

const AppointmentDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [editableData, setEditableData] = useState({});

  // Obtener detalles de la cita
  const { data: appointment, isLoading, isError } = useQuery({
    queryKey: ['appointmentDetail', id],
    queryFn: () => appointmentService.getAppointmentDetail(id),
  });

  // Actualizar cita
  const updateAppointmentMutation = useMutation({
    mutationFn: appointmentService.updateAppointment,
    onSuccess: () => {
      queryClient.invalidateQueries(['appointmentDetail', id]);
      setIsEditing(false);
    },
    onError: (error) => {
      console.error('Error updating appointment:', error);
    },
  });

  const handleEditToggle = () => {
    setIsEditing((prev) => !prev);
    setEditableData({
      notes: appointment?.notes || '',
    });
  };

  const handleInputChange = (field, value) => {
    setEditableData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSaveChanges = () => {
    updateAppointmentMutation.mutate({
      id,
      data: editableData,
    });
  };

  const statusLabels = {
    'pending': 'Pendiente',
    'confirmed': 'Confirmada',
    'in_progress': 'En Progreso',
    'completed': 'Completada',
    'cancelled': 'Cancelada',
    'no_show': 'No se presentó',
  };

  if (isLoading) return <div>Loading...</div>;
  if (isError) return <div>Error loading appointment details.</div>;

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
              <h1 className="text-3xl font-bold text-white">Detalles de la Cita</h1>
              <p className="text-slate-200">Ver y editar detalles de la cita</p>
            </div>
          </div>
          <button 
            onClick={handleEditToggle} 
            className="bg-white/10 text-white px-4 py-2 rounded-lg hover:bg-white/20 transition-colors"
          >
            {isEditing ? 'Cancelar Edición' : 'Editar'} <Edit3 className="inline-block ml-1 h-5 w-5" />
          </button>
        </motion.div>

        {/* Details */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="backdrop-blur-lg bg-white/10 rounded-2xl p-6 border border-white/20"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-semibold text-white mb-2">Paciente</h3>
              <p className="text-white">
                <User className="h-5 w-5 mr-2 inline text-blue-400" />
                {appointment.patient_name}
              </p>
              <p className="text-slate-300">DNI: {appointment.patient_dni}</p>
              <p className="text-slate-300">Tel: {appointment.patient_phone}</p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white mb-2">Doctor</h3>
              <p className="text-white">
                <Stethoscope className="h-5 w-5 mr-2 inline text-blue-400" />
                Dr. {appointment.doctor_name}
              </p>
              <p className="text-slate-300">Especialidad: {appointment.specialty_name}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
            <div>
              <h3 className="text-lg font-semibold text-white mb-2">Fecha y Hora</h3>
              <p className="text-white">
                <Calendar className="h-5 w-5 mr-2 inline text-blue-400" />
                {format(new Date(appointment.datetime), 'EEEE, d MMMM yyyy', { locale: es })}
              </p>
              <p className="text-white">
                <Clock className="h-5 w-5 mr-2 inline text-blue-400" />
                {format(new Date(appointment.datetime), 'hh:mm a')}
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white mb-2">Estado</h3>
              <p className="text-white">
                <FileText className="h-5 w-5 mr-2 inline text-blue-400" />
                {statusLabels[appointment.status]}
              </p>
            </div>
          </div>

          <div className="mt-6">
            <h3 className="text-lg font-semibold text-white mb-2">Notas</h3>
            {isEditing ? (
              <textarea
                value={editableData.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            ) : (
              <p className="text-slate-300">
                {appointment.notes || 'No hay notas adicionales.'}
              </p>
            )}
          </div>

          {isEditing && (
            <div className="flex justify-end mt-6">
              <button 
                onClick={handleSaveChanges} 
                className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors flex items-center"
              >
                Guardar Cambios <Save className="ml-2 h-5 w-5" />
              </button>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default AppointmentDetail;
