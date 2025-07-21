import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { 
  FileText, BarChart3, Calendar, Users, TrendingUp,
  Download, Filter, Search, Plus, ChevronRight,
  Activity, Pill, AlertTriangle, Stethoscope,
  Heart, Shield, Package, Clock, Eye
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import dashboardService from '../../services/dashboardService';
import { useAuth } from '../../contexts/AuthContext';

const ReportsMain = () => {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const [selectedCategory, setSelectedCategory] = useState('all');

  // Obtener estadísticas generales de reportes
  const { data: reportsStats, isLoading: loadingStats } = useQuery({
    queryKey: ['reportsStats', selectedPeriod],
    queryFn: () => dashboardService.getReportsStats(selectedPeriod),
  });

  // Obtener reportes recientes
  const { data: recentReports, isLoading: loadingRecent } = useQuery({
    queryKey: ['recentReports'],
    queryFn: dashboardService.getRecentReports,
    refetchInterval: 300000, // Actualizar cada 5 minutos
  });

  // Obtener reportes disponibles por rol
  const { data: availableReports, isLoading: loadingAvailable } = useQuery({
    queryKey: ['availableReports', user?.role],
    queryFn: () => dashboardService.getAvailableReports(user?.role),
  });

  const periods = [
    { value: 'day', label: 'Hoy' },
    { value: 'week', label: 'Esta semana' },
    { value: 'month', label: 'Este mes' },
    { value: 'quarter', label: 'Trimestre' },
    { value: 'year', label: 'Este año' }
  ];

  const categories = [
    { value: 'all', label: 'Todos', icon: FileText },
    { value: 'clinical', label: 'Clínicos', icon: Stethoscope },
    { value: 'financial', label: 'Financieros', icon: BarChart3 },
    { value: 'operational', label: 'Operacionales', icon: Activity },
    { value: 'pharmacy', label: 'Farmacia', icon: Pill },
    { value: 'emergency', label: 'Emergencias', icon: Shield },
  ];

  const getReportIcon = (type) => {
    const icons = {
      clinical: Stethoscope,
      financial: BarChart3,
      operational: Activity,
      pharmacy: Pill,
      emergency: Shield,
      patients: Users,
      appointments: Calendar,
      inventory: Package,
      performance: TrendingUp,
    };
    return icons[type] || FileText;
  };

  const getReportColor = (type) => {
    const colors = {
      clinical: 'from-blue-500 to-indigo-600',
      financial: 'from-green-500 to-emerald-600',
      operational: 'from-purple-500 to-violet-600',
      pharmacy: 'from-orange-500 to-red-600',
      emergency: 'from-red-500 to-pink-600',
      patients: 'from-teal-500 to-cyan-600',
      appointments: 'from-indigo-500 to-blue-600',
      inventory: 'from-amber-500 to-yellow-600',
      performance: 'from-pink-500 to-rose-600',
    };
    return colors[type] || 'from-gray-500 to-slate-600';
  };

  const filteredReports = availableReports?.filter(report => {
    const matchesSearch = report.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         report.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || report.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

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
              <BarChart3 className="h-8 w-8 mr-3 text-blue-400" />
              Centro de Reportes
            </h1>
            <p className="text-slate-200">
              {format(new Date(), "EEEE, d 'de' MMMM 'de' yyyy", { locale: es })}
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <Link to="/reports/create">
              <button className="flex items-center px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl font-medium hover:from-blue-600 hover:to-indigo-700 transition-colors">
                <Plus className="h-4 w-4 mr-2" />
                Crear Reporte
              </button>
            </Link>
            <button className="flex items-center px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl border border-white/20 transition-colors">
              <Download className="h-4 w-4 mr-2" />
              Exportar
            </button>
          </div>
        </motion.div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="backdrop-blur-lg bg-white/10 rounded-2xl p-6 border border-white/20"
          >
            <div className="flex items-center justify-between">
              <div className="p-3 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600">
                <FileText className="h-6 w-6 text-white" />
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-white">{reportsStats?.total_reports || 0}</p>
                <p className="text-sm text-slate-200">Reportes Totales</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="backdrop-blur-lg bg-white/10 rounded-2xl p-6 border border-white/20"
          >
            <div className="flex items-center justify-between">
              <div className="p-3 rounded-xl bg-gradient-to-r from-green-500 to-green-600">
                <Calendar className="h-6 w-6 text-white" />
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-white">{reportsStats?.reports_this_month || 0}</p>
                <p className="text-sm text-slate-200">Este Mes</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="backdrop-blur-lg bg-white/10 rounded-2xl p-6 border border-white/20"
          >
            <div className="flex items-center justify-between">
              <div className="p-3 rounded-xl bg-gradient-to-r from-purple-500 to-purple-600">
                <TrendingUp className="h-6 w-6 text-white" />
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-white">{reportsStats?.downloads || 0}</p>
                <p className="text-sm text-slate-200">Descargas</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="backdrop-blur-lg bg-white/10 rounded-2xl p-6 border border-white/20"
          >
            <div className="flex items-center justify-between">
              <div className="p-3 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600">
                <Clock className="h-6 w-6 text-white" />
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-white">{reportsStats?.scheduled || 0}</p>
                <p className="text-sm text-slate-200">Programados</p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="backdrop-blur-lg bg-white/10 rounded-2xl p-6 border border-white/20 mb-8"
        >
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-5 w-5" />
              <input
                type="text"
                placeholder="Buscar reportes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Category Filter */}
            <div className="flex items-center space-x-2">
              {categories.map((category) => {
                const IconComponent = category.icon;
                return (
                  <button
                    key={category.value}
                    onClick={() => setSelectedCategory(category.value)}
                    className={`flex items-center px-4 py-2 rounded-xl font-medium transition-colors ${
                      selectedCategory === category.value
                        ? 'bg-blue-500 text-white'
                        : 'bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white border border-white/20'
                    }`}
                  >
                    <IconComponent className="h-4 w-4 mr-2" />
                    {category.label}
                  </button>
                );
              })}
            </div>

            {/* Period Filter */}
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {periods.map((period) => (
                <option key={period.value} value={period.value} className="bg-slate-800">
                  {period.label}
                </option>
              ))}
            </select>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Available Reports */}
          <div className="lg:col-span-2">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="backdrop-blur-lg bg-white/10 rounded-2xl p-6 border border-white/20"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-white flex items-center">
                  <FileText className="h-5 w-5 mr-2 text-blue-400" />
                  Reportes Disponibles
                </h2>
              </div>

              {loadingAvailable ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-96 overflow-y-auto">
                  {filteredReports?.length === 0 ? (
                    <p className="text-slate-200 text-center py-8 col-span-full">
                      No se encontraron reportes
                    </p>
                  ) : (
                    filteredReports?.map((report) => {
                      const ReportIcon = getReportIcon(report.type);
                      return (
                        <motion.div
                          key={report.id}
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="bg-white/5 rounded-xl p-4 border border-white/10 hover:bg-white/10 transition-colors cursor-pointer group"
                        >
                          <div className="flex items-center justify-between mb-3">
                            <div className={`p-2 rounded-lg bg-gradient-to-r ${getReportColor(report.type)}`}>
                              <ReportIcon className="h-5 w-5 text-white" />
                            </div>
                            <div className="flex items-center space-x-2">
                              {report.link && (
                                <Link to={report.link}>
                                  <button className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors">
                                    <Eye className="h-4 w-4" />
                                  </button>
                                </Link>
                              )}
                              <button className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors">
                                <Download className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                          
                          <h4 className="text-white font-medium mb-1">{report.name}</h4>
                          <p className="text-slate-300 text-sm mb-2">{report.description}</p>
                          
                          <div className="flex items-center justify-between text-xs text-slate-400">
                            <span>Última actualización: {report.last_updated}</span>
                            <span className="capitalize">{report.frequency}</span>
                          </div>
                        </motion.div>
                      );
                    })
                  )}
                </div>
              )}
            </motion.div>
          </div>

          {/* Recent Reports */}
          <div className="lg:col-span-1">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="backdrop-blur-lg bg-white/10 rounded-2xl p-6 border border-white/20"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-white flex items-center">
                  <Clock className="h-5 w-5 mr-2 text-green-400" />
                  Reportes Recientes
                </h2>
              </div>

              {loadingRecent ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                </div>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {recentReports?.length === 0 ? (
                    <p className="text-slate-200 text-center py-8">
                      No hay reportes recientes
                    </p>
                  ) : (
                    recentReports?.map((report) => (
                      <div
                        key={report.id}
                        className="bg-white/5 rounded-xl p-4 border border-white/10 hover:bg-white/10 transition-colors"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="text-white font-medium text-sm">{report.name}</h4>
                          <span className="text-xs text-slate-300">
                            {format(new Date(report.created_at), 'dd/MM HH:mm')}
                          </span>
                        </div>
                        <p className="text-slate-300 text-xs mb-2">
                          Por: {report.created_by}
                        </p>
                        <div className="flex items-center justify-between">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            report.status === 'completed' ? 'bg-green-500/20 text-green-300' :
                            report.status === 'processing' ? 'bg-yellow-500/20 text-yellow-300' :
                            report.status === 'failed' ? 'bg-red-500/20 text-red-300' :
                            'bg-gray-500/20 text-gray-300'
                          }`}>
                            {report.status === 'completed' ? 'Completado' :
                             report.status === 'processing' ? 'Procesando' :
                             report.status === 'failed' ? 'Error' :
                             report.status}
                          </span>
                          {report.status === 'completed' && (
                            <button className="text-blue-400 hover:text-blue-300 text-xs">
                              Descargar
                            </button>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </motion.div>
          </div>
        </div>

        {/* Quick Access */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="mt-6 backdrop-blur-lg bg-white/10 rounded-2xl p-6 border border-white/20"
        >
          <h2 className="text-xl font-semibold text-white mb-4">Acceso Rápido a Reportes</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {/* Admin Exclusive Reports */}
            {user?.role === 'admin' && (
              <>
                <Link to="/reports/financial">
                  <button className="w-full py-3 px-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-medium rounded-xl hover:from-green-600 hover:to-emerald-700 transition duration-200 flex items-center justify-center">
                    <BarChart3 className="h-5 w-5 mr-2" />
                    Financieros
                  </button>
                </Link>
                <Link to="/reports/performance">
                  <button className="w-full py-3 px-4 bg-gradient-to-r from-purple-500 to-violet-600 text-white font-medium rounded-xl hover:from-purple-600 hover:to-violet-700 transition duration-200 flex items-center justify-center">
                    <TrendingUp className="h-5 w-5 mr-2" />
                    Rendimiento
                  </button>
                </Link>
                <Link to="/reports/monthly">
                  <button className="w-full py-3 px-4 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-medium rounded-xl hover:from-indigo-600 hover:to-purple-700 transition duration-200 flex items-center justify-center">
                    <Calendar className="h-5 w-5 mr-2" />
                    Mensuales
                  </button>
                </Link>
              </>
            )}
            
            {/* Pharmacy Reports */}
            {(user?.role === 'admin' || user?.role === 'pharmacist') && (
              <>
                <Link to="/pharmacy/reports">
                  <button className="w-full py-3 px-4 bg-gradient-to-r from-orange-500 to-red-600 text-white font-medium rounded-xl hover:from-orange-600 hover:to-red-700 transition duration-200 flex items-center justify-center">
                    <Pill className="h-5 w-5 mr-2" />
                    Farmacia
                  </button>
                </Link>
                <Link to="/pharmacy/financials">
                  <button className="w-full py-3 px-4 bg-gradient-to-r from-amber-500 to-orange-600 text-white font-medium rounded-xl hover:from-amber-600 hover:to-orange-700 transition duration-200 flex items-center justify-center">
                    <Pill className="h-5 w-5 mr-2" />
                    Finanz. Farm.
                  </button>
                </Link>
              </>
            )}

            {/* Emergency Reports */}
            {(user?.role === 'admin' || user?.role === 'emergency') && (
              <Link to="/emergency/reports">
                <button className="w-full py-3 px-4 bg-gradient-to-r from-red-500 to-pink-600 text-white font-medium rounded-xl hover:from-red-600 hover:to-pink-700 transition duration-200 flex items-center justify-center">
                  <Shield className="h-5 w-5 mr-2" />
                  Emergencias
                </button>
              </Link>
            )}

            {/* Medical Reports */}
            {(user?.role === 'admin' || user?.role === 'doctor') && (
              <Link to="/reports/clinical">
                <button className="w-full py-3 px-4 bg-white/10 text-white font-medium rounded-xl hover:bg-white/20 transition duration-200 flex items-center justify-center border border-white/20">
                  <Stethoscope className="h-5 w-5 mr-2" />
                  Clínicos
                </button>
              </Link>
            )}

            {/* General Reports */}
            <Link to="/reports/appointments">
              <button className="w-full py-3 px-4 bg-white/10 text-white font-medium rounded-xl hover:bg-white/20 transition duration-200 flex items-center justify-center border border-white/20">
                <Calendar className="h-5 w-5 mr-2" />
                Citas
              </button>
            </Link>

            <Link to="/reports/patients">
              <button className="w-full py-3 px-4 bg-white/10 text-white font-medium rounded-xl hover:bg-white/20 transition duration-200 flex items-center justify-center border border-white/20">
                <Users className="h-5 w-5 mr-2" />
                Pacientes
              </button>
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default ReportsMain;
