import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Calendar, Clock, User, FileText, Activity, Plus, LogOut, Menu } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useAuth } from '../contexts/AuthContext';
import appointmentService from '../services/appointmentService';
import medicalRecordService from '../services/medicalRecordService';

const Dashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showMobileMenu, setShowMobileMenu] = React.useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  // Obtener próximas citas
  const { data: upcomingAppointments, isLoading: loadingAppointments } = useQuery({
    queryKey: ['upcomingAppointments'],
    queryFn: appointmentService.getUpcomingAppointments,
    enabled: !!user, // Solo ejecutar si hay usuario autenticado
    retry: false,
  });

  // Obtener resumen del expediente médico
  const { data: medicalSummary, isLoading: loadingSummary } = useQuery({
    queryKey: ['medicalSummary'],
    queryFn: medicalRecordService.getMedicalSummary,
    enabled: !!user, // Solo ejecutar si hay usuario autenticado
    retry: false,
  });

  const statsCards = [
    {
      title: 'Próximas Citas',
      value: upcomingAppointments?.length || 0,
      icon: Calendar,
      color: 'from-blue-500 to-blue-600',
      link: '/appointments',
    },
    {
      title: 'Historial Médico',
      value: medicalSummary?.total_visits || 0,
      icon: FileText,
      color: 'from-purple-500 to-purple-600',
      link: '/medical-history',
    },
    {
      title: 'Recetas Activas',
      value: medicalSummary?.active_prescriptions || 0,
      icon: Activity,
      color: 'from-green-500 to-green-600',
      link: '/prescriptions',
    },
    {
      title: 'Exámenes Pendientes',
      value: medicalSummary?.pending_exams || 0,
      icon: Clock,
      color: 'from-orange-500 to-orange-600',
      link: '/exams',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      {/* Header Navigation */}
      <header className="backdrop-blur-lg bg-white/10 border-b border-white/20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center justify-between h-16">
            {/* Logo/Title */}
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-white">SIIGCEM🩺</h1>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-8">
              <Link to="/dashboard" className="text-white hover:text-blue-400 transition-colors">
                Dashboard
              </Link>
              <Link to="/appointments" className="text-white hover:text-blue-400 transition-colors">
                Citas
              </Link>
              <Link to="/medical-history" className="text-white hover:text-blue-400 transition-colors">
                Historial
              </Link>
              <Link to="/prescriptions" className="text-white hover:text-blue-400 transition-colors">
                Recetas
              </Link>
              <Link to="/profile" className="text-white hover:text-blue-400 transition-colors">
                Perfil
              </Link>
            </nav>

            {/* User Menu */}
            <div className="flex items-center space-x-4">
              <span className="text-white text-sm hidden md:block">
                {user?.first_name}
              </span>
              <button
                onClick={handleLogout}
                className="flex items-center space-x-2 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded-lg transition-colors"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden md:block">Cerrar Sesión</span>
              </button>
              
              {/* Mobile menu button */}
              <button
                onClick={() => setShowMobileMenu(!showMobileMenu)}
                className="md:hidden text-white"
              >
                <Menu className="h-6 w-6" />
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        {showMobileMenu && (
          <div className="md:hidden bg-white/10 backdrop-blur-lg border-t border-white/20">
            <nav className="px-6 py-4 space-y-2">
              <Link to="/dashboard" className="block text-white hover:text-blue-400 py-2">Dashboard</Link>
              <Link to="/appointments" className="block text-white hover:text-blue-400 py-2">Citas</Link>
              <Link to="/medical-history" className="block text-white hover:text-blue-400 py-2">Historial</Link>
              <Link to="/prescriptions" className="block text-white hover:text-blue-400 py-2">Recetas</Link>
              <Link to="/profile" className="block text-white hover:text-blue-400 py-2">Perfil</Link>
            </nav>
          </div>
        )}
      </header>

      <div className="max-w-7xl mx-auto p-6">
        {/* Welcome Section */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-white mb-2">
            Bienvenido, {user?.first_name} {user?.last_name}
          </h1>
          <p className="text-gray-400">
            {format(new Date(), "EEEE, d 'de' MMMM 'de' yyyy", { locale: es })}
          </p>
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
                    <span className="text-2xl font-bold text-white">{stat.value}</span>
                  </div>
                  <h3 className="text-white/80 text-sm">{stat.title}</h3>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="backdrop-blur-lg bg-white/10 rounded-2xl p-6 border border-white/20 mb-8"
        >
          <h2 className="text-xl font-semibold text-white mb-4">Acciones Rápidas</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link to="/appointments/new">
              <button className="w-full py-3 px-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-medium rounded-xl hover:from-blue-600 hover:to-purple-700 transition duration-200 flex items-center justify-center">
                <Plus className="h-5 w-5 mr-2" />
                Nueva Cita
              </button>
            </Link>
            <Link to="/profile">
              <button className="w-full py-3 px-4 bg-white/10 text-white font-medium rounded-xl hover:bg-white/20 transition duration-200 flex items-center justify-center border border-white/20">
                <User className="h-5 w-5 mr-2" />
                Mi Perfil
              </button>
            </Link>
            <Link to="/medical-history">
              <button className="w-full py-3 px-4 bg-white/10 text-white font-medium rounded-xl hover:bg-white/20 transition duration-200 flex items-center justify-center border border-white/20">
                <FileText className="h-5 w-5 mr-2" />
                Ver Historial
              </button>
            </Link>
          </div>
        </motion.div>

        {/* Upcoming Appointments */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="backdrop-blur-lg bg-white/10 rounded-2xl p-6 border border-white/20"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-white">Próximas Citas</h2>
            <Link to="/appointments" className="text-blue-400 hover:text-blue-300 text-sm">
              Ver todas →
            </Link>
          </div>

          {loadingAppointments ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto"></div>
            </div>
          ) : upcomingAppointments?.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-400 mb-4">No tienes citas programadas</p>
              <Link to="/appointments/new">
                <button className="py-2 px-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-medium rounded-lg hover:from-blue-600 hover:to-purple-700 transition duration-200">
                  Agendar Cita
                </button>
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {upcomingAppointments?.slice(0, 3).map((appointment) => (
                <div
                  key={appointment.id}
                  className="bg-white/5 rounded-xl p-4 border border-white/10"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-white font-medium">
                        {appointment.specialty_name}
                      </h3>
                      <p className="text-gray-400 text-sm">
                        Dr. {appointment.doctor_name}
                      </p>
                      <p className="text-gray-500 text-sm mt-1">
                        {format(new Date(appointment.date_time), "d 'de' MMMM, HH:mm", {
                          locale: es,
                        })}
                      </p>
                    </div>
                    <div className="flex flex-col items-end">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          appointment.status === 'scheduled'
                            ? 'bg-green-500/20 text-green-300'
                            : appointment.status === 'confirmed'
                            ? 'bg-blue-500/20 text-blue-300'
                            : 'bg-gray-500/20 text-gray-300'
                        }`}
                      >
                        {appointment.status === 'scheduled'
                          ? 'Programada'
                          : appointment.status === 'confirmed'
                          ? 'Confirmada'
                          : appointment.status}
                      </span>
                      <Link
                        to={`/appointments/${appointment.id}`}
                        className="text-blue-400 hover:text-blue-300 text-sm mt-2"
                      >
                        Ver detalles
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default Dashboard;
