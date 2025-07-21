import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { 
  Heart, Baby, Thermometer, Edit3, Eye, FileText, 
  ArrowLeft, Search, Plus, Calendar, AlertCircle,
  Shield, User, Activity, Stethoscope, TrendingUp,
  Clock, Phone, MapPin, Weight, Pill, Filter,
  ChevronDown
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { format, differenceInDays } from 'date-fns';
import { es } from 'date-fns/locale';
import obstetricService from '../services/obstetricService';

const PostpartumCare = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');

  // Queries
  const { data: postpartumRecords, isLoading } = useQuery({
    queryKey: ['postpartumRecords', { searchTerm, statusFilter }],
    queryFn: () => obstetricService.getPostpartumRecords({
      search: searchTerm,
      status: statusFilter !== 'all' ? statusFilter : undefined,
    }),
  });

  const { data: statistics } = useQuery({
    queryKey: ['postpartumStatistics'],
    queryFn: obstetricService.getPostpartumStatistics,
  });

  // Filtered records
  const filteredRecords = postpartumRecords?.filter(record => {
    const matchesSearch = record.patient_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPriority = priorityFilter === 'all' || 
      (priorityFilter === 'high' && (record.complications || record.current_day <= 7)) ||
      (priorityFilter === 'medium' && (record.current_day > 7 && record.current_day <= 21)) ||
      (priorityFilter === 'low' && record.current_day > 21 && !record.complications);
    
    return matchesSearch && matchesPriority;
  }) || [];

  // Helper function to get status color
  const getStatusColor = (status, complications) => {
    if (complications) return 'text-red-300 bg-red-500/20';
    if (status === 'Excelente') return 'text-green-300 bg-green-500/20';
    if (status === 'Recuperación lenta') return 'text-yellow-300 bg-yellow-500/20';
    return 'text-blue-300 bg-blue-500/20';
  };

  // Helper function to get priority level
  const getPriorityLevel = (complications, currentDay) => {
    if (complications) return 'Alta';
    if (currentDay <= 7) return 'Alta';
    if (currentDay <= 21) return 'Media';
    return 'Baja';
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
                Cuidados Postparto
              </h1>
              <p className="text-pink-200">
                Seguimiento integral de madres y bebés después del parto
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <Link to="/postpartum-care/new">
              <button className="px-4 py-2 bg-gradient-to-r from-pink-500 to-purple-600 text-white font-medium rounded-lg hover:from-pink-600 hover:to-purple-700 transition duration-200 flex items-center">
                <Plus className="h-4 w-4 mr-2" />
                Nuevo Registro
              </button>
            </Link>
          </div>
        </motion.div>

        {/* Statistics Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8"
        >
          <div className="backdrop-blur-lg bg-white/10 rounded-xl p-6 border border-white/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-pink-200 text-sm font-medium">Total Pacientes</p>
                <p className="text-2xl font-bold text-white">{statistics?.total_patients || 0}</p>
              </div>
              <User className="h-8 w-8 text-pink-300" />
            </div>
          </div>

          <div className="backdrop-blur-lg bg-white/10 rounded-xl p-6 border border-white/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-pink-200 text-sm font-medium">Casos Críticos</p>
                <p className="text-2xl font-bold text-white">{statistics?.critical_cases || 0}</p>
              </div>
              <AlertCircle className="h-8 w-8 text-red-300" />
            </div>
          </div>

          <div className="backdrop-blur-lg bg-white/10 rounded-xl p-6 border border-white/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-pink-200 text-sm font-medium">Visitas Programadas</p>
                <p className="text-2xl font-bold text-white">{statistics?.scheduled_visits || 0}</p>
              </div>
              <Calendar className="h-8 w-8 text-blue-300" />
            </div>
          </div>

          <div className="backdrop-blur-lg bg-white/10 rounded-xl p-6 border border-white/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-pink-200 text-sm font-medium">Éxito Lactancia</p>
                <p className="text-2xl font-bold text-white">{statistics?.breastfeeding_success || 0}%</p>
              </div>
              <Heart className="h-8 w-8 text-green-300" />
            </div>
          </div>
        </motion.div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Postpartum Records List */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
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
              
              {/* Status Filter */}
              <div className="relative">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="appearance-none bg-white/10 border border-white/20 rounded-lg px-4 py-2 pr-8 text-white focus:outline-none focus:ring-2 focus:ring-pink-400 min-w-[160px]"
                >
                  <option value="all" className="bg-gray-800">Todos los estados</option>
                  <option value="Excelente" className="bg-gray-800">Excelente</option>
                  <option value="Normal" className="bg-gray-800">Normal</option>
                  <option value="Recuperación lenta" className="bg-gray-800">Recuperación lenta</option>
                  <option value="Requiere atención" className="bg-gray-800">Requiere atención</option>
                </select>
                <ChevronDown className="h-4 w-4 text-pink-300 absolute right-2 top-3 pointer-events-none" />
              </div>
              
              {/* Priority Filter */}
              <div className="relative">
                <select
                  value={priorityFilter}
                  onChange={(e) => setPriorityFilter(e.target.value)}
                  className="appearance-none bg-white/10 border border-white/20 rounded-lg px-4 py-2 pr-8 text-white focus:outline-none focus:ring-2 focus:ring-pink-400 min-w-[140px]"
                >
                  <option value="all" className="bg-gray-800">Toda prioridad</option>
                  <option value="high" className="bg-gray-800">Alta</option>
                  <option value="medium" className="bg-gray-800">Media</option>
                  <option value="low" className="bg-gray-800">Baja</option>
                </select>
                <ChevronDown className="h-4 w-4 text-pink-300 absolute right-2 top-3 pointer-events-none" />
              </div>
            </div>

            {isLoading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
              </div>
            ) : (
              <div className="space-y-4 max-h-[600px] overflow-y-auto">
                {filteredRecords.length === 0 ? (
                  <p className="text-pink-200 text-center py-8">No hay registros de cuidados postparto que coincidan con los criterios</p>
                ) : (
                  filteredRecords.map((record) => (
                    <motion.div
                      key={record.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="bg-white/5 rounded-xl p-5 border border-white/10 hover:bg-white/10 transition-colors"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-12 h-12 rounded-full bg-gradient-to-r from-pink-500 to-purple-600 flex items-center justify-center text-white font-semibold">
                            {record.patient_name.split(' ').map(n => n[0]).join('').substring(0, 2)}
                          </div>
                          <div>
                            <h4 className="text-white font-semibold text-lg">{record.patient_name}</h4>
                            <p className="text-pink-200 text-sm">
                              DNI: {record.patient_dni} • {record.birth_type}
                            </p>
                            <p className="text-pink-300 text-xs">
                              {format(new Date(record.birth_date), 'dd/MM/yyyy', { locale: es })} - Día {record.current_day} postparto
                            </p>
                          </div>
                        </div>
                        <div className="flex flex-col items-end space-y-2">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(record.mother_status, record.complications)}`}>
                            {record.mother_status}
                          </span>
                          {record.complications && (
                            <div className="flex items-center space-x-1">
                              <AlertCircle className="h-3 w-3 text-red-300" />
                              <span className="text-red-300 text-xs">Con complicaciones</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Detailed Info Grid */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 p-3 bg-white/5 rounded-lg">
                        <div className="text-center">
                          <div className="flex items-center justify-center mb-1">
                            <Baby className="h-4 w-4 text-pink-300 mr-1" />
                          </div>
                          <p className="text-xs text-pink-300">Estado Bebé</p>
                          <p className="text-white text-sm font-medium">{record.baby_status}</p>
                          <p className="text-pink-200 text-xs">{record.baby_weight} kg</p>
                        </div>
                        <div className="text-center">
                          <div className="flex items-center justify-center mb-1">
                            <Heart className="h-4 w-4 text-pink-300 mr-1" />
                          </div>
                          <p className="text-xs text-pink-300">Lactancia</p>
                          <p className="text-white text-sm font-medium">{record.breastfeeding_status}</p>
                          <p className="text-pink-200 text-xs">{record.baby_feeding}</p>
                        </div>
                        <div className="text-center">
                          <div className="flex items-center justify-center mb-1">
                            <Weight className="h-4 w-4 text-pink-300 mr-1" />
                          </div>
                          <p className="text-xs text-pink-300">Peso Madre</p>
                          <p className="text-white text-sm font-medium">{record.mother_weight} kg</p>
                          <p className="text-pink-200 text-xs">{record.mood_assessment}</p>
                        </div>
                        <div className="text-center">
                          <div className="flex items-center justify-center mb-1">
                            <Activity className="h-4 w-4 text-pink-300 mr-1" />
                          </div>
                          <p className="text-xs text-pink-300">Loquios</p>
                          <p className="text-white text-sm font-medium">{record.lochia_status}</p>
                          <p className="text-pink-200 text-xs">{record.episiotomy_healing !== 'N/A' ? record.episiotomy_healing : 'No aplica'}</p>
                        </div>
                      </div>

                      {/* Additional Info */}
                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                          <p className="text-pink-300 text-xs font-medium mb-1">Última Revisión</p>
                          <p className="text-white text-sm">
                            {format(new Date(record.last_checkup), 'dd/MM/yyyy', { locale: es })}
                          </p>
                        </div>
                        <div>
                          <p className="text-pink-300 text-xs font-medium mb-1">Próxima Cita</p>
                          <p className="text-white text-sm">
                            {format(new Date(record.next_appointment), 'dd/MM/yyyy', { locale: es })}
                          </p>
                        </div>
                        <div>
                          <p className="text-pink-300 text-xs font-medium mb-1">Apoyo Familiar</p>
                          <p className="text-white text-sm">{record.support_system}</p>
                        </div>
                        <div>
                          <p className="text-pink-300 text-xs font-medium mb-1">Anticoncepción</p>
                          <p className="text-white text-sm">{record.contraception_counseling}</p>
                        </div>
                      </div>

                      {record.notes && (
                        <div className="mb-4">
                          <p className="text-pink-200 text-sm italic">
                            "{record.notes}"
                          </p>
                        </div>
                      )}

                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            getPriorityLevel(record.complications, record.current_day) === 'Alta' 
                              ? 'text-red-300 bg-red-500/20'
                              : getPriorityLevel(record.complications, record.current_day) === 'Media'
                              ? 'text-yellow-300 bg-yellow-500/20'
                              : 'text-green-300 bg-green-500/20'
                          }`}>
                            Prioridad {getPriorityLevel(record.complications, record.current_day)}
                          </span>
                        </div>
                        <div className="flex space-x-2">
                          <Link
                            to={`/postpartum-care/${record.id}/view`}
                            className="p-2 text-pink-300 hover:text-pink-200 hover:bg-white/5 rounded-lg transition-colors"
                            title="Ver detalle"
                          >
                            <Eye className="h-4 w-4" />
                          </Link>
                          <Link
                            to={`/postpartum-care/${record.id}/edit`}
                            className="p-2 text-pink-300 hover:text-pink-200 hover:bg-white/5 rounded-lg transition-colors"
                            title="Editar"
                          >
                            <Edit3 className="h-4 w-4" />
                          </Link>
                          <Link
                            to={`/postpartum-care/${record.id}/checkup`}
                            className="p-2 text-pink-300 hover:text-pink-200 hover:bg-white/5 rounded-lg transition-colors"
                            title="Nueva revisión"
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

          {/* Quick Actions Sidebar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="space-y-6"
          >
            {/* Quick Actions */}
            <div className="backdrop-blur-lg bg-white/10 rounded-xl p-6 border border-white/20">
              <h3 className="text-white font-semibold mb-4 flex items-center">
                <Activity className="h-5 w-5 mr-2" />
                Acciones Rápidas
              </h3>
              <div className="space-y-3">
                <Link
                  to="/postpartum-care/schedule"
                  className="w-full p-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg hover:from-blue-600 hover:to-indigo-700 transition duration-200 flex items-center"
                >
                  <Calendar className="h-4 w-4 mr-2" />
                  Programar Visita
                </Link>
                <Link
                  to="/postpartum-care/emergency"
                  className="w-full p-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg hover:from-red-600 hover:to-red-700 transition duration-200 flex items-center"
                >
                  <AlertCircle className="h-4 w-4 mr-2" />
                  Caso Urgente
                </Link>
                <Link
                  to="/postpartum-care/reports"
                  className="w-full p-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg hover:from-green-600 hover:to-emerald-700 transition duration-200 flex items-center"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Generar Reporte
                </Link>
              </div>
            </div>

            {/* Today's Priority Cases */}
            <div className="backdrop-blur-lg bg-white/10 rounded-xl p-6 border border-white/20">
              <h3 className="text-white font-semibold mb-4 flex items-center">
                <Shield className="h-5 w-5 mr-2" />
                Casos Prioritarios Hoy
              </h3>
              <div className="space-y-3">
                {filteredRecords?.filter(record => 
                  record.complications || record.current_day <= 7
                ).slice(0, 3).map((record) => (
                  <div key={record.id} className="bg-white/5 rounded-lg p-3 border border-white/10">
                    <p className="text-white font-medium text-sm">{record.patient_name}</p>
                    <p className="text-pink-200 text-xs">Día {record.current_day} - {record.mother_status}</p>
                  </div>
                ))}
                {(!filteredRecords || filteredRecords.filter(record => 
                  record.complications || record.current_day <= 7
                ).length === 0) && (
                  <p className="text-pink-200 text-sm">No hay casos prioritarios hoy</p>
                )}
              </div>
            </div>

            {/* Breastfeeding Support */}
            <div className="backdrop-blur-lg bg-white/10 rounded-xl p-6 border border-white/20">
              <h3 className="text-white font-semibold mb-4 flex items-center">
                <Heart className="h-5 w-5 mr-2" />
                Apoyo Lactancia
              </h3>
              <div className="space-y-2">
                <Link
                  to="/postpartum-care/breastfeeding-guide"
                  className="block text-pink-200 hover:text-white text-sm transition-colors"
                >
                  • Guías de Lactancia
                </Link>
                <Link
                  to="/postpartum-care/nutrition-tips"
                  className="block text-pink-200 hover:text-white text-sm transition-colors"
                >
                  • Consejos Nutricionales
                </Link>
                <Link
                  to="/postpartum-care/support-groups"
                  className="block text-pink-200 hover:text-white text-sm transition-colors"
                >
                  • Grupos de Apoyo
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default PostpartumCare;
