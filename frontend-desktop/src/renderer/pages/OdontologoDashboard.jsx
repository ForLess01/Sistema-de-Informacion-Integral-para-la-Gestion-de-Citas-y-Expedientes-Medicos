import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { 
  Calendar, Users, Activity, FileText, 
  AlertCircle, Shield, Zap, Clock,
  UserCheck, Bell, ChevronRight, 
  Smile, TrendingUp, Heart, Stethoscope,
  ClipboardList, Target, Eye, Plus,
  BarChart3, Package, Link2
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import dashboardService from '../services/dashboardService';
import dentalService from '../services/dentalService';
import { useModuleIntegration } from '../hooks/useModuleIntegration';
// import PatientIntegrationView from '../components/PatientIntegrationView'; // Componente por crear

const OdontologoDashboard = () => {
  // Integración modular para compartir datos cross-módulo
  const { 
    shareData, 
    getSharedData, 
    subscribeToModule, 
    notifyModules 
  } = useModuleIntegration('odontologia');

  // Obtener estadísticas del dashboard específicas para odontología
  const { data: stats, isLoading: loadingStats } = useQuery({
    queryKey: ['odontologoDashboardStats'],
    queryFn: dashboardService.getOdontologoDashboardStats,
  });

  // Obtener citas del día para odontología
  const { data: todayAppointments, isLoading: loadingAppointments } = useQuery({
    queryKey: ['odontologo TodayAppointments'],
    queryFn: dashboardService.getOdontologoTodayAppointments,
  });

  // Obtener tratamientos activos
  const { data: activeTreatments, isLoading: loadingTreatments } = useQuery({
    queryKey: ['activeTreatments'],
    queryFn: dashboardService.getActiveTreatments,
  });

  // Obtener estadísticas de procedimientos dentales
  const { data: procedureStats, isLoading: loadingProcedureStats } = useQuery({
    queryKey: ['dentalProcedureStats'],
    queryFn: dentalService.getDentalProcedureStats,
  });

  // Obtener estadísticas de planes de tratamiento
  const { data: treatmentPlanStats, isLoading: loadingTreatmentPlanStats } = useQuery({
    queryKey: ['treatmentPlanStats'],
    queryFn: dentalService.getTreatmentPlanStats,
  });

  // Obtener datos compartidos de otros módulos (pacientes, citas generales, etc.)
  const sharedPatientData = getSharedData('pacientes');
  const sharedAppointmentData = getSharedData('citas');

  // Compartir estadísticas dentales con otros módulos
  React.useEffect(() => {
    if (stats && procedureStats && treatmentPlanStats) {
      shareData({
        type: 'dental-statistics',
        data: {
          totalProcedures: procedureStats.total,
          activeTreatments: stats.active_treatments,
          todayAppointments: stats.appointments_today,
          emergenciesMonth: stats.emergencies_month,
          newPatients: stats.new_patients
        },
        timestamp: new Date().toISOString(),
        module: 'odontologia'
      });
    }
  }, [stats, procedureStats, treatmentPlanStats, shareData]);

  // Suscribirse a notificaciones de otros módulos
  React.useEffect(() => {
    const unsubscribePacientes = subscribeToModule('pacientes', (data) => {
      console.log('Notificación del módulo pacientes:', data);
      // Refresco datos si hay cambios relevantes en pacientes
      if (data.type === 'patient-update' || data.type === 'new-patient') {
        // Invalidar queries relacionadas
        window.location.reload(); // Simple refresh - en producción usar query invalidation
      }
    });

    const unsubscribeCitas = subscribeToModule('citas', (data) => {
      console.log('Notificación del módulo citas:', data);
      if (data.type === 'appointment-update') {
        // Actualizar citas del día
        window.location.reload();
      }
    });

    return () => {
      unsubscribePacientes();
      unsubscribeCitas();
    };
  }, [subscribeToModule]);

  const statsCards = [
    {
      title: 'Citas Hoy',
      value: stats?.appointments_today || 0,
      change: stats?.appointments_change || '+0%',
      icon: Calendar,
      color: 'from-cyan-500 to-cyan-600',
      link: '/appointments',
    },
    {
      title: 'Tratamientos Activos',
      value: stats?.active_treatments || 0,
      change: stats?.treatments_change || '+0%',
      icon: Activity,
      color: 'from-blue-500 to-blue-600',
      link: '/treatments',
    },
    {
      title: 'Emergencias Mes',
      value: stats?.emergencies_month || 0,
      change: stats?.emergencies_change || '+0%',
      icon: AlertCircle,
      color: 'from-orange-500 to-orange-600',
      link: '/emergencies',
    },
    {
      title: 'Pacientes Nuevos',
      value: stats?.new_patients || 0,
      change: stats?.new_patients_change || '+0%',
      icon: Smile,
      color: 'from-green-500 to-green-600',
      link: '/patients',
    },
  ];

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
              Panel de Control - Odontología
            </h1>
            <p className="text-cyan-200">
              {format(new Date(), "EEEE, d 'de' MMMM 'de' yyyy", { locale: es })}
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <button className="relative p-2 text-cyan-200 hover:text-white transition-colors">
              <Bell className="h-6 w-6" />
              <span className="absolute top-0 right-0 h-2 w-2 bg-cyan-500 rounded-full"></span>
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
                      <p className="text-sm text-cyan-200">{stat.change}</p>
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
                Citas de Hoy - Odontología
              </h2>
              <Link to="/appointments" className="text-cyan-300 hover:text-cyan-200 text-sm flex items-center">
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
                  <p className="text-cyan-200 text-center py-8">No hay citas programadas para hoy</p>
                ) : (
                  todayAppointments?.map((appointment) => (
                    <div
                      key={appointment.id}
                      className="bg-white/5 rounded-xl p-4 border border-white/10 hover:bg-white/10 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="w-12 h-12 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 flex items-center justify-center text-white font-semibold">
                            {appointment.patient_name.charAt(0)}
                          </div>
                          <div>
                            <h4 className="text-white font-medium">{appointment.patient_name}</h4>
                            <p className="text-cyan-200 text-sm">
                              {appointment.time} - {appointment.procedure || 'Consulta general'}
                            </p>
                            {appointment.urgency && (
                              <p className={`text-xs mt-1 font-medium ${
                                appointment.urgency === 'high' ? 'text-red-300' :
                                appointment.urgency === 'medium' ? 'text-yellow-300' :
                                'text-green-300'
                              }`}>
                                Urgencia: {appointment.urgency === 'high' ? 'Alta' : 
                                          appointment.urgency === 'medium' ? 'Media' : 'Baja'}
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
                            className="text-cyan-300 hover:text-cyan-200"
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

          {/* Tratamientos Activos */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="backdrop-blur-lg bg-white/10 rounded-2xl p-6 border border-white/20"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-white flex items-center">
                <Activity className="h-5 w-5 mr-2 text-blue-400" />
                Tratamientos
              </h2>
              <Link to="/treatments" className="text-cyan-300 hover:text-cyan-200 text-sm flex items-center">
                Ver todos <ChevronRight className="h-4 w-4 ml-1" />
              </Link>
            </div>

            {loadingTreatments ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
              </div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {activeTreatments?.length === 0 ? (
                  <p className="text-cyan-200 text-center py-8">No hay tratamientos activos</p>
                ) : (
                  activeTreatments?.map((treatment) => (
                    <div
                      key={treatment.id}
                      className="bg-white/5 rounded-xl p-4 border border-white/10"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-white font-medium">{treatment.patient_name}</h4>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          treatment.progress >= 80 ? 'bg-green-500 text-white' :
                          treatment.progress >= 50 ? 'bg-blue-500 text-white' :
                          'bg-orange-500 text-white'
                        }`}>
                          {treatment.progress}%
                        </span>
                      </div>
                      <p className="text-cyan-200 text-sm mb-1">
                        {treatment.procedure}
                      </p>
                      <p className="text-cyan-300 text-xs">
                        Próxima cita: {treatment.next_appointment && format(new Date(treatment.next_appointment), 'dd/MM/yyyy')}
                      </p>
                      <div className="mt-2 bg-white/10 rounded-full h-2">
                        <div 
                          className="bg-gradient-to-r from-cyan-500 to-blue-500 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${treatment.progress}%` }}
                        />
                      </div>
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
          <h2 className="text-xl font-semibold text-white mb-4">Acciones Rápidas - Odontología</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <Link to="/dental-history">
              <button className="w-full py-3 px-4 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-medium rounded-xl hover:from-cyan-600 hover:to-blue-700 transition duration-200 flex items-center justify-center">
                <FileText className="h-5 w-5 mr-2" />
                Historial Dental
              </button>
            </Link>
            <Link to="/treatment-plan">
              <button className="w-full py-3 px-4 bg-white/10 text-white font-medium rounded-xl hover:bg-white/20 transition duration-200 flex items-center justify-center border border-white/20">
                <ClipboardList className="h-5 w-5 mr-2" />
                Plan Tratamiento
              </button>
            </Link>
            <Link to="/dental-procedures">
              <button className="w-full py-3 px-4 bg-white/10 text-white font-medium rounded-xl hover:bg-white/20 transition duration-200 flex items-center justify-center border border-white/20">
                <Activity className="h-5 w-5 mr-2" />
                Procedimientos
              </button>
            </Link>
            <Link to="/appointments/new">
              <button className="w-full py-3 px-4 bg-white/10 text-white font-medium rounded-xl hover:bg-white/20 transition duration-200 flex items-center justify-center border border-white/20">
                <Calendar className="h-5 w-5 mr-2" />
                Nueva Cita
              </button>
            </Link>
            <Link to="/patients">
              <button className="w-full py-3 px-4 bg-white/10 text-white font-medium rounded-xl hover:bg-white/20 transition duration-200 flex items-center justify-center border border-white/20">
                <Smile className="h-5 w-5 mr-2" />
                Pacientes
              </button>
            </Link>
            <Link to="/dental-chart">
              <button className="w-full py-3 px-4 bg-white/10 text-white font-medium rounded-xl hover:bg-white/20 transition duration-200 flex items-center justify-center border border-white/20">
                <Eye className="h-5 w-5 mr-2" />
                Odontograma
              </button>
            </Link>
          </div>
        </motion.div>

        {/* Integration View - Cross-Module Data */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="mt-6 backdrop-blur-lg bg-white/10 rounded-2xl p-6 border border-white/20"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-white flex items-center">
              <Link2 className="h-5 w-5 mr-2" />
              Integración de Módulos
            </h2>
          </div>
          
          {/* <PatientIntegrationView currentModule="odontologia" /> */}
          <div className="text-center text-cyan-200 py-8">
            <p>Vista de integración de módulos - En desarrollo</p>
          </div>
        </motion.div>

        {/* Dental Chart Preview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="mt-6 backdrop-blur-lg bg-white/10 rounded-2xl p-6 border border-white/20"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-white flex items-center">
              <Shield className="h-5 w-5 mr-2" />
              Odontograma Rápido
            </h2>
            <Link to="/dental-chart" className="text-cyan-300 hover:text-cyan-200 text-sm flex items-center">
              Ver completo <ChevronRight className="h-4 w-4 ml-1" />
            </Link>
          </div>
          
          {/* Simplified dental chart */}
          <div className="grid grid-cols-8 gap-2 mb-4">
            {Array.from({ length: 16 }, (_, i) => (
              <div
                key={i}
                className="aspect-square bg-white/10 rounded-lg border border-white/20 flex items-center justify-center text-xs text-white font-medium hover:bg-white/20 cursor-pointer transition-colors"
              >
                {18 - i}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-8 gap-2">
            {Array.from({ length: 16 }, (_, i) => (
              <div
                key={i + 16}
                className="aspect-square bg-white/10 rounded-lg border border-white/20 flex items-center justify-center text-xs text-white font-medium hover:bg-white/20 cursor-pointer transition-colors"
              >
                {48 - i}
              </div>
            ))}
          </div>
          <p className="text-cyan-200 text-sm mt-4 text-center">
            Haz clic en cualquier diente para ver detalles o registrar procedimientos
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default OdontologoDashboard;
