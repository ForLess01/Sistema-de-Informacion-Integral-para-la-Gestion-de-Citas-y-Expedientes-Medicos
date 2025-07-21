import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Calendar, Search, Filter, Plus, Eye, Edit2, X, 
  Clock, User, Stethoscope, ChevronLeft, ChevronRight,
  AlertCircle, CheckCircle, XCircle
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { format, startOfDay, endOfDay } from 'date-fns';
import { es } from 'date-fns/locale';
import appointmentService from '../../services/appointmentService';

const AppointmentsList = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [statusFilter, setStatusFilter] = useState('all');
  const [specialtyFilter, setSpecialtyFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);

  // Obtener citas con filtros
  const { data: appointmentsData, isLoading, refetch } = useQuery({
    queryKey: ['appointments', {
      search: searchTerm,
      date: selectedDate,
      status: statusFilter,
      specialty: specialtyFilter,
      page: currentPage
    }],
    queryFn: () => appointmentService.getAllAppointments({
      search: searchTerm,
      date_start: startOfDay(selectedDate).toISOString(),
      date_end: endOfDay(selectedDate).toISOString(),
      status: statusFilter === 'all' ? undefined : statusFilter,
      specialty: specialtyFilter === 'all' ? undefined : specialtyFilter,
      page: currentPage,
      page_size: 20
    }),
  });

  // Obtener especialidades para el filtro
  const { data: specialties } = useQuery({
    queryKey: ['specialties'],
    queryFn: appointmentService.getSpecialties,
  });

  const appointments = appointmentsData?.results || [];
  const totalPages = Math.ceil((appointmentsData?.count || 0) / 20);

  const statusColors = {
    'pending': 'bg-yellow-500/20 text-yellow-300 border-yellow-400',
    'confirmed': 'bg-green-500/20 text-green-300 border-green-400',
    'in_progress': 'bg-blue-500/20 text-blue-300 border-blue-400',
    'completed': 'bg-purple-500/20 text-purple-300 border-purple-400',
    'cancelled': 'bg-red-500/20 text-red-300 border-red-400',
    'no_show': 'bg-gray-500/20 text-gray-300 border-gray-400'
  };

  const statusLabels = {
    'pending': 'Pendiente',
    'confirmed': 'Confirmada',
    'in_progress': 'En Progreso',
    'completed': 'Completada',
    'cancelled': 'Cancelada',
    'no_show': 'No se presentó'
  };

  const StatusIcon = ({ status }) => {
    switch (status) {
      case 'confirmed':
        return <CheckCircle className="h-4 w-4 text-green-400" />;
      case 'cancelled':
        return <XCircle className="h-4 w-4 text-red-400" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-400" />;
      default:
        return <AlertCircle className="h-4 w-4 text-blue-400" />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-800 to-indigo-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8"
        >
          <div className="mb-4 lg:mb-0">
            <h1 className="text-3xl font-bold text-white mb-2 flex items-center">
              <Calendar className="h-8 w-8 mr-3 text-blue-400" />
              Gestión de Citas
            </h1>
            <p className="text-slate-200">
              {format(selectedDate, "EEEE, d 'de' MMMM 'de' yyyy", { locale: es })}
            </p>
          </div>
          <Link to="/appointments/new">
            <button className="px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-medium rounded-xl hover:from-blue-600 hover:to-indigo-700 transition duration-200 flex items-center">
              <Plus className="h-5 w-5 mr-2" />
              Nueva Cita
            </button>
          </Link>
        </motion.div>

        {/* Search and Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="backdrop-blur-lg bg-white/10 rounded-2xl p-6 border border-white/20 mb-6"
        >
          <div className="flex flex-col lg:flex-row lg:items-center lg:space-x-4 space-y-4 lg:space-y-0">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar por paciente, doctor o DNI..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Date Picker */}
            <div className="flex items-center space-x-2">
              <Calendar className="h-5 w-5 text-slate-400" />
              <input
                type="date"
                value={format(selectedDate, 'yyyy-MM-dd')}
                onChange={(e) => setSelectedDate(new Date(e.target.value))}
                className="px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Filter Button */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="px-4 py-2 bg-white/10 text-white border border-white/20 rounded-lg hover:bg-white/20 transition duration-200 flex items-center"
            >
              <Filter className="h-5 w-5 mr-2" />
              Filtros
            </button>
          </div>

          {/* Expanded Filters */}
          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="mt-4 pt-4 border-t border-white/20"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">Estado</label>
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="all">Todos los estados</option>
                      <option value="pending">Pendiente</option>
                      <option value="confirmed">Confirmada</option>
                      <option value="in_progress">En Progreso</option>
                      <option value="completed">Completada</option>
                      <option value="cancelled">Cancelada</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">Especialidad</label>
                    <select
                      value={specialtyFilter}
                      onChange={(e) => setSpecialtyFilter(e.target.value)}
                      className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="all">Todas las especialidades</option>
                      {specialties?.map((specialty) => (
                        <option key={specialty.id} value={specialty.id}>
                          {specialty.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Appointments List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="backdrop-blur-lg bg-white/10 rounded-2xl border border-white/20 overflow-hidden"
        >
          {isLoading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
            </div>
          ) : appointments.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="h-16 w-16 text-slate-400 mx-auto mb-4" />
              <h3 className="text-xl font-medium text-white mb-2">No hay citas</h3>
              <p className="text-slate-400">No se encontraron citas para los filtros seleccionados.</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-white/5">
                    <tr>
                      <th className="px-6 py-4 text-left text-sm font-medium text-white">Paciente</th>
                      <th className="px-6 py-4 text-left text-sm font-medium text-white">Doctor</th>
                      <th className="px-6 py-4 text-left text-sm font-medium text-white">Fecha/Hora</th>
                      <th className="px-6 py-4 text-left text-sm font-medium text-white">Especialidad</th>
                      <th className="px-6 py-4 text-left text-sm font-medium text-white">Estado</th>
                      <th className="px-6 py-4 text-center text-sm font-medium text-white">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/10">
                    {appointments.map((appointment, index) => (
                      <motion.tr
                        key={appointment.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="hover:bg-white/5 transition-colors"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 flex items-center justify-center text-white font-semibold mr-3">
                              {appointment.patient_name?.charAt(0) || 'P'}
                            </div>
                            <div>
                              <div className="text-white font-medium">{appointment.patient_name}</div>
                              <div className="text-slate-400 text-sm">DNI: {appointment.patient_dni}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center">
                            <Stethoscope className="h-4 w-4 text-blue-400 mr-2" />
                            <span className="text-white">{appointment.doctor_name}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center">
                            <Clock className="h-4 w-4 text-slate-400 mr-2" />
                            <div>
                              <div className="text-white">{format(new Date(appointment.datetime), 'dd/MM/yyyy')}</div>
                              <div className="text-slate-400 text-sm">{format(new Date(appointment.datetime), 'HH:mm')}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-slate-200">{appointment.specialty_name}</span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center">
                            <StatusIcon status={appointment.status} />
                            <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium border ${statusColors[appointment.status] || 'bg-gray-500/20 text-gray-300 border-gray-400'}`}>
                              {statusLabels[appointment.status] || appointment.status}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex justify-center space-x-2">
                            <Link
                              to={`/appointments/${appointment.id}`}
                              className="p-2 text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 rounded-lg transition-colors"
                              title="Ver detalles"
                            >
                              <Eye className="h-4 w-4" />
                            </Link>
                            <Link
                              to={`/appointments/${appointment.id}/edit`}
                              className="p-2 text-slate-400 hover:text-slate-300 hover:bg-slate-500/10 rounded-lg transition-colors"
                              title="Editar"
                            >
                              <Edit2 className="h-4 w-4" />
                            </Link>
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-between items-center px-6 py-4 border-t border-white/10">
                  <div className="text-sm text-slate-400">
                    Mostrando {((currentPage - 1) * 20) + 1} - {Math.min(currentPage * 20, appointmentsData?.count || 0)} de {appointmentsData?.count || 0} citas
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                      className="px-3 py-1 bg-white/10 text-white rounded border border-white/20 hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    <span className="px-3 py-1 text-white">
                      {currentPage} / {totalPages}
                    </span>
                    <button
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages}
                      className="px-3 py-1 bg-white/10 text-white rounded border border-white/20 hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default AppointmentsList;
