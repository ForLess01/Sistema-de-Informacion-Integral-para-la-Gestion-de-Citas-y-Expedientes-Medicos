import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { 
  Search, Filter, Clock, UserCheck, AlertCircle,
  Stethoscope, Eye, ChevronRight, Users, Activity,
  SortAsc, SortDesc, RefreshCw
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Link } from 'react-router-dom';
import dashboardService from '../../services/dashboardService';

const WaitingRoom = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('waiting_time'); // 'waiting_time', 'priority', 'name', 'appointment_time'
  const [sortOrder, setSortOrder] = useState('desc'); // 'asc', 'desc'
  const [priorityFilter, setPriorityFilter] = useState('all'); // 'all', '1', '2', '3', '4', '5'

  const { data: waitingPatients, error, isLoading, refetch } = useQuery({
    queryKey: ['patientsWaitingConsultation'],
    queryFn: dashboardService.getPatientsWaitingConsultation,
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  // Filter and sort patients
  const filteredAndSortedPatients = useMemo(() => {
    if (!waitingPatients) return [];

    let filtered = waitingPatients.filter(patient => {
      const matchesSearch = patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           patient.chief_complaint.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesPriority = priorityFilter === 'all' || patient.triage_priority?.toString() === priorityFilter;
      return matchesSearch && matchesPriority;
    });

    // Sort patients
    filtered.sort((a, b) => {
      let compareValue = 0;
      
      switch (sortBy) {
        case 'waiting_time':
          compareValue = (a.waiting_time || 0) - (b.waiting_time || 0);
          break;
        case 'priority':
          compareValue = (a.triage_priority || 5) - (b.triage_priority || 5);
          break;
        case 'name':
          compareValue = a.name.localeCompare(b.name);
          break;
        case 'appointment_time':
          compareValue = new Date(a.appointment_time || 0) - new Date(b.appointment_time || 0);
          break;
        default:
          compareValue = 0;
      }
      
      return sortOrder === 'asc' ? compareValue : -compareValue;
    });

    return filtered;
  }, [waitingPatients, searchTerm, sortBy, sortOrder, priorityFilter]);

  const handleSort = (newSortBy) => {
    if (sortBy === newSortBy) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(newSortBy);
      setSortOrder('desc');
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 1: return 'bg-red-600 text-white';
      case 2: return 'bg-orange-500 text-white';
      case 3: return 'bg-yellow-500 text-white';
      case 4: return 'bg-green-500 text-white';
      case 5: return 'bg-blue-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  const getPriorityLabel = (priority) => {
    switch (priority) {
      case 1: return 'Crítico';
      case 2: return 'Urgente';
      case 3: return 'Menos Urgente';
      case 4: return 'No Urgente';
      case 5: return 'Sin Triaje';
      default: return 'Sin Clasificar';
    }
  };

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-indigo-800 to-purple-900 p-6 flex items-center justify-center">
        <div className="backdrop-blur-lg bg-white/10 rounded-2xl p-8 border border-white/20 text-center">
          <AlertCircle className="h-16 w-16 text-red-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">Error al cargar pacientes</h2>
          <p className="text-blue-200 mb-4">{error.message}</p>
          <button 
            onClick={() => refetch()}
            className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-indigo-800 to-purple-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 space-y-4 sm:space-y-0"
        >
          <div>
            <h1 className="text-3xl font-bold text-white mb-2 flex items-center">
              <UserCheck className="h-8 w-8 mr-3 text-green-400" />
              Sala de Espera
            </h1>
            <p className="text-blue-200">
              {format(new Date(), "EEEE, d 'de' MMMM 'de' yyyy", { locale: es })}
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <button 
              onClick={() => refetch()}
              className="flex items-center px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl border border-white/20 transition-colors"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Actualizar
            </button>
          </div>
        </motion.div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="backdrop-blur-lg bg-white/10 rounded-2xl p-6 border border-white/20"
          >
            <div className="flex items-center justify-between">
              <div className="p-3 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600">
                <Users className="h-6 w-6 text-white" />
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-white">{filteredAndSortedPatients.length}</p>
                <p className="text-sm text-blue-200">Pacientes</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="backdrop-blur-lg bg-white/10 rounded-2xl p-6 border border-white/20"
          >
            <div className="flex items-center justify-between">
              <div className="p-3 rounded-xl bg-gradient-to-r from-red-500 to-red-600">
                <AlertCircle className="h-6 w-6 text-white" />
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-white">
                  {filteredAndSortedPatients.filter(p => p.triage_priority <= 2).length}
                </p>
                <p className="text-sm text-blue-200">Críticos</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="backdrop-blur-lg bg-white/10 rounded-2xl p-6 border border-white/20"
          >
            <div className="flex items-center justify-between">
              <div className="p-3 rounded-xl bg-gradient-to-r from-yellow-500 to-yellow-600">
                <Clock className="h-6 w-6 text-white" />
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-white">
                  {filteredAndSortedPatients.length > 0 
                    ? Math.round(filteredAndSortedPatients.reduce((acc, p) => acc + (p.waiting_time || 0), 0) / filteredAndSortedPatients.length)
                    : 0
                  }
                </p>
                <p className="text-sm text-blue-200">Min Promedio</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="backdrop-blur-lg bg-white/10 rounded-2xl p-6 border border-white/20"
          >
            <div className="flex items-center justify-between">
              <div className="p-3 rounded-xl bg-gradient-to-r from-purple-500 to-purple-600">
                <Activity className="h-6 w-6 text-white" />
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-white">
                  {filteredAndSortedPatients.filter(p => p.triage_priority).length}
                </p>
                <p className="text-sm text-blue-200">Con Triaje</p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Search and Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="backdrop-blur-lg bg-white/10 rounded-2xl p-6 border border-white/20 mb-8"
        >
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-300 h-5 w-5" />
              <input
                type="text"
                placeholder="Buscar pacientes por nombre o motivo de consulta..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Priority Filter */}
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-300 h-5 w-5" />
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="pl-10 pr-8 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none cursor-pointer"
              >
                <option value="all">Todas las prioridades</option>
                <option value="1">Crítico (P1)</option>
                <option value="2">Urgente (P2)</option>
                <option value="3">Menos Urgente (P3)</option>
                <option value="4">No Urgente (P4)</option>
                <option value="5">Sin Triaje (P5)</option>
              </select>
            </div>

            {/* Sort Controls */}
            <div className="flex space-x-2">
              <button
                onClick={() => handleSort('priority')}
                className={`px-4 py-3 rounded-xl border transition-colors flex items-center ${
                  sortBy === 'priority'
                    ? 'bg-blue-500/20 border-blue-500 text-blue-300'
                    : 'bg-white/5 border-white/10 text-blue-200 hover:bg-white/10'
                }`}
              >
                Prioridad
                {sortBy === 'priority' && (
                  sortOrder === 'asc' ? <SortAsc className="ml-1 h-4 w-4" /> : <SortDesc className="ml-1 h-4 w-4" />
                )}
              </button>
              <button
                onClick={() => handleSort('waiting_time')}
                className={`px-4 py-3 rounded-xl border transition-colors flex items-center ${
                  sortBy === 'waiting_time'
                    ? 'bg-blue-500/20 border-blue-500 text-blue-300'
                    : 'bg-white/5 border-white/10 text-blue-200 hover:bg-white/10'
                }`}
              >
                Tiempo
                {sortBy === 'waiting_time' && (
                  sortOrder === 'asc' ? <SortAsc className="ml-1 h-4 w-4" /> : <SortDesc className="ml-1 h-4 w-4" />
                )}
              </button>
              <button
                onClick={() => handleSort('name')}
                className={`px-4 py-3 rounded-xl border transition-colors flex items-center ${
                  sortBy === 'name'
                    ? 'bg-blue-500/20 border-blue-500 text-blue-300'
                    : 'bg-white/5 border-white/10 text-blue-200 hover:bg-white/10'
                }`}
              >
                Nombre
                {sortBy === 'name' && (
                  sortOrder === 'asc' ? <SortAsc className="ml-1 h-4 w-4" /> : <SortDesc className="ml-1 h-4 w-4" />
                )}
              </button>
            </div>
          </div>
        </motion.div>

        {/* Patients List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="backdrop-blur-lg bg-white/10 rounded-2xl p-6 border border-white/20"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-white flex items-center">
              <UserCheck className="h-5 w-5 mr-2 text-green-400" />
              Lista de Pacientes ({filteredAndSortedPatients.length})
            </h2>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
            </div>
          ) : filteredAndSortedPatients.length === 0 ? (
            <div className="text-center py-12">
              <UserCheck className="h-16 w-16 text-blue-300 mx-auto mb-4" />
              <p className="text-blue-200 text-lg mb-2">
                {searchTerm || priorityFilter !== 'all'
                  ? 'No se encontraron pacientes con los filtros aplicados'
                  : 'No hay pacientes esperando consulta'
                }
              </p>
              {(searchTerm || priorityFilter !== 'all') && (
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setPriorityFilter('all');
                  }}
                  className="text-blue-300 hover:text-blue-200 underline"
                >
                  Limpiar filtros
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredAndSortedPatients.map((patient, index) => (
                <motion.div
                  key={patient.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 * (index % 6) }}
                  className="bg-white/5 rounded-xl p-5 border border-white/10 hover:bg-white/10 cursor-pointer transition-all duration-200 hover:border-white/20"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold text-sm">
                        {patient.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h4 className="text-white font-medium text-sm">{patient.name}</h4>
                        <p className="text-blue-300 text-xs">{patient.appointment_time}</p>
                      </div>
                    </div>
                    <span className={`px-2 py-1 rounded-md text-xs font-medium ${getPriorityColor(patient.triage_priority)}`}>
                      P{patient.triage_priority || 5}
                    </span>
                  </div>

                  <p className="text-blue-200 text-sm mb-3 line-clamp-2">
                    {patient.chief_complaint}
                  </p>

                  <div className="flex items-center justify-between text-xs mb-3">
                    <span className="text-blue-400 flex items-center">
                      <Clock className="h-3 w-3 mr-1" />
                      Espera: {patient.waiting_time || 0} min
                    </span>
                    <span className={`px-2 py-1 rounded text-xs ${getPriorityColor(patient.triage_priority)}`}>
                      {getPriorityLabel(patient.triage_priority)}
                    </span>
                  </div>

                  <div className="flex justify-between items-center pt-3 border-t border-white/10">
                    <div className="flex space-x-2">
                      <Link
                        to={`/consultation/new?patientId=${patient.id}`}
                        className="flex items-center px-3 py-1.5 bg-gradient-to-r from-blue-500 to-purple-600 text-white text-xs rounded-lg hover:from-blue-600 hover:to-purple-700 transition-colors"
                      >
                        <Stethoscope className="h-3 w-3 mr-1" />
                        Consulta
                      </Link>
                      <Link
                        to={`/patients/${patient.id}`}
                        className="flex items-center px-3 py-1.5 bg-white/10 text-blue-300 text-xs rounded-lg hover:bg-white/20 transition-colors border border-white/20"
                      >
                        <Eye className="h-3 w-3 mr-1" />
                        Ver
                      </Link>
                    </div>
                    <ChevronRight className="h-4 w-4 text-blue-400" />
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default WaitingRoom;

