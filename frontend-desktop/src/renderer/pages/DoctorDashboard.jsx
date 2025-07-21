import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { 
  Calendar, Users, Activity, FileText, 
  AlertCircle, Stethoscope, Clock, Heart,
  UserCheck, Bell, ChevronRight, 
  TrendingUp, ClipboardList, Eye, Zap
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import dashboardService from '../services/dashboardService';
import TriageViewer from '../components/medical/TriageViewer';

const DoctorDashboard = () => {
  // Obtener estadísticas del dashboard para doctor
  const { data: stats, isLoading: loadingStats } = useQuery({
    queryKey: ['doctorDashboardStats'],
    queryFn: dashboardService.getDoctorDashboardStats,
  });

  // Obtener citas del día para el doctor
  const { data: todayAppointments, isLoading: loadingAppointments } = useQuery({
    queryKey: ['doctorTodayAppointments'],
    queryFn: dashboardService.getDoctorTodayAppointments,
  });

  // Obtener pacientes con triaje pendiente
  const { data: triageQueue, isLoading: loadingTriage } = useQuery({
    queryKey: ['doctorTriageQueue'],
    queryFn: dashboardService.getDoctorTriageQueue,
  });

  // Obtener pacientes en espera de consulta
  const { data: waitingPatients, isLoading: loadingWaiting } = useQuery({
    queryKey: ['patientsWaitingConsultation'],
    queryFn: dashboardService.getPatientsWaitingConsultation,
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
      title: 'Pacientes Atendidos',
      value: stats?.patients_attended || 0,
      change: stats?.attended_change || '+0%',
      icon: Users,
      color: 'from-green-500 to-green-600',
      link: '/patients',
    },
    {
      title: 'Consultas Pendientes',
      value: stats?.pending_consultations || 0,
      change: 'En espera',
      icon: Clock,
      color: 'from-orange-500 to-orange-600',
      link: '/consultations',
    },
    {
      title: 'Triaje Completado',
      value: stats?.triage_completed || 0,
      change: stats?.triage_change || '+0%',
      icon: Activity,
      color: 'from-purple-500 to-purple-600',
      link: '/triage',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-indigo-800 to-purple-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex justify-between items-center mb-8"
        >
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">
              Panel de Control - Doctor
            </h1>
            <p className="text-blue-200">
              {format(new Date(), "EEEE, d 'de' MMMM 'de' yyyy", { locale: es })}
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <button className="relative p-2 text-blue-200 hover:text-white transition-colors">
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
                      <p className="text-sm text-blue-200">{stat.change}</p>
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
                Mis Citas de Hoy
              </h2>
              <Link to="/appointments" className="text-blue-300 hover:text-blue-200 text-sm flex items-center">
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
                  <p className="text-blue-200 text-center py-8">No hay citas programadas para hoy</p>
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
                            <p className="text-blue-200 text-sm">
                              {appointment.time} - {appointment.specialty}
                            </p>
                            {appointment.triage_status && (
                              <p className="text-blue-300 text-xs">
                                Triaje: {appointment.triage_status}
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
                              : appointment.status === 'in_consultation'
                              ? 'bg-blue-500/20 text-blue-300'
                              : 'bg-gray-500/20 text-gray-300'
                          }`}>
                            {appointment.status === 'confirmed' ? 'Confirmada' : 
                             appointment.status === 'pending' ? 'Pendiente' : 
                             appointment.status === 'in_consultation' ? 'En Consulta' : 
                             appointment.status}
                          </span>
                          {appointment.triage_data && (
                            <button className="text-blue-300 hover:text-blue-200">
                              <Eye className="h-4 w-4" />
                            </button>
                          )}
                          <Link
                            to={`/appointments/${appointment.id}`}
                            className="text-blue-300 hover:text-blue-200"
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

          {/* Cola de Triaje */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="backdrop-blur-lg bg-white/10 rounded-2xl p-6 border border-white/20"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-white flex items-center">
                <ClipboardList className="h-5 w-5 mr-2 text-purple-400" />
                Triaje
              </h2>
              <Link to="/triage" className="text-blue-300 hover:text-blue-200 text-sm flex items-center">
                Ver todos <ChevronRight className="h-4 w-4 ml-1" />
              </Link>
            </div>

            {loadingTriage ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
              </div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {triageQueue?.length === 0 ? (
                  <p className="text-blue-200 text-center py-8">No hay pacientes con triaje pendiente</p>
                ) : (
                  triageQueue?.map((patient) => (
                    <div
                      key={patient.id}
                      className="bg-white/5 rounded-xl p-4 border border-white/10"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-white font-medium">{patient.name}</h4>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          patient.triage_priority === 1 ? 'bg-red-600 text-white' :
                          patient.triage_priority === 2 ? 'bg-orange-500 text-white' :
                          patient.triage_priority === 3 ? 'bg-yellow-500 text-white' :
                          patient.triage_priority === 4 ? 'bg-green-500 text-white' :
                          'bg-blue-500 text-white'
                        }`}>
                          P{patient.triage_priority}
                        </span>
                      </div>
                      <p className="text-blue-200 text-sm">{patient.chief_complaint}</p>
                      <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                        <span className="text-blue-300">FC: {patient.heart_rate}bpm</span>
                        <span className="text-blue-300">PA: {patient.blood_pressure}</span>
                        <span className="text-blue-300">T°: {patient.temperature}°C</span>
                        <span className="text-blue-300">SpO₂: {patient.oxygen_saturation}%</span>
                      </div>
                      <p className="text-blue-400 text-xs mt-1">
                        Triaje: {format(new Date(patient.triage_time), 'HH:mm')}
                      </p>
                    </div>
                  ))
                )}
              </div>
            )}
          </motion.div>
        </div>

        {/* Pacientes en Espera de Consulta */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mt-6 backdrop-blur-lg bg-white/10 rounded-2xl p-6 border border-white/20"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-white flex items-center">
              <UserCheck className="h-5 w-5 mr-2 text-green-400" />
              Pacientes en Espera de Consulta
            </h2>
            <Link to="/medical/waiting-room" className="text-blue-300 hover:text-blue-200 text-sm flex items-center">
              Ver sala de espera <ChevronRight className="h-4 w-4 ml-1" />
            </Link>
          </div>

          {loadingWaiting ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {waitingPatients?.length === 0 ? (
                <p className="text-blue-200 text-center py-8 col-span-full">No hay pacientes esperando consulta</p>
              ) : (
                waitingPatients?.map((patient) => (
                  <div
                    key={patient.id}
                    className="bg-white/5 rounded-xl p-4 border border-white/10 hover:bg-white/10 cursor-pointer transition-colors"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-white font-medium">{patient.name}</h4>
                      <span className="text-xs text-blue-300">{patient.appointment_time}</span>
                    </div>
                    <p className="text-blue-200 text-sm mb-2">{patient.chief_complaint}</p>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-blue-400">
                        Espera: {patient.waiting_time} min
                      </span>
                      <span className={`px-2 py-1 rounded font-medium ${
                        patient.triage_priority === 1 ? 'bg-red-600 text-white' :
                        patient.triage_priority === 2 ? 'bg-orange-500 text-white' :
                        patient.triage_priority === 3 ? 'bg-yellow-500 text-white' :
                        'bg-green-500 text-white'
                      }`}>
                        P{patient.triage_priority}
                      </span>
                    </div>
                  </div>
                ))
              )}
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
            <Link to="/medical/new-consultation">
              <button className="w-full py-3 px-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-medium rounded-xl hover:from-blue-600 hover:to-purple-700 transition duration-200 flex items-center justify-center">
                <Stethoscope className="h-5 w-5 mr-2" />
                Nueva Consulta
              </button>
            </Link>
            <Link to="/patients/new">
              <button className="w-full py-3 px-4 bg-white/10 text-white font-medium rounded-xl hover:bg-white/20 transition duration-200 flex items-center justify-center border border-white/20">
                <UserCheck className="h-5 w-5 mr-2" />
                Nuevo Paciente
              </button>
            </Link>
            <Link to="/medical/prescription-manager">
              <button className="w-full py-3 px-4 bg-white/10 text-white font-medium rounded-xl hover:bg-white/20 transition duration-200 flex items-center justify-center border border-white/20">
                <FileText className="h-5 w-5 mr-2" />
                Recetas
              </button>
            </Link>
            <Link to="/medical/medical-records">
              <button className="w-full py-3 px-4 bg-white/10 text-white font-medium rounded-xl hover:bg-white/20 transition duration-200 flex items-center justify-center border border-white/20">
                <Activity className="h-5 w-5 mr-2" />
                Expedientes
              </button>
            </Link>
            <Link to="/medical/diagnosis-history">
              <button className="w-full py-3 px-4 bg-white/10 text-white font-medium rounded-xl hover:bg-white/20 transition duration-200 flex items-center justify-center border border-white/20">
                <ClipboardList className="h-5 w-5 mr-2" />
                Diagnósticos
              </button>
            </Link>
            <Link to="/medical/vital-signs">
              <button className="w-full py-3 px-4 bg-white/10 text-white font-medium rounded-xl hover:bg-white/20 transition duration-200 flex items-center justify-center border border-white/20">
                <Heart className="h-5 w-5 mr-2" />
                Signos Vitales
              </button>
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default DoctorDashboard;
