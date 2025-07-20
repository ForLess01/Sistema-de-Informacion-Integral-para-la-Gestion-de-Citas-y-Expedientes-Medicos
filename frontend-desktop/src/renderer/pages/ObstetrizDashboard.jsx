import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { 
  Calendar, Users, Activity, FileText, 
  AlertCircle, Heart, Baby, Clock,
  UserCheck, Bell, ChevronRight, 
  Stethoscope, TrendingUp
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import dashboardService from '../services/dashboardService';

const ObstetrizDashboard = () => {
  // Obtener estadísticas del dashboard específicas para obstetricia
  const { data: stats, isLoading: loadingStats } = useQuery({
    queryKey: ['obstetrizDashboardStats'],
    queryFn: dashboardService.getObstetrizDashboardStats,
  });

  // Obtener citas del día para obstetricia
  const { data: todayAppointments, isLoading: loadingAppointments } = useQuery({
    queryKey: ['obstetrizTodayAppointments'],
    queryFn: dashboardService.getObstetrizTodayAppointments,
  });

  // Obtener pacientes embarazadas en seguimiento
  const { data: pregnantPatients, isLoading: loadingPregnant } = useQuery({
    queryKey: ['pregnantPatients'],
    queryFn: dashboardService.getPregnantPatients,
  });

  const statsCards = [
    {
      title: 'Citas Hoy',
      value: stats?.appointments_today || 0,
      change: stats?.appointments_change || '+0%',
      icon: Calendar,
      color: 'from-pink-500 to-pink-600',
      link: '/appointments',
    },
    {
      title: 'Pacientes Embarazadas',
      value: stats?.pregnant_patients || 0,
      change: stats?.pregnant_change || '+0%',
      icon: Baby,
      color: 'from-purple-500 to-purple-600',
      link: '/pregnant-patients',
    },
    {
      title: 'Partos Programados',
      value: stats?.scheduled_births || 0,
      change: 'Esta semana',
      icon: Heart,
      color: 'from-rose-500 to-rose-600',
      link: '/scheduled-births',
    },
    {
      title: 'Controles Prenatales',
      value: stats?.prenatal_controls || 0,
      change: stats?.controls_change || '+0%',
      icon: Stethoscope,
      color: 'from-indigo-500 to-indigo-600',
      link: '/prenatal-controls',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-900 via-purple-800 to-rose-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex justify-between items-center mb-8"
        >
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">
              Panel de Control - Obstetricia
            </h1>
            <p className="text-pink-200">
              {format(new Date(), "EEEE, d 'de' MMMM 'de' yyyy", { locale: es })}
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <button className="relative p-2 text-pink-200 hover:text-white transition-colors">
              <Bell className="h-6 w-6" />
              <span className="absolute top-0 right-0 h-2 w-2 bg-pink-500 rounded-full"></span>
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
                      <p className="text-sm text-pink-200">{stat.change}</p>
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
                Citas de Hoy - Obstetricia
              </h2>
              <Link to="/appointments" className="text-pink-300 hover:text-pink-200 text-sm flex items-center">
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
                  <p className="text-pink-200 text-center py-8">No hay citas programadas para hoy</p>
                ) : (
                  todayAppointments?.map((appointment) => (
                    <div
                      key={appointment.id}
                      className="bg-white/5 rounded-xl p-4 border border-white/10 hover:bg-white/10 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="w-12 h-12 rounded-full bg-gradient-to-r from-pink-500 to-purple-600 flex items-center justify-center text-white font-semibold">
                            {appointment.patient_name.charAt(0)}
                          </div>
                          <div>
                            <h4 className="text-white font-medium">{appointment.patient_name}</h4>
                            <p className="text-pink-200 text-sm">
                              {appointment.time} - {appointment.appointment_type || 'Control prenatal'}
                            </p>
                            {appointment.weeks_pregnant && (
                              <p className="text-pink-300 text-xs">
                                {appointment.weeks_pregnant} semanas de gestación
                              </p>
                            )}
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
                            className="text-pink-300 hover:text-pink-200"
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

          {/* Pacientes Embarazadas */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="backdrop-blur-lg bg-white/10 rounded-2xl p-6 border border-white/20"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-white flex items-center">
                <Baby className="h-5 w-5 mr-2 text-pink-400" />
                Seguimiento
              </h2>
              <Link to="/pregnant-patients" className="text-pink-300 hover:text-pink-200 text-sm flex items-center">
                Ver todas <ChevronRight className="h-4 w-4 ml-1" />
              </Link>
            </div>

            {loadingPregnant ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
              </div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {pregnantPatients?.length === 0 ? (
                  <p className="text-pink-200 text-center py-8">No hay pacientes en seguimiento</p>
                ) : (
                  pregnantPatients?.map((patient) => (
                    <div
                      key={patient.id}
                      className="bg-white/5 rounded-xl p-4 border border-white/10"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-white font-medium">{patient.name}</h4>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          patient.trimester === 1 ? 'bg-blue-500 text-white' :
                          patient.trimester === 2 ? 'bg-green-500 text-white' :
                          'bg-orange-500 text-white'
                        }`}>
                          {patient.weeks_pregnant} sem
                        </span>
                      </div>
                      <p className="text-pink-200 text-sm">
                        Próximo control: {patient.next_appointment && format(new Date(patient.next_appointment), 'dd/MM/yyyy')}
                      </p>
                      {patient.risk_level && (
                        <p className={`text-xs mt-1 font-medium ${
                          patient.risk_level === 'high' ? 'text-red-300' :
                          patient.risk_level === 'medium' ? 'text-yellow-300' :
                          'text-green-300'
                        }`}>
                          Riesgo: {patient.risk_level === 'high' ? 'Alto' : 
                                  patient.risk_level === 'medium' ? 'Medio' : 'Bajo'}
                        </p>
                      )}
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
            <Link to="/prenatal-control/new">
              <button className="w-full py-3 px-4 bg-gradient-to-r from-pink-500 to-purple-600 text-white font-medium rounded-xl hover:from-pink-600 hover:to-purple-700 transition duration-200 flex items-center justify-center">
                <Stethoscope className="h-5 w-5 mr-2" />
                Control Prenatal
              </button>
            </Link>
            <Link to="/appointments/new">
              <button className="w-full py-3 px-4 bg-white/10 text-white font-medium rounded-xl hover:bg-white/20 transition duration-200 flex items-center justify-center border border-white/20">
                <Calendar className="h-5 w-5 mr-2" />
                Nueva Cita
              </button>
            </Link>
            <Link to="/ultrasound/new">
              <button className="w-full py-3 px-4 bg-white/10 text-white font-medium rounded-xl hover:bg-white/20 transition duration-200 flex items-center justify-center border border-white/20">
                <Activity className="h-5 w-5 mr-2" />
                Ecografía
              </button>
            </Link>
            <Link to="/birth-plan/new">
              <button className="w-full py-3 px-4 bg-white/10 text-white font-medium rounded-xl hover:bg-white/20 transition duration-200 flex items-center justify-center border border-white/20">
                <Heart className="h-5 w-5 mr-2" />
                Plan de Parto
              </button>
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default ObstetrizDashboard;
