import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { 
  Baby, Heart, Calendar, Activity, 
  AlertTriangle, TrendingUp, FileText, 
  Stethoscope, Weight, Ruler, 
  ArrowLeft, Search, Filter, 
  ChevronRight, Clock, User,
  Thermometer, Zap, Plus,
  Edit3, Eye, Download, Phone,
  MapPin, Clipboard
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { format, differenceInWeeks, addWeeks } from 'date-fns';
import { es } from 'date-fns/locale';
import obstetricService from '../services/obstetricService';

const PregnancyTracking = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRisk, setFilterRisk] = useState('all');
  const [filterTrimester, setFilterTrimester] = useState('all');

  // Queries
  const { data: overview, isLoading: loadingOverview } = useQuery({
    queryKey: ['pregnancyOverview'],
    queryFn: obstetricService.getPregnancyOverview,
  });

  const { data: activePregnancies, isLoading: loadingPregnancies } = useQuery({
    queryKey: ['activePregnancies', { searchTerm, filterRisk, filterTrimester }],
    queryFn: () => obstetricService.getActivePregnancies({
      search: searchTerm,
      risk_level: filterRisk !== 'all' ? filterRisk : undefined,
      trimester: filterTrimester !== 'all' ? filterTrimester : undefined,
    }),
  });

  const { data: upcomingAppointments, isLoading: loadingAppointments } = useQuery({
    queryKey: ['upcomingPrenatalAppointments'],
    queryFn: obstetricService.getUpcomingPrenatalAppointments,
  });

  // Filtered pregnancies
  const filteredPregnancies = activePregnancies?.filter(pregnancy => {
    const matchesSearch = pregnancy.patient_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRisk = filterRisk === 'all' || pregnancy.risk_level === filterRisk;
    const matchesTrimester = filterTrimester === 'all' || pregnancy.trimester.toString() === filterTrimester;
    
    return matchesSearch && matchesRisk && matchesTrimester;
  }) || [];

  // Overview cards
  const overviewCards = [
    {
      title: 'Embarazos Activos',
      value: overview?.active_pregnancies || 0,
      subtitle: `de ${overview?.total_pregnancies || 0} total`,
      icon: Baby,
      color: 'from-pink-500 to-pink-600',
    },
    {
      title: 'Alto Riesgo',
      value: overview?.high_risk || 0,
      subtitle: 'Requieren seguimiento',
      icon: AlertTriangle,
      color: 'from-red-500 to-red-600',
    },
    {
      title: 'Partos Esperados',
      value: overview?.due_this_month || 0,
      subtitle: 'Este mes',
      icon: Heart,
      color: 'from-purple-500 to-purple-600',
    },
    {
      title: 'Nacimientos Recientes',
      value: overview?.recent_births || 0,
      subtitle: 'Última semana',
      icon: TrendingUp,
      color: 'from-green-500 to-green-600',
    }
  ];

  const getRiskColor = (level) => {
    switch(level) {
      case 'high': return 'text-red-300 bg-red-500/20';
      case 'medium': return 'text-yellow-300 bg-yellow-500/20';
      case 'low': return 'text-green-300 bg-green-500/20';
      default: return 'text-gray-300 bg-gray-500/20';
    }
  };

  const getRiskText = (level) => {
    switch(level) {
      case 'high': return 'Alto';
      case 'medium': return 'Medio';
      case 'low': return 'Bajo';
      default: return level;
    }
  };

  const getTrimesterColor = (trimester) => {
    switch(trimester) {
      case 1: return 'bg-blue-500';
      case 2: return 'bg-green-500';
      case 3: return 'bg-orange-500';
      default: return 'bg-gray-500';
    }
  };

  const calculateWeeksAndDays = (lmp) => {
    const weeks = differenceInWeeks(new Date(), new Date(lmp));
    return weeks;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-900 via-purple-800 to-rose-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-8"
        >
          <div className="flex items-center">
            <Link to="/obstetriz-dashboard" className="mr-4 p-2 hover:bg-white/10 rounded-lg transition-colors">
              <ArrowLeft className="h-6 w-6 text-white" />
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">
                Seguimiento de Embarazos
              </h1>
              <p className="text-pink-200">
                Monitoreo integral del embarazo y control prenatal
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <Link to="/pregnancy/new">
              <button className="px-4 py-2 bg-gradient-to-r from-pink-500 to-purple-600 text-white font-medium rounded-lg hover:from-pink-600 hover:to-purple-700 transition duration-200 flex items-center">
                <Plus className="h-4 w-4 mr-2" />
                Nuevo Embarazo
              </button>
            </Link>
          </div>
        </motion.div>

        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {overviewCards.map((card, index) => (
            <motion.div
              key={card.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="backdrop-blur-lg bg-white/10 rounded-2xl p-6 border border-white/20"
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-xl bg-gradient-to-r ${card.color}`}>
                  <card.icon className="h-6 w-6 text-white" />
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-white">{card.value}</p>
                  <p className="text-sm text-pink-200">{card.subtitle}</p>
                </div>
              </div>
              <h3 className="text-white/80 text-sm">{card.title}</h3>
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Pregnancy List */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="lg:col-span-2 backdrop-blur-lg bg-white/10 rounded-2xl p-6 border border-white/20"
          >
            {/* Search and Filters */}
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="flex-1 relative">
                <Search className="h-5 w-5 text-pink-300 absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="Buscar por nombre de paciente..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-pink-300 focus:outline-none focus:ring-2 focus:ring-pink-400"
                />
              </div>
              <div className="flex gap-2">
                <select
                  value={filterRisk}
                  onChange={(e) => setFilterRisk(e.target.value)}
                  className="px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-pink-400"
                >
                  <option value="all">Todos los riesgos</option>
                  <option value="low">Bajo riesgo</option>
                  <option value="medium">Riesgo medio</option>
                  <option value="high">Alto riesgo</option>
                </select>
                <select
                  value={filterTrimester}
                  onChange={(e) => setFilterTrimester(e.target.value)}
                  className="px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-pink-400"
                >
                  <option value="all">Todos los trimestres</option>
                  <option value="1">1er Trimestre</option>
                  <option value="2">2do Trimestre</option>
                  <option value="3">3er Trimestre</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-white flex items-center">
                <Baby className="h-5 w-5 mr-2 text-pink-400" />
                Embarazos Activos ({filteredPregnancies.length})
              </h2>
            </div>

            {loadingPregnancies ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
              </div>
            ) : (
              <div className="space-y-4 max-h-[600px] overflow-y-auto">
                {filteredPregnancies.length === 0 ? (
                  <p className="text-pink-200 text-center py-8">No hay embarazos que coincidan con los filtros</p>
                ) : (
                  filteredPregnancies.map((pregnancy) => (
                    <motion.div
                      key={pregnancy.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="bg-white/5 rounded-xl p-5 border border-white/10 hover:bg-white/10 transition-colors"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center space-x-4">
                          <div className="w-12 h-12 rounded-full bg-gradient-to-r from-pink-500 to-purple-600 flex items-center justify-center text-white font-semibold">
                            {pregnancy.patient_name.split(' ').map(n => n[0]).join('').substring(0, 2)}
                          </div>
                          <div>
                            <h4 className="text-white font-semibold text-lg">{pregnancy.patient_name}</h4>
                            <p className="text-pink-200 text-sm">{pregnancy.age} años</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${getRiskColor(pregnancy.risk_level)}`}>
                            {getRiskText(pregnancy.risk_level)}
                          </span>
                          <span className={`px-2 py-1 rounded text-xs font-medium text-white ${getTrimesterColor(pregnancy.trimester)}`}>
                            {pregnancy.weeks_pregnant} sem
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                        <div className="text-center">
                          <div className="flex items-center justify-center mb-1">
                            <Calendar className="h-4 w-4 text-pink-300 mr-1" />
                          </div>
                          <p className="text-xs text-pink-200">FPP</p>
                          <p className="text-white text-sm font-medium">
                            {format(new Date(pregnancy.edd), 'dd/MM/yyyy')}
                          </p>
                        </div>
                        <div className="text-center">
                          <div className="flex items-center justify-center mb-1">
                            <Activity className="h-4 w-4 text-pink-300 mr-1" />
                          </div>
                          <p className="text-xs text-pink-200">FCF</p>
                          <p className="text-white text-sm font-medium">{pregnancy.fetal_heart_rate} lpm</p>
                        </div>
                        <div className="text-center">
                          <div className="flex items-center justify-center mb-1">
                            <Thermometer className="h-4 w-4 text-pink-300 mr-1" />
                          </div>
                          <p className="text-xs text-pink-200">PA</p>
                          <p className="text-white text-sm font-medium">{pregnancy.blood_pressure}</p>
                        </div>
                        <div className="text-center">
                          <div className="flex items-center justify-center mb-1">
                            <Weight className="h-4 w-4 text-pink-300 mr-1" />
                          </div>
                          <p className="text-xs text-pink-200">Ganancia</p>
                          <p className="text-white text-sm font-medium">{pregnancy.weight_gain} kg</p>
                        </div>
                      </div>

                      {pregnancy.recent_notes && (
                        <div className="mb-4">
                          <p className="text-pink-200 text-sm italic">
                            "{pregnancy.recent_notes}"
                          </p>
                        </div>
                      )}

                      <div className="flex items-center justify-between">
                        <div className="text-sm text-pink-200">
                          <Clock className="h-4 w-4 inline mr-1" />
                          Próxima cita: {format(new Date(pregnancy.next_appointment), 'dd/MM/yyyy', { locale: es })}
                        </div>
                        <div className="flex space-x-2">
                          <Link
                            to={`/pregnancy/${pregnancy.id}/view`}
                            className="p-2 text-pink-300 hover:text-pink-200 hover:bg-white/5 rounded-lg transition-colors"
                            title="Ver detalle"
                          >
                            <Eye className="h-4 w-4" />
                          </Link>
                          <Link
                            to={`/pregnancy/${pregnancy.id}/edit`}
                            className="p-2 text-pink-300 hover:text-pink-200 hover:bg-white/5 rounded-lg transition-colors"
                            title="Editar"
                          >
                            <Edit3 className="h-4 w-4" />
                          </Link>
                          <Link
                            to={`/prenatal-control/new?patient_id=${pregnancy.patient_id}`}
                            className="p-2 text-pink-300 hover:text-pink-200 hover:bg-white/5 rounded-lg transition-colors"
                            title="Nuevo control"
                          >
                            <Stethoscope className="h-4 w-4" />
                          </Link>
                        </div>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            )}
          </motion.div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Upcoming Appointments */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="backdrop-blur-lg bg-white/10 rounded-2xl p-6 border border-white/20"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white flex items-center">
                  <Calendar className="h-5 w-5 mr-2 text-pink-400" />
                  Próximas Citas
                </h3>
                <Link to="/appointments" className="text-pink-300 hover:text-pink-200 text-sm">
                  Ver todas
                </Link>
              </div>

              {loadingAppointments ? (
                <div className="flex justify-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                </div>
              ) : (
                <div className="space-y-3">
                  {upcomingAppointments?.map((appointment) => (
                    <div
                      key={appointment.id}
                      className="bg-white/5 rounded-lg p-3 border border-white/10"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-white font-medium text-sm">{appointment.patient_name}</h4>
                        <span className="text-pink-300 text-xs">{appointment.weeks_pregnant} sem</span>
                      </div>
                      <p className="text-pink-200 text-xs mb-1">{appointment.type}</p>
                      <p className="text-pink-300 text-xs">
                        {format(new Date(appointment.date), 'dd/MM', { locale: es })} - {appointment.time}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>

            {/* Quick Actions */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="backdrop-blur-lg bg-white/10 rounded-2xl p-6 border border-white/20"
            >
              <h3 className="text-lg font-semibold text-white mb-4">Acciones Rápidas</h3>
              <div className="space-y-2">
                <Link to="/prenatal-control/new">
                  <button className="w-full py-2 px-4 bg-gradient-to-r from-pink-500 to-purple-600 text-white font-medium rounded-lg hover:from-pink-600 hover:to-purple-700 transition duration-200 flex items-center justify-center text-sm">
                    <Stethoscope className="h-4 w-4 mr-2" />
                    Control Prenatal
                  </button>
                </Link>
                <Link to="/ultrasound/new">
                  <button className="w-full py-2 px-4 bg-white/10 text-white font-medium rounded-lg hover:bg-white/20 transition duration-200 flex items-center justify-center border border-white/20 text-sm">
                    <Activity className="h-4 w-4 mr-2" />
                    Ecografía
                  </button>
                </Link>
                <Link to="/birth-plan/new">
                  <button className="w-full py-2 px-4 bg-white/10 text-white font-medium rounded-lg hover:bg-white/20 transition duration-200 flex items-center justify-center border border-white/20 text-sm">
                    <Heart className="h-4 w-4 mr-2" />
                    Plan de Parto
                  </button>
                </Link>
                <Link to="/reports/pregnancy">
                  <button className="w-full py-2 px-4 bg-white/10 text-white font-medium rounded-lg hover:bg-white/20 transition duration-200 flex items-center justify-center border border-white/20 text-sm">
                    <FileText className="h-4 w-4 mr-2" />
                    Reportes
                  </button>
                </Link>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PregnancyTracking;
