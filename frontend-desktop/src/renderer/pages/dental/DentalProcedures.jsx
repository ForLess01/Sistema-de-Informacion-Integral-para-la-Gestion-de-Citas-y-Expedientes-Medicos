import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { 
  Zap, Search, Plus, Calendar, Users, 
  Clock, DollarSign, Activity, CheckCircle, 
  ChevronRight, Eye, Edit, Trash2, AlertCircle,
  ClipboardList, Target, TrendingUp, BarChart3,
  User, Phone, MapPin, Shield, FileText,
  Play, Pause, Square, Timer, Settings,
  Award, Star, Stethoscope, Pill, X, Bell, Share2
} from 'lucide-react';
import { format, differenceInDays, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { Link } from 'react-router-dom';
import patientService from '../../services/patientService';
import dentalService from '../../services/dentalService';
import { useModuleIntegration } from '../../hooks/useModuleIntegration';
import PatientIntegrationView from '../../components/integration/PatientIntegrationView';
import ModuleNotifications from '../../components/integration/ModuleNotifications';

const DentalProcedures = () => {
  const [selectedPatientId, setSelectedPatientId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('active');
  const [selectedProcedure, setSelectedProcedure] = useState(null);
  const [showNewProcedureModal, setShowNewProcedureModal] = useState(false);
  const [showProcedureDetail, setShowProcedureDetail] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const [showPatientIntegration, setShowPatientIntegration] = useState(false);
  const queryClient = useQueryClient();

  // Module integration hook
  const { shareData, getSharedData, subscribe, notifications } = useModuleIntegration('dental');

  // Module integration effects
  useEffect(() => {
    if (stats) {
      shareData('dentalProcedureStats', {
        totalProcedures: stats.total_procedures,
        activeProcedures: stats.active_procedures,
        completedToday: stats.completed_today,
        successRate: stats.success_rate,
        avgDuration: stats.avg_duration,
        proceduresThisWeek: stats.procedures_this_week,
        timestamp: new Date().toISOString()
      });
    }
  }, [stats, shareData]);

  // Share selected patient data for cross-module integration
  useEffect(() => {
    if (selectedPatient) {
      shareData('selectedPatient', {
        id: selectedPatient.id,
        name: selectedPatient.first_name && selectedPatient.last_name 
          ? `${selectedPatient.first_name} ${selectedPatient.last_name}`
          : selectedPatient.name,
        dni: selectedPatient.dni,
        phone: selectedPatient.phone,
        module: 'dental',
        lastAccessed: new Date().toISOString()
      });
    }
  }, [selectedPatient, shareData]);

  // Subscribe to patient updates from other modules
  useEffect(() => {
    const unsubscribePatient = subscribe('patientUpdate', (data) => {
      if (data.patientId === selectedPatientId) {
        queryClient.invalidateQueries(['dentalPatients']);
        queryClient.invalidateQueries(['patientProcedures', selectedPatientId]);
      }
    });

    const unsubscribeAppointment = subscribe('appointmentUpdate', (data) => {
      if (data.patientId === selectedPatientId) {
        queryClient.invalidateQueries(['patientProcedures', selectedPatientId]);
      }
    });

    return () => {
      unsubscribePatient();
      unsubscribeAppointment();
    };
  }, [subscribe, selectedPatientId, queryClient]);

  // Obtener lista de pacientes
  const { data: patientsData, isLoading: loadingPatients } = useQuery({
    queryKey: ['dentalPatients', searchTerm],
    queryFn: () => patientService.getDentalPatients(searchTerm),
  });

  // Obtener procedimientos del paciente seleccionado
  const { data: patientProcedures, isLoading: loadingProcedures } = useQuery({
    queryKey: ['patientProcedures', selectedPatientId],
    queryFn: () => dentalService.getPatientProcedures(selectedPatientId),
    enabled: !!selectedPatientId,
  });

  // Obtener estadísticas de procedimientos
  const { data: procedureStats, isLoading: loadingStats } = useQuery({
    queryKey: ['dentalProcedureStats'],
    queryFn: () => dentalService.getDentalProcedureStats(),
  });

  // Obtener tratamientos activos
  const { data: activeTreatments, isLoading: loadingTreatments } = useQuery({
    queryKey: ['activeTreatments', selectedPatientId],
    queryFn: () => dentalService.getPatientTreatments(selectedPatientId),
    enabled: !!selectedPatientId,
  });

  // Mutation para crear nuevo procedimiento
  const createProcedureMutation = useMutation({
    mutationFn: (procedureData) => dentalService.createProcedure(selectedPatientId, procedureData),
    onSuccess: () => {
      queryClient.invalidateQueries(['patientProcedures', selectedPatientId]);
      setShowNewProcedureModal(false);
    },
  });

  // Mutation para actualizar procedimiento
  const updateProcedureMutation = useMutation({
    mutationFn: ({ procedureId, data }) => dentalService.updateProcedure(procedureId, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['patientProcedures', selectedPatientId]);
    },
  });

  const patients = patientsData?.results || [];
  const selectedPatient = patients.find(p => p.id === selectedPatientId);

  const tabs = [
    { id: 'active', name: 'Activos', icon: Play, count: patientProcedures?.filter(p => p.status === 'in_progress').length || 0 },
    { id: 'completed', name: 'Completados', icon: CheckCircle, count: patientProcedures?.filter(p => p.status === 'completed').length || 0 },
    { id: 'scheduled', name: 'Programados', icon: Calendar, count: patientProcedures?.filter(p => p.status === 'scheduled').length || 0 },
    { id: 'all', name: 'Todos', icon: ClipboardList, count: patientProcedures?.length || 0 },
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'bg-green-500/20 text-green-300';
      case 'in_progress':
        return 'bg-blue-500/20 text-blue-300';
      case 'scheduled':
        return 'bg-yellow-500/20 text-yellow-300';
      case 'pending':
        return 'bg-gray-500/20 text-gray-300';
      case 'cancelled':
        return 'bg-red-500/20 text-red-300';
      default:
        return 'bg-slate-500/20 text-slate-300';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'completed':
        return 'Completado';
      case 'in_progress':
        return 'En Progreso';
      case 'scheduled':
        return 'Programado';
      case 'pending':
        return 'Pendiente';
      case 'cancelled':
        return 'Cancelado';
      default:
        return status;
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-500/20 text-red-300 border-red-500/30';
      case 'high':
        return 'bg-orange-500/20 text-orange-300 border-orange-500/30';
      case 'medium':
        return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30';
      case 'low':
        return 'bg-green-500/20 text-green-300 border-green-500/30';
      default:
        return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
    }
  };

  const getPriorityText = (priority) => {
    switch (priority) {
      case 'urgent':
        return 'Urgente';
      case 'high':
        return 'Alta';
      case 'medium':
        return 'Media';
      case 'low':
        return 'Baja';
      default:
        return priority;
    }
  };

  // Filtrar procedimientos según el tab activo y filtros
  const filteredProcedures = patientProcedures?.filter(procedure => {
    const statusFilter = activeTab === 'all' || procedure.status === activeTab || 
                        (activeTab === 'active' && procedure.status === 'in_progress');
    const priorityFilter = filterPriority === 'all' || procedure.priority === filterPriority;
    return statusFilter && priorityFilter;
  }) || [];

  // Funciones auxiliares
  const handleStartProcedure = async (procedureId) => {
    try {
      await updateProcedureMutation.mutateAsync({
        procedureId,
        data: { status: 'in_progress', start_time: new Date().toISOString() }
      });
    } catch (error) {
      console.error('Error starting procedure:', error);
    }
  };

  const handleCompleteProcedure = async (procedureId) => {
    try {
      await updateProcedureMutation.mutateAsync({
        procedureId,
        data: { 
          status: 'completed', 
          completion_time: new Date().toISOString(),
          progress: 100 
        }
      });
    } catch (error) {
      console.error('Error completing procedure:', error);
    }
  };

  const handlePauseProcedure = async (procedureId) => {
    try {
      await updateProcedureMutation.mutateAsync({
        procedureId,
        data: { status: 'pending', pause_time: new Date().toISOString() }
      });
    } catch (error) {
      console.error('Error pausing procedure:', error);
    }
  };

  // Mock data para estadísticas mientras no esté el endpoint
  const mockStats = {
    total_procedures: 156,
    active_procedures: 23,
    completed_today: 8,
    success_rate: 94,
    avg_duration: 45, // minutos
    procedures_this_week: 34,
  };

  const stats = procedureStats || mockStats;

  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-900 via-blue-800 to-teal-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex justify-between items-center mb-8"
        >
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">
              Procedimientos Dentales
            </h1>
            <p className="text-cyan-200">
              {format(new Date(), "EEEE, d 'de' MMMM 'de' yyyy", { locale: es })}
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <Link
              to="/dental/treatment-plan"
              className="px-4 py-2 bg-white/10 text-white font-medium rounded-xl hover:bg-white/20 transition duration-200 flex items-center border border-white/20"
            >
              <Target className="h-4 w-4 mr-2" />
              Planes de Tratamiento
            </Link>
            <button
              onClick={() => setShowNewProcedureModal(true)}
              disabled={!selectedPatientId}
              className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-medium rounded-xl hover:from-cyan-600 hover:to-blue-700 transition duration-200 flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Procedimiento
            </button>
          </div>
        </motion.div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="backdrop-blur-lg bg-white/10 rounded-2xl p-4 border border-white/20"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 rounded-lg bg-gradient-to-r from-blue-500 to-indigo-600">
                <ClipboardList className="h-4 w-4 text-white" />
              </div>
              <div className="text-right">
                <p className="text-xl font-bold text-white">{stats.total_procedures}</p>
                <p className="text-xs text-cyan-200">Total</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="backdrop-blur-lg bg-white/10 rounded-2xl p-4 border border-white/20"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 rounded-lg bg-gradient-to-r from-orange-500 to-red-600">
                <Play className="h-4 w-4 text-white" />
              </div>
              <div className="text-right">
                <p className="text-xl font-bold text-white">{stats.active_procedures}</p>
                <p className="text-xs text-cyan-200">Activos</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="backdrop-blur-lg bg-white/10 rounded-2xl p-4 border border-white/20"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 rounded-lg bg-gradient-to-r from-green-500 to-emerald-600">
                <CheckCircle className="h-4 w-4 text-white" />
              </div>
              <div className="text-right">
                <p className="text-xl font-bold text-white">{stats.completed_today}</p>
                <p className="text-xs text-cyan-200">Hoy</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="backdrop-blur-lg bg-white/10 rounded-2xl p-4 border border-white/20"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 rounded-lg bg-gradient-to-r from-purple-500 to-violet-600">
                <Award className="h-4 w-4 text-white" />
              </div>
              <div className="text-right">
                <p className="text-xl font-bold text-white">{stats.success_rate}%</p>
                <p className="text-xs text-cyan-200">Éxito</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="backdrop-blur-lg bg-white/10 rounded-2xl p-4 border border-white/20"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600">
                <Timer className="h-4 w-4 text-white" />
              </div>
              <div className="text-right">
                <p className="text-xl font-bold text-white">{stats.avg_duration}m</p>
                <p className="text-xs text-cyan-200">Promedio</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="backdrop-blur-lg bg-white/10 rounded-2xl p-4 border border-white/20"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 rounded-lg bg-gradient-to-r from-yellow-500 to-orange-600">
                <TrendingUp className="h-4 w-4 text-white" />
              </div>
              <div className="text-right">
                <p className="text-xl font-bold text-white">{stats.procedures_this_week}</p>
                <p className="text-xs text-cyan-200">Esta semana</p>
              </div>
            </div>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Lista de Pacientes */}
          <div className="lg:col-span-1">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="backdrop-blur-lg bg-white/10 rounded-2xl p-6 border border-white/20 h-fit"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-white flex items-center">
                  <Users className="h-5 w-5 mr-2 text-cyan-400" />
                  Pacientes
                </h2>
              </div>

              {/* Búsqueda */}
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-5 w-5" />
                <input
                  type="text"
                  placeholder="Buscar pacientes..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>

              {/* Lista de Pacientes */}
              <div className="space-y-3 max-h-[600px] overflow-y-auto">
                {loadingPatients ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-500"></div>
                  </div>
                ) : patients.length === 0 ? (
                  <p className="text-cyan-200 text-center py-8">No se encontraron pacientes</p>
                ) : (
                  patients.map((patient, index) => (
                    <motion.div
                      key={patient.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      onClick={() => setSelectedPatientId(patient.id)}
                      className={`p-4 rounded-xl border cursor-pointer transition-all duration-200 ${
                        selectedPatientId === patient.id
                          ? 'bg-cyan-500/20 border-cyan-500/50'
                          : 'bg-white/5 border-white/10 hover:bg-white/10'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 flex items-center justify-center text-white font-semibold">
                            {patient.first_name?.charAt(0) || patient.name?.charAt(0) || 'P'}
                          </div>
                          <div>
                            <h4 className="text-white font-medium">
                              {patient.first_name && patient.last_name 
                                ? `${patient.first_name} ${patient.last_name}`
                                : patient.name || 'Sin nombre'}
                            </h4>
                            <p className="text-cyan-300 text-sm">
                              DNI: {patient.dni || 'N/A'}
                            </p>
                            {patient.active_treatments > 0 && (
                              <div className="flex items-center mt-1">
                                <Activity className="h-3 w-3 text-orange-400 mr-1" />
                                <span className="text-xs text-orange-400">
                                  {patient.active_treatments} tratamientos
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                        <ChevronRight className="h-5 w-5 text-slate-400" />
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            </motion.div>
          </div>

          {/* Contenido Principal */}
          <div className="lg:col-span-2">
            {selectedPatientId ? (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="backdrop-blur-lg bg-white/10 rounded-2xl p-6 border border-white/20"
              >
                {/* Header del Paciente */}
                {selectedPatient && (
                  <div className="mb-6 p-4 bg-white/5 rounded-xl border border-white/10">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="w-16 h-16 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 flex items-center justify-center text-white font-bold text-xl">
                          {selectedPatient.first_name?.charAt(0) || selectedPatient.name?.charAt(0) || 'P'}
                        </div>
                        <div>
                          <h3 className="text-2xl font-bold text-white mb-1">
                            {selectedPatient.first_name && selectedPatient.last_name 
                              ? `${selectedPatient.first_name} ${selectedPatient.last_name}`
                              : selectedPatient.name || 'Sin nombre'}
                          </h3>
                          <div className="flex flex-wrap gap-4 text-sm text-cyan-300">
                            <span>DNI: {selectedPatient.dni || 'N/A'}</span>
                            <span>Edad: {selectedPatient.age || 'N/A'} años</span>
                            <span>Tel: {selectedPatient.phone || 'N/A'}</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <Link
                          to={`/dental/history?patient=${selectedPatientId}`}
                          className="px-3 py-2 bg-cyan-500/20 text-cyan-300 rounded-lg hover:bg-cyan-500/30 transition-colors text-sm flex items-center"
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          Ver Historial
                        </Link>
                      </div>
                    </div>
                  </div>
                )}

                {/* Tabs de Procedimientos */}
                <div className="flex flex-wrap gap-2 mb-6">
                  {tabs.map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center ${
                        activeTab === tab.id
                          ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                          : 'bg-white/5 text-slate-300 hover:bg-white/10'
                      }`}
                    >
                      <tab.icon className="h-4 w-4 mr-2" />
                      {tab.name}
                      {tab.count > 0 && (
                        <span className="ml-2 px-2 py-1 bg-cyan-500/30 text-cyan-200 rounded-full text-xs">
                          {tab.count}
                        </span>
                      )}
                    </button>
                  ))}
                </div>

                {/* Filtros */}
                <div className="flex items-center space-x-4 mb-6">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-cyan-400">Prioridad:</span>
                    <select
                      value={filterPriority}
                      onChange={(e) => setFilterPriority(e.target.value)}
                      className="px-3 py-1 bg-white/5 border border-white/20 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    >
                      <option value="all">Todas</option>
                      <option value="urgent">Urgente</option>
                      <option value="high">Alta</option>
                      <option value="medium">Media</option>
                      <option value="low">Baja</option>
                    </select>
                  </div>
                </div>

                {/* Lista de Procedimientos */}
                <div className="space-y-4">
                  {loadingProcedures ? (
                    <div className="flex justify-center items-center h-64">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-500"></div>
                    </div>
                  ) : filteredProcedures.length === 0 ? (
                    <div className="text-center py-12">
                      <Zap className="h-16 w-16 text-slate-400 mx-auto mb-4" />
                      <h3 className="text-xl font-semibold text-white mb-2">
                        No hay procedimientos {activeTab !== 'all' ? tabs.find(t => t.id === activeTab)?.name.toLowerCase() : ''}
                      </h3>
                      <p className="text-cyan-300 mb-4">
                        {activeTab === 'all' 
                          ? 'Comienza registrando un nuevo procedimiento dental'
                          : `No se encontraron procedimientos ${tabs.find(t => t.id === activeTab)?.name.toLowerCase()}`
                        }
                      </p>
                      <button
                        onClick={() => setShowNewProcedureModal(true)}
                        className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-medium rounded-xl hover:from-cyan-600 hover:to-blue-700 transition duration-200 flex items-center mx-auto"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Nuevo Procedimiento
                      </button>
                    </div>
                  ) : (
                    filteredProcedures.map((procedure, index) => (
                      <motion.div
                        key={procedure.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="bg-white/5 rounded-xl p-6 border border-white/10 hover:bg-white/10 transition-colors"
                      >
                        <div className="flex justify-between items-start mb-4">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-2">
                              <Zap className="h-5 w-5 text-yellow-400" />
                              <h4 className="text-white font-semibold text-lg">{procedure.name}</h4>
                              <span className={`px-2 py-1 rounded text-xs font-medium border ${getPriorityColor(procedure.priority)}`}>
                                {getPriorityText(procedure.priority)}
                              </span>
                            </div>
                            <p className="text-cyan-300 text-sm mb-2">
                              Diente: {procedure.tooth_number} | 
                              Duración estimada: {procedure.estimated_duration || '30 min'}
                            </p>
                            {procedure.description && (
                              <p className="text-slate-300 text-sm mb-3">{procedure.description}</p>
                            )}
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(procedure.status)}`}>
                              {getStatusText(procedure.status)}
                            </span>
                            <button
                              onClick={() => {
                                setSelectedProcedure(procedure);
                                setShowProcedureDetail(true);
                              }}
                              className="text-cyan-300 hover:text-cyan-200 p-1"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                            <button className="text-cyan-300 hover:text-cyan-200 p-1">
                              <Edit className="h-4 w-4" />
                            </button>
                          </div>
                        </div>

                        {/* Información del procedimiento */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs mb-4">
                          <div>
                            <span className="text-cyan-400">Fecha programada:</span>
                            <p className="text-white">
                              {procedure.scheduled_date 
                                ? format(parseISO(procedure.scheduled_date), 'dd/MM/yyyy HH:mm')
                                : 'Por programar'}
                            </p>
                          </div>
                          <div>
                            <span className="text-cyan-400">Doctor:</span>
                            <p className="text-white">Dr. {procedure.doctor_name || 'Martinez'}</p>
                          </div>
                          <div>
                            <span className="text-cyan-400">Costo:</span>
                            <p className="text-white">S/. {procedure.cost?.toLocaleString() || '0'}</p>
                          </div>
                          <div>
                            <span className="text-cyan-400">Progreso:</span>
                            <p className="text-white">{procedure.progress || 0}%</p>
                          </div>
                        </div>

                        {/* Barra de progreso */}
                        {procedure.progress > 0 && (
                          <div className="mb-4">
                            <div className="w-full bg-white/10 rounded-full h-2">
                              <div 
                                className="bg-gradient-to-r from-cyan-500 to-blue-500 h-2 rounded-full transition-all duration-300"
                                style={{ width: `${procedure.progress}%` }}
                              ></div>
                            </div>
                          </div>
                        )}

                        {/* Acciones del procedimiento */}
                        <div className="flex items-center justify-between pt-4 border-t border-white/10">
                          <div className="flex items-center space-x-2">
                            {procedure.status === 'scheduled' && (
                              <button
                                onClick={() => handleStartProcedure(procedure.id)}
                                className="px-3 py-1 bg-green-500/20 text-green-300 rounded-lg hover:bg-green-500/30 transition-colors text-sm flex items-center"
                              >
                                <Play className="h-3 w-3 mr-1" />
                                Iniciar
                              </button>
                            )}
                            {procedure.status === 'in_progress' && (
                              <>
                                <button
                                  onClick={() => handlePauseProcedure(procedure.id)}
                                  className="px-3 py-1 bg-yellow-500/20 text-yellow-300 rounded-lg hover:bg-yellow-500/30 transition-colors text-sm flex items-center"
                                >
                                  <Pause className="h-3 w-3 mr-1" />
                                  Pausar
                                </button>
                                <button
                                  onClick={() => handleCompleteProcedure(procedure.id)}
                                  className="px-3 py-1 bg-blue-500/20 text-blue-300 rounded-lg hover:bg-blue-500/30 transition-colors text-sm flex items-center"
                                >
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                  Completar
                                </button>
                              </>
                            )}
                          </div>
                          <div className="flex items-center space-x-2 text-xs text-cyan-400">
                            {procedure.created_at && (
                              <span>
                                Creado: {format(parseISO(procedure.created_at), 'dd/MM')}
                              </span>
                            )}
                            {procedure.completed_at && (
                              <span>
                                Completado: {format(parseISO(procedure.completed_at), 'dd/MM')}
                              </span>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    ))
                  )}
                </div>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="backdrop-blur-lg bg-white/10 rounded-2xl p-12 border border-white/20 text-center"
              >
                <Zap className="h-16 w-16 text-slate-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">Selecciona un Paciente</h3>
                <p className="text-cyan-300">Elige un paciente de la lista para ver y gestionar sus procedimientos dentales</p>
              </motion.div>
            )}
          </div>
        </div>

        {/* Modal de Detalle de Procedimiento */}
        {showProcedureDetail && selectedProcedure && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-slate-900 rounded-2xl p-6 border border-white/20 max-w-2xl w-full max-h-[80vh] overflow-y-auto"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold text-white">Detalle del Procedimiento</h3>
                <button
                  onClick={() => setShowProcedureDetail(false)}
                  className="text-slate-400 hover:text-white transition-colors"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <div className="space-y-6">
                {/* Información básica */}
                <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                  <h4 className="text-white font-semibold mb-3 flex items-center">
                    <Zap className="h-4 w-4 mr-2 text-yellow-400" />
                    {selectedProcedure.name}
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-cyan-400">Estado:</span>
                      <p className="text-white">{getStatusText(selectedProcedure.status)}</p>
                    </div>
                    <div>
                      <span className="text-cyan-400">Prioridad:</span>
                      <p className="text-white">{getPriorityText(selectedProcedure.priority)}</p>
                    </div>
                    <div>
                      <span className="text-cyan-400">Diente:</span>
                      <p className="text-white">{selectedProcedure.tooth_number}</p>
                    </div>
                    <div>
                      <span className="text-cyan-400">Duración:</span>
                      <p className="text-white">{selectedProcedure.estimated_duration || '30 min'}</p>
                    </div>
                  </div>
                </div>

                {/* Descripción */}
                {selectedProcedure.description && (
                  <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                    <h4 className="text-white font-semibold mb-2">Descripción</h4>
                    <p className="text-slate-300 text-sm">{selectedProcedure.description}</p>
                  </div>
                )}

                {/* Fechas importantes */}
                <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                  <h4 className="text-white font-semibold mb-3">Cronología</h4>
                  <div className="space-y-2 text-sm">
                    {selectedProcedure.created_at && (
                      <div className="flex justify-between">
                        <span className="text-cyan-400">Creado:</span>
                        <span className="text-white">
                          {format(parseISO(selectedProcedure.created_at), 'dd/MM/yyyy HH:mm')}
                        </span>
                      </div>
                    )}
                    {selectedProcedure.scheduled_date && (
                      <div className="flex justify-between">
                        <span className="text-cyan-400">Programado:</span>
                        <span className="text-white">
                          {format(parseISO(selectedProcedure.scheduled_date), 'dd/MM/yyyy HH:mm')}
                        </span>
                      </div>
                    )}
                    {selectedProcedure.started_at && (
                      <div className="flex justify-between">
                        <span className="text-cyan-400">Iniciado:</span>
                        <span className="text-white">
                          {format(parseISO(selectedProcedure.started_at), 'dd/MM/yyyy HH:mm')}
                        </span>
                      </div>
                    )}
                    {selectedProcedure.completed_at && (
                      <div className="flex justify-between">
                        <span className="text-cyan-400">Completado:</span>
                        <span className="text-white">
                          {format(parseISO(selectedProcedure.completed_at), 'dd/MM/yyyy HH:mm')}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Notas adicionales */}
                {selectedProcedure.notes && (
                  <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                    <h4 className="text-white font-semibold mb-2">Notas</h4>
                    <p className="text-slate-300 text-sm">{selectedProcedure.notes}</p>
                  </div>
                )}
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowProcedureDetail(false)}
                  className="px-4 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors"
                >
                  Cerrar
                </button>
                <button className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-lg hover:from-cyan-600 hover:to-blue-700 transition duration-200 flex items-center">
                  <Edit className="h-4 w-4 mr-2" />
                  Editar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DentalProcedures;
