import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { 
  Calendar, Users, Activity, FileText, 
  AlertCircle, Stethoscope, Clock, Heart,
  UserCheck, Bell, ChevronRight, 
  TrendingUp, ClipboardList, Plus
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import dashboardService from '../services/dashboardService';
import TriageForm from '../components/medical/TriageForm';

const NurseDashboard = () => {
  const [showTriageForm, setShowTriageForm] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);

  // Obtener estadísticas del dashboard para enfermero
  const { data: stats, isLoading: loadingStats } = useQuery({
    queryKey: ['nurseDashboardStats'],
    queryFn: dashboardService.getNurseDashboardStats,
  });

  // Obtener cola de triaje (pacientes que necesitan triaje)
  const { data: triageQueue, isLoading: loadingTriageQueue } = useQuery({
    queryKey: ['nurseTriageQueue'],
    queryFn: dashboardService.getNurseTriageQueue,
    refetchInterval: 30000, // Actualizar cada 30 segundos
  });

  // Obtener pacientes con triaje completado
  const { data: completedTriage, isLoading: loadingCompleted } = useQuery({
    queryKey: ['completedTriage'],
    queryFn: dashboardService.getCompletedTriage,
  });

  // Obtener citas del día
  const { data: todayAppointments, isLoading: loadingAppointments } = useQuery({
    queryKey: ['nurseAppointments'],
    queryFn: dashboardService.getNurseAppointments,
  });

  const statsCards = [
    {
      title: 'Triaje Pendientes',
      value: stats?.triage_pending || 0,
      change: 'Pacientes esperando',
      icon: ClipboardList,
      color: 'from-red-500 to-red-600',
      link: '/triage',
    },
    {
      title: 'Triaje Completados Hoy',
      value: stats?.triage_completed_today || 0,
      change: stats?.triage_change || '+0%',
      icon: UserCheck,
      color: 'from-green-500 to-green-600',
      link: '/triage/completed',
    },
    {
      title: 'Pacientes en Consulta',
      value: stats?.patients_in_consultation || 0,
      change: 'Activos',
      icon: Stethoscope,
      color: 'from-blue-500 to-blue-600',
      link: '/consultations',
    },
    {
      title: 'Signos Vitales Hoy',
      value: stats?.vital_signs_taken || 0,
      change: stats?.vitals_change || '+0%',
      icon: Heart,
      color: 'from-purple-500 to-purple-600',
      link: '/vital-signs',
    },
  ];

  const handleStartTriage = (patient) => {
    setSelectedPatient(patient);
    setShowTriageForm(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-900 via-teal-800 to-blue-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex justify-between items-center mb-8"
        >
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">
              Panel de Control - Enfermería
            </h1>
            <p className="text-green-200">
              {format(new Date(), "EEEE, d 'de' MMMM 'de' yyyy", { locale: es })}
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <button className="relative p-2 text-green-200 hover:text-white transition-colors">
              <Bell className="h-6 w-6" />
              {stats?.urgent_alerts > 0 && (
                <span className="absolute top-0 right-0 h-2 w-2 bg-red-500 rounded-full"></span>
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
                      <p className="text-sm text-green-200">{stat.change}</p>
                    </div>
                  </div>
                  <h3 className="text-white/80 text-sm">{stat.title}</h3>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Cola de Triaje */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="lg:col-span-2 backdrop-blur-lg bg-white/10 rounded-2xl p-6 border border-white/20"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-white flex items-center">
                <ClipboardList className="h-5 w-5 mr-2 text-red-400" />
                Cola de Triaje
              </h2>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-green-200">
                  {triageQueue?.length || 0} pacientes esperando
                </span>
                <Link to="/triage" className="text-green-300 hover:text-green-200 text-sm flex items-center">
                  Ver todos <ChevronRight className="h-4 w-4 ml-1" />
                </Link>
              </div>
            </div>

            {loadingTriageQueue ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
              </div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {triageQueue?.length === 0 ? (
                  <p className="text-green-200 text-center py-8">No hay pacientes esperando triaje</p>
                ) : (
                  triageQueue?.map((patient, index) => (
                    <div
                      key={patient.id}
                      className="bg-white/5 rounded-xl p-4 border border-white/10 hover:bg-white/10 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="flex-shrink-0">
                            <div className="w-12 h-12 rounded-full bg-gradient-to-r from-green-500 to-teal-600 flex items-center justify-center text-white font-semibold">
                              {patient.patient_name ? patient.patient_name.charAt(0) : '?'}
                            </div>
                            <div className="text-xs text-center mt-1 text-green-300">
                              #{index + 1}
                            </div>
                          </div>
                          <div className="flex-grow">
                            <h4 className="text-white font-medium">{patient.patient_name}</h4>
                            <p className="text-green-200 text-sm">
                              Llegada: {format(new Date(patient.arrival_time), 'HH:mm')}
                            </p>
                            <p className="text-green-200 text-sm">
                              Motivo: {patient.chief_complaint}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="text-right">
                            <p className="text-xs text-green-300">Espera</p>
                            <p className="text-sm font-medium text-white">
                              {patient.waiting_time} min
                            </p>
                          </div>
                          <button
                            onClick={() => handleStartTriage(patient)}
                            className="px-3 py-2 bg-gradient-to-r from-green-500 to-teal-600 text-white text-xs font-medium rounded-lg hover:from-green-600 hover:to-teal-700 transition duration-200 flex items-center"
                          >
                            <Plus className="h-3 w-3 mr-1" />
                            Iniciar
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </motion.div>

          {/* Triaje Completado */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="backdrop-blur-lg bg-white/10 rounded-2xl p-6 border border-white/20"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-white flex items-center">
                <UserCheck className="h-5 w-5 mr-2 text-green-400" />
                Completados
              </h2>
              <Link to="/triage/completed" className="text-green-300 hover:text-green-200 text-sm flex items-center">
                Ver todos <ChevronRight className="h-4 w-4 ml-1" />
              </Link>
            </div>

            {loadingCompleted ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
              </div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {completedTriage?.length === 0 ? (
                  <p className="text-green-200 text-center py-8">No hay triajes completados</p>
                ) : (
                  completedTriage?.map((patient) => (
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
                      <p className="text-green-200 text-sm mb-2">{patient.chief_complaint}</p>
                      <div className="grid grid-cols-2 gap-1 text-xs text-green-300">
                        <span>FC: {patient.heart_rate}bpm</span>
                        <span>T°: {patient.temperature}°C</span>
                        <span>PA: {patient.blood_pressure}</span>
                        <span>SpO₂: {patient.oxygen_saturation}%</span>
                      </div>
                      <p className="text-green-400 text-xs mt-2">
                        {format(new Date(patient.completed_at), 'HH:mm')}
                      </p>
                    </div>
                  ))
                )}
              </div>
            )}
          </motion.div>
        </div>

        {/* Citas del Día */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mt-6 backdrop-blur-lg bg-white/10 rounded-2xl p-6 border border-white/20"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-white flex items-center">
              <Calendar className="h-5 w-5 mr-2 text-blue-400" />
              Citas del Día
            </h2>
            <Link to="/appointments" className="text-green-300 hover:text-green-200 text-sm flex items-center">
              Ver todas <ChevronRight className="h-4 w-4 ml-1" />
            </Link>
          </div>

          {loadingAppointments ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {todayAppointments?.length === 0 ? (
                <p className="text-green-200 text-center py-8 col-span-full">No hay citas programadas</p>
              ) : (
                todayAppointments?.map((appointment) => (
                  <div
                    key={appointment.id}
                    className="bg-white/5 rounded-xl p-4 border border-white/10 hover:bg-white/10 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-white font-medium">{appointment.patient_name}</h4>
                      <span className="text-xs text-green-300">{appointment.time}</span>
                    </div>
                    <p className="text-green-200 text-sm mb-2">{appointment.specialty}</p>
                    <div className="flex items-center justify-between">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        appointment.status === 'confirmed' ? 'bg-green-500/20 text-green-300' :
                        appointment.status === 'pending' ? 'bg-yellow-500/20 text-yellow-300' :
                        appointment.status === 'checked_in' ? 'bg-blue-500/20 text-blue-300' :
                        'bg-gray-500/20 text-gray-300'
                      }`}>
                        {appointment.status === 'confirmed' ? 'Confirmada' :
                         appointment.status === 'pending' ? 'Pendiente' :
                         appointment.status === 'checked_in' ? 'Presente' :
                         appointment.status}
                      </span>
                      {appointment.triage_status && (
                        <span className="text-xs text-green-400">
                          Triaje: {appointment.triage_status}
                        </span>
                      )}
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
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <button
              onClick={() => setShowTriageForm(true)}
              className="w-full py-3 px-4 bg-gradient-to-r from-green-500 to-teal-600 text-white font-medium rounded-xl hover:from-green-600 hover:to-teal-700 transition duration-200 flex items-center justify-center"
            >
              <ClipboardList className="h-5 w-5 mr-2" />
              Nuevo Triaje
            </button>
            <Link to="/vital-signs/new">
              <button className="w-full py-3 px-4 bg-white/10 text-white font-medium rounded-xl hover:bg-white/20 transition duration-200 flex items-center justify-center border border-white/20">
                <Heart className="h-5 w-5 mr-2" />
                Signos Vitales
              </button>
            </Link>
            <Link to="/check-in">
              <button className="w-full py-3 px-4 bg-white/10 text-white font-medium rounded-xl hover:bg-white/20 transition duration-200 flex items-center justify-center border border-white/20">
                <UserCheck className="h-5 w-5 mr-2" />
                Check-in
              </button>
            </Link>
            <Link to="/appointments">
              <button className="w-full py-3 px-4 bg-white/10 text-white font-medium rounded-xl hover:bg-white/20 transition duration-200 flex items-center justify-center border border-white/20">
                <Calendar className="h-5 w-5 mr-2" />
                Citas
              </button>
            </Link>
          </div>
        </motion.div>
      </div>

      {/* Modal de Formulario de Triaje */}
      {showTriageForm && (
        <TriageForm
          patient={selectedPatient}
          onClose={() => {
            setShowTriageForm(false);
            setSelectedPatient(null);
          }}
          onSuccess={() => {
            setShowTriageForm(false);
            setSelectedPatient(null);
            // Refetch data
            window.location.reload();
          }}
        />
      )}
    </div>
  );
};

export default NurseDashboard;
