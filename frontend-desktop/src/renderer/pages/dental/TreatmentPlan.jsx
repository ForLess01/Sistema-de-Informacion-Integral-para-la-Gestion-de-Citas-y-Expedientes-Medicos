import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { 
  FileText, Search, Plus, Calendar, Users, 
  Clock, DollarSign, Activity, CheckCircle, 
  ChevronRight, Eye, Edit, Trash2, AlertCircle,
  ClipboardList, Target, TrendingUp, BarChart3,
  User, Phone, MapPin, Zap, Shield, Globe
} from 'lucide-react';
import { format, addDays, differenceInDays } from 'date-fns';
import { es } from 'date-fns/locale';
import { Link } from 'react-router-dom';
import patientService from '../../services/patientService';
import dentalService from '../../services/dentalService';
import { useModuleIntegration } from '../../hooks/useModuleIntegration';
import PatientIntegrationView from '../../components/integration/PatientIntegrationView';
import ModuleNotifications from '../../components/integration/ModuleNotifications';

const TreatmentPlan = () => {
  const [selectedPatientId, setSelectedPatientId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [showNewPlanModal, setShowNewPlanModal] = useState(false);
  const queryClient = useQueryClient();

  // Obtener lista de pacientes
  const { shareData, getSharedData, subscribe, notifications } = useModuleIntegration('dental');

  const { data: patientsData, isLoading: loadingPatients } = useQuery({
    queryKey: ['dentalPatients', searchTerm],
    queryFn: () => patientService.getDentalPatients(searchTerm),
  });

  // Obtener plan de tratamiento del paciente seleccionado
  const { data: treatmentPlan, isLoading: loadingPlan } = useQuery({
    queryKey: ['treatmentPlan', selectedPatientId],
    queryFn: () => dentalService.getTreatmentPlan(selectedPatientId),
    enabled: !!selectedPatientId,
  });

  // Obtener estadísticas de planes
  const { data: planStats, isLoading: loadingStats } = useQuery({
    queryKey: ['treatmentPlanStats'],
    queryFn: () => dentalService.getTreatmentPlanStats(),
  });

  // Mutation para crear nuevo plan
  const createPlanMutation = useMutation({
    mutationFn: (planData) => dentalService.createTreatmentPlan(selectedPatientId, planData),
    onSuccess: () => {
      queryClient.invalidateQueries(['treatmentPlan', selectedPatientId]);
      setShowNewPlanModal(false);
    },
  });

  const patients = patientsData?.results || [];
  const selectedPatient = patients.find(p => p.id === selectedPatientId);

  // Integration effects
  useEffect(() => {
    if (planStats) {
      shareData('treatmentPlanStats', {
        total_plans: planStats.total_plans,
        active_plans: planStats.active_plans,
        completion_rate: planStats.completion_rate,
        avg_cost: planStats.avg_cost
      });
    }
  }, [planStats, shareData]);

  useEffect(() => {
    if (selectedPatient && treatmentPlan) {
      shareData('selectedPatientTreatmentPlan', {
        patient_id: selectedPatient.id,
        patient_name: `${selectedPatient.first_name} ${selectedPatient.last_name}`,
        plan: {
          id: treatmentPlan.id,
          name: treatmentPlan.name,
          status: treatmentPlan.status,
          priority: treatmentPlan.priority,
          total_procedures: planMetrics.totalProcedures,
          completed_procedures: planMetrics.completedProcedures,
          progress_percentage: planMetrics.progressPercentage,
          total_cost: planMetrics.totalCost,
          next_appointment: treatmentPlan.procedures?.find(p => p.status === 'scheduled')?.scheduled_date
        }
      });
    }
  }, [selectedPatient, treatmentPlan, planMetrics, shareData]);

  useEffect(() => {
    const unsubscribePatient = subscribe('patient', (data) => {
      if (data.eventType === 'patient_updated' && data.patient?.id === selectedPatientId) {
        queryClient.invalidateQueries(['dentalPatients']);
      }
    });

    const unsubscribeAppointment = subscribe('appointment', (data) => {
      if (data.eventType === 'appointment_created' || data.eventType === 'appointment_updated') {
        if (data.appointment?.patient_id === selectedPatientId) {
          queryClient.invalidateQueries(['treatmentPlan', selectedPatientId]);
        }
      }
    });

    return () => {
      unsubscribePatient();
      unsubscribeAppointment();
    };
  }, [subscribe, selectedPatientId, queryClient]);

  const tabs = [
    { id: 'overview', name: 'Resumen', icon: Target },
    { id: 'procedures', name: 'Procedimientos', icon: ClipboardList },
    { id: 'schedule', name: 'Cronograma', icon: Calendar },
    { id: 'budget', name: 'Presupuesto', icon: DollarSign },
  ];

  // Cálculos del plan
  const planMetrics = treatmentPlan ? {
    totalProcedures: treatmentPlan.procedures?.length || 0,
    completedProcedures: treatmentPlan.procedures?.filter(p => p.status === 'completed').length || 0,
    progressPercentage: treatmentPlan.procedures?.length > 0 
      ? Math.round((treatmentPlan.procedures.filter(p => p.status === 'completed').length / treatmentPlan.procedures.length) * 100)
      : 0,
    totalCost: treatmentPlan.procedures?.reduce((sum, p) => sum + (p.cost || 0), 0) || 0,
    estimatedDuration: treatmentPlan.estimated_duration || 0,
  } : {};

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
      default:
        return status;
    }
  };

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
              Planes de Tratamiento
            </h1>
            <p className="text-cyan-200">
              {format(new Date(), "EEEE, d 'de' MMMM 'de' yyyy", { locale: es })}
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setShowNewPlanModal(true)}
              disabled={!selectedPatientId}
              className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-medium rounded-xl hover:from-cyan-600 hover:to-blue-700 transition duration-200 flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Plan
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
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600">
                <FileText className="h-6 w-6 text-white" />
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-white">{planStats?.total_plans || 0}</p>
                <p className="text-sm text-cyan-200">Total Planes</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="backdrop-blur-lg bg-white/10 rounded-2xl p-6 border border-white/20"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-xl bg-gradient-to-r from-green-500 to-emerald-600">
                <CheckCircle className="h-6 w-6 text-white" />
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-white">{planStats?.active_plans || 0}</p>
                <p className="text-sm text-cyan-200">Planes Activos</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="backdrop-blur-lg bg-white/10 rounded-2xl p-6 border border-white/20"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-xl bg-gradient-to-r from-purple-500 to-violet-600">
                <TrendingUp className="h-6 w-6 text-white" />
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-white">{planStats?.completion_rate || 0}%</p>
                <p className="text-sm text-cyan-200">Tasa Éxito</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="backdrop-blur-lg bg-white/10 rounded-2xl p-6 border border-white/20"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-xl bg-gradient-to-r from-orange-500 to-red-600">
                <DollarSign className="h-6 w-6 text-white" />
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-white">S/. {planStats?.avg_cost?.toLocaleString() || 0}</p>
                <p className="text-sm text-cyan-200">Costo Promedio</p>
              </div>
            </div>
          </motion.div>
        </div>

        <ModuleNotifications notifications={notifications} />

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

              {/* Lista */}
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
                                  {patient.active_treatments} tratamientos activos
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
                    <div className="flex items-center space-x-4">
                      <div className="w-16 h-16 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 flex items-center justify-center text-white font-bold text-xl">
                        {selectedPatient.first_name?.charAt(0) || selectedPatient.name?.charAt(0) || 'P'}
                      </div>
                      <div className="flex-1">
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
                      <div className="text-right">
                        <div className="flex items-center space-x-2">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                            selectedPatient.risk_level === 'high' ? 'bg-red-500/20 text-red-300' :
                            selectedPatient.risk_level === 'medium' ? 'bg-yellow-500/20 text-yellow-300' :
                            'bg-green-500/20 text-green-300'
                          }`}>
                            Riesgo: {selectedPatient.risk_level === 'high' ? 'Alto' : 
                                    selectedPatient.risk_level === 'medium' ? 'Medio' : 'Bajo'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Plan de Tratamiento Status */}
                {treatmentPlan && (
                  <div className="mb-6 p-4 bg-gradient-to-r from-blue-500/10 to-cyan-500/10 rounded-xl border border-blue-500/20">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-white flex items-center">
                        <Target className="h-5 w-5 mr-2 text-blue-400" />
                        Plan de Tratamiento Actual
                      </h3>
                      <div className="flex items-center space-x-2">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium border ${
                          getPriorityColor(treatmentPlan.priority)
                        }`}>
                          Prioridad: {treatmentPlan.priority}
                        </span>
                        <button className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                          <Edit className="h-4 w-4 text-cyan-300" />
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-white">{planMetrics.completedProcedures}/{planMetrics.totalProcedures}</div>
                        <div className="text-sm text-cyan-300">Procedimientos</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-white">{planMetrics.progressPercentage}%</div>
                        <div className="text-sm text-cyan-300">Progreso</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-white">S/. {planMetrics.totalCost?.toLocaleString()}</div>
                        <div className="text-sm text-cyan-300">Costo Total</div>
                      </div>
                    </div>

                    {/* Barra de progreso */}
                    <div className="w-full bg-white/10 rounded-full h-3 mb-2">
                      <div 
                        className="bg-gradient-to-r from-cyan-500 to-blue-500 h-3 rounded-full transition-all duration-500"
                        style={{ width: `${planMetrics.progressPercentage}%` }}
                      ></div>
                    </div>
                    <div className="flex justify-between text-xs text-cyan-400">
                      <span>Inicio: {treatmentPlan.start_date && format(new Date(treatmentPlan.start_date), 'dd/MM/yyyy')}</span>
                      <span>Estimado: {planMetrics.estimatedDuration} semanas</span>
                    </div>
                  </div>
                )}

                {/* Tabs */}
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
                    </button>
                  ))}
                </div>

                {/* Contenido de Tabs */}
                <div className="min-h-[400px]">
                  {loadingPlan ? (
                    <div className="flex justify-center items-center h-64">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-500"></div>
                    </div>
                  ) : (
                    <>
                      {activeTab === 'overview' && (
                        <div className="space-y-6">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Información General */}
                            <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                              <h4 className="text-white font-medium mb-3 flex items-center">
                                <FileText className="h-4 w-4 mr-2 text-blue-400" />
                                Información del Plan
                              </h4>
                              <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                  <span className="text-cyan-400">Nombre:</span>
                                  <span className="text-white">{treatmentPlan?.name || 'Plan Integral'}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-cyan-400">Estado:</span>
                                  <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(treatmentPlan?.status)}`}>
                                    {getStatusText(treatmentPlan?.status)}
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-cyan-400">Doctor:</span>
                                  <span className="text-white">Dr. {treatmentPlan?.doctor_name || 'No asignado'}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-cyan-400">Creado:</span>
                                  <span className="text-white">
                                    {treatmentPlan?.created_date && format(new Date(treatmentPlan.created_date), 'dd/MM/yyyy')}
                                  </span>
                                </div>
                              </div>
                            </div>

                            {/* Próximos Procedimientos */}
                            <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                              <h4 className="text-white font-medium mb-3 flex items-center">
                                <Clock className="h-4 w-4 mr-2 text-orange-400" />
                                Próximos Procedimientos
                              </h4>
                              <div className="space-y-2">
                                {treatmentPlan?.procedures?.filter(p => p.status !== 'completed').slice(0, 3).map((procedure, index) => (
                                  <div key={index} className="flex justify-between items-center py-2 border-b border-white/10 last:border-b-0">
                                    <div>
                                      <p className="text-white text-sm font-medium">{procedure.name}</p>
                                      <p className="text-cyan-400 text-xs">
                                        {procedure.scheduled_date && format(new Date(procedure.scheduled_date), 'dd/MM/yyyy')}
                                      </p>
                                    </div>
                                    <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(procedure.status)}`}>
                                      {getStatusText(procedure.status)}
                                    </span>
                                  </div>
                                )) || (
                                  <p className="text-slate-400 text-sm">No hay procedimientos programados</p>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Notas del Plan */}
                          {treatmentPlan?.notes && (
                            <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                              <h4 className="text-white font-medium mb-3">Notas del Tratamiento</h4>
                              <p className="text-slate-300 text-sm leading-relaxed">{treatmentPlan.notes}</p>
                            </div>
                          )}
                        </div>
                      )}

                      {activeTab === 'procedures' && (
                        <div className="space-y-4">
                          <div className="flex justify-between items-center">
                            <h3 className="text-xl font-semibold text-white">Procedimientos del Plan</h3>
                            <button className="px-3 py-2 bg-cyan-500/20 text-cyan-300 rounded-lg hover:bg-cyan-500/30 transition-colors text-sm flex items-center">
                              <Plus className="h-4 w-4 mr-1" />
                              Agregar Procedimiento
                            </button>
                          </div>

                          <div className="space-y-3">
                            {treatmentPlan?.procedures?.map((procedure, index) => (
                              <motion.div
                                key={index}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 }}
                                className="bg-white/5 rounded-xl p-4 border border-white/10 hover:bg-white/10 transition-colors"
                              >
                                <div className="flex justify-between items-start mb-3">
                                  <div className="flex-1">
                                    <h4 className="text-white font-medium flex items-center">
                                      <Zap className="h-4 w-4 mr-2 text-yellow-400" />
                                      {procedure.name}
                                    </h4>
                                    <p className="text-cyan-300 text-sm">
                                      Diente: {procedure.tooth_number} | Duración: {procedure.estimated_duration || '1 sesión'}
                                    </p>
                                  </div>
                                  <div className="flex items-center space-x-2">
                                    <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(procedure.status)}`}>
                                      {getStatusText(procedure.status)}
                                    </span>
                                    <button className="text-cyan-300 hover:text-cyan-200">
                                      <Edit className="h-4 w-4" />
                                    </button>
                                  </div>
                                </div>

                                <p className="text-slate-300 text-sm mb-3">{procedure.description}</p>

                                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
                                  <div>
                                    <span className="text-cyan-400">Fecha programada:</span>
                                    <p className="text-white">
                                      {procedure.scheduled_date 
                                        ? format(new Date(procedure.scheduled_date), 'dd/MM/yyyy')
                                        : 'Por programar'}
                                    </p>
                                  </div>
                                  <div>
                                    <span className="text-cyan-400">Prioridad:</span>
                                    <p className="text-white capitalize">{procedure.priority}</p>
                                  </div>
                                  <div>
                                    <span className="text-cyan-400">Costo:</span>
                                    <p className="text-white">S/. {procedure.cost?.toLocaleString()}</p>
                                  </div>
                                  <div>
                                    <span className="text-cyan-400">Progreso:</span>
                                    <p className="text-white">{procedure.progress || 0}%</p>
                                  </div>
                                </div>

                                {procedure.progress > 0 && (
                                  <div className="mt-3">
                                    <div className="w-full bg-white/10 rounded-full h-2">
                                      <div 
                                        className="bg-gradient-to-r from-cyan-500 to-blue-500 h-2 rounded-full transition-all duration-300"
                                        style={{ width: `${procedure.progress}%` }}
                                      ></div>
                                    </div>
                                  </div>
                                )}
                              </motion.div>
                            )) || (
                              <p className="text-cyan-300 text-center py-8">No hay procedimientos en este plan</p>
                            )}
                          </div>
                        </div>
                      )}

                      {activeTab === 'schedule' && (
                        <div className="space-y-4">
                          <h3 className="text-xl font-semibold text-white">Cronograma de Tratamiento</h3>
                          
                          <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                            <div className="space-y-4">
                              {treatmentPlan?.procedures?.map((procedure, index) => (
                                <div key={index} className="flex items-center space-x-4">
                                  <div className="flex-shrink-0">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                                      procedure.status === 'completed' ? 'bg-green-500' :
                                      procedure.status === 'in_progress' ? 'bg-blue-500' :
                                      procedure.status === 'scheduled' ? 'bg-yellow-500' : 'bg-gray-500'
                                    }`}>
                                      {procedure.status === 'completed' ? (
                                        <CheckCircle className="h-4 w-4 text-white" />
                                      ) : (
                                        <span className="text-white text-xs font-bold">{index + 1}</span>
                                      )}
                                    </div>
                                  </div>
                                  <div className="flex-1">
                                    <div className="flex justify-between items-center">
                                      <h4 className="text-white font-medium">{procedure.name}</h4>
                                      <span className="text-cyan-400 text-sm">
                                        {procedure.scheduled_date 
                                          ? format(new Date(procedure.scheduled_date), 'dd/MM/yyyy')
                                          : 'Por programar'}
                                      </span>
                                    </div>
                                    <p className="text-slate-300 text-sm">Diente {procedure.tooth_number}</p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}

                      {activeTab === 'budget' && (
                        <div className="space-y-6">
                          <h3 className="text-xl font-semibold text-white">Presupuesto del Tratamiento</h3>
                          
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                              <h4 className="text-white font-medium mb-2">Costo Total</h4>
                              <p className="text-3xl font-bold text-cyan-400">
                                S/. {planMetrics.totalCost?.toLocaleString()}
                              </p>
                            </div>
                            <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                              <h4 className="text-white font-medium mb-2">Pagado</h4>
                              <p className="text-3xl font-bold text-green-400">
                                S/. {treatmentPlan?.amount_paid?.toLocaleString() || 0}
                              </p>
                            </div>
                            <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                              <h4 className="text-white font-medium mb-2">Pendiente</h4>
                              <p className="text-3xl font-bold text-orange-400">
                                S/. {(planMetrics.totalCost - (treatmentPlan?.amount_paid || 0))?.toLocaleString()}
                              </p>
                            </div>
                          </div>

                          <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                            <h4 className="text-white font-medium mb-4">Desglose por Procedimiento</h4>
                            <div className="space-y-3">
                              {treatmentPlan?.procedures?.map((procedure, index) => (
                                <div key={index} className="flex justify-between items-center py-2 border-b border-white/10 last:border-b-0">
                                  <div>
                                    <p className="text-white font-medium">{procedure.name}</p>
                                    <p className="text-cyan-400 text-sm">Diente {procedure.tooth_number}</p>
                                  </div>
                                  <div className="text-right">
                                    <p className="text-white font-medium">S/. {procedure.cost?.toLocaleString()}</p>
                                    <p className="text-slate-400 text-xs">{procedure.payment_status || 'Pendiente'}</p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="backdrop-blur-lg bg-white/10 rounded-2xl p-12 border border-white/20 text-center"
              >
                <FileText className="h-16 w-16 text-slate-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">Selecciona un Paciente</h3>
                <p className="text-cyan-300">Elige un paciente de la lista para ver o crear su plan de tratamiento</p>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TreatmentPlan;
