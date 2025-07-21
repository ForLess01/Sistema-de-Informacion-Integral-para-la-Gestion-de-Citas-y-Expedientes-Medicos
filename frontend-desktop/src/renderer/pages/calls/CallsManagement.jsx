import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Phone, 
  PhoneCall, 
  PhoneIncoming, 
  PhoneOutgoing, 
  PhoneMissed,
  Clock, 
  User, 
  Calendar,
  Filter,
  Search,
  Plus,
  Edit2,
  Trash2,
  CheckCircle,
  XCircle,
  AlertCircle,
  RefreshCw,
  Download,
  Eye,
  UserCheck,
  PhoneOff
} from 'lucide-react';
import * as callsService from '../../services/callsService';

const CallsManagement = () => {
  const queryClient = useQueryClient();
  
  // Estados locales
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('today');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedCall, setSelectedCall] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isNewCallModalOpen, setIsNewCallModalOpen] = useState(false);
  
  const itemsPerPage = 10;

  // Queries para obtener datos
  const { data: callsData, isLoading, error, refetch } = useQuery(
    ['calls', { 
      page: currentPage, 
      limit: itemsPerPage, 
      search: searchTerm,
      status: statusFilter,
      type: typeFilter,
      priority: priorityFilter,
      date: dateFilter
    }],
    () => callsService.getCalls({
      page: currentPage,
      limit: itemsPerPage,
      search: searchTerm,
      status: statusFilter !== 'all' ? statusFilter : undefined,
      type: typeFilter !== 'all' ? typeFilter : undefined,
      priority: priorityFilter !== 'all' ? priorityFilter : undefined,
      date: dateFilter !== 'all' ? dateFilter : undefined
    }),
    { 
      keepPreviousData: true,
      refetchInterval: 30000 // Refrescar cada 30 segundos
    }
  );

  const { data: callTypes } = useQuery('callTypes', callsService.getCallTypes);
  const { data: callStatuses } = useQuery('callStatuses', callsService.getCallStatuses);
  const { data: callPriorities } = useQuery('callPriorities', callsService.getCallPriorities);
  const { data: callStats } = useQuery('callStats', callsService.getCallStatistics);

  // Mutaciones
  const updateCallMutation = useMutation(callsService.updateCall, {
    onSuccess: () => {
      queryClient.invalidateQueries('calls');
      queryClient.invalidateQueries('callStats');
      setIsModalOpen(false);
      setSelectedCall(null);
    }
  });

  const deleteCallMutation = useMutation(callsService.deleteCall, {
    onSuccess: () => {
      queryClient.invalidateQueries('calls');
      queryClient.invalidateQueries('callStats');
    }
  });

  const completeCallMutation = useMutation(callsService.completeCall, {
    onSuccess: () => {
      queryClient.invalidateQueries('calls');
      queryClient.invalidateQueries('callStats');
    }
  });

  const cancelCallMutation = useMutation(callsService.cancelCall, {
    onSuccess: () => {
      queryClient.invalidateQueries('calls');
      queryClient.invalidateQueries('callStats');
    }
  });

  const assignCallMutation = useMutation(callsService.assignCall, {
    onSuccess: () => {
      queryClient.invalidateQueries('calls');
    }
  });

  // Funciones auxiliares
  const getStatusIcon = (status) => {
    const icons = {
      'pending': <Clock className="w-4 h-4 text-yellow-500" />,
      'in_progress': <PhoneCall className="w-4 h-4 text-blue-500" />,
      'completed': <CheckCircle className="w-4 h-4 text-green-500" />,
      'cancelled': <XCircle className="w-4 h-4 text-red-500" />,
      'missed': <PhoneMissed className="w-4 h-4 text-orange-500" />
    };
    return icons[status] || <Phone className="w-4 h-4 text-gray-500" />;
  };

  const getTypeIcon = (type) => {
    const icons = {
      'incoming': <PhoneIncoming className="w-4 h-4 text-green-600" />,
      'outgoing': <PhoneOutgoing className="w-4 h-4 text-blue-600" />,
      'internal': <Phone className="w-4 h-4 text-purple-600" />,
      'emergency': <AlertCircle className="w-4 h-4 text-red-600" />
    };
    return icons[type] || <Phone className="w-4 h-4 text-gray-500" />;
  };

  const getPriorityBadge = (priority) => {
    const styles = {
      'low': 'bg-green-100 text-green-800',
      'medium': 'bg-yellow-100 text-yellow-800', 
      'high': 'bg-orange-100 text-orange-800',
      'critical': 'bg-red-100 text-red-800'
    };
    return styles[priority] || 'bg-gray-100 text-gray-800';
  };

  const formatDuration = (seconds) => {
    if (!seconds) return '00:00';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDateTime = (dateTime) => {
    return new Date(dateTime).toLocaleString('es-ES', {
      day: '2-digit',
      month: '2-digit', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Handlers
  const handleCompleteCall = async (callId) => {
    try {
      await completeCallMutation.mutateAsync(callId);
    } catch (error) {
      console.error('Error completing call:', error);
    }
  };

  const handleCancelCall = async (callId) => {
    try {
      await cancelCallMutation.mutateAsync(callId);
    } catch (error) {
      console.error('Error cancelling call:', error);
    }
  };

  const handleDeleteCall = async (callId) => {
    if (window.confirm('¿Está seguro de que desea eliminar esta llamada?')) {
      try {
        await deleteCallMutation.mutateAsync(callId);
      } catch (error) {
        console.error('Error deleting call:', error);
      }
    }
  };

  const handleViewCall = (call) => {
    setSelectedCall(call);
    setIsModalOpen(true);
  };

  const resetFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setTypeFilter('all'); 
    setPriorityFilter('all');
    setDateFilter('today');
    setCurrentPage(1);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
        <div className="flex items-center justify-center h-64">
          <div className="flex items-center space-x-2">
            <RefreshCw className="w-6 h-6 animate-spin text-blue-600" />
            <span className="text-lg text-gray-600">Cargando llamadas...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-800 mb-2">Error al cargar</h3>
            <p className="text-gray-600 mb-4">No se pudieron cargar las llamadas</p>
            <button 
              onClick={() => refetch()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Reintentar
            </button>
          </div>
        </div>
      </div>
    );
  }

  const calls = callsData?.data || [];
  const totalPages = callsData?.pagination?.totalPages || 1;
  const totalCalls = callsData?.pagination?.total || 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-7xl mx-auto"
      >
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 mb-2">Gestión de Llamadas</h1>
              <p className="text-gray-600">Administra todas las llamadas del sistema</p>
            </div>
            <div className="flex space-x-4">
              <button
                onClick={() => refetch()}
                className="flex items-center space-x-2 px-4 py-2 bg-white text-gray-700 rounded-lg hover:bg-gray-50 border transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Actualizar</span>
              </button>
              <button
                onClick={() => setIsNewCallModalOpen(true)}
                className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-lg"
              >
                <Plus className="w-4 h-4" />
                <span>Nueva Llamada</span>
              </button>
            </div>
          </div>

          {/* Estadísticas */}
          {callStats && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white rounded-xl p-6 shadow-lg border border-gray-100"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Llamadas</p>
                    <p className="text-2xl font-bold text-gray-900">{callStats.total}</p>
                  </div>
                  <div className="p-3 bg-blue-100 rounded-full">
                    <Phone className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 }}
                className="bg-white rounded-xl p-6 shadow-lg border border-gray-100"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">En Progreso</p>
                    <p className="text-2xl font-bold text-blue-600">{callStats.inProgress}</p>
                  </div>
                  <div className="p-3 bg-blue-100 rounded-full">
                    <PhoneCall className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 }}
                className="bg-white rounded-xl p-6 shadow-lg border border-gray-100"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Completadas</p>
                    <p className="text-2xl font-bold text-green-600">{callStats.completed}</p>
                  </div>
                  <div className="p-3 bg-green-100 rounded-full">
                    <CheckCircle className="w-6 h-6 text-green-600" />
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 }}
                className="bg-white rounded-xl p-6 shadow-lg border border-gray-100"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Perdidas</p>
                    <p className="text-2xl font-bold text-red-600">{callStats.missed}</p>
                  </div>
                  <div className="p-3 bg-red-100 rounded-full">
                    <PhoneMissed className="w-6 h-6 text-red-600" />
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </div>

        {/* Filtros */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-6 gap-4 mb-4">
            {/* Búsqueda */}
            <div className="md:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Buscar por número, contacto..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Filtro de Estado */}
            <div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">Todos los estados</option>
                {callStatuses?.map(status => (
                  <option key={status.id} value={status.value}>
                    {status.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Filtro de Tipo */}
            <div>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">Todos los tipos</option>
                {callTypes?.map(type => (
                  <option key={type.id} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Filtro de Prioridad */}
            <div>
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">Todas las prioridades</option>
                {callPriorities?.map(priority => (
                  <option key={priority.id} value={priority.value}>
                    {priority.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Filtro de Fecha */}
            <div>
              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="today">Hoy</option>
                <option value="yesterday">Ayer</option>
                <option value="week">Esta semana</option>
                <option value="month">Este mes</option>
                <option value="all">Todas las fechas</option>
              </select>
            </div>
          </div>

          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                {totalCalls} llamada{totalCalls !== 1 ? 's' : ''} encontrada{totalCalls !== 1 ? 's' : ''}
              </span>
            </div>
            <button
              onClick={resetFilters}
              className="text-sm text-blue-600 hover:text-blue-800 font-medium"
            >
              Limpiar filtros
            </button>
          </div>
        </div>

        {/* Lista de Llamadas */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Llamada
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contacto
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fecha/Hora
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Duración
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Prioridad
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                <AnimatePresence>
                  {calls.map((call) => (
                    <motion.tr
                      key={call.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {getTypeIcon(call.type)}
                          <div className="ml-3">
                            <div className="text-sm font-medium text-gray-900">
                              {call.phoneNumber}
                            </div>
                            <div className="text-xs text-gray-500">
                              {call.type === 'incoming' ? 'Entrante' : 
                               call.type === 'outgoing' ? 'Saliente' : 
                               call.type === 'internal' ? 'Interna' : 'Emergencia'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <User className="w-4 h-4 text-gray-400 mr-2" />
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {call.contactName || 'Desconocido'}
                            </div>
                            {call.assignedTo && (
                              <div className="text-xs text-gray-500">
                                Asignado a: {call.assignedTo}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <Calendar className="w-4 h-4 text-gray-400 mr-2" />
                          <div className="text-sm text-gray-900">
                            {formatDateTime(call.startTime)}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <Clock className="w-4 h-4 text-gray-400 mr-2" />
                          <div className="text-sm text-gray-900">
                            {formatDuration(call.duration)}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {getStatusIcon(call.status)}
                          <span className="ml-2 text-sm text-gray-900 capitalize">
                            {call.status.replace('_', ' ')}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getPriorityBadge(call.priority)}`}>
                          {call.priority}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleViewCall(call)}
                            className="text-blue-600 hover:text-blue-900 transition-colors"
                            title="Ver detalles"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          
                          {call.status === 'pending' && (
                            <button
                              onClick={() => handleCompleteCall(call.id)}
                              className="text-green-600 hover:text-green-900 transition-colors"
                              title="Marcar como completada"
                              disabled={completeCallMutation.isLoading}
                            >
                              <CheckCircle className="w-4 h-4" />
                            </button>
                          )}
                          
                          {(call.status === 'pending' || call.status === 'in_progress') && (
                            <button
                              onClick={() => handleCancelCall(call.id)}
                              className="text-red-600 hover:text-red-900 transition-colors"
                              title="Cancelar llamada"
                              disabled={cancelCallMutation.isLoading}
                            >
                              <PhoneOff className="w-4 h-4" />
                            </button>
                          )}
                          
                          <button
                            onClick={() => handleDeleteCall(call.id)}
                            className="text-red-600 hover:text-red-900 transition-colors"
                            title="Eliminar"
                            disabled={deleteCallMutation.isLoading}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
          </div>

          {calls.length === 0 && (
            <div className="text-center py-12">
              <Phone className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No hay llamadas</h3>
              <p className="text-gray-500">No se encontraron llamadas con los filtros aplicados.</p>
            </div>
          )}

          {/* Paginación */}
          {totalPages > 1 && (
            <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
              <div className="flex-1 flex justify-between sm:hidden">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Anterior
                </button>
                <button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Siguiente
                </button>
              </div>
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    Mostrando{' '}
                    <span className="font-medium">
                      {(currentPage - 1) * itemsPerPage + 1}
                    </span>{' '}
                    a{' '}
                    <span className="font-medium">
                      {Math.min(currentPage * itemsPerPage, totalCalls)}
                    </span>{' '}
                    de{' '}
                    <span className="font-medium">{totalCalls}</span> resultados
                  </p>
                </div>
                <div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Paginación">
                    <button
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                      className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Anterior
                    </button>
                    {[...Array(Math.min(5, totalPages))].map((_, i) => {
                      const page = currentPage <= 3 ? i + 1 : currentPage - 2 + i;
                      if (page > totalPages) return null;
                      
                      return (
                        <button
                          key={page}
                          onClick={() => setCurrentPage(page)}
                          className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                            currentPage === page
                              ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                              : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                          }`}
                        >
                          {page}
                        </button>
                      );
                    })}
                    <button
                      onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                      disabled={currentPage === totalPages}
                      className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Siguiente
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          )}
        </div>
      </motion.div>

      {/* Modal de Detalles de Llamada */}
      <AnimatePresence>
        {isModalOpen && selectedCall && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-auto"
            >
              <div className="p-6">
                <div className="flex justify-between items-start mb-6">
                  <h3 className="text-xl font-bold text-gray-900">Detalles de la Llamada</h3>
                  <button
                    onClick={() => setIsModalOpen(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <XCircle className="w-6 h-6" />
                  </button>
                </div>
                
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Número de Teléfono
                      </label>
                      <p className="text-sm text-gray-900">{selectedCall.phoneNumber}</p>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Contacto
                      </label>
                      <p className="text-sm text-gray-900">{selectedCall.contactName || 'Desconocido'}</p>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Tipo de Llamada
                      </label>
                      <div className="flex items-center">
                        {getTypeIcon(selectedCall.type)}
                        <span className="ml-2 text-sm text-gray-900 capitalize">
                          {selectedCall.type === 'incoming' ? 'Entrante' : 
                           selectedCall.type === 'outgoing' ? 'Saliente' : 
                           selectedCall.type === 'internal' ? 'Interna' : 'Emergencia'}
                        </span>
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Estado
                      </label>
                      <div className="flex items-center">
                        {getStatusIcon(selectedCall.status)}
                        <span className="ml-2 text-sm text-gray-900 capitalize">
                          {selectedCall.status.replace('_', ' ')}
                        </span>
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Prioridad
                      </label>
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getPriorityBadge(selectedCall.priority)}`}>
                        {selectedCall.priority}
                      </span>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Duración
                      </label>
                      <p className="text-sm text-gray-900">{formatDuration(selectedCall.duration)}</p>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Fecha de Inicio
                      </label>
                      <p className="text-sm text-gray-900">{formatDateTime(selectedCall.startTime)}</p>
                    </div>
                    
                    {selectedCall.endTime && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Fecha de Fin
                        </label>
                        <p className="text-sm text-gray-900">{formatDateTime(selectedCall.endTime)}</p>
                      </div>
                    )}
                  </div>
                  
                  {selectedCall.notes && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Notas
                      </label>
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <p className="text-sm text-gray-900">{selectedCall.notes}</p>
                      </div>
                    </div>
                  )}
                  
                  {selectedCall.assignedTo && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Asignado a
                      </label>
                      <p className="text-sm text-gray-900">{selectedCall.assignedTo}</p>
                    </div>
                  )}
                </div>
                
                <div className="flex justify-end space-x-4 mt-8">
                  <button
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Cerrar
                  </button>
                  
                  {selectedCall.status === 'pending' && (
                    <>
                      <button
                        onClick={() => {
                          handleCompleteCall(selectedCall.id);
                          setIsModalOpen(false);
                        }}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                        disabled={completeCallMutation.isLoading}
                      >
                        Completar Llamada
                      </button>
                      
                      <button
                        onClick={() => {
                          handleCancelCall(selectedCall.id);
                          setIsModalOpen(false);
                        }}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                        disabled={cancelCallMutation.isLoading}
                      >
                        Cancelar Llamada
                      </button>
                    </>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CallsManagement;

