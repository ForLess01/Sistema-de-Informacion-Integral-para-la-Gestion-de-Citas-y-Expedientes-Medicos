import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { 
  Calendar, Clock, User, Search, Filter, 
  CheckCircle, XCircle, Eye, Edit, 
  Phone, Mail, MapPin, Plus, AlertCircle, FileText
} from 'lucide-react';
import { format, parseISO, isToday, isTomorrow } from 'date-fns';
import { es } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';
import appointmentService from '../../services/appointmentService';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';

const AppointmentManager = () => {
  const { user, isDoctor, isAdminStaff, canAccessSpecialty } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedSpecialty, setSelectedSpecialty] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('today');
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // Query para obtener especialidades (solo admin/recepcionistas)
  const { data: specialties } = useQuery({
    queryKey: ['specialties'],
    queryFn: appointmentService.getSpecialties,
    enabled: isAdminStaff()
  });

  // Query para obtener citas según el rol del usuario
  const { data: appointments, isLoading, refetch } = useQuery({
    queryKey: ['appointments', selectedDate, selectedSpecialty, selectedStatus, activeTab],
    queryFn: () => {
      if (isDoctor()) {
        // Los doctores ven solo sus citas
        return appointmentService.getMyAppointments(selectedDate);
      } else if (isAdminStaff()) {
        // Personal administrativo ve citas según filtros
        if (activeTab === 'today') {
          return appointmentService.getTodayAppointments();
        } else if (selectedSpecialty) {
          return appointmentService.getAppointmentsBySpecialty(selectedSpecialty, {
            date: selectedDate,
            status: selectedStatus
          });
        } else {
          return appointmentService.getAllAppointments({
            date: selectedDate,
            status: selectedStatus
          });
        }
      }
      return [];
    },
    enabled: !!user
  });

  // Mutación para confirmar cita
  const confirmMutation = useMutation({
    mutationFn: appointmentService.confirmAppointment,
    onSuccess: () => {
      queryClient.invalidateQueries(['appointments']);
      toast.success('Cita confirmada exitosamente');
      setShowDetailModal(false);
    },
    onError: () => {
      toast.error('Error al confirmar la cita');
    }
  });

  // Mutación para cancelar cita
  const cancelMutation = useMutation({
    mutationFn: ({ id, reason }) => appointmentService.cancelAppointment(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries(['appointments']);
      toast.success('Cita cancelada exitosamente');
      setShowDetailModal(false);
    },
    onError: () => {
      toast.error('Error al cancelar la cita');
    }
  });

  // Mutación para completar cita (solo doctores)
  const completeMutation = useMutation({
    mutationFn: ({ id, notes }) => appointmentService.completeAppointment(id, notes),
    onSuccess: () => {
      queryClient.invalidateQueries(['appointments']);
      toast.success('Cita marcada como completada');
      setShowDetailModal(false);
    },
    onError: () => {
      toast.error('Error al completar la cita');
    }
  });

  // Filtrar citas según el término de búsqueda
  const filteredAppointments = appointments?.results?.filter(appointment => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      appointment.patient_name?.toLowerCase().includes(searchLower) ||
      appointment.doctor_name?.toLowerCase().includes(searchLower) ||
      appointment.specialty_name?.toLowerCase().includes(searchLower)
    );
  }) || [];

  const getStatusBadge = (status) => {
    const statusConfig = {
      'confirmed': { color: 'bg-green-500/20 text-green-300', label: 'Confirmada' },
      'pending': { color: 'bg-yellow-500/20 text-yellow-300', label: 'Pendiente' },
      'cancelled': { color: 'bg-red-500/20 text-red-300', label: 'Cancelada' },
      'completed': { color: 'bg-blue-500/20 text-blue-300', label: 'Completada' },
      'no_show': { color: 'bg-gray-500/20 text-gray-300', label: 'No asistió' }
    };
    
    const config = statusConfig[status] || statusConfig['pending'];
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
        {config.label}
      </span>
    );
  };

  const getDateDisplay = (dateStr) => {
    const date = parseISO(dateStr);
    if (isToday(date)) return 'Hoy';
    if (isTomorrow(date)) return 'Mañana';
    return format(date, 'dd/MM/yyyy', { locale: es });
  };

  const AppointmentCard = ({ appointment }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white/5 rounded-xl p-4 border border-white/10 hover:bg-white/10 transition-colors"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold">
            {appointment.patient_name?.charAt(0) || 'P'}
          </div>
          <div>
            <h4 className="text-white font-medium">{appointment.patient_name}</h4>
            <p className="text-sm text-gray-400">
              {appointment.specialty_name} - Dr. {appointment.doctor_name}
            </p>
          </div>
        </div>
        {getStatusBadge(appointment.status)}
      </div>

      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-4 text-sm text-gray-400">
          <div className="flex items-center space-x-1">
            <Calendar className="h-4 w-4" />
            <span>{getDateDisplay(appointment.date)}</span>
          </div>
          <div className="flex items-center space-x-1">
            <Clock className="h-4 w-4" />
            <span>{appointment.time}</span>
          </div>
        </div>
      </div>

      {appointment.notes && (
        <p className="text-sm text-gray-300 mb-3 line-clamp-2">
          <strong>Motivo:</strong> {appointment.notes}
        </p>
      )}

      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          {appointment.patient_phone && (
            <button className="p-1 text-gray-400 hover:text-white transition-colors">
              <Phone className="h-4 w-4" />
            </button>
          )}
          {appointment.patient_email && (
            <button className="p-1 text-gray-400 hover:text-white transition-colors">
              <Mail className="h-4 w-4" />
            </button>
          )}
        </div>

        <div className="flex items-center space-x-2">
          {/* Botón Ver Expediente */}
          <button
            onClick={() => navigate(`/medical-records?patient=${appointment.patient_id}`)}
            className="p-2 text-blue-400 hover:text-blue-300 transition-colors"
            title="Ver expediente médico"
          >
            <FileText className="h-4 w-4" />
          </button>
          
          <button
            onClick={() => {
              setSelectedAppointment(appointment);
              setShowDetailModal(true);
            }}
            className="p-2 text-gray-400 hover:text-white transition-colors"
            title="Ver detalle de cita"
          >
            <Eye className="h-4 w-4" />
          </button>

          {/* Acciones según el rol y estado */}
          {isAdminStaff() && appointment.status === 'pending' && (
            <>
              <button
                onClick={() => confirmMutation.mutate(appointment.id)}
                className="p-2 text-green-400 hover:text-green-300 transition-colors"
                disabled={confirmMutation.isPending}
              >
                <CheckCircle className="h-4 w-4" />
              </button>
              <button
                onClick={() => cancelMutation.mutate({ id: appointment.id, reason: 'Cancelada por recepción' })}
                className="p-2 text-red-400 hover:text-red-300 transition-colors"
                disabled={cancelMutation.isPending}
              >
                <XCircle className="h-4 w-4" />
              </button>
            </>
          )}

          {isDoctor() && appointment.status === 'confirmed' && (
            <button
              onClick={() => completeMutation.mutate({ id: appointment.id, notes: 'Consulta completada' })}
              className="p-2 text-blue-400 hover:text-blue-300 transition-colors"
              disabled={completeMutation.isPending}
            >
              <CheckCircle className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );

  return (
    <div className="p-6 bg-white/10 rounded-2xl border border-white/20">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-white mb-2">
            Gestión de Citas
          </h2>
          <p className="text-gray-400">
            {isDoctor() ? 'Mis citas programadas' : 'Administrar citas médicas'}
          </p>
        </div>
        
        {isAdminStaff() && (
          <button className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition flex items-center">
            <Plus className="h-4 w-4 mr-2" />
            Nueva Cita
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 mb-6 border-b border-white/20">
        <button
          onClick={() => setActiveTab('today')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'today'
              ? 'text-blue-400 border-b-2 border-blue-400'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          Hoy
        </button>
        <button
          onClick={() => setActiveTab('upcoming')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'upcoming'
              ? 'text-blue-400 border-b-2 border-blue-400'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          Próximas
        </button>
        {isAdminStaff() && (
          <button
            onClick={() => setActiveTab('all')}
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === 'all'
                ? 'text-blue-400 border-b-2 border-blue-400'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Todas
          </button>
        )}
      </div>

      {/* Filtros */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        {/* Búsqueda */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar paciente, doctor..."
            className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
          />
        </div>

        {/* Fecha (solo para admin/recepcionistas) */}
        {isAdminStaff() && activeTab === 'all' && (
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-3 py-2 bg-white/5 border border-white/20 rounded-lg text-white focus:outline-none focus:border-blue-500"
          />
        )}

        {/* Especialidad (solo para admin/recepcionistas) */}
        {isAdminStaff() && (
          <select
            value={selectedSpecialty}
            onChange={(e) => setSelectedSpecialty(e.target.value)}
            className="px-3 py-2 bg-white/5 border border-white/20 rounded-lg text-white focus:outline-none focus:border-blue-500"
          >
            <option value="">Todas las especialidades</option>
            {specialties?.map((specialty) => (
              <option key={specialty.id} value={specialty.id}>
                {specialty.name}
              </option>
            ))}
          </select>
        )}

        {/* Estado */}
        <select
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          className="px-3 py-2 bg-white/5 border border-white/20 rounded-lg text-white focus:outline-none focus:border-blue-500"
        >
          <option value="">Todos los estados</option>
          <option value="pending">Pendiente</option>
          <option value="confirmed">Confirmada</option>
          <option value="completed">Completada</option>
          <option value="cancelled">Cancelada</option>
        </select>
      </div>

      {/* Lista de citas */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
          </div>
        ) : filteredAppointments.length === 0 ? (
          <div className="text-center py-8">
            <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-400">No hay citas para mostrar</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredAppointments.map((appointment) => (
              <AppointmentCard key={appointment.id} appointment={appointment} />
            ))}
          </div>
        )}
      </div>

      {/* Modal de detalle de cita */}
      {showDetailModal && selectedAppointment && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-gray-800 rounded-2xl p-6 w-full max-w-md mx-4"
          >
            <h3 className="text-xl font-bold text-white mb-4">
              Detalle de Cita
            </h3>
            
            {/* Contenido del modal */}
            <div className="space-y-4">
              <div>
                <label className="text-gray-400 text-sm">Paciente</label>
                <p className="text-white font-medium">{selectedAppointment.patient_name}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-gray-400 text-sm">Fecha</label>
                  <p className="text-white">{getDateDisplay(selectedAppointment.date)}</p>
                </div>
                <div>
                  <label className="text-gray-400 text-sm">Hora</label>
                  <p className="text-white">{selectedAppointment.time}</p>
                </div>
              </div>
              
              <div>
                <label className="text-gray-400 text-sm">Doctor</label>
                <p className="text-white">Dr. {selectedAppointment.doctor_name}</p>
              </div>
              
              <div>
                <label className="text-gray-400 text-sm">Especialidad</label>
                <p className="text-white">{selectedAppointment.specialty_name}</p>
              </div>
              
              <div>
                <label className="text-gray-400 text-sm">Estado</label>
                <div className="mt-1">
                  {getStatusBadge(selectedAppointment.status)}
                </div>
              </div>
              
              {selectedAppointment.notes && (
                <div>
                  <label className="text-gray-400 text-sm">Motivo de consulta</label>
                  <p className="text-white">{selectedAppointment.notes}</p>
                </div>
              )}
            </div>
            
            <div className="flex justify-end space-x-2 mt-6">
              <button
                onClick={() => setShowDetailModal(false)}
                className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
              >
                Cerrar
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default AppointmentManager;
