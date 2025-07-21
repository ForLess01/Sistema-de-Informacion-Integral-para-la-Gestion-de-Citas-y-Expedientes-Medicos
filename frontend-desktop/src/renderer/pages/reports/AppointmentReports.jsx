import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { 
  Calendar, BarChart3, TrendingUp, TrendingDown, Clock,
  Users, CheckCircle, XCircle, AlertCircle, Eye,
  Download, Filter, Search, Plus, RefreshCw,
  FileText, PieChart, Activity, ArrowRight,
  UserCheck, CalendarX, CalendarCheck, Timer
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';
import { es } from 'date-fns/locale';
import dashboardService from '../../services/dashboardService';
import appointmentService from '../../services/appointmentService';
import { useAuth } from '../../contexts/AuthContext';

const AppointmentReports = () => {
  const { user } = useAuth();
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const [selectedSpecialty, setSelectedSpecialty] = useState('all');
  const [selectedDoctor, setSelectedDoctor] = useState('all');
  const [reportType, setReportType] = useState('overview');
  const [customDateRange, setCustomDateRange] = useState({
    start: format(new Date(), 'yyyy-MM-dd'),
    end: format(new Date(), 'yyyy-MM-dd')
  });

  // Obtener estadísticas de citas
  const { data: appointmentStats, isLoading: loadingStats, refetch: refetchStats } = useQuery({
    queryKey: ['appointmentReportsStats', selectedPeriod, selectedSpecialty, selectedDoctor],
    queryFn: () => appointmentService.getAppointmentStats({
      period: selectedPeriod,
      specialty: selectedSpecialty,
      doctor: selectedDoctor,
      ...customDateRange
    }),
  });

  // Obtener análisis temporal
  const { data: temporalAnalysis, isLoading: loadingTemporal } = useQuery({
    queryKey: ['appointmentTemporalAnalysis', selectedPeriod],
    queryFn: () => appointmentService.getTemporalAnalysis(selectedPeriod),
  });

  // Obtener reportes por especialidad
  const { data: specialtyReports, isLoading: loadingSpecialty } = useQuery({
    queryKey: ['appointmentSpecialtyReports', selectedPeriod],
    queryFn: () => appointmentService.getSpecialtyReports(selectedPeriod),
  });

  // Obtener lista de especialidades para filtros
  const { data: specialties } = useQuery({
    queryKey: ['specialties'],
    queryFn: dashboardService.getSpecialties,
  });

  // Obtener lista de doctores para filtros
  const { data: doctors } = useQuery({
    queryKey: ['doctors', selectedSpecialty],
    queryFn: () => dashboardService.getDoctorsBySpecialty(selectedSpecialty),
    enabled: selectedSpecialty !== 'all'
  });

  const periods = [
    { value: 'today', label: 'Hoy' },
    { value: 'week', label: 'Esta semana' },
    { value: 'month', label: 'Este mes' },
    { value: 'quarter', label: 'Trimestre' },
    { value: 'year', label: 'Este año' },
    { value: 'custom', label: 'Personalizado' }
  ];

  const reportTypes = [
    { value: 'overview', label: 'Resumen General', icon: BarChart3 },
    { value: 'efficiency', label: 'Eficiencia', icon: TrendingUp },
    { value: 'specialty', label: 'Por Especialidad', icon: Activity },
    { value: 'doctor', label: 'Por Doctor', icon: Users },
    { value: 'temporal', label: 'Análisis Temporal', icon: Clock },
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'text-green-400';
      case 'confirmed': return 'text-blue-400';
      case 'cancelled': return 'text-red-400';
      case 'no_show': return 'text-orange-400';
      case 'pending': return 'text-yellow-400';
      default: return 'text-gray-400';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed': return CheckCircle;
      case 'confirmed': return CalendarCheck;
      case 'cancelled': return CalendarX;
      case 'no_show': return AlertCircle;
      case 'pending': return Clock;
      default: return Calendar;
    }
  };

  const handleExportReport = (format = 'excel') => {
    // Implementar lógica de exportación
    console.log('Exporting report in format:', format);
  };

  const handleRefreshData = () => {
    refetchStats();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-800 to-indigo-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 space-y-4 sm:space-y-0"
        >
          <div>
            <h1 className="text-3xl font-bold text-white mb-2 flex items-center">
              <Calendar className="h-8 w-8 mr-3 text-blue-400" />
              Reportes de Citas
            </h1>
            <p className="text-slate-200">
              {format(new Date(), "EEEE, d 'de' MMMM 'de' yyyy", { locale: es })}
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={handleRefreshData}
              className="flex items-center px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl border border-white/20 transition-colors"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Actualizar
            </button>
            <button
              onClick={() => handleExportReport('excel')}
              className="flex items-center px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-medium hover:from-green-600 hover:to-emerald-700 transition-colors"
            >
              <Download className="h-4 w-4 mr-2" />
              Exportar
            </button>
          </div>
        </motion.div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="backdrop-blur-lg bg-white/10 rounded-2xl p-6 border border-white/20 mb-8"
        >
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
            {/* Period Filter */}
            <div>
              <label className="block text-sm font-medium text-white mb-2">Período</label>
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {periods.map((period) => (
                  <option key={period.value} value={period.value} className="bg-slate-800">
                    {period.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Specialty Filter */}
            <div>
              <label className="block text-sm font-medium text-white mb-2">Especialidad</label>
              <select
                value={selectedSpecialty}
                onChange={(e) => setSelectedSpecialty(e.target.value)}
                className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all" className="bg-slate-800">Todas las especialidades</option>
                {specialties?.map((specialty) => (
                  <option key={specialty.id} value={specialty.id} className="bg-slate-800">
                    {specialty.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Doctor Filter */}
            <div>
              <label className="block text-sm font-medium text-white mb-2">Doctor</label>
              <select
                value={selectedDoctor}
                onChange={(e) => setSelectedDoctor(e.target.value)}
                disabled={selectedSpecialty === 'all'}
                className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
              >
                <option value="all" className="bg-slate-800">Todos los doctores</option>
                {doctors?.map((doctor) => (
                  <option key={doctor.id} value={doctor.id} className="bg-slate-800">
                    Dr. {doctor.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Report Type */}
            <div>
              <label className="block text-sm font-medium text-white mb-2">Tipo de Reporte</label>
              <select
                value={reportType}
                onChange={(e) => setReportType(e.target.value)}
                className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {reportTypes.map((type) => (
                  <option key={type.value} value={type.value} className="bg-slate-800">
                    {type.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Custom Date Range */}
          {selectedPeriod === 'custom' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div>
                <label className="block text-sm font-medium text-white mb-2">Fecha Inicio</label>
                <input
                  type="date"
                  value={customDateRange.start}
                  onChange={(e) => setCustomDateRange(prev => ({ ...prev, start: e.target.value }))}
                  className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-white mb-2">Fecha Fin</label>
                <input
                  type="date"
                  value={customDateRange.end}
                  onChange={(e) => setCustomDateRange(prev => ({ ...prev, end: e.target.value }))}
                  className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          )}
        </motion.div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="backdrop-blur-lg bg-white/10 rounded-2xl p-6 border border-white/20"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600">
                <Calendar className="h-6 w-6 text-white" />
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-white">{appointmentStats?.total || 0}</p>
                <p className="text-sm text-slate-200">Total Citas</p>
              </div>
            </div>
            <div className="flex items-center text-sm">
              {appointmentStats?.total_change >= 0 ? (
                <TrendingUp className="h-4 w-4 text-green-400 mr-1" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-400 mr-1" />
              )}
              <span className={appointmentStats?.total_change >= 0 ? 'text-green-400' : 'text-red-400'}>
                {appointmentStats?.total_change >= 0 ? '+' : ''}{appointmentStats?.total_change || 0}%
              </span>
              <span className="text-slate-300 ml-1">vs período anterior</span>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="backdrop-blur-lg bg-white/10 rounded-2xl p-6 border border-white/20"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-xl bg-gradient-to-r from-green-500 to-green-600">
                <CheckCircle className="h-6 w-6 text-white" />
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-white">{appointmentStats?.completed || 0}</p>
                <p className="text-sm text-slate-200">Completadas</p>
              </div>
            </div>
            <div className="flex items-center text-sm">
              <span className="text-green-400">
                {appointmentStats?.completion_rate || 0}% tasa de completitud
              </span>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="backdrop-blur-lg bg-white/10 rounded-2xl p-6 border border-white/20"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-xl bg-gradient-to-r from-red-500 to-red-600">
                <XCircle className="h-6 w-6 text-white" />
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-white">{appointmentStats?.cancelled || 0}</p>
                <p className="text-sm text-slate-200">Canceladas</p>
              </div>
            </div>
            <div className="flex items-center text-sm">
              <span className="text-red-400">
                {appointmentStats?.cancellation_rate || 0}% tasa de cancelación
              </span>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="backdrop-blur-lg bg-white/10 rounded-2xl p-6 border border-white/20"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600">
                <AlertCircle className="h-6 w-6 text-white" />
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-white">{appointmentStats?.no_shows || 0}</p>
                <p className="text-sm text-slate-200">No Asistieron</p>
              </div>
            </div>
            <div className="flex items-center text-sm">
              <span className="text-orange-400">
                {appointmentStats?.no_show_rate || 0}% tasa de inasistencia
              </span>
            </div>
          </motion.div>
        </div>

        {/* Main Content Based on Report Type */}
        {reportType === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Appointment Status Distribution */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="backdrop-blur-lg bg-white/10 rounded-2xl p-6 border border-white/20"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-white flex items-center">
                  <PieChart className="h-5 w-5 mr-2 text-blue-400" />
                  Distribución por Estado
                </h2>
              </div>

              {loadingStats ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                </div>
              ) : (
                <div className="space-y-4">
                  {appointmentStats?.status_distribution?.map((status) => {
                    const StatusIcon = getStatusIcon(status.status);
                    return (
                      <div key={status.status} className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/10">
                        <div className="flex items-center space-x-3">
                          <StatusIcon className={`h-5 w-5 ${getStatusColor(status.status)}`} />
                          <span className="text-white font-medium capitalize">
                            {status.status === 'completed' ? 'Completadas' :
                             status.status === 'confirmed' ? 'Confirmadas' :
                             status.status === 'cancelled' ? 'Canceladas' :
                             status.status === 'no_show' ? 'No Asistieron' :
                             status.status === 'pending' ? 'Pendientes' :
                             status.status}
                          </span>
                        </div>
                        <div className="flex items-center space-x-3">
                          <span className="text-white font-bold">{status.count}</span>
                          <span className={`text-sm ${getStatusColor(status.status)}`}>
                            {status.percentage}%
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </motion.div>

            {/* Recent Appointments */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              className="backdrop-blur-lg bg-white/10 rounded-2xl p-6 border border-white/20"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-white flex items-center">
                  <Clock className="h-5 w-5 mr-2 text-green-400" />
                  Citas Recientes
                </h2>
                <Link to="/appointments" className="text-slate-300 hover:text-slate-200 text-sm flex items-center">
                  Ver todas <ArrowRight className="h-4 w-4 ml-1" />
                </Link>
              </div>

              <div className="space-y-3 max-h-96 overflow-y-auto">
                {appointmentStats?.recent_appointments?.map((appointment) => (
                  <div key={appointment.id} className="p-3 bg-white/5 rounded-xl border border-white/10 hover:bg-white/10 transition-colors">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-white font-medium">{appointment.patient_name}</h4>
                      <span className="text-xs text-slate-300">
                        {format(new Date(appointment.date_time), 'dd/MM HH:mm')}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-slate-300 text-sm">
                        {appointment.specialty} - Dr. {appointment.doctor_name}
                      </p>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        appointment.status === 'completed' ? 'bg-green-500/20 text-green-300' :
                        appointment.status === 'confirmed' ? 'bg-blue-500/20 text-blue-300' :
                        appointment.status === 'cancelled' ? 'bg-red-500/20 text-red-300' :
                        appointment.status === 'no_show' ? 'bg-orange-500/20 text-orange-300' :
                        'bg-yellow-500/20 text-yellow-300'
                      }`}>
                        {appointment.status === 'completed' ? 'Completada' :
                         appointment.status === 'confirmed' ? 'Confirmada' :
                         appointment.status === 'cancelled' ? 'Cancelada' :
                         appointment.status === 'no_show' ? 'No asistió' :
                         'Pendiente'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        )}

        {/* Specialty Analysis */}
        {reportType === 'specialty' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="backdrop-blur-lg bg-white/10 rounded-2xl p-6 border border-white/20 mb-8"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-white flex items-center">
                <Activity className="h-5 w-5 mr-2 text-purple-400" />
                Análisis por Especialidad
              </h2>
            </div>

            {loadingSpecialty ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {specialtyReports?.map((specialty) => (
                  <div key={specialty.id} className="p-4 bg-white/5 rounded-xl border border-white/10">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-white font-medium">{specialty.name}</h4>
                      <span className="text-2xl font-bold text-white">{specialty.total_appointments}</span>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-300">Completadas:</span>
                        <span className="text-green-400">{specialty.completed}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-300">Canceladas:</span>
                        <span className="text-red-400">{specialty.cancelled}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-300">Tasa éxito:</span>
                        <span className="text-blue-400">{specialty.success_rate}%</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* Temporal Analysis */}
        {reportType === 'temporal' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="backdrop-blur-lg bg-white/10 rounded-2xl p-6 border border-white/20 mb-8"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-white flex items-center">
                <Clock className="h-5 w-5 mr-2 text-orange-400" />
                Análisis Temporal
              </h2>
            </div>

            {loadingTemporal ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-white">Horarios Más Solicitados</h3>
                  {temporalAnalysis?.peak_hours?.map((hour) => (
                    <div key={hour.hour} className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/10">
                      <span className="text-white">{hour.hour}:00</span>
                      <div className="flex items-center space-x-3">
                        <div className="w-24 bg-white/10 rounded-full h-2">
                          <div 
                            className="bg-gradient-to-r from-orange-500 to-red-500 h-2 rounded-full"
                            style={{ width: `${(hour.appointments / temporalAnalysis.max_appointments) * 100}%` }}
                          />
                        </div>
                        <span className="text-white font-medium">{hour.appointments}</span>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-white">Días Más Activos</h3>
                  {temporalAnalysis?.peak_days?.map((day) => (
                    <div key={day.day} className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/10">
                      <span className="text-white capitalize">{day.day_name}</span>
                      <div className="flex items-center space-x-3">
                        <div className="w-24 bg-white/10 rounded-full h-2">
                          <div 
                            className="bg-gradient-to-r from-blue-500 to-indigo-500 h-2 rounded-full"
                            style={{ width: `${(day.appointments / temporalAnalysis.max_day_appointments) * 100}%` }}
                          />
                        </div>
                        <span className="text-white font-medium">{day.appointments}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="backdrop-blur-lg bg-white/10 rounded-2xl p-6 border border-white/20"
        >
          <h2 className="text-xl font-semibold text-white mb-4">Acciones Rápidas</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            <Link to="/appointments">
              <button className="w-full py-3 px-4 bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-medium rounded-xl hover:from-blue-600 hover:to-indigo-700 transition duration-200 flex items-center justify-center">
                <Calendar className="h-5 w-5 mr-2" />
                Ver Citas
              </button>
            </Link>
            
            <Link to="/appointments/new">
              <button className="w-full py-3 px-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-medium rounded-xl hover:from-green-600 hover:to-emerald-700 transition duration-200 flex items-center justify-center">
                <Plus className="h-5 w-5 mr-2" />
                Nueva Cita
              </button>
            </Link>

            {user?.role === 'admin' && (
              <>
                <Link to="/reports/doctor-performance">
                  <button className="w-full py-3 px-4 bg-white/10 text-white font-medium rounded-xl hover:bg-white/20 transition duration-200 flex items-center justify-center border border-white/20">
                    <Users className="h-5 w-5 mr-2" />
                    Rendimiento
                  </button>
                </Link>
                
                <Link to="/reports/financial">
                  <button className="w-full py-3 px-4 bg-white/10 text-white font-medium rounded-xl hover:bg-white/20 transition duration-200 flex items-center justify-center border border-white/20">
                    <BarChart3 className="h-5 w-5 mr-2" />
                    Financiero
                  </button>
                </Link>
              </>
            )}

            <button 
              onClick={() => handleExportReport('pdf')}
              className="w-full py-3 px-4 bg-white/10 text-white font-medium rounded-xl hover:bg-white/20 transition duration-200 flex items-center justify-center border border-white/20"
            >
              <FileText className="h-5 w-5 mr-2" />
              Exportar PDF
            </button>

            <Link to="/reports">
              <button className="w-full py-3 px-4 bg-white/10 text-white font-medium rounded-xl hover:bg-white/20 transition duration-200 flex items-center justify-center border border-white/20">
                <ArrowRight className="h-5 w-5 mr-2" />
                Todos los Reportes
              </button>
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default AppointmentReports;
