import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Calendar, Clock, User, Plus, Filter, Search, ChevronLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useAuth } from '../contexts/AuthContext';
import appointmentService from '../services/appointmentService';
import toast from 'react-hot-toast';

const Appointments = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  // Obtener todas las citas
  const { data: appointmentsData, isLoading } = useQuery({
    queryKey: ['appointments'],
    queryFn: appointmentService.getMyAppointments,
  });

  // Extraer array de appointments de la respuesta
  // El API puede devolver un array directo o un objeto con 'results'
  const appointments = React.useMemo(() => {
    if (!appointmentsData) return [];
    if (Array.isArray(appointmentsData)) return appointmentsData;
    if (appointmentsData.results && Array.isArray(appointmentsData.results)) {
      return appointmentsData.results;
    }
    return [];
  }, [appointmentsData]);

  // Filtrar citas
  const filteredAppointments = React.useMemo(() => {
    if (!Array.isArray(appointments)) return [];
    
    return appointments.filter(appointment => {
      const matchesSearch = appointment.doctor_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           appointment.specialty_name?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesFilter = filterStatus === 'all' || appointment.status === filterStatus;
      return matchesSearch && matchesFilter;
    });
  }, [appointments, searchTerm, filterStatus]);

  // Mutation para cancelar cita
  const cancelMutation = useMutation({
    mutationFn: appointmentService.cancelAppointment,
    onSuccess: () => {
      queryClient.invalidateQueries(['appointments']);
      toast.success('Cita cancelada exitosamente');
    },
    onError: () => {
      toast.error('Error al cancelar la cita');
    },
  });

  const handleCancelAppointment = (appointmentId) => {
    if (window.confirm('¿Estás seguro de que deseas cancelar esta cita?')) {
      cancelMutation.mutate(appointmentId);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'scheduled':
        return 'bg-green-500/20 text-green-300';
      case 'confirmed':
        return 'bg-blue-500/20 text-blue-300';
      case 'cancelled':
        return 'bg-red-500/20 text-red-300';
      case 'completed':
        return 'bg-gray-500/20 text-gray-300';
      default:
        return 'bg-gray-500/20 text-gray-300';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'scheduled':
        return 'Programada';
      case 'confirmed':
        return 'Confirmada';
      case 'cancelled':
        return 'Cancelada';
      case 'completed':
        return 'Completada';
      default:
        return status;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      {/* Header */}
      <header className="backdrop-blur-lg bg-white/10 border-b border-white/20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Link to="/dashboard" className="text-white hover:text-blue-400 transition-colors">
                <ChevronLeft className="h-6 w-6" />
              </Link>
              <h1 className="text-xl font-bold text-white">Mis Citas</h1>
            </div>
            <Link to="/appointments/new">
              <button className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-medium rounded-lg hover:from-blue-600 hover:to-purple-700 transition duration-200">
                <Plus className="h-4 w-4" />
                <span>Nueva Cita</span>
              </button>
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto p-6">
        {/* Filtros y búsqueda */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="backdrop-blur-lg bg-white/10 rounded-2xl p-6 border border-white/20 mb-6"
        >
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar por doctor o especialidad..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-400"
                />
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Filter className="h-5 w-5 text-gray-400" />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-blue-400"
              >
                <option value="all">Todas</option>
                <option value="scheduled">Programadas</option>
                <option value="confirmed">Confirmadas</option>
                <option value="completed">Completadas</option>
                <option value="cancelled">Canceladas</option>
              </select>
            </div>
          </div>
        </motion.div>

        {/* Lista de citas */}
        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto"></div>
          </div>
        ) : filteredAppointments?.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="backdrop-blur-lg bg-white/10 rounded-2xl p-12 border border-white/20 text-center"
          >
            <Calendar className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-400 text-lg mb-4">No se encontraron citas</p>
            <Link to="/appointments/new">
              <button className="py-2 px-6 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-medium rounded-lg hover:from-blue-600 hover:to-purple-700 transition duration-200">
                Agendar Nueva Cita
              </button>
            </Link>
          </motion.div>
        ) : (
          <div className="grid gap-4">
            {filteredAppointments?.map((appointment, index) => (
              <motion.div
                key={appointment.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="backdrop-blur-lg bg-white/10 rounded-2xl p-6 border border-white/20"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between">
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-white mb-2">
                      {appointment.specialty_name}
                    </h3>
                    <div className="space-y-1 text-gray-400">
                      <p className="flex items-center">
                        <User className="h-4 w-4 mr-2" />
                        Dr. {appointment.doctor_name}
                      </p>
                      <p className="flex items-center">
                        <Calendar className="h-4 w-4 mr-2" />
{appointment.date_time ? format(new Date(appointment.date_time), "EEEE, d 'de' MMMM 'de' yyyy", { locale: es }) : 'Fecha no disponible'}
                      </p>
                      <p className="flex items-center">
                        <Clock className="h-4 w-4 mr-2" />
{appointment.date_time ? format(new Date(appointment.date_time), "HH:mm", { locale: es }) : '--:--'} hrs
                      </p>
                    </div>
                  </div>
                  <div className="mt-4 md:mt-0 flex flex-col items-end space-y-3">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(appointment.status)}`}>
                      {getStatusText(appointment.status)}
                    </span>
                    <div className="flex space-x-2">
                      <Link
                        to={`/appointments/${appointment.id}`}
                        className="text-blue-400 hover:text-blue-300 text-sm"
                      >
                        Ver detalles
                      </Link>
                      {appointment.status === 'scheduled' && (
                        <button
                          onClick={() => handleCancelAppointment(appointment.id)}
                          className="text-red-400 hover:text-red-300 text-sm"
                        >
                          Cancelar
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Appointments;
