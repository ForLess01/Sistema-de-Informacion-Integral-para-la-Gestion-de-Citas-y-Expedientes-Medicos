import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { 
  Calendar, Users, Settings, BarChart3,
  UserPlus, Clock, CheckSquare, Phone,
  Bell, ChevronRight, TrendingUp, FileText,
  Pill, Package, AlertTriangle, Ambulance,
  Shield, FileBarChart, Home, Cog,
  UserCog, CalendarDays, PhoneCall,
  Building, Activity, Layers
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import dashboardService from '../services/dashboardService';

// Importar componentes de administración
import UserManagement from '../components/admin/UserManagement';
import SystemSettings from '../components/admin/SystemSettings';
import NotificationCenter from '../components/notifications/NotificationCenter';
import ScheduleManagement from '../components/schedule/ScheduleManagement';
import RoomManagement from '../components/facilities/RoomManagement';

const AdminDashboard = () => {
  // Estado para manejo de tabs/modales del panel admin
  const [activeModule, setActiveModule] = useState('dashboard');
  const [showNotifications, setShowNotifications] = useState(false);

  // Obtener estadísticas del dashboard para admin
  const { data: stats, isLoading: loadingStats } = useQuery({
    queryKey: ['adminDashboardStats'],
    queryFn: dashboardService.getAdminDashboardStats,
  });

  // Obtener actividad de citas reciente
  const { data: recentAppointments, isLoading: loadingAppointments } = useQuery({
    queryKey: ['recentAppointmentActivity'],
    queryFn: dashboardService.getRecentAppointmentActivity,
  });

  // Obtener nuevos pacientes registrados
  const { data: newPatients, isLoading: loadingPatients } = useQuery({
    queryKey: ['newPatients'],
    queryFn: dashboardService.getNewPatients,
  });

  // Obtener métricas de rendimiento
  const { data: performanceMetrics, isLoading: loadingMetrics } = useQuery({
    queryKey: ['performanceMetrics'],
    queryFn: dashboardService.getPerformanceMetrics,
  });

  const statsCards = [
    {
      title: 'Citas Hoy',
      value: stats?.appointments_today || 0,
      change: stats?.appointments_change || '+0%',
      icon: Calendar,
      color: 'from-blue-500 to-blue-600',
      link: '/appointments',
    },
    {
      title: 'Pacientes Registrados',
      value: stats?.total_patients || 0,
      change: stats?.patients_change || '+0%',
      icon: Users,
      color: 'from-green-500 to-green-600',
      link: '/patients',
    },
    {
      title: 'Check-ins Hoy',
      value: stats?.checkins_today || 0,
      change: stats?.checkins_change || '+0%',
      icon: CheckSquare,
      color: 'from-purple-500 to-purple-600',
      link: '/patients/check-in',
    },
    {
      title: 'Llamadas Atendidas',
      value: stats?.calls_handled || 0,
      change: stats?.calls_change || '+0%',
      icon: Phone,
      color: 'from-orange-500 to-orange-600',
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
            <h1 className="text-3xl font-bold text-white mb-2">
              Panel de Control - Administración
            </h1>
            <p className="text-slate-200">
              {format(new Date(), "EEEE, d 'de' MMMM 'de' yyyy", { locale: es })}
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <button 
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 text-slate-200 hover:text-white transition-colors"
            >
              <Bell className="h-6 w-6" />
              {stats?.pending_notifications > 0 && (
                <span className="absolute top-0 right-0 h-2 w-2 bg-red-500 rounded-full"></span>
              )}
            </button>
          </div>
        </motion.div>

        {/* Admin Module Navigation */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-6 backdrop-blur-lg bg-white/10 rounded-2xl p-4 border border-white/20"
        >
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setActiveModule('dashboard')}
              className={`px-4 py-2 rounded-xl font-medium transition-all duration-200 flex items-center space-x-2 ${
                activeModule === 'dashboard'
                  ? 'bg-blue-500 text-white shadow-lg'
                  : 'bg-white/10 text-slate-200 hover:bg-white/20'
              }`}
            >
              <Home className="h-4 w-4" />
              <span>Dashboard</span>
            </button>
            <button
              onClick={() => setActiveModule('users')}
              className={`px-4 py-2 rounded-xl font-medium transition-all duration-200 flex items-center space-x-2 ${
                activeModule === 'users'
                  ? 'bg-blue-500 text-white shadow-lg'
                  : 'bg-white/10 text-slate-200 hover:bg-white/20'
              }`}
            >
              <UserCog className="h-4 w-4" />
              <span>Usuarios</span>
            </button>
            <button
              onClick={() => setActiveModule('schedules')}
              className={`px-4 py-2 rounded-xl font-medium transition-all duration-200 flex items-center space-x-2 ${
                activeModule === 'schedules'
                  ? 'bg-blue-500 text-white shadow-lg'
                  : 'bg-white/10 text-slate-200 hover:bg-white/20'
              }`}
            >
              <CalendarDays className="h-4 w-4" />
              <span>Horarios</span>
            </button>
            <button
              onClick={() => setActiveModule('facilities')}
              className={`px-4 py-2 rounded-xl font-medium transition-all duration-200 flex items-center space-x-2 ${
                activeModule === 'facilities'
                  ? 'bg-blue-500 text-white shadow-lg'
                  : 'bg-white/10 text-slate-200 hover:bg-white/20'
              }`}
            >
              <Building className="h-4 w-4" />
              <span>Instalaciones</span>
            </button>
            <button
              onClick={() => setActiveModule('settings')}
              className={`px-4 py-2 rounded-xl font-medium transition-all duration-200 flex items-center space-x-2 ${
                activeModule === 'settings'
                  ? 'bg-blue-500 text-white shadow-lg'
                  : 'bg-white/10 text-slate-200 hover:bg-white/20'
              }`}
            >
              <Cog className="h-4 w-4" />
              <span>Configuración</span>
            </button>
          </div>
        </motion.div>

        {/* Notification Center */}
        {showNotifications && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="mb-6 backdrop-blur-lg bg-white/10 rounded-2xl p-4 border border-white/20"
          >
            <NotificationCenter 
              onClose={() => setShowNotifications(false)}
              isVisible={showNotifications}
            />
          </motion.div>
        )}

        {/* Render Module Content */}
        {activeModule === 'users' && (
          <motion.div
            key="users"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="mb-6"
          >
            <UserManagement />
          </motion.div>
        )}

        {activeModule === 'schedules' && (
          <motion.div
            key="schedules"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="mb-6"
          >
            <ScheduleManagement />
          </motion.div>
        )}

        {activeModule === 'facilities' && (
          <motion.div
            key="facilities"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="mb-6"
          >
            <RoomManagement />
          </motion.div>
        )}

        {activeModule === 'settings' && (
          <motion.div
            key="settings"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="mb-6"
          >
            <SystemSettings />
          </motion.div>
        )}

        {/* Dashboard Content - Only show when dashboard is active */}
        {activeModule === 'dashboard' && (
          <>
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
                      <p className="text-sm text-slate-200">{stat.change}</p>
                    </div>
                  </div>
                  <h3 className="text-white/80 text-sm">{stat.title}</h3>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Actividad de Citas */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="lg:col-span-2 backdrop-blur-lg bg-white/10 rounded-2xl p-6 border border-white/20"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-white flex items-center">
                <Calendar className="h-5 w-5 mr-2 text-blue-400" />
                Actividad de Citas
              </h2>
              <Link to="/appointments" className="text-slate-300 hover:text-slate-200 text-sm flex items-center">
                Ver todas <ChevronRight className="h-4 w-4 ml-1" />
              </Link>
            </div>

            {loadingAppointments ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
              </div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {recentAppointments?.length === 0 ? (
                  <p className="text-slate-200 text-center py-8">No hay actividad reciente</p>
                ) : (
                  recentAppointments?.map((appointment) => (
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
                            appointment.status === 'cancelled' ? 'bg-red-500/20 text-red-300' :
                            appointment.status === 'completed' ? 'bg-blue-500/20 text-blue-300' :
                            'bg-gray-500/20 text-gray-300'
                          }`}>
                            {appointment.status === 'confirmed' ? 'Confirmada' :
                             appointment.status === 'pending' ? 'Pendiente' :
                             appointment.status === 'cancelled' ? 'Cancelada' :
                             appointment.status === 'completed' ? 'Completada' :
                             appointment.status}
                          </span>
                          <p className="text-xs text-slate-400 mt-1">
                            {appointment.action_time && format(new Date(appointment.action_time), 'HH:mm')}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </motion.div>

          {/* Nuevos Pacientes */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="backdrop-blur-lg bg-white/10 rounded-2xl p-6 border border-white/20"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-white flex items-center">
                <UserPlus className="h-5 w-5 mr-2 text-green-400" />
                Nuevos Pacientes
              </h2>
              <Link to="/patients/new" className="text-slate-300 hover:text-slate-200 text-sm flex items-center">
                Ver todos <ChevronRight className="h-4 w-4 ml-1" />
              </Link>
            </div>

            {loadingPatients ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
              </div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {newPatients?.length === 0 ? (
                  <p className="text-slate-200 text-center py-8">No hay pacientes nuevos</p>
                ) : (
                  newPatients?.map((patient) => (
                    <div
                      key={patient.id}
                      className="bg-white/5 rounded-xl p-4 border border-white/10"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-white font-medium">{patient.name}</h4>
                        <span className="text-xs text-slate-300">
                          {format(new Date(patient.registered_at), 'dd/MM')}
                        </span>
                      </div>
                      <p className="text-slate-200 text-sm mb-1">
                        DNI: {patient.dni}
                      </p>
                      <p className="text-slate-200 text-sm mb-2">
                        Edad: {patient.age} años
                      </p>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-300">
                          Tel: {patient.phone}
                        </span>
                        {patient.needs_appointment && (
                          <span className="px-2 py-1 bg-yellow-500/20 text-yellow-300 rounded">
                            Necesita cita
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

        {/* Métricas de Rendimiento */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mt-6 backdrop-blur-lg bg-white/10 rounded-2xl p-6 border border-white/20"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-white flex items-center">
              <BarChart3 className="h-5 w-5 mr-2 text-purple-400" />
              Métricas de Rendimiento
            </h2>
            <Link to="/reports" className="text-slate-300 hover:text-slate-200 text-sm flex items-center">
              Ver reportes <ChevronRight className="h-4 w-4 ml-1" />
            </Link>
          </div>

          {loadingMetrics ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-white font-medium">Tiempo Promedio Espera</h3>
                  <Clock className="h-5 w-5 text-blue-400" />
                </div>
                <p className="text-2xl font-bold text-white mb-1">
                  {performanceMetrics?.avg_wait_time || '0'} min
                </p>
                <p className={`text-xs ${
                  (performanceMetrics?.wait_time_change || 0) > 0 ? 'text-red-300' : 'text-green-300'
                }`}>
                  {performanceMetrics?.wait_time_change > 0 ? '+' : ''}{performanceMetrics?.wait_time_change || 0}% vs ayer
                </p>
              </div>

              <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-white font-medium">Satisfacción</h3>
                  <TrendingUp className="h-5 w-5 text-green-400" />
                </div>
                <p className="text-2xl font-bold text-white mb-1">
                  {performanceMetrics?.satisfaction_score || '0'}%
                </p>
                <p className="text-xs text-green-300">
                  +{performanceMetrics?.satisfaction_change || 0}% vs mes anterior
                </p>
              </div>

              <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-white font-medium">Cancelaciones</h3>
                  <Calendar className="h-5 w-5 text-orange-400" />
                </div>
                <p className="text-2xl font-bold text-white mb-1">
                  {performanceMetrics?.cancellation_rate || '0'}%
                </p>
                <p className={`text-xs ${
                  (performanceMetrics?.cancellation_change || 0) > 0 ? 'text-red-300' : 'text-green-300'
                }`}>
                  {performanceMetrics?.cancellation_change > 0 ? '+' : ''}{performanceMetrics?.cancellation_change || 0}% vs semana anterior
                </p>
              </div>

              <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-white font-medium">Ocupación</h3>
                  <Users className="h-5 w-5 text-purple-400" />
                </div>
                <p className="text-2xl font-bold text-white mb-1">
                  {performanceMetrics?.occupancy_rate || '0'}%
                </p>
                <p className="text-xs text-blue-300">
                  Promedio de la semana
                </p>
              </div>
            </div>
          )}
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="mt-6 backdrop-blur-lg bg-white/10 rounded-2xl p-6 border border-white/20"
        >
          <h2 className="text-xl font-semibold text-white mb-4">Acciones Rápidas</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <Link to="/appointments/new">
              <button className="w-full py-3 px-4 bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-medium rounded-xl hover:from-blue-600 hover:to-indigo-700 transition duration-200 flex items-center justify-center">
                <Calendar className="h-5 w-5 mr-2" />
                Nueva Cita
              </button>
            </Link>
            <Link to="/patients/new">
              <button className="w-full py-3 px-4 bg-white/10 text-white font-medium rounded-xl hover:bg-white/20 transition duration-200 flex items-center justify-center border border-white/20">
                <UserPlus className="h-5 w-5 mr-2" />
                Registrar Paciente
              </button>
            </Link>
            <Link to="/pharmacy/inventory">
              <button className="w-full py-3 px-4 bg-gradient-to-r from-purple-500 to-indigo-600 text-white font-medium rounded-xl hover:from-purple-600 hover:to-indigo-700 transition duration-200 flex items-center justify-center">
                <Package className="h-5 w-5 mr-2" />
                Inventario
              </button>
            </Link>
            <Link to="/pharmacy/low-stock">
              <button className="w-full py-3 px-4 bg-gradient-to-r from-red-500 to-orange-600 text-white font-medium rounded-xl hover:from-red-600 hover:to-orange-700 transition duration-200 flex items-center justify-center">
                <AlertTriangle className="h-5 w-5 mr-2" />
                Stock Bajo
              </button>
            </Link>
            <Link to="/pharmacy/medicine-entry">
              <button className="w-full py-3 px-4 bg-white/10 text-white font-medium rounded-xl hover:bg-white/20 transition duration-200 flex items-center justify-center border border-white/20">
                <Pill className="h-5 w-5 mr-2" />
                Agregar Medicamento
              </button>
            </Link>
            <Link to="/reports">
              <button className="w-full py-3 px-4 bg-white/10 text-white font-medium rounded-xl hover:bg-white/20 transition duration-200 flex items-center justify-center border border-white/20">
                <FileText className="h-5 w-5 mr-2" />
                Reportes
              </button>
            </Link>
          </div>
        </motion.div>
          </>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
