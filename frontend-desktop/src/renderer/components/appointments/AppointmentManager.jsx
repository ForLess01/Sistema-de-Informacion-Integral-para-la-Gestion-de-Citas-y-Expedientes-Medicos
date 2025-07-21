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
  // Manejar tanto respuestas paginadas como arrays directos
  const appointmentsList = Array.isArray(appointments) ? appointments : (appointments?.results || []);
  const filteredAppointments = appointmentsList.filter(appointment => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      appointment.patient_name?.toLowerCase().includes(searchLower) ||
      appointment.doctor_name?.toLowerCase().includes(searchLower) ||
      appointment.specialty_name?.toLowerCase().includes(searchLower)
    );
  });

  const getStatusBadge = (status) => {
    const statusConfig = {
      'confirmed': { color: 'bg-green-500/20 text-green-300', label: 'Confirmada' },
      'pending': { color: 'bg-yellow-500/20 text-yellow-300', label: 'Pendiente' },
      'cancelled': { color: 'bg-red-500/20 text-red-300', label: 'Cancelada' },
      'completed': { color: 'bg-blue-500/20 text-blue-300', label: 'Completada' },
      'no_show': { color: 'bg-gray-500/20 text-gray-300', label: 'No asistió' },
      'scheduled': { color: 'bg-purple-500/20 text-purple-300', label: 'Agendada' },
      'in_consultation': { color: 'bg-indigo-500/20 text-indigo-300', label: 'En consulta' }
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

const AppointmentCard = ({ appointment }) => {
    console.log('Datos de la Cita:', appointment);
    
    return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-2xl p-6 border border-white/10 backdrop-blur-sm hover:bg-white/10 transition-colors"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold">
            {appointment.patient_name?.charAt(0) || 'P'}
          </div>
          <div>
            <h4 className="text-white font-semibold text-lg">{appointment.patient_name}</h4>
            <p className="text-sm text-gray-400">
              {appointment.specialty_name} - Dr. {appointment.doctor_name}
            </p>
          </div>
        </div>
        {getStatusBadge(appointment.status)}
      </div>

      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-4 text-sm text-gray-400">
          <div className="flex items-center space-x-1">
            <Calendar className="h-4 w-4" />
            <span>{getDateDisplay(appointment.appointment_date || appointment.date)}</span>
          </div>
          <div className="flex items-center space-x-1">
            <Clock className="h-4 w-4" />
            <span>{appointment.appointment_time || appointment.time}</span>
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
            <button className="p-2 text-gray-400 hover:text-white transition-colors">
              <Phone className="h-4 w-4" />
            </button>
          )}
          {appointment.patient_email && (
            <button className="p-2 text-gray-400 hover:text-white transition-colors">
              <Mail className="h-4 w-4" />
            </button>
          )}
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => navigate(`/medical-records?patient=${appointment.patient || appointment.patient_id}`)}
            className="p-3 bg-blue-500/20 hover:bg-blue-600/30 rounded-xl transition-all duration-300"
            title="Ver expediente médico"
          >
            <FileText className="h-5 w-5 text-blue-400" />
          </button>
          
          <button
            onClick={() => {
              setSelectedAppointment(appointment);
              setShowDetailModal(true);
            }}
            className="p-3 bg-gray-400/20 hover:bg-gray-500/30 rounded-xl transition-all duration-300"
            title="Ver detalle de cita"
          >
            <Eye className="h-5 w-5 text-gray-300" />
          </button>

          {isAdminStaff() && appointment.status === 'pending' && (
            <>
              <button
                onClick={() => confirmMutation.mutate(appointment.id)}
                className="p-3 bg-green-500/20 hover:bg-green-600/30 rounded-xl transition-all duration-300"
                disabled={confirmMutation.isPending}
              >
                <CheckCircle className="h-5 w-5 text-green-400" />
              </button>
              <button
                onClick={() => cancelMutation.mutate({ id: appointment.id, reason: 'Cancelada por recepción' })}
                className="p-3 bg-red-500/20 hover:bg-red-600/30 rounded-xl transition-all duration-300"
                disabled={cancelMutation.isPending}
              >
                <XCircle className="h-5 w-5 text-red-400" />
              </button>
            </>
          )}

          {isDoctor() && appointment.status === 'confirmed' && (
            <button
              onClick={() => completeMutation.mutate({ id: appointment.id, notes: 'Consulta completada' })}
              className="p-3 bg-blue-500/20 hover:bg-blue-600/30 rounded-xl transition-all duration-300"
              disabled={completeMutation.isPending}
            >
              <CheckCircle className="h-5 w-5 text-blue-400" />
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
  };

return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-6"
    >
      <div className="max-w-7xl mx-auto">
        {/* Modern Header */}
        <motion.div 
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 backdrop-blur-lg rounded-3xl shadow-2xl border border-white/10 p-6 mb-6"
        >
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                Gestión de Citas Médicas
              </h1>
              <p className="text-gray-400 mt-1">
                {isDoctor() ? 'Mis citas programadas' : 'Sistema de Administración de Citas'}
              </p>
            </div>
            
            {isAdminStaff() && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-5 py-2.5 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl hover:from-blue-600 hover:to-purple-700 transition-all duration-300 flex items-center shadow-lg"
              >
                <Plus className="h-4 w-4 mr-2" />
                Nueva Cita
              </motion.button>
            )}
          </div>
        </motion.div>

        {/* Modern Tabs */}
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="bg-white/5 backdrop-blur-lg rounded-2xl shadow-xl border border-white/10 p-2 mb-6"
        >
          <div className="flex flex-wrap gap-2">
            {[
              { id: 'today', label: 'Hoy', icon: Clock },
              { id: 'upcoming', label: 'Próximas', icon: Calendar },
              ...(isAdminStaff() ? [{ id: 'all', label: 'Todas', icon: Eye }] : [])
            ].map((tab, index) => (
              <motion.button
                key={tab.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-3 rounded-xl flex items-center space-x-2 transition-all duration-300 ${
                  activeTab === tab.id
                    ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg'
                    : 'text-gray-400 hover:text-white hover:bg-white/10'
                }`}
              >
                <tab.icon className={`h-5 w-5 ${
                  activeTab === tab.id ? 'text-white' : ''
                }`} />
                <span className="font-medium">{tab.label}</span>
              </motion.button>
            ))}
          </div>
        </motion.div>

        {/* Filtros Avanzados */}
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-lg rounded-2xl shadow-xl border border-white/10 p-6 mb-6"
        >
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-2 bg-purple-500/20 rounded-xl">
              <Filter className="h-5 w-5 text-purple-400" />
            </div>
            <h3 className="text-white font-semibold text-lg">Filtros de Búsqueda</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Búsqueda */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar paciente, doctor..."
                className="w-full pl-10 pr-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 transition-all duration-300"
              />
            </div>

            {/* Fecha (solo para admin/recepcionistas) */}
            {isAdminStaff() && activeTab === 'all' && (
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white focus:outline-none focus:border-blue-500 transition-all duration-300"
                />
              </div>
            )}

            {/* Especialidad (solo para admin/recepcionistas) */}
            {isAdminStaff() && (
              <select
                value={selectedSpecialty}
                onChange={(e) => setSelectedSpecialty(e.target.value)}
                className="px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white focus:outline-none focus:border-blue-500 transition-all duration-300"
              >
                <option value="" className="bg-gray-800">Todas las especialidades</option>
                {specialties?.map((specialty) => (
                  <option key={specialty.id} value={specialty.id} className="bg-gray-800">
                    {specialty.name}
                  </option>
                ))}
              </select>
            )}

            {/* Estado */}
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white focus:outline-none focus:border-blue-500 transition-all duration-300"
            >
              <option value="" className="bg-gray-800">Todos los estados</option>
              <option value="pending" className="bg-gray-800">Pendiente</option>
              <option value="confirmed" className="bg-gray-800">Confirmada</option>
              <option value="completed" className="bg-gray-800">Completada</option>
              <option value="cancelled" className="bg-gray-800">Cancelada</option>
            </select>
          </div>
        </motion.div>

        {/* Lista de citas con diseño mejorado */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-lg rounded-3xl shadow-2xl border border-white/10 p-6"
        >
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            </div>
          ) : filteredAppointments.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-16"
            >
              <motion.div
                animate={{ 
                  scale: [1, 1.1, 1],
                  rotate: [0, 5, -5, 0]
                }}
                transition={{ 
                  duration: 2,
                  repeat: Infinity,
                  repeatDelay: 3
                }}
              >
                <Calendar className="h-24 w-24 text-gray-600 mx-auto mb-6" />
              </motion.div>
              
              <h3 className="text-2xl font-semibold text-white mb-3">
                No hay citas disponibles
              </h3>
              <p className="text-gray-400 mb-8 max-w-md mx-auto">
                No se encontraron citas que coincidan con los filtros seleccionados. 
                Intenta ajustar los criterios de búsqueda.
              </p>
            </motion.div>
          ) : (
            <div className="space-y-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-white flex items-center">
                  <Calendar className="h-6 w-6 mr-3 text-blue-400" />
                  Citas {activeTab === 'today' ? 'de Hoy' : activeTab === 'upcoming' ? 'Próximas' : 'Todas'}
                  <span className="ml-3 px-3 py-1 bg-blue-500/20 text-blue-300 rounded-full text-sm font-medium">
                    {filteredAppointments.length}
                  </span>
                </h3>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {filteredAppointments.map((appointment, index) => (
                  <motion.div
                    key={appointment.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <AppointmentCard appointment={appointment} />
                  </motion.div>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      </div>

{/* Modal de detalle de cita */}
      {showDetailModal && selectedAppointment && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-md flex items-center justify-center z-50">
          <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-black/20 opacity-70"></div>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative bg-white/10 backdrop-blur-lg rounded-3xl shadow-2xl p-8 w-full max-w-lg mx-4 border border-white/20"
          >
            <h3 className="text-2xl font-bold text-white mb-6">
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
                  <p className="text-white">{getDateDisplay(selectedAppointment.appointment_date || selectedAppointment.date)}</p>
                </div>
                <div>
                  <label className="text-gray-400 text-sm">Hora</label>
                  <p className="text-white">{selectedAppointment.appointment_time || selectedAppointment.time}</p>
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
            
            <div className="flex justify-end space-x-3 mt-8 pt-4 border-t border-white/10">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowDetailModal(false)}
                className="px-6 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white hover:bg-white/20 transition-all duration-300 font-medium"
              >
                Cerrar
              </motion.button>
            </div>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
};

export default AppointmentManager;
