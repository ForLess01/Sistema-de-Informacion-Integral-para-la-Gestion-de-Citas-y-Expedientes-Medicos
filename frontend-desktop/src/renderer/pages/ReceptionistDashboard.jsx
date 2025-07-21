import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { 
  Calendar, Users, Shield, Receipt, Phone, Clock, 
  CheckSquare, UserPlus, CreditCard, FileText,
  Bell, ChevronRight, TrendingUp, AlertTriangle,
  Building, Package, Stethoscope, Activity,
  DollarSign, Target, Award, Star, MapPin, Mail
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import dashboardService from '../services/dashboardService';

const ReceptionistDashboard = () => {
  // Obtener estadísticas del dashboard para recepcionistas
  const { data: stats, isLoading: loadingStats } = useQuery({
    queryKey: ['receptionistDashboardStats'],
    queryFn: dashboardService.getReceptionistDashboardStats,
  });

  // Obtener citas de hoy para gestión
  const { data: todayAppointments, isLoading: loadingAppointments } = useQuery({
    queryKey: ['todayAppointmentsReception'],
    queryFn: dashboardService.getTodayAppointmentsForReception,
  });

  // Obtener pacientes que necesitan atención
  const { data: pendingPatients, isLoading: loadingPatients } = useQuery({
    queryKey: ['pendingPatientsReception'],
    queryFn: dashboardService.getPendingPatientsForReception,
  });

  // Obtener tareas pendientes de recepción
  const { data: pendingTasks, isLoading: loadingTasks } = useQuery({
    queryKey: ['receptionPendingTasks'],
    queryFn: dashboardService.getReceptionPendingTasks,
  });

  const statsCards = [
    {
      title: 'Citas Hoy',
      value: stats?.appointments_today || 0,
      change: stats?.appointments_change || '+0%',
      icon: Calendar,
      color: 'from-blue-500 to-blue-600',
      link: '/reception/appointments',
    },
    {
      title: 'Check-ins Pendientes',
      value: stats?.pending_checkins || 0,
      change: stats?.checkins_change || '+0%',
      icon: CheckSquare,
      color: 'from-yellow-500 to-orange-600',
      link: '/patients/check-in',
    },
    {
      title: 'Seguros a Verificar',
      value: stats?.pending_insurance || 0,
      change: stats?.insurance_change || '+0%',
      icon: Shield,
      color: 'from-purple-500 to-purple-600',
      link: '/reception/insurance-verification',
    },
    {
      title: 'Facturas Pendientes',
      value: stats?.pending_billing || 0,
      change: stats?.billing_change || '+0%',
      icon: Receipt,
      color: 'from-green-500 to-green-600',
      link: '/reception/billing',
    },
  ];

  const quickActions = [
    {
      title: 'Nueva Cita',
      description: 'Programar cita médica',
      icon: Calendar,
      color: 'from-blue-500 to-indigo-600',
      link: '/reception/appointments/new',
    },
    {
      title: 'Registrar Paciente',
      description: 'Nuevo paciente en sistema',
      icon: UserPlus,
      color: 'from-green-500 to-emerald-600',
      link: '/reception/patient-registration',
    },
    {
      title: 'Check-in Paciente',
      description: 'Registrar llegada',
      icon: CheckSquare,
      color: 'from-purple-500 to-violet-600',
      link: '/patients/check-in',
    },
    {
      title: 'Verificar Seguro',
      description: 'Validar cobertura médica',
      icon: Shield,
      color: 'from-cyan-500 to-blue-600',
      link: '/reception/insurance-verification',
    },
    {
      title: 'Gestionar Facturación',
      description: 'Pagos y facturación',
      icon: Receipt,
      color: 'from-orange-500 to-red-600',
      link: '/reception/billing',
    },
    {
      title: 'Gestión de Llamadas',
      description: 'Registro de llamadas',
      icon: Phone,
      color: 'from-pink-500 to-rose-600',
      link: '/calls',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-800 to-indigo-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex justify-between items-center mb-8"
        >
          <div>
            <h1 className="text-3xl font-bold text-white mb-2 flex items-center">
              <Building className="h-8 w-8 mr-3 text-blue-400" />
              Panel de Recepción
            </h1>
            <p className="text-slate-200">
              {format(new Date(), "EEEE, d 'de' MMMM 'de' yyyy", { locale: es })}
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <button className="relative p-2 text-slate-200 hover:text-white transition-colors">
              <Bell className="h-6 w-6" />
              {stats?.pending_notifications > 0 && (
                <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 rounded-full flex items-center justify-center text-xs text-white">
                  {stats.pending_notifications}
                </span>
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
                      <p className={`text-sm ${
                        stat.change.startsWith('+') ? 'text-green-400' : 
                        stat.change.startsWith('-') ? 'text-red-400' : 'text-slate-200'
                      }`}>
                        {stat.change}
                      </p>
                    </div>
                  </div>
                  <h3 className="text-white/80 text-sm font-medium">{stat.title}</h3>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Citas de Hoy */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="lg:col-span-2 backdrop-blur-lg bg-white/10 rounded-2xl p-6 border border-white/20"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-white flex items-center">
                <Calendar className="h-5 w-5 mr-2 text-blue-400" />
                Citas de Hoy
              </h2>
              <Link to="/reception/appointments" className="text-slate-300 hover:text-slate-200 text-sm flex items-center">
                Ver todas <ChevronRight className="h-4 w-4 ml-1" />
              </Link>
            </div>

            {loadingAppointments ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
              </div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {todayAppointments?.length === 0 ? (
                  <p className="text-slate-200 text-center py-8">No hay citas programadas para hoy</p>
                ) : (
                  todayAppointments?.map((appointment) => (
                    <div
                      key={appointment.id}
                      className="bg-white/5 rounded-xl p-4 border border-white/10 hover:bg-white/10 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 flex items-center justify-center text-white font-semibold">
                            {appointment.patient_name.charAt(0)}
                          </div>
                          <div>
                            <h4 className="text-white font-medium">{appointment.patient_name}</h4>
                            <p className="text-slate-200 text-sm">
                              {appointment.time} - {appointment.specialty}
                            </p>
                            <p className="text-slate-300 text-sm">
                              Dr. {appointment.doctor_name}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                            appointment.status === 'confirmed' ? 'bg-green-500/20 text-green-300' :
                            appointment.status === 'pending' ? 'bg-yellow-500/20 text-yellow-300' :
                            appointment.status === 'checked_in' ? 'bg-blue-500/20 text-blue-300' :
                            'bg-gray-500/20 text-gray-300'
                          }`}>
                            {appointment.status === 'confirmed' ? 'Confirmada' :
                             appointment.status === 'pending' ? 'Pendiente' :
                             appointment.status === 'checked_in' ? 'Check-in' :
                             appointment.status}
                          </span>
                          {appointment.needs_checkin && (
                            <p className="text-orange-400 text-xs mt-1">
                              Requiere check-in
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </motion.div>

          {/* Tareas Pendientes */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="backdrop-blur-lg bg-white/10 rounded-2xl p-6 border border-white/20"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-white flex items-center">
                <Activity className="h-5 w-5 mr-2 text-orange-400" />
                Tareas Pendientes
              </h2>
            </div>

            {loadingTasks ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
              </div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {pendingTasks?.length === 0 ? (
                  <p className="text-slate-200 text-center py-8">No hay tareas pendientes</p>
                ) : (
                  pendingTasks?.map((task) => (
                    <div
                      key={task.id}
                      className="bg-white/5 rounded-xl p-4 border border-white/10"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-white font-medium">{task.title}</h4>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          task.priority === 'high' ? 'bg-red-500/20 text-red-300' :
                          task.priority === 'medium' ? 'bg-yellow-500/20 text-yellow-300' :
                          'bg-green-500/20 text-green-300'
                        }`}>
                          {task.priority === 'high' ? 'Alta' :
                           task.priority === 'medium' ? 'Media' : 'Baja'}
                        </span>
                      </div>
                      <p className="text-slate-200 text-sm mb-2">{task.description}</p>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-300">{task.type}</span>
                        {task.due_time && (
                          <span className="text-orange-400">
                            Vence: {task.due_time}
                          </span>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </motion.div>
        </div>

        {/* Acciones Rápidas */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mt-6 backdrop-blur-lg bg-white/10 rounded-2xl p-6 border border-white/20"
        >
          <h2 className="text-xl font-semibold text-white mb-6">Acciones Rápidas</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {quickActions.map((action, index) => (
              <motion.div
                key={action.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 + index * 0.1 }}
              >
                <Link to={action.link}>
                  <div className={`p-6 rounded-xl bg-gradient-to-r ${action.color} hover:scale-105 transition-all duration-200 cursor-pointer`}>
                    <div className="flex items-center mb-3">
                      <action.icon className="h-8 w-8 text-white mr-3" />
                      <div>
                        <h3 className="text-white font-semibold">{action.title}</h3>
                        <p className="text-white/80 text-sm">{action.description}</p>
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Métricas Rápidas */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="mt-6 backdrop-blur-lg bg-white/10 rounded-2xl p-6 border border-white/20"
        >
          <h2 className="text-xl font-semibold text-white mb-6">Métricas del Día</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white/5 rounded-xl p-4 border border-white/10">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-white font-medium">Tiempo Promedio Espera</h3>
                <Clock className="h-5 w-5 text-blue-400" />
              </div>
              <p className="text-2xl font-bold text-white mb-1">
                {stats?.avg_wait_time || '0'} min
              </p>
              <p className="text-xs text-green-400">
                -5 min vs ayer
              </p>
            </div>

            <div className="bg-white/5 rounded-xl p-4 border border-white/10">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-white font-medium">Satisfacción</h3>
                <Star className="h-5 w-5 text-yellow-400" />
              </div>
              <p className="text-2xl font-bold text-white mb-1">
                {stats?.satisfaction_score || '0'}%
              </p>
              <p className="text-xs text-green-400">
                +2% vs semana anterior
              </p>
            </div>

            <div className="bg-white/5 rounded-xl p-4 border border-white/10">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-white font-medium">Ingresos Hoy</h3>
                <DollarSign className="h-5 w-5 text-green-400" />
              </div>
              <p className="text-2xl font-bold text-white mb-1">
                S/. {stats?.today_revenue?.toLocaleString() || '0'}
              </p>
              <p className="text-xs text-green-400">
                +12% vs ayer
              </p>
            </div>

            <div className="bg-white/5 rounded-xl p-4 border border-white/10">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-white font-medium">Eficiencia</h3>
                <Target className="h-5 w-5 text-purple-400" />
              </div>
              <p className="text-2xl font-bold text-white mb-1">
                {stats?.efficiency_rate || '0'}%
              </p>
              <p className="text-xs text-green-400">
                +8% vs promedio
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default ReceptionistDashboard;
