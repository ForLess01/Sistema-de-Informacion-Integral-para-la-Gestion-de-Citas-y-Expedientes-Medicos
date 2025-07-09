import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Calendar, Clock, User, MapPin, FileText, ChevronLeft, X, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import toast from 'react-hot-toast';
import appointmentService from '../services/appointmentService';

const AppointmentDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');

  // Obtener detalles de la cita
  const { data: appointment, isLoading } = useQuery({
    queryKey: ['appointment', id],
    queryFn: () => appointmentService.getAppointment(id),
  });

  // Mutation para cancelar cita
  const cancelMutation = useMutation({
    mutationFn: (reason) => appointmentService.cancelAppointment(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries(['appointment', id]);
      queryClient.invalidateQueries(['appointments']);
      toast.success('Cita cancelada exitosamente');
      setShowCancelModal(false);
      navigate('/appointments');
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Error al cancelar la cita');
    },
  });

  // Mutation para confirmar asistencia
  const confirmMutation = useMutation({
    mutationFn: () => appointmentService.confirmAttendance(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['appointment', id]);
      toast.success('Asistencia confirmada');
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Error al confirmar asistencia');
    },
  });

  const handleCancelAppointment = () => {
    if (!cancelReason.trim()) {
      toast.error('Por favor ingrese una razón para cancelar');
      return;
    }
    cancelMutation.mutate(cancelReason);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'scheduled':
        return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
      case 'confirmed':
        return 'bg-green-500/20 text-green-300 border-green-500/30';
      case 'completed':
        return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
      case 'cancelled':
        return 'bg-red-500/20 text-red-300 border-red-500/30';
      default:
        return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'scheduled':
        return 'Programada';
      case 'confirmed':
        return 'Confirmada';
      case 'completed':
        return 'Completada';
      case 'cancelled':
        return 'Cancelada';
      default:
        return status;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
      </div>
    );
  }

  if (!appointment) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-white text-xl mb-4">Cita no encontrada</p>
          <Link to="/appointments">
            <button className="px-6 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all">
              Volver a Citas
            </button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      {/* Header */}
      <header className="backdrop-blur-lg bg-white/10 border-b border-white/20">
        <div className="max-w-4xl mx-auto px-6">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Link to="/appointments" className="text-white hover:text-blue-400 transition-colors">
                <ChevronLeft className="h-6 w-6" />
              </Link>
              <h1 className="text-xl font-bold text-white">Detalles de la Cita</h1>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="backdrop-blur-lg bg-white/10 rounded-2xl border border-white/20 overflow-hidden"
        >
          {/* Estado de la cita */}
          <div className="p-6 border-b border-white/10">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-white">{appointment.specialty_name}</h2>
              <span className={`px-4 py-2 rounded-full text-sm font-medium border ${getStatusColor(appointment.status)}`}>
                {getStatusText(appointment.status)}
              </span>
            </div>
          </div>

          {/* Información principal */}
          <div className="p-6 space-y-6">
            {/* Doctor */}
            <div className="flex items-start space-x-4">
              <div className="h-12 w-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                <User className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">Dr. {appointment.doctor_name}</h3>
                <p className="text-gray-400">{appointment.doctor_specialty}</p>
                {appointment.doctor_phone && (
                  <p className="text-gray-400 text-sm mt-1">Tel: {appointment.doctor_phone}</p>
                )}
              </div>
            </div>

            {/* Fecha y hora */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center space-x-3">
                <Calendar className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-white font-medium">
                    {format(new Date(appointment.date_time), "EEEE, d 'de' MMMM 'de' yyyy", { locale: es })}
                  </p>
                  <p className="text-gray-400 text-sm">Fecha de la cita</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <Clock className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-white font-medium">
                    {format(new Date(appointment.date_time), "HH:mm", { locale: es })} hrs
                  </p>
                  <p className="text-gray-400 text-sm">Hora de la cita</p>
                </div>
              </div>
            </div>

            {/* Ubicación */}
            {appointment.location && (
              <div className="flex items-start space-x-3">
                <MapPin className="h-5 w-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-white">{appointment.location}</p>
                  <p className="text-gray-400 text-sm">Ubicación</p>
                </div>
              </div>
            )}

            {/* Motivo */}
            {appointment.reason && (
              <div className="flex items-start space-x-3">
                <FileText className="h-5 w-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-white">{appointment.reason}</p>
                  <p className="text-gray-400 text-sm">Motivo de la consulta</p>
                </div>
              </div>
            )}

            {/* Notas adicionales */}
            {appointment.notes && (
              <div className="p-4 bg-white/5 rounded-xl">
                <h4 className="text-white font-medium mb-2">Notas adicionales</h4>
                <p className="text-gray-300">{appointment.notes}</p>
              </div>
            )}

            {/* Recordatorios */}
            {appointment.status === 'scheduled' && (
              <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-xl">
                <div className="flex items-start space-x-3">
                  <AlertCircle className="h-5 w-5 text-blue-400 mt-0.5" />
                  <div>
                    <h4 className="text-blue-300 font-medium">Recordatorios importantes</h4>
                    <ul className="text-blue-200 text-sm mt-2 space-y-1">
                      <li>• Llegue 15 minutos antes de su cita</li>
                      <li>• Traiga su documento de identidad</li>
                      <li>• Si tiene exámenes previos, no olvide traerlos</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Acciones */}
          {appointment.status === 'scheduled' && (
            <div className="p-6 border-t border-white/10">
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => confirmMutation.mutate()}
                  disabled={confirmMutation.isLoading}
                  className="flex-1 py-3 px-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-medium rounded-xl hover:from-green-600 hover:to-emerald-700 transition-all disabled:opacity-50"
                >
                  {confirmMutation.isLoading ? 'Confirmando...' : 'Confirmar Asistencia'}
                </button>
                <button
                  onClick={() => navigate(`/appointments/${id}/reschedule`)}
                  className="flex-1 py-3 px-4 bg-white/10 text-white font-medium rounded-xl hover:bg-white/20 transition-all border border-white/20"
                >
                  Reprogramar
                </button>
                <button
                  onClick={() => setShowCancelModal(true)}
                  className="flex-1 py-3 px-4 bg-red-500/20 text-red-300 font-medium rounded-xl hover:bg-red-500/30 transition-all border border-red-500/30"
                >
                  Cancelar Cita
                </button>
              </div>
            </div>
          )}
        </motion.div>

        {/* Información adicional */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mt-6 backdrop-blur-lg bg-white/10 rounded-2xl p-6 border border-white/20"
        >
          <h3 className="text-lg font-semibold text-white mb-4">Información de contacto</h3>
          <div className="space-y-3">
            <p className="text-gray-300">
              Si necesita cancelar o reprogramar su cita, puede hacerlo hasta 24 horas antes.
            </p>
            <p className="text-gray-300">
              Para emergencias, contacte al: <span className="text-white font-medium">+1 234 567 8900</span>
            </p>
          </div>
        </motion.div>
      </div>

      {/* Modal de cancelación */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-gray-800 rounded-2xl p-6 max-w-md w-full"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-white">Cancelar Cita</h3>
              <button
                onClick={() => {
                  setShowCancelModal(false);
                  setCancelReason('');
                }}
                className="text-gray-400 hover:text-white"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <p className="text-gray-300 mb-4">
              ¿Está seguro que desea cancelar su cita con el Dr. {appointment.doctor_name} 
              programada para el {format(new Date(appointment.date_time), "d 'de' MMMM", { locale: es })}?
            </p>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Motivo de cancelación
              </label>
              <textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-400"
                placeholder="Por favor, indique el motivo de la cancelación..."
              />
            </div>

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowCancelModal(false);
                  setCancelReason('');
                }}
                className="px-4 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors"
              >
                Volver
              </button>
              <button
                onClick={handleCancelAppointment}
                disabled={cancelMutation.isLoading}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50"
              >
                {cancelMutation.isLoading ? 'Cancelando...' : 'Confirmar Cancelación'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default AppointmentDetails;
