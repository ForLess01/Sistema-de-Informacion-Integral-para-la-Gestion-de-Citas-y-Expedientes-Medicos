import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  Stethoscope, Search, Filter, Calendar, Clock,
  User, ChevronRight, Eye, AlertCircle, Activity,
  FileText, CheckCircle, XCircle, Loader
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import medicalRecordService from '../../services/medicalRecordService';
import appointmentService from '../../services/appointmentService';

const ConsultationsList = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterDate, setFilterDate] = useState('today');

  // Obtener consultas pendientes
  const { data: consultations, isLoading, error } = useQuery({
    queryKey: ['consultations', filterStatus, filterDate],
    queryFn: () => medicalRecordService.getConsultations({
      status: filterStatus,
      date_filter: filterDate
    }),
  });

  // Filtrar consultas basándose en el término de búsqueda
  // Manejar tanto array directo como objeto con results
  const consultationsList = Array.isArray(consultations) ? consultations : consultations?.results || [];
  
  const filteredConsultations = consultationsList.filter((consultation) => {
    const search = searchTerm.toLowerCase();
    return (
      consultation.patient_name?.toLowerCase().includes(search) ||
      consultation.patient_dni?.toLowerCase().includes(search) ||
      consultation.chief_complaint?.toLowerCase().includes(search)
    );
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30';
      case 'in_progress':
        return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
      case 'completed':
        return 'bg-green-500/20 text-green-300 border-green-500/30';
      case 'cancelled':
        return 'bg-red-500/20 text-red-300 border-red-500/30';
      default:
        return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'pending':
        return 'Pendiente';
      case 'in_progress':
        return 'En Progreso';
      case 'completed':
        return 'Completada';
      case 'cancelled':
        return 'Cancelada';
      default:
        return status;
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 1:
        return 'bg-red-600 text-white';
      case 2:
        return 'bg-orange-500 text-white';
      case 3:
        return 'bg-yellow-500 text-white';
      case 4:
        return 'bg-green-500 text-white';
      case 5:
        return 'bg-blue-500 text-white';
      default:
        return 'bg-gray-500 text-white';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">Consultas Médicas</h1>
              <p className="text-gray-400">Gestión de consultas y pacientes</p>
            </div>
            <Link to="/medical/new-consultation">
              <button className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-3 rounded-xl font-medium hover:from-blue-600 hover:to-purple-700 transition-all duration-200 flex items-center">
                <Stethoscope className="h-5 w-5 mr-2" />
                Nueva Consulta
              </button>
            </Link>
          </div>

          {/* Search and Filters */}
          <div className="backdrop-blur-lg bg-white/10 rounded-2xl p-6 border border-white/20">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar por nombre, DNI o síntoma..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Status Filter */}
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white appearance-none focus:outline-none focus:border-blue-500"
                >
                  <option value="all">Todos los estados</option>
                  <option value="pending">Pendientes</option>
                  <option value="in_progress">En Progreso</option>
                  <option value="completed">Completadas</option>
                  <option value="cancelled">Canceladas</option>
                </select>
              </div>

              {/* Date Filter */}
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <select
                  value={filterDate}
                  onChange={(e) => setFilterDate(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white appearance-none focus:outline-none focus:border-blue-500"
                >
                  <option value="today">Hoy</option>
                  <option value="week">Esta semana</option>
                  <option value="month">Este mes</option>
                  <option value="all">Todas</option>
                </select>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Consultations List */}
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <Loader className="h-8 w-8 text-blue-500 animate-spin" />
          </div>
        ) : error ? (
          <div className="backdrop-blur-lg bg-red-500/10 rounded-2xl p-6 border border-red-500/20">
            <div className="flex items-center space-x-3">
              <AlertCircle className="h-6 w-6 text-red-400" />
              <p className="text-red-300">Error al cargar las consultas: {error.message}</p>
            </div>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-4"
          >
            {filteredConsultations?.length === 0 ? (
              <div className="backdrop-blur-lg bg-white/10 rounded-2xl p-12 border border-white/20 text-center">
                <Activity className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-300 text-lg">No se encontraron consultas</p>
                <p className="text-gray-400 mt-2">Intenta ajustar los filtros de búsqueda</p>
              </div>
            ) : (
              filteredConsultations?.map((consultation, index) => (
                <motion.div
                  key={consultation.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="backdrop-blur-lg bg-white/10 rounded-2xl p-6 border border-white/20 hover:bg-white/15 transition-all duration-200"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-4 mb-3">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold">
                          {consultation.patient_name?.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <h3 className="text-xl font-semibold text-white">
                            {consultation.patient_name}
                          </h3>
                          <p className="text-gray-400 text-sm">
                            DNI: {consultation.patient_dni} | Edad: {consultation.patient_age} años
                          </p>
                        </div>
                        {consultation.triage_priority && (
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${getPriorityColor(consultation.triage_priority)}`}>
                            P{consultation.triage_priority}
                          </span>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                          <p className="text-gray-400 text-sm mb-1">Motivo de consulta</p>
                          <p className="text-white">{consultation.chief_complaint}</p>
                        </div>
                        <div>
                          <p className="text-gray-400 text-sm mb-1">Especialidad</p>
                          <p className="text-white">{consultation.specialty}</p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-6 text-sm">
                        <div className="flex items-center space-x-2">
                          <Calendar className="h-4 w-4 text-gray-400" />
                          <span className="text-gray-300">
                            {consultation.appointment_date ? 
                              format(new Date(consultation.appointment_date), "d 'de' MMMM, yyyy", { locale: es }) :
                              'Fecha no disponible'
                            }
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Clock className="h-4 w-4 text-gray-400" />
                          <span className="text-gray-300">
                            {consultation.appointment_time}
                          </span>
                        </div>
                        {consultation.waiting_time && (
                          <div className="flex items-center space-x-2">
                            <Loader className="h-4 w-4 text-gray-400" />
                            <span className="text-gray-300">
                              Espera: {consultation.waiting_time} min
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col items-end space-y-3">
                      <span className={`px-4 py-2 rounded-full text-sm font-medium border ${getStatusColor(consultation.status)}`}>
                        {getStatusText(consultation.status)}
                      </span>
                      <div className="flex space-x-2">
                        {consultation.has_triage && (
                          <button className="p-2 bg-white/10 rounded-lg hover:bg-white/20 transition-colors" title="Ver triaje">
                            <Eye className="h-4 w-4 text-blue-400" />
                          </button>
                        )}
                        {consultation.has_medical_record && (
                          <Link to={`/medical/medical-records/${consultation.patient_id}`}>
                            <button className="p-2 bg-white/10 rounded-lg hover:bg-white/20 transition-colors" title="Ver expediente">
                              <FileText className="h-4 w-4 text-purple-400" />
                            </button>
                          </Link>
                        )}
                        <Link to={`/medical/consultations/${consultation.id}`}>
                          <button className="p-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all">
                            <ChevronRight className="h-4 w-4" />
                          </button>
                        </Link>
                      </div>
                    </div>
                  </div>

                  {consultation.vital_signs && (
                    <div className="mt-4 pt-4 border-t border-white/10">
                      <p className="text-gray-400 text-sm mb-2">Signos vitales</p>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <div className="bg-white/5 rounded-lg p-2">
                          <p className="text-gray-400 text-xs">FC</p>
                          <p className="text-white font-medium">{consultation.vital_signs.heart_rate} bpm</p>
                        </div>
                        <div className="bg-white/5 rounded-lg p-2">
                          <p className="text-gray-400 text-xs">PA</p>
                          <p className="text-white font-medium">{consultation.vital_signs.blood_pressure}</p>
                        </div>
                        <div className="bg-white/5 rounded-lg p-2">
                          <p className="text-gray-400 text-xs">Temp</p>
                          <p className="text-white font-medium">{consultation.vital_signs.temperature}°C</p>
                        </div>
                        <div className="bg-white/5 rounded-lg p-2">
                          <p className="text-gray-400 text-xs">SpO₂</p>
                          <p className="text-white font-medium">{consultation.vital_signs.oxygen_saturation}%</p>
                        </div>
                      </div>
                    </div>
                  )}
                </motion.div>
              ))
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default ConsultationsList;
