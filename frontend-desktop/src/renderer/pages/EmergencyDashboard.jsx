import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { 
  AlertTriangle, Users, Clock, Activity,
  Zap, Heart, Phone, Plus,
  Bell, ChevronRight, TrendingUp, UserCheck
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import dashboardService from '../services/dashboardService';

const EmergencyDashboard = () => {
  // Obtener estadísticas del dashboard para emergencias
  const { data: stats, isLoading: loadingStats } = useQuery({
    queryKey: ['emergencyDashboardStats'],
    queryFn: dashboardService.getEmergencyDashboardStats,
  });

  // Obtener pacientes de emergencia ordenados por prioridad
  const { data: emergencyPatients, isLoading: loadingPatients } = useQuery({
    queryKey: ['emergencyPatients'],
    queryFn: dashboardService.getEmergencyPatients,
    refetchInterval: 10000, // Actualizar cada 10 segundos
  });

  // Obtener casos críticos activos
  const { data: criticalCases, isLoading: loadingCritical } = useQuery({
    queryKey: ['criticalCases'],
    queryFn: dashboardService.getCriticalCases,
  });

  // Obtener estadísticas de respuesta
  const { data: responseStats, isLoading: loadingResponse } = useQuery({
    queryKey: ['emergencyResponseStats'],
    queryFn: dashboardService.getEmergencyResponseStats,
  });

  const statsCards = [
    {
      title: 'Pacientes Activos',
      value: stats?.active_patients || 0,
      change: 'En emergencia',
      icon: Users,
      color: 'from-red-500 to-red-600',
      link: '/emergency/queue',
    },
    {
      title: 'Casos Críticos',
      value: stats?.critical_cases || 0,
      change: stats?.critical_change || '+0%',
      icon: AlertTriangle,
      color: 'from-red-600 to-red-700',
      link: '/emergency/critical-cases',
    },
    {
      title: 'Tiempo Promedio',
      value: `${stats?.avg_response_time || 0} min`,
      change: stats?.response_change || '+0%',
      icon: Clock,
      color: 'from-orange-500 to-orange-600',
      link: '/emergency/metrics',
    },
    {
      title: 'Ambulancias',
      value: stats?.ambulances_available || 0,
      change: 'Disponibles',
      icon: Zap,
      color: 'from-blue-500 to-blue-600',
      link: '/emergency/ambulances',
    },
  ];

  const getPriorityColor = (priority) => {
    switch(priority) {
      case 1: return 'bg-red-600 text-white border-red-500';
      case 2: return 'bg-orange-500 text-white border-orange-400';
      case 3: return 'bg-yellow-500 text-white border-yellow-400';
      case 4: return 'bg-green-500 text-white border-green-400';
      case 5: return 'bg-blue-500 text-white border-blue-400';
      default: return 'bg-gray-500 text-white border-gray-400';
    }
  };

  const getPriorityLabel = (priority) => {
    switch(priority) {
      case 1: return '🔴 INMEDIATA';
      case 2: return '🟠 MUY URGENTE';
      case 3: return '🟡 URGENTE';
      case 4: return '🟢 NORMAL';
      case 5: return '🔵 NO URGENTE';
      default: return 'SIN CLASIFICAR';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-900 via-orange-800 to-red-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex justify-between items-center mb-8"
        >
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">
              Panel de Control - Emergencias
            </h1>
            <p className="text-red-200">
              {format(new Date(), "EEEE, d 'de' MMMM 'de' yyyy HH:mm", { locale: es })}
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <button className="relative p-2 text-red-200 hover:text-white transition-colors">
              <Bell className="h-6 w-6" />
              {stats?.urgent_alerts > 0 && (
                <span className="absolute top-0 right-0 h-2 w-2 bg-yellow-400 rounded-full animate-pulse"></span>
              )}
            </button>
          </div>
        </motion.div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {statsCards.map((stat, index) => (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Link to={stat.link}>
                <div className="backdrop-blur-lg bg-white/10 rounded-2xl p-6 border border-white/20 hover:bg-white/20 transition-all duration-300 cursor-pointer">
                  <div className="flex items-center justify-between mb-4">
                    <div className={`p-3 rounded-xl bg-gradient-to-r ${stat.color}`}>
                      <stat.icon className="h-6 w-6 text-white" />
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-white">{stat.value}</p>
                      <p className="text-sm text-red-200">{stat.change}</p>
                    </div>
                  </div>
                  <h3 className="text-white/80 text-sm">{stat.title}</h3>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>

        {/* Cola de Emergencias Priorizada */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="backdrop-blur-lg bg-white/10 rounded-2xl p-6 border border-white/20 mb-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-white flex items-center">
              <AlertTriangle className="h-5 w-5 mr-2 text-red-400" />
              Cola de Emergencias (Ordenada por Prioridad)
            </h2>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-red-200">
                {emergencyPatients?.length || 0} pacientes
              </span>
              <Link to="/emergency/new" className="px-3 py-1 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition duration-200">
                <Plus className="h-4 w-4 inline mr-1" />
                Nuevo
              </Link>
            </div>
          </div>

          {loadingPatients ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
            </div>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {emergencyPatients?.length === 0 ? (
                <p className="text-red-200 text-center py-8">No hay pacientes en emergencia</p>
              ) : (
                emergencyPatients?.map((patient, index) => (
                  <div
                    key={patient.id}
                    className={`rounded-xl p-4 border-l-4 ${
                      patient.triage_priority <= 2 ? 'bg-red-500/20 border-red-500' :
                      patient.triage_priority === 3 ? 'bg-yellow-500/20 border-yellow-500' :
                      'bg-white/5 border-white/10'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="flex-shrink-0">
                          <div className="w-12 h-12 rounded-full bg-gradient-to-r from-red-500 to-orange-600 flex items-center justify-center text-white font-semibold">
                            {patient.name ? patient.name.charAt(0) : '?'}
                          </div>
                          <div className="text-xs text-center mt-1 text-red-300">
                            #{index + 1}
                          </div>
                        </div>
                        <div className="flex-grow">
                          <h4 className="text-white font-medium">{patient.name}</h4>
                          <p className="text-red-200 text-sm">
                            {patient.chief_complaint}
                          </p>
                          <div className="flex items-center space-x-4 text-sm mt-2">
                            <span className="text-red-300">
                              Llegada: {format(new Date(patient.arrival_time), 'HH:mm')}
                            </span>
                            <span className="text-red-300">
                              Edad: {patient.age}
                            </span>
                            {patient.vital_signs && (
                              <span className="text-red-300">
                                PA: {patient.vital_signs.blood_pressure} | FC: {patient.vital_signs.heart_rate}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col items-end space-y-2">
                        <span className={`px-3 py-1 rounded text-xs font-medium ${getPriorityColor(patient.triage_priority)}`}>
                          {getPriorityLabel(patient.triage_priority)}
                        </span>
                        <div className="flex items-center space-x-2">
                          <span className="text-xs text-red-300">
                            Espera: {patient.waiting_time} min
                          </span>
                          <Link
                            to={`/emergency/patient/${patient.id}`}
                            className="px-2 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700 transition duration-200"
                          >
                            Ver
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Casos Críticos */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="backdrop-blur-lg bg-white/10 rounded-2xl p-6 border border-white/20"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-white flex items-center">
                <Heart className="h-5 w-5 mr-2 text-red-400" />
                Casos Críticos Activos
              </h2>
              <Link to="/emergency/critical-cases" className="text-red-300 hover:text-red-200 text-sm flex items-center">
                Ver todos <ChevronRight className="h-4 w-4 ml-1" />
              </Link>
            </div>

            {loadingCritical ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
              </div>
            ) : (
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {criticalCases?.length === 0 ? (
                  <p className="text-red-200 text-center py-8">No hay casos críticos activos</p>
                ) : (
                  criticalCases?.map((caseItem) => (
                    <div
                      key={caseItem.id}
                      className="bg-red-500/20 rounded-xl p-4 border border-red-500/50"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-white font-medium">{caseItem.patient_name}</h4>
                        <span className="px-2 py-1 bg-red-600 text-white text-xs rounded font-medium">
                          CRÍTICO
                        </span>
                      </div>
                      <p className="text-red-200 text-sm mb-2">{caseItem.diagnosis}</p>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-red-300">
                          Habitación: {caseItem.room}
                        </span>
                        <span className="text-red-300">
                          Desde: {format(new Date(caseItem.critical_since), 'HH:mm')}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </motion.div>

          {/* Estadísticas de Respuesta */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="backdrop-blur-lg bg-white/10 rounded-2xl p-6 border border-white/20"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-white flex items-center">
                <TrendingUp className="h-5 w-5 mr-2 text-orange-400" />
                Estadísticas de Respuesta
              </h2>
            </div>

            {loadingResponse ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-white font-medium">Tiempo Respuesta P1</h3>
                    <Clock className="h-5 w-5 text-red-400" />
                  </div>
                  <p className="text-2xl font-bold text-white mb-1">
                    {responseStats?.priority_1_time || '0'} min
                  </p>
                  <p className="text-xs text-red-300">
                    Objetivo: &lt; 5 min
                  </p>
                </div>

                <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-white font-medium">Casos Atendidos Hoy</h3>
                    <UserCheck className="h-5 w-5 text-green-400" />
                  </div>
                  <p className="text-2xl font-bold text-white mb-1">
                    {responseStats?.cases_handled_today || '0'}
                  </p>
                  <p className="text-xs text-red-300">
                    +{responseStats?.cases_change || '0'}% vs ayer
                  </p>
                </div>

                <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-white font-medium">Efectividad</h3>
                    <Activity className="h-5 w-5 text-blue-400" />
                  </div>
                  <p className="text-2xl font-bold text-white mb-1">
                    {responseStats?.success_rate || '0'}%
                  </p>
                  <p className="text-xs text-red-300">
                    Casos resueltos exitosamente
                  </p>
                </div>
              </div>
            )}
          </motion.div>
        </div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="mt-6 backdrop-blur-lg bg-white/10 rounded-2xl p-6 border border-white/20"
        >
          <h2 className="text-xl font-semibold text-white mb-4">Acciones Rápidas</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Link to="/emergency/new">
              <button className="w-full py-3 px-4 bg-gradient-to-r from-red-500 to-orange-600 text-white font-medium rounded-xl hover:from-red-600 hover:to-orange-700 transition duration-200 flex items-center justify-center">
                <Plus className="h-5 w-5 mr-2" />
                Nueva Emergencia
              </button>
            </Link>
            <Link to="/emergency/triage">
              <button className="w-full py-3 px-4 bg-white/10 text-white font-medium rounded-xl hover:bg-white/20 transition duration-200 flex items-center justify-center border border-white/20">
                <AlertTriangle className="h-5 w-5 mr-2" />
                Triaje
              </button>
            </Link>
            <Link to="/emergency/ambulances">
              <button className="w-full py-3 px-4 bg-white/10 text-white font-medium rounded-xl hover:bg-white/20 transition duration-200 flex items-center justify-center border border-white/20">
                <Zap className="h-5 w-5 mr-2" />
                Ambulancias
              </button>
            </Link>
            <Link to="/emergency/reports">
              <button className="w-full py-3 px-4 bg-white/10 text-white font-medium rounded-xl hover:bg-white/20 transition duration-200 flex items-center justify-center border border-white/20">
                <TrendingUp className="h-5 w-5 mr-2" />
                Reportes
              </button>
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default EmergencyDashboard;
