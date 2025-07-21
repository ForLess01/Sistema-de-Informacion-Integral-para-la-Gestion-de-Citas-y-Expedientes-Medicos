import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { 
  Stethoscope, TrendingUp, TrendingDown, BarChart3,
  Clock, Users, Calendar, Star, Award,
  Filter, Search, Download, RefreshCw,
  ChevronRight, Eye, Target, Activity,
  Heart, Building, Zap, CheckCircle,
  XCircle, AlertTriangle, PieChart,
  FileText, ArrowUpRight, ArrowDownRight,
  User, Phone, Mail, MapPin
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import dashboardService from '../../services/dashboardService';
import { useAuth } from '../../contexts/AuthContext';

const DoctorPerformance = () => {
  const { user } = useAuth();
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const [selectedSpecialty, setSelectedSpecialty] = useState('all');
  const [selectedDoctor, setSelectedDoctor] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState('overview');

  // Obtener datos de rendimiento de doctores
  const { data: doctorPerformance, isLoading: loadingPerformance, refetch } = useQuery({
    queryKey: ['doctorPerformance', selectedPeriod, selectedSpecialty],
    queryFn: () => dashboardService.getDoctorPerformance(selectedPeriod, selectedSpecialty),
    refetchInterval: 300000, // Actualizar cada 5 minutos
  });

  // Obtener comparativas por especialidad
  const { data: specialtyComparison, isLoading: loadingComparison } = useQuery({
    queryKey: ['specialtyPerformanceComparison', selectedPeriod],
    queryFn: () => dashboardService.getSpecialtyPerformanceComparison(selectedPeriod),
  });

  // Obtener métricas de satisfacción
  const { data: satisfactionMetrics, isLoading: loadingSatisfaction } = useQuery({
    queryKey: ['doctorSatisfactionMetrics', selectedPeriod],
    queryFn: () => dashboardService.getDoctorSatisfactionMetrics(selectedPeriod),
  });

  // Obtener estadísticas globales de rendimiento
  const { data: globalStats, isLoading: loadingStats } = useQuery({
    queryKey: ['globalPerformanceStats', selectedPeriod],
    queryFn: () => dashboardService.getGlobalPerformanceStats(selectedPeriod),
  });

  // Obtener top performers
  const { data: topPerformers, isLoading: loadingTop } = useQuery({
    queryKey: ['topPerformingDoctors', selectedPeriod],
    queryFn: () => dashboardService.getTopPerformingDoctors(selectedPeriod),
  });

  const periods = [
    { value: 'week', label: 'Esta semana' },
    { value: 'month', label: 'Este mes' },
    { value: 'quarter', label: 'Trimestre' },
    { value: 'year', label: 'Este año' }
  ];

  const specialties = [
    { value: 'all', label: 'Todas las especialidades', icon: Stethoscope },
    { value: 'general', label: 'Medicina General', icon: Stethoscope },
    { value: 'obstetrics', label: 'Obstetricia', icon: Heart },
    { value: 'dentistry', label: 'Odontología', icon: Building },
  ];

  const viewModes = [
    { value: 'overview', label: 'Resumen', icon: BarChart3 },
    { value: 'detailed', label: 'Detallado', icon: FileText },
    { value: 'comparison', label: 'Comparación', icon: PieChart },
    { value: 'satisfaction', label: 'Satisfacción', icon: Star },
  ];

  // Métricas principales del sistema
  const mainMetrics = [
    {
      title: 'Promedio General Satisfacción',
      value: globalStats?.avg_satisfaction || 0,
      change: globalStats?.satisfaction_change || '+0%',
      icon: Star,
      color: 'from-yellow-500 to-orange-600',
      type: 'percentage',
    },
    {
      title: 'Tiempo Promedio Consulta',
      value: globalStats?.avg_consultation_time || 0,
      change: globalStats?.consultation_time_change || '+0%',
      icon: Clock,
      color: 'from-blue-500 to-indigo-600',
      type: 'time',
    },
    {
      title: 'Tasa de Cancelaciones',
      value: globalStats?.cancellation_rate || 0,
      change: globalStats?.cancellation_change || '+0%',
      icon: XCircle,
      color: 'from-red-500 to-pink-600',
      type: 'percentage',
    },
    {
      title: 'Doctores Activos',
      value: globalStats?.active_doctors || 0,
      change: globalStats?.active_change || '+0%',
      icon: Users,
      color: 'from-green-500 to-emerald-600',
      type: 'number',
    },
  ];

  const formatValue = (value, type) => {
    switch (type) {
      case 'percentage':
        return `${value}%`;
      case 'time':
        return `${value} min`;
      case 'currency':
        return new Intl.NumberFormat('es-PE', {
          style: 'currency',
          currency: 'PEN',
          minimumFractionDigits: 0,
        }).format(value);
      default:
        return value;
    }
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

  const getPerformanceColor = (score) => {
    if (score >= 90) return 'from-green-500 to-emerald-600';
    if (score >= 75) return 'from-blue-500 to-indigo-600';
    if (score >= 60) return 'from-yellow-500 to-orange-600';
    return 'from-red-500 to-pink-600';
  };

  const getPerformanceLabel = (score) => {
    if (score >= 90) return 'Excelente';
    if (score >= 75) return 'Bueno';
    if (score >= 60) return 'Regular';
    return 'Necesita Mejora';
  };

  const getSpecialtyIcon = (specialty) => {
    switch (specialty) {
      case 'general':
        return Stethoscope;
      case 'obstetrics':
        return Heart;
      case 'dentistry':
        return Building;
      default:
        return Activity;
    }
  };

  const filteredDoctors = doctorPerformance?.doctors?.filter(doctor => {
    const matchesSearch = doctor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         doctor.specialty.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
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
              <TrendingUp className="h-8 w-8 mr-3 text-purple-400" />
              Rendimiento de Doctores
            </h1>
            <p className="text-slate-200">
              {format(new Date(), "EEEE, d 'de' MMMM 'de' yyyy", { locale: es })}
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
            <button className="flex items-center px-4 py-2 bg-gradient-to-r from-purple-500 to-violet-600 text-white rounded-xl font-medium hover:from-purple-600 hover:to-violet-700 transition-colors">
              <Download className="h-4 w-4 mr-2" />
              Exportar
            </button>
          </div>
        </motion.div>

        {/* Main Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {mainMetrics.map((metric, index) => (
            <motion.div
              key={metric.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
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
                  <div className={`flex items-center text-sm ${getChangeColor(metric.change)}`}>
                    {getChangeIcon(metric.change)}
                    <span className="ml-1">{metric.change}</span>
                  </div>
                </div>
              </div>
              <h3 className="text-white/80 text-sm">{metric.title}</h3>
            </motion.div>
          ))}
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
                placeholder="Buscar doctores por nombre o especialidad..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            {/* View Mode */}
            <div className="flex items-center space-x-2">
              {viewModes.map((mode) => {
                const ModeIcon = mode.icon;
                return (
                  <button
                    key={mode.value}
                    onClick={() => setViewMode(mode.value)}
                    className={`flex items-center px-4 py-2 rounded-xl font-medium transition-colors ${
                      viewMode === mode.value
                        ? 'bg-purple-500 text-white'
                        : 'bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white border border-white/20'
                    }`}
                  >
                    <ModeIcon className="h-4 w-4 mr-2" />
                    {mode.label}
                  </button>
                );
              })}
            </div>

            {/* Specialty Filter */}
            <select
              value={selectedSpecialty}
              onChange={(e) => setSelectedSpecialty(e.target.value)}
              className="px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              {specialties.map((specialty) => (
                <option key={specialty.value} value={specialty.value} className="bg-slate-800">
                  {specialty.label}
                </option>
              ))}
            </select>

            {/* Period Filter */}
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
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
          {/* Doctor Performance List */}
          <div className="lg:col-span-2">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="backdrop-blur-lg bg-white/10 rounded-2xl p-6 border border-white/20"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-white flex items-center">
                  <Users className="h-5 w-5 mr-2 text-blue-400" />
                  Rendimiento Individual
                </h2>
                <div className="flex items-center space-x-2">
                  <button className="text-slate-300 hover:text-white">
                    <Filter className="h-5 w-5" />
                  </button>
                  <button className="text-slate-300 hover:text-white">
                    <Eye className="h-5 w-5" />
                  </button>
                </div>
              </div>

              {loadingPerformance ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                </div>
              ) : (
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {filteredDoctors?.length === 0 ? (
                    <p className="text-slate-200 text-center py-8">
                      No se encontraron doctores
                    </p>
                  ) : (
                    filteredDoctors?.map((doctor) => {
                      const SpecialtyIcon = getSpecialtyIcon(doctor.specialty_code);
                      return (
                        <motion.div
                          key={doctor.id}
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="bg-white/5 rounded-xl p-5 border border-white/10 hover:bg-white/10 transition-colors"
                        >
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center space-x-4">
                              <div className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 flex items-center justify-center text-white font-semibold">
                                {doctor.name.charAt(0)}
                              </div>
                              <div>
                                <h4 className="text-white font-semibold">{doctor.name}</h4>
                                <div className="flex items-center space-x-2 text-slate-300 text-sm">
                                  <SpecialtyIcon className="h-4 w-4" />
                                  <span>{doctor.specialty}</span>
                                </div>
                                <div className="flex items-center space-x-4 text-xs text-slate-400 mt-1">
                                  <span className="flex items-center">
                                    <Mail className="h-3 w-3 mr-1" />
                                    {doctor.email}
                                  </span>
                                  <span className="flex items-center">
                                    <Phone className="h-3 w-3 mr-1" />
                                    {doctor.phone}
                                  </span>
                                </div>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gradient-to-r ${getPerformanceColor(doctor.performance_score)} text-white`}>
                                <Award className="h-3 w-3 mr-1" />
                                {getPerformanceLabel(doctor.performance_score)}
                              </div>
                              <p className="text-2xl font-bold text-white mt-1">
                                {doctor.performance_score}%
                              </p>
                            </div>
                          </div>

                          {/* Performance Metrics */}
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="text-center">
                              <p className="text-slate-300 text-xs">Citas</p>
                              <p className="text-white font-semibold">{doctor.total_appointments}</p>
                              <div className={`text-xs flex items-center justify-center ${getChangeColor(doctor.appointments_change)}`}>
                                {getChangeIcon(doctor.appointments_change)}
                                <span className="ml-1">{doctor.appointments_change}</span>
                              </div>
                            </div>
                            <div className="text-center">
                              <p className="text-slate-300 text-xs">Satisfacción</p>
                              <p className="text-white font-semibold flex items-center justify-center">
                                <Star className="h-4 w-4 text-yellow-400 mr-1" />
                                {doctor.satisfaction_score}%
                              </p>
                            </div>
                            <div className="text-center">
                              <p className="text-slate-300 text-xs">Tiempo Promedio</p>
                              <p className="text-white font-semibold flex items-center justify-center">
                                <Clock className="h-4 w-4 text-blue-400 mr-1" />
                                {doctor.avg_consultation_time}min
                              </p>
                            </div>
                            <div className="text-center">
                              <p className="text-slate-300 text-xs">Cancelaciones</p>
                              <p className="text-white font-semibold flex items-center justify-center">
                                <XCircle className="h-4 w-4 text-red-400 mr-1" />
                                {doctor.cancellation_rate}%
                              </p>
                            </div>
                          </div>

                          {/* Performance Bar */}
                          <div className="mt-4">
                            <div className="flex justify-between text-xs text-slate-300 mb-2">
                              <span>Rendimiento General</span>
                              <span>{doctor.performance_score}%</span>
                            </div>
                            <div className="w-full bg-white/10 rounded-full h-2">
                              <div 
                                className={`h-2 rounded-full bg-gradient-to-r ${getPerformanceColor(doctor.performance_score)}`}
                                style={{ width: `${doctor.performance_score}%` }}
                              />
                            </div>
                          </div>
                        </motion.div>
                      );
                    })
                  )}
                </div>
              )}
            </motion.div>
          </div>

          {/* Top Performers & Specialty Comparison */}
          <div className="space-y-6">
            {/* Top Performers */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="backdrop-blur-lg bg-white/10 rounded-2xl p-6 border border-white/20"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-white flex items-center">
                  <Award className="h-5 w-5 mr-2 text-yellow-400" />
                  Top Performers
                </h2>
              </div>

              {loadingTop ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                </div>
              ) : (
                <div className="space-y-3">
                  {topPerformers?.slice(0, 5).map((doctor, index) => (
                    <div
                      key={doctor.id}
                      className="bg-white/5 rounded-xl p-4 border border-white/10 hover:bg-white/10 transition-colors"
                    >
                      <div className="flex items-center space-x-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm ${
                          index === 0 ? 'bg-yellow-500' :
                          index === 1 ? 'bg-gray-400' :
                          index === 2 ? 'bg-amber-600' :
                          'bg-blue-500'
                        }`}>
                          {index + 1}
                        </div>
                        <div className="flex-1">
                          <h4 className="text-white font-medium text-sm">{doctor.name}</h4>
                          <p className="text-slate-300 text-xs">{doctor.specialty}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-white font-semibold text-sm">{doctor.performance_score}%</p>
                          <div className="flex items-center">
                            <Star className="h-3 w-3 text-yellow-400 mr-1" />
                            <span className="text-slate-300 text-xs">{doctor.satisfaction_score}%</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>

            {/* Specialty Comparison */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              className="backdrop-blur-lg bg-white/10 rounded-2xl p-6 border border-white/20"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-white flex items-center">
                  <PieChart className="h-5 w-5 mr-2 text-green-400" />
                  Por Especialidad
                </h2>
              </div>

              {loadingComparison ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                </div>
              ) : (
                <div className="space-y-4">
                  {specialtyComparison?.map((specialty) => {
                    const SpecialtyIcon = getSpecialtyIcon(specialty.code);
                    return (
                      <div
                        key={specialty.name}
                        className="bg-white/5 rounded-xl p-4 border border-white/10 hover:bg-white/10 transition-colors"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center space-x-3">
                            <div className={`p-2 rounded-lg bg-gradient-to-r ${
                              specialty.code === 'general' ? 'from-blue-500 to-blue-600' :
                              specialty.code === 'obstetrics' ? 'from-pink-500 to-pink-600' :
                              specialty.code === 'dentistry' ? 'from-green-500 to-green-600' :
                              'from-purple-500 to-purple-600'
                            }`}>
                              <SpecialtyIcon className="h-4 w-4 text-white" />
                            </div>
                            <div>
                              <h4 className="text-white font-medium text-sm">{specialty.name}</h4>
                              <p className="text-slate-300 text-xs">{specialty.doctor_count} doctores</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-white font-semibold">{specialty.avg_performance}%</p>
                            <p className={`text-xs flex items-center ${getChangeColor(specialty.performance_change)}`}>
                              {getChangeIcon(specialty.performance_change)}
                              <span className="ml-1">{specialty.performance_change}</span>
                            </p>
                          </div>
                        </div>
                        <div className="w-full bg-white/10 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full bg-gradient-to-r ${
                              specialty.code === 'general' ? 'from-blue-500 to-blue-600' :
                              specialty.code === 'obstetrics' ? 'from-pink-500 to-pink-600' :
                              specialty.code === 'dentistry' ? 'from-green-500 to-green-600' :
                              'from-purple-500 to-purple-600'
                            }`}
                            style={{ width: `${specialty.avg_performance}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </motion.div>
          </div>
        </div>

        {/* Satisfaction Metrics */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="mt-6 backdrop-blur-lg bg-white/10 rounded-2xl p-6 border border-white/20"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-white flex items-center">
              <Star className="h-5 w-5 mr-2 text-yellow-400" />
              Métricas de Satisfacción del Paciente
            </h2>
            <button className="text-slate-300 hover:text-white flex items-center text-sm">
              Ver detalles <ChevronRight className="h-4 w-4 ml-1" />
            </button>
          </div>

          {loadingSatisfaction ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="bg-white/5 rounded-xl p-4 border border-white/10 text-center">
                <div className="flex items-center justify-center mb-2">
                  <Star className="h-8 w-8 text-yellow-400" />
                </div>
                <p className="text-2xl font-bold text-white mb-1">
                  {satisfactionMetrics?.overall_rating || 0}
                </p>
                <p className="text-slate-300 text-sm">Calificación General</p>
              </div>
              <div className="bg-white/5 rounded-xl p-4 border border-white/10 text-center">
                <div className="flex items-center justify-center mb-2">
                  <CheckCircle className="h-8 w-8 text-green-400" />
                </div>
                <p className="text-2xl font-bold text-white mb-1">
                  {satisfactionMetrics?.positive_feedback || 0}%
                </p>
                <p className="text-slate-300 text-sm">Feedback Positivo</p>
              </div>
              <div className="bg-white/5 rounded-xl p-4 border border-white/10 text-center">
                <div className="flex items-center justify-center mb-2">
                  <Target className="h-8 w-8 text-blue-400" />
                </div>
                <p className="text-2xl font-bold text-white mb-1">
                  {satisfactionMetrics?.recommendation_rate || 0}%
                </p>
                <p className="text-slate-300 text-sm">Recomendación</p>
              </div>
              <div className="bg-white/5 rounded-xl p-4 border border-white/10 text-center">
                <div className="flex items-center justify-center mb-2">
                  <Clock className="h-8 w-8 text-orange-400" />
                </div>
                <p className="text-2xl font-bold text-white mb-1">
                  {satisfactionMetrics?.punctuality_score || 0}%
                </p>
                <p className="text-slate-300 text-sm">Puntualidad</p>
              </div>
              <div className="bg-white/5 rounded-xl p-4 border border-white/10 text-center">
                <div className="flex items-center justify-center mb-2">
                  <Activity className="h-8 w-8 text-purple-400" />
                </div>
                <p className="text-2xl font-bold text-white mb-1">
                  {satisfactionMetrics?.total_reviews || 0}
                </p>
                <p className="text-slate-300 text-sm">Total Reviews</p>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default DoctorPerformance;
