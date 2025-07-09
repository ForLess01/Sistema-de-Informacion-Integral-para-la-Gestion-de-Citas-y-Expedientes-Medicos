import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { 
  Calendar, Users, Activity, FileText, 
  AlertCircle, TrendingUp, Clock, Package,
  UserCheck, Bell, ChevronRight
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import dashboardService from '../services/dashboardService';

const MedicalDashboard = () => {
  // Obtener estadísticas del dashboard
  const { data: stats, isLoading: loadingStats } = useQuery({
    queryKey: ['dashboardStats'],
    queryFn: dashboardService.getDashboardStats,
  });

  // Obtener citas del día
  const { data: todayAppointments, isLoading: loadingAppointments } = useQuery({
    queryKey: ['todayAppointments'],
    queryFn: dashboardService.getTodayAppointments,
  });

  // Obtener pacientes en emergencia
  const { data: emergencyPatients, isLoading: loadingEmergency } = useQuery({
    queryKey: ['emergencyPatients'],
    queryFn: dashboardService.getEmergencyPatients,
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
      title: 'Pacientes Activos',
      value: stats?.active_patients || 0,
      change: stats?.patients_change || '+0%',
      icon: Users,
      color: 'from-purple-500 to-purple-600',
      link: '/patients',
    },
    {
      title: 'En Emergencia',
      value: stats?.emergency_count || 0,
      change: 'Activos',
      icon: AlertCircle,
      color: 'from-red-500 to-red-600',
      link: '/emergency',
    },
    {
      title: 'Ocupación Camas',
      value: `${stats?.bed_occupancy || 0}%`,
      change: stats?.beds_available || '0 disponibles',
      icon: Activity,
      color: 'from-green-500 to-green-600',
      link: '/beds',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex justify-between items-center mb-8"
        >
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">
              Panel de Control Médico
            </h1>
            <p className="text-gray-400">
              {format(new Date(), "EEEE, d 'de' MMMM 'de' yyyy", { locale: es })}
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <button className="relative p-2 text-gray-400 hover:text-white transition-colors">
              <Bell className="h-6 w-6" />
              <span className="absolute top-0 right-0 h-2 w-2 bg-red-500 rounded-full"></span>
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
                      <p className="text-sm text-gray-400">{stat.change}</p>
                    </div>
                  </div>
                  <h3 className="text-white/80 text-sm">{stat.title}</h3>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Citas del día */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="lg:col-span-2 backdrop-blur-lg bg-white/10 rounded-2xl p-6 border border-white/20"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-white flex items-center">
                <Calendar className="h-5 w-5 mr-2" />
                Citas de Hoy
              </h2>
              <Link to="/appointments" className="text-blue-400 hover:text-blue-300 text-sm flex items-center">
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
                  <p className="text-gray-400 text-center py-8">No hay citas programadas para hoy</p>
                ) : (
                  todayAppointments?.map((appointment) => (
                    <div
                      key={appointment.id}
                      className="bg-white/5 rounded-xl p-4 border border-white/10 hover:bg-white/10 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold">
                            {appointment.patient_name.charAt(0)}
                          </div>
                          <div>
                            <h4 className="text-white font-medium">{appointment.patient_name}</h4>
                            <p className="text-gray-400 text-sm">
                              {appointment.time} - {appointment.specialty}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                            appointment.status === 'confirmed' 
                              ? 'bg-green-500/20 text-green-300'
                              : appointment.status === 'pending'
                              ? 'bg-yellow-500/20 text-yellow-300'
                              : 'bg-gray-500/20 text-gray-300'
                          }`}>
                            {appointment.status === 'confirmed' ? 'Confirmada' : 
                             appointment.status === 'pending' ? 'Pendiente' : appointment.status}
                          </span>
                          <Link
                            to={`/appointments/${appointment.id}`}
                            className="text-blue-400 hover:text-blue-300"
                          >
                            <ChevronRight className="h-5 w-5" />
                          </Link>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </motion.div>

          {/* Pacientes en Emergencia */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="backdrop-blur-lg bg-white/10 rounded-2xl p-6 border border-white/20"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-white flex items-center">
                <AlertCircle className="h-5 w-5 mr-2 text-red-400" />
                Emergencias
              </h2>
              <Link to="/emergency" className="text-blue-400 hover:text-blue-300 text-sm flex items-center">
                Ver todas <ChevronRight className="h-4 w-4 ml-1" />
              </Link>
            </div>

            {loadingEmergency ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
              </div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {emergencyPatients?.length === 0 ? (
                  <p className="text-gray-400 text-center py-8">No hay pacientes en emergencia</p>
                ) : (
                  emergencyPatients?.map((patient) => (
                    <div
                      key={patient.id}
                      className="bg-white/5 rounded-xl p-4 border border-white/10"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-white font-medium">{patient.name}</h4>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          patient.triage === 1 ? 'bg-red-600 text-white' :
                          patient.triage === 2 ? 'bg-orange-500 text-white' :
                          patient.triage === 3 ? 'bg-yellow-500 text-white' :
                          'bg-green-500 text-white'
                        }`}>
                          Nivel {patient.triage}
                        </span>
                      </div>
                      <p className="text-gray-400 text-sm">{patient.chief_complaint}</p>
                      <p className="text-gray-500 text-xs mt-1">
                        Ingreso: {format(new Date(patient.arrival_time), 'HH:mm')}
                      </p>
                    </div>
                  ))
                )}
              </div>
            )}
          </motion.div>
        </div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mt-6 backdrop-blur-lg bg-white/10 rounded-2xl p-6 border border-white/20"
        >
          <h2 className="text-xl font-semibold text-white mb-4">Acciones Rápidas</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Link to="/patients/new">
              <button className="w-full py-3 px-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-medium rounded-xl hover:from-blue-600 hover:to-purple-700 transition duration-200 flex items-center justify-center">
                <UserCheck className="h-5 w-5 mr-2" />
                Nuevo Paciente
              </button>
            </Link>
            <Link to="/appointments/new">
              <button className="w-full py-3 px-4 bg-white/10 text-white font-medium rounded-xl hover:bg-white/20 transition duration-200 flex items-center justify-center border border-white/20">
                <Calendar className="h-5 w-5 mr-2" />
                Nueva Cita
              </button>
            </Link>
            <Link to="/prescriptions/new">
              <button className="w-full py-3 px-4 bg-white/10 text-white font-medium rounded-xl hover:bg-white/20 transition duration-200 flex items-center justify-center border border-white/20">
                <FileText className="h-5 w-5 mr-2" />
                Nueva Receta
              </button>
            </Link>
            <Link to="/lab-orders/new">
              <button className="w-full py-3 px-4 bg-white/10 text-white font-medium rounded-xl hover:bg-white/20 transition duration-200 flex items-center justify-center border border-white/20">
                <Activity className="h-5 w-5 mr-2" />
                Orden de Lab
              </button>
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default MedicalDashboard;
