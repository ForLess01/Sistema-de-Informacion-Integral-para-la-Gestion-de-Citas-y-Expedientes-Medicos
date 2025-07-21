import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { 
  Calendar, BarChart3, TrendingUp, TrendingDown, FileText,
  Users, Stethoscope, Pill, Shield, DollarSign,
  Clock, CheckCircle, XCircle, AlertTriangle,
  Download, RefreshCw, Eye, Filter, Search,
  PieChart, Activity, Target, Award, Heart,
  Building, Phone, UserPlus, Package,
  ArrowUpRight, ArrowDownRight, ChevronRight,
  Star, Zap, MessageSquare, BookOpen,
  Briefcase, TrendingDown as Down, Settings
} from 'lucide-react';
import { format, startOfMonth, endOfMonth, subMonths, addMonths } from 'date-fns';
import { es } from 'date-fns/locale';
import dashboardService from '../../services/dashboardService';
import { useAuth } from '../../contexts/AuthContext';

const MonthlyReports = () => {
  const { user } = useAuth();
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [reportView, setReportView] = useState('overview');
  const [comparison, setComparison] = useState(true);

  // Obtener datos del reporte mensual consolidado
  const { data: monthlyData, isLoading: loadingMonthly, refetch } = useQuery({
    queryKey: ['monthlyConsolidatedReport', selectedMonth, selectedYear],
    queryFn: () => dashboardService.getMonthlyConsolidatedReport(selectedMonth, selectedYear),
    refetchInterval: 600000, // Actualizar cada 10 minutos
  });

  // Obtener comparación con mes anterior
  const { data: comparisonData, isLoading: loadingComparison } = useQuery({
    queryKey: ['monthlyComparison', selectedMonth, selectedYear],
    queryFn: () => dashboardService.getMonthlyComparison(selectedMonth, selectedYear),
    enabled: comparison,
  });

  // Obtener tendencias anuales
  const { data: yearlyTrends, isLoading: loadingTrends } = useQuery({
    queryKey: ['yearlyTrends', selectedYear],
    queryFn: () => dashboardService.getYearlyTrends(selectedYear),
  });

  // Obtener alertas y recomendaciones
  const { data: monthlyAlerts, isLoading: loadingAlerts } = useQuery({
    queryKey: ['monthlyAlerts', selectedMonth, selectedYear],
    queryFn: () => dashboardService.getMonthlyAlerts(selectedMonth, selectedYear),
  });

  // Obtener resumen ejecutivo
  const { data: executiveSummary, isLoading: loadingExecutive } = useQuery({
    queryKey: ['monthlyExecutiveSummary', selectedMonth, selectedYear],
    queryFn: () => dashboardService.getMonthlyExecutiveSummary(selectedMonth, selectedYear),
  });

  const months = [
    { value: 0, label: 'Enero' },
    { value: 1, label: 'Febrero' },
    { value: 2, label: 'Marzo' },
    { value: 3, label: 'Abril' },
    { value: 4, label: 'Mayo' },
    { value: 5, label: 'Junio' },
    { value: 6, label: 'Julio' },
    { value: 7, label: 'Agosto' },
    { value: 8, label: 'Septiembre' },
    { value: 9, label: 'Octubre' },
    { value: 10, label: 'Noviembre' },
    { value: 11, label: 'Diciembre' },
  ];

  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);

  const reportViews = [
    { value: 'overview', label: 'Resumen Ejecutivo', icon: BarChart3 },
    { value: 'detailed', label: 'Análisis Detallado', icon: FileText },
    { value: 'trends', label: 'Tendencias', icon: TrendingUp },
    { value: 'alerts', label: 'Alertas', icon: AlertTriangle },
  ];

  // Métricas principales consolidadas
  const mainMetrics = [
    {
      title: 'Total Pacientes Atendidos',
      value: monthlyData?.patients?.total_served || 0,
      change: comparisonData?.patients?.change || '+0%',
      icon: Users,
      color: 'from-blue-500 to-indigo-600',
      category: 'patients'
    },
    {
      title: 'Citas Programadas',
      value: monthlyData?.appointments?.total_scheduled || 0,
      change: comparisonData?.appointments?.change || '+0%',
      icon: Calendar,
      color: 'from-green-500 to-emerald-600',
      category: 'appointments'
    },
    {
      title: 'Emergencias Atendidas',
      value: monthlyData?.emergencies?.total_cases || 0,
      change: comparisonData?.emergencies?.change || '+0%',
      icon: Shield,
      color: 'from-red-500 to-pink-600',
      category: 'emergencies'
    },
    {
      title: 'Ingresos Totales',
      value: monthlyData?.financial?.total_revenue || 0,
      change: comparisonData?.financial?.change || '+0%',
      icon: DollarSign,
      color: 'from-yellow-500 to-orange-600',
      category: 'financial',
      type: 'currency'
    },
  ];

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency: 'PEN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatValue = (value, type) => {
    if (type === 'currency') return formatCurrency(value);
    return value.toLocaleString();
  };

  const getChangeIcon = (change) => {
    if (change.startsWith('+')) {
      return <ArrowUpRight className="h-4 w-4 text-green-400" />;
    } else if (change.startsWith('-')) {
      return <ArrowDownRight className="h-4 w-4 text-red-400" />;
    }
    return null;
  };

  const getChangeColor = (change) => {
    if (change.startsWith('+')) {
      return 'text-green-400';
    } else if (change.startsWith('-')) {
      return 'text-red-400';
    }
    return 'text-slate-400';
  };

  const handleExport = (format = 'pdf') => {
    // Implementar lógica de exportación
    console.log(`Exporting monthly report for ${format}`);
  };

  const handleMonthChange = (direction) => {
    const newDate = direction === 'prev' 
      ? subMonths(selectedMonth, 1)
      : addMonths(selectedMonth, 1);
    setSelectedMonth(newDate);
    setSelectedYear(newDate.getFullYear());
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
              <Calendar className="h-8 w-8 mr-3 text-indigo-400" />
              Reportes Mensuales
            </h1>
            <p className="text-slate-200">
              {format(selectedMonth, "MMMM 'de' yyyy", { locale: es })} - Reporte Consolidado
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <button 
              onClick={() => refetch()}
              className="flex items-center px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl border border-white/20 transition-colors"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Actualizar
            </button>
            <div className="flex items-center space-x-2">
              <button 
                onClick={() => handleExport('pdf')}
                className="flex items-center px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl font-medium hover:from-indigo-600 hover:to-purple-700 transition-colors"
              >
                <Download className="h-4 w-4 mr-2" />
                PDF
              </button>
              <button 
                onClick={() => handleExport('excel')}
                className="flex items-center px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-medium hover:from-green-600 hover:to-emerald-700 transition-colors"
              >
                <Download className="h-4 w-4 mr-2" />
                Excel
              </button>
            </div>
          </div>
        </motion.div>

        {/* Month Navigation & Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="backdrop-blur-lg bg-white/10 rounded-2xl p-6 border border-white/20 mb-8"
        >
          <div className="flex flex-col lg:flex-row gap-4 items-center">
            {/* Month Navigation */}
            <div className="flex items-center space-x-4">
              <button
                onClick={() => handleMonthChange('prev')}
                className="p-2 text-white hover:bg-white/10 rounded-lg transition-colors"
              >
                ←
              </button>
              <div className="text-center">
                <h3 className="text-xl font-bold text-white">
                  {format(selectedMonth, "MMMM yyyy", { locale: es })}
                </h3>
                <p className="text-slate-300 text-sm">
                  {format(startOfMonth(selectedMonth), "d")} - {format(endOfMonth(selectedMonth), "d 'de' MMMM", { locale: es })}
                </p>
              </div>
              <button
                onClick={() => handleMonthChange('next')}
                className="p-2 text-white hover:bg-white/10 rounded-lg transition-colors"
                disabled={selectedMonth >= new Date()}
              >
                →
              </button>
            </div>

            {/* View Selector */}
            <div className="flex items-center space-x-2 ml-auto">
              {reportViews.map((view) => {
                const ViewIcon = view.icon;
                return (
                  <button
                    key={view.value}
                    onClick={() => setReportView(view.value)}
                    className={`flex items-center px-4 py-2 rounded-xl font-medium transition-colors ${
                      reportView === view.value
                        ? 'bg-indigo-500 text-white'
                        : 'bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white border border-white/20'
                    }`}
                  >
                    <ViewIcon className="h-4 w-4 mr-2" />
                    {view.label}
                  </button>
                );
              })}
            </div>

            {/* Comparison Toggle */}
            <label className="flex items-center space-x-2 text-white">
              <input
                type="checkbox"
                checked={comparison}
                onChange={(e) => setComparison(e.target.checked)}
                className="rounded"
              />
              <span className="text-sm">Comparar con mes anterior</span>
            </label>
          </div>
        </motion.div>

        {/* Main Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {mainMetrics.map((metric, index) => (
            <motion.div
              key={metric.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 + 0.2 }}
              className="backdrop-blur-lg bg-white/10 rounded-2xl p-6 border border-white/20"
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-xl bg-gradient-to-r ${metric.color}`}>
                  <metric.icon className="h-6 w-6 text-white" />
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-white">
                    {formatValue(metric.value, metric.type)}
                  </p>
                  {comparison && (
                    <div className={`flex items-center text-sm ${getChangeColor(metric.change)}`}>
                      {getChangeIcon(metric.change)}
                      <span className="ml-1">{metric.change}</span>
                    </div>
                  )}
                </div>
              </div>
              <h3 className="text-white/80 text-sm">{metric.title}</h3>
            </motion.div>
          ))}
        </div>

        {/* Content Based on Selected View */}
        {reportView === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Executive Summary */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="lg:col-span-2 backdrop-blur-lg bg-white/10 rounded-2xl p-6 border border-white/20"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-white flex items-center">
                  <Briefcase className="h-5 w-5 mr-2 text-indigo-400" />
                  Resumen Ejecutivo
                </h2>
                <button className="text-slate-300 hover:text-white">
                  <Eye className="h-5 w-5" />
                </button>
              </div>

              {loadingExecutive ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Key Performance Indicators */}
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-white font-medium text-sm">Satisfacción General</h4>
                        <Star className="h-4 w-4 text-yellow-400" />
                      </div>
                      <p className="text-2xl font-bold text-white">{executiveSummary?.satisfaction || '92'}%</p>
                      <p className="text-xs text-green-300">+2% vs mes anterior</p>
                    </div>

                    <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-white font-medium text-sm">Ocupación Promedio</h4>
                        <Activity className="h-4 w-4 text-blue-400" />
                      </div>
                      <p className="text-2xl font-bold text-white">{executiveSummary?.occupancy || '78'}%</p>
                      <p className="text-xs text-green-300">+5% vs mes anterior</p>
                    </div>

                    <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-white font-medium text-sm">Tiempo Esp. Prom.</h4>
                        <Clock className="h-4 w-4 text-orange-400" />
                      </div>
                      <p className="text-2xl font-bold text-white">{executiveSummary?.wait_time || '18'} min</p>
                      <p className="text-xs text-red-300">+2min vs mes anterior</p>
                    </div>
                  </div>

                  {/* Specialty Performance */}
                  <div>
                    <h4 className="text-white font-medium mb-4">Rendimiento por Especialidad</h4>
                    <div className="space-y-3">
                      {[
                        { name: 'Medicina General', patients: 1247, efficiency: 94, color: 'from-blue-500 to-blue-600', icon: Stethoscope },
                        { name: 'Obstetricia', patients: 432, efficiency: 91, color: 'from-pink-500 to-pink-600', icon: Heart },
                        { name: 'Odontología', patients: 678, efficiency: 88, color: 'from-green-500 to-green-600', icon: Building },
                      ].map((specialty) => (
                        <div key={specialty.name} className="bg-white/5 rounded-xl p-4 border border-white/10">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center space-x-3">
                              <div className={`p-2 rounded-lg bg-gradient-to-r ${specialty.color}`}>
                                <specialty.icon className="h-4 w-4 text-white" />
                              </div>
                              <div>
                                <h5 className="text-white font-medium text-sm">{specialty.name}</h5>
                                <p className="text-slate-300 text-xs">{specialty.patients} pacientes</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-white font-semibold">{specialty.efficiency}%</p>
                              <p className="text-slate-300 text-xs">Eficiencia</p>
                            </div>
                          </div>
                          <div className="w-full bg-white/10 rounded-full h-2">
                            <div 
                              className={`h-2 rounded-full bg-gradient-to-r ${specialty.color}`}
                              style={{ width: `${specialty.efficiency}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </motion.div>

            {/* Key Insights & Alerts */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              className="space-y-6"
            >
              {/* Monthly Alerts */}
              <div className="backdrop-blur-lg bg-white/10 rounded-2xl p-6 border border-white/20">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-white flex items-center">
                    <AlertTriangle className="h-5 w-5 mr-2 text-yellow-400" />
                    Alertas del Mes
                  </h2>
                </div>

                {loadingAlerts ? (
                  <div className="flex justify-center py-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {monthlyAlerts?.slice(0, 4).map((alert, index) => (
                      <div
                        key={index}
                        className={`bg-white/5 rounded-xl p-4 border-l-4 ${
                          alert.priority === 'high' ? 'border-red-400' :
                          alert.priority === 'medium' ? 'border-yellow-400' :
                          'border-blue-400'
                        } border-r border-t border-b border-white/10`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="text-white font-medium text-sm">{alert.title}</h4>
                            <p className="text-slate-300 text-xs">{alert.description}</p>
                          </div>
                          <div className={`text-xs px-2 py-1 rounded ${
                            alert.priority === 'high' ? 'bg-red-500/20 text-red-300' :
                            alert.priority === 'medium' ? 'bg-yellow-500/20 text-yellow-300' :
                            'bg-blue-500/20 text-blue-300'
                          }`}>
                            {alert.priority === 'high' ? 'Alta' :
                             alert.priority === 'medium' ? 'Media' : 'Baja'}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Quick Stats */}
              <div className="backdrop-blur-lg bg-white/10 rounded-2xl p-6 border border-white/20">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-white flex items-center">
                    <Zap className="h-5 w-5 mr-2 text-purple-400" />
                    Estadísticas Rápidas
                  </h2>
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-300 text-sm">Nuevos Pacientes</span>
                    <span className="text-white font-semibold">+{monthlyData?.patients?.new_patients || 156}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-300 text-sm">Medicamentos Dispensados</span>
                    <span className="text-white font-semibold">{monthlyData?.pharmacy?.dispensed || '2,847'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-300 text-sm">Llamadas Atendidas</span>
                    <span className="text-white font-semibold">{monthlyData?.calls?.total || '1,293'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-300 text-sm">Tasa de No-Show</span>
                    <span className="text-white font-semibold">{monthlyData?.appointments?.no_show_rate || '5.2'}%</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {/* Financial Summary */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="mt-6 backdrop-blur-lg bg-white/10 rounded-2xl p-6 border border-white/20"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-white flex items-center">
              <DollarSign className="h-5 w-5 mr-2 text-green-400" />
              Resumen Financiero del Mes
            </h2>
            <button className="text-slate-300 hover:text-white flex items-center text-sm">
              Ver detalle completo <ChevronRight className="h-4 w-4 ml-1" />
            </button>
          </div>

          {loadingMonthly ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="bg-white/5 rounded-xl p-4 border border-white/10 text-center">
                <div className="flex items-center justify-center mb-2">
                  <TrendingUp className="h-6 w-6 text-green-400" />
                </div>
                <p className="text-2xl font-bold text-white mb-1">
                  {formatCurrency(monthlyData?.financial?.total_income || 245680)}
                </p>
                <p className="text-slate-300 text-sm">Ingresos Totales</p>
                <p className="text-green-300 text-xs">+12% vs mes anterior</p>
              </div>

              <div className="bg-white/5 rounded-xl p-4 border border-white/10 text-center">
                <div className="flex items-center justify-center mb-2">
                  <Down className="h-6 w-6 text-red-400" />
                </div>
                <p className="text-2xl font-bold text-white mb-1">
                  {formatCurrency(monthlyData?.financial?.total_expenses || 186420)}
                </p>
                <p className="text-slate-300 text-sm">Gastos Totales</p>
                <p className="text-yellow-300 text-xs">+8% vs mes anterior</p>
              </div>

              <div className="bg-white/5 rounded-xl p-4 border border-white/10 text-center">
                <div className="flex items-center justify-center mb-2">
                  <Target className="h-6 w-6 text-blue-400" />
                </div>
                <p className="text-2xl font-bold text-white mb-1">
                  {formatCurrency(monthlyData?.financial?.net_profit || 59260)}
                </p>
                <p className="text-slate-300 text-sm">Ganancia Neta</p>
                <p className="text-green-300 text-xs">+24% vs mes anterior</p>
              </div>

              <div className="bg-white/5 rounded-xl p-4 border border-white/10 text-center">
                <div className="flex items-center justify-center mb-2">
                  <Pill className="h-6 w-6 text-orange-400" />
                </div>
                <p className="text-2xl font-bold text-white mb-1">
                  {formatCurrency(monthlyData?.pharmacy?.revenue || 87350)}
                </p>
                <p className="text-slate-300 text-sm">Farmacia</p>
                <p className="text-green-300 text-xs">+18% vs mes anterior</p>
              </div>

              <div className="bg-white/5 rounded-xl p-4 border border-white/10 text-center">
                <div className="flex items-center justify-center mb-2">
                  <Activity className="h-6 w-6 text-purple-400" />
                </div>
                <p className="text-2xl font-bold text-white mb-1">
                  {monthlyData?.financial?.margin || '24.1'}%
                </p>
                <p className="text-slate-300 text-sm">Margen</p>
                <p className="text-green-300 text-xs">+2.3% vs mes anterior</p>
              </div>
            </div>
          )}
        </motion.div>

        {/* Monthly Goals & Achievements */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
          className="mt-6 backdrop-blur-lg bg-white/10 rounded-2xl p-6 border border-white/20"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-white flex items-center">
              <Award className="h-5 w-5 mr-2 text-yellow-400" />
              Objetivos y Logros del Mes
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                goal: 'Atender 2,500 pacientes',
                achieved: monthlyData?.patients?.total_served || 2847,
                target: 2500,
                status: 'exceeded',
                icon: Users
              },
              {
                goal: 'Mantener satisfacción >90%',
                achieved: executiveSummary?.satisfaction || 92,
                target: 90,
                status: 'achieved',
                icon: Star
              },
              {
                goal: 'Reducir tiempo espera <15min',
                achieved: executiveSummary?.wait_time || 18,
                target: 15,
                status: 'pending',
                icon: Clock
              }
            ].map((objective, index) => (
              <div key={index} className="bg-white/5 rounded-xl p-4 border border-white/10">
                <div className="flex items-center justify-between mb-3">
                  <objective.icon className={`h-5 w-5 ${
                    objective.status === 'exceeded' ? 'text-green-400' :
                    objective.status === 'achieved' ? 'text-blue-400' : 'text-orange-400'
                  }`} />
                  <div className={`text-xs px-2 py-1 rounded ${
                    objective.status === 'exceeded' ? 'bg-green-500/20 text-green-300' :
                    objective.status === 'achieved' ? 'bg-blue-500/20 text-blue-300' :
                    'bg-orange-500/20 text-orange-300'
                  }`}>
                    {objective.status === 'exceeded' ? 'Superado' :
                     objective.status === 'achieved' ? 'Logrado' : 'Pendiente'}
                  </div>
                </div>
                <h4 className="text-white font-medium text-sm mb-2">{objective.goal}</h4>
                <div className="flex items-center justify-between text-xs text-slate-300">
                  <span>Actual: {objective.achieved}</span>
                  <span>Meta: {objective.target}</span>
                </div>
                <div className="w-full bg-white/10 rounded-full h-2 mt-2">
                  <div 
                    className={`h-2 rounded-full ${
                      objective.status === 'exceeded' ? 'bg-green-500' :
                      objective.status === 'achieved' ? 'bg-blue-500' : 'bg-orange-500'
                    }`}
                    style={{ 
                      width: `${Math.min((objective.achieved / objective.target) * 100, 100)}%` 
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default MonthlyReports;
