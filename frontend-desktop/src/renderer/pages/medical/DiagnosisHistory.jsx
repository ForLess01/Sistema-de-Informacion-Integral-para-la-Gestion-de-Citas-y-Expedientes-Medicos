import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { 
  ClipboardList, Search, ChevronRight, AlertCircle,
  Calendar, User, FileText, Activity, Heart,
  Pill, Plus, Filter, TrendingUp, Clock
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import medicalRecordService from '../../services/medicalRecordService';
import patientService from '../../services/patientService';

const DiagnosisHistory = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDiagnosis, setSelectedDiagnosis] = useState(null);
  const [selectedPatientId, setSelectedPatientId] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');

  // Obtener lista de pacientes
  const { data: patientsData } = useQuery({
    queryKey: ['patients'],
    queryFn: () => patientService.getPatients(),
  });

  // Obtener lista de diagnósticos desde el endpoint general
  const { data: allDiagnosesData, isLoading: loadingAllDiagnoses } = useQuery({
    queryKey: ['allDiagnoses'],
    queryFn: () => medicalRecordService.diagnoses(),
  });

  // Obtener diagnósticos de un paciente específico
  const { data: patientDiagnosesData, isLoading: loadingPatientDiagnoses } = useQuery({
    queryKey: ['patientDiagnoses', selectedPatientId],
    queryFn: () => medicalRecordService.getDiagnoses(selectedPatientId),
    enabled: !!selectedPatientId,
  });

  const diagnoses = selectedPatientId 
    ? (patientDiagnosesData || [])
    : (allDiagnosesData || []);

  const isLoading = selectedPatientId ? loadingPatientDiagnoses : loadingAllDiagnoses;

  // Filtrar diagnósticos
  const filteredDiagnoses = diagnoses.filter(diagnosis => {
    const matchesSearch = 
      diagnosis.condition?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      diagnosis.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      diagnosis.doctor_name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === 'all' || diagnosis.status === filterStatus;
    
    return matchesSearch && matchesStatus;
  });

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'critical': return 'text-red-500 bg-red-500/20';
      case 'high': return 'text-orange-500 bg-orange-500/20';
      case 'moderate': return 'text-yellow-500 bg-yellow-500/20';
      case 'mild': return 'text-green-500 bg-green-500/20';
      case 'low': return 'text-blue-500 bg-blue-500/20';
      default: return 'text-gray-500 bg-gray-500/20';
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'active':
        return <span className="px-2 py-1 bg-green-500/20 text-green-300 rounded-full text-xs">Activo</span>;
      case 'resolved':
        return <span className="px-2 py-1 bg-blue-500/20 text-blue-300 rounded-full text-xs">Resuelto</span>;
      case 'chronic':
        return <span className="px-2 py-1 bg-orange-500/20 text-orange-300 rounded-full text-xs">Crónico</span>;
      default:
        return <span className="px-2 py-1 bg-gray-500/20 text-gray-300 rounded-full text-xs">En Observación</span>;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-800 to-indigo-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex justify-between items-center mb-8"
        >
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">
              Historial de Diagnósticos
            </h1>
            <p className="text-slate-200">
              {format(new Date(), "EEEE, d 'de' MMMM 'de' yyyy", { locale: es })}
            </p>
          </div>
        </motion.div>

        {/* Lista de Diagnósticos */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="backdrop-blur-lg bg-white/10 rounded-2xl p-6 border border-white/20 h-fit"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-white flex items-center">
                  <ClipboardList className="h-5 w-5 mr-2 text-blue-400" />
                  Diagnósticos
                </h2>
              </div>

              {/* Búsqueda */}
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-5 w-5" />
                <input
                  type="text"
                  placeholder="Buscar diagnóstico..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Filtros */}
              <div className="mb-4">
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="w-full px-4 py-2 bg-white/5 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">Todos los estados</option>
                  <option value="active">Activos</option>
                  <option value="resolved">Resueltos</option>
                  <option value="chronic">Crónicos</option>
                  <option value="observation">En Observación</option>
                </select>
              </div>

              {/* Lista */}
              <div className="space-y-3 max-h-[600px] overflow-y-auto">
                {isLoading ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                  </div>
                ) : filteredDiagnoses.length === 0 ? (
                  <p className="text-slate-200 text-center py-8">No se encontraron diagnósticos</p>
                ) : (
                  filteredDiagnoses.map((diagnosis, index) => (
                    <motion.div
                      key={diagnosis.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      onClick={() => setSelectedDiagnosis(diagnosis)}
                      className={`p-4 rounded-xl border cursor-pointer transition-all duration-200 ${
                        selectedDiagnosis?.id === diagnosis.id
                          ? 'bg-blue-500/20 border-blue-500/50'
                          : 'bg-white/5 border-white/10 hover:bg-white/10'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-white font-medium">{diagnosis.condition}</h4>
                        {getStatusBadge(diagnosis.status)}
                      </div>
                      <p className="text-slate-300 text-sm mb-2 line-clamp-2">
                        {diagnosis.description}
                      </p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4 text-xs text-slate-400">
                          <span className="flex items-center">
                            <Calendar className="h-3 w-3 mr-1" />
                            {diagnosis.date ? format(parseISO(diagnosis.date), 'dd/MM/yyyy') : 'N/A'}
                          </span>
                          <span className={`px-2 py-0.5 rounded-full ${getSeverityColor(diagnosis.severity)}`}>
                            {diagnosis.severity === 'critical' ? 'Crítico' :
                             diagnosis.severity === 'high' ? 'Alto' :
                             diagnosis.severity === 'moderate' ? 'Moderado' :
                             diagnosis.severity === 'mild' ? 'Leve' : 'Bajo'}
                          </span>
                        </div>
                        <ChevronRight className="h-5 w-5 text-slate-400" />
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            </motion.div>
          </div>
          {/* Detalles del Diagnóstico */}
          <div className="lg:col-span-2">
            {selectedDiagnosis ? (
              <motion.div
                key={selectedDiagnosis.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="backdrop-blur-lg bg-white/10 rounded-2xl p-6 border border-white/20"
              >
                {/* Header del diagnóstico */}
                <div className="mb-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h2 className="text-2xl font-bold text-white mb-2">
                        {selectedDiagnosis.condition}
                      </h2>
                      <div className="flex items-center space-x-4">
                        {getStatusBadge(selectedDiagnosis.status)}
                        <span className={`px-3 py-1 rounded-full text-sm ${getSeverityColor(selectedDiagnosis.severity)}`}>
                          Severidad: {selectedDiagnosis.severity === 'critical' ? 'Crítica' :
                                     selectedDiagnosis.severity === 'high' ? 'Alta' :
                                     selectedDiagnosis.severity === 'moderate' ? 'Moderada' :
                                     selectedDiagnosis.severity === 'mild' ? 'Leve' : 'Baja'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Información del diagnóstico */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                    <h3 className="text-white font-medium mb-3 flex items-center">
                      <FileText className="h-4 w-4 mr-2 text-blue-400" />
                      Descripción
                    </h3>
                    <p className="text-slate-300 text-sm leading-relaxed">
                      {selectedDiagnosis.description}
                    </p>
                  </div>

                  <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                    <h3 className="text-white font-medium mb-3 flex items-center">
                      <User className="h-4 w-4 mr-2 text-green-400" />
                      Información del Médico
                    </h3>
                    <div className="space-y-2 text-sm">
                      <p className="text-slate-300">
                        <span className="text-slate-400">Doctor:</span> {selectedDiagnosis.doctor_name}
                      </p>
                      <p className="text-slate-300">
                        <span className="text-slate-400">Fecha:</span> {selectedDiagnosis.date ? format(parseISO(selectedDiagnosis.date), "d 'de' MMMM, yyyy", { locale: es }) : 'N/A'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Tratamiento y recomendaciones */}
                {(selectedDiagnosis.treatment || selectedDiagnosis.recommendations) && (
                  <div className="mb-6">
                    <h3 className="text-white font-medium mb-3 flex items-center">
                      <Activity className="h-4 w-4 mr-2 text-purple-400" />
                      Tratamiento y Recomendaciones
                    </h3>
                    <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                      {selectedDiagnosis.treatment && (
                        <div className="mb-4">
                          <h4 className="text-slate-300 font-medium mb-2">Tratamiento:</h4>
                          <p className="text-slate-400 text-sm">{selectedDiagnosis.treatment}</p>
                        </div>
                      )}
                      {selectedDiagnosis.recommendations && (
                        <div>
                          <h4 className="text-slate-300 font-medium mb-2">Recomendaciones:</h4>
                          <p className="text-slate-400 text-sm">{selectedDiagnosis.recommendations}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Medicamentos relacionados */}
                {selectedDiagnosis.medications && selectedDiagnosis.medications.length > 0 && (
                  <div>
                    <h3 className="text-white font-medium mb-3 flex items-center">
                      <Pill className="h-4 w-4 mr-2 text-orange-400" />
                      Medicamentos Prescritos
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {selectedDiagnosis.medications.map((med, index) => (
                        <div key={index} className="bg-white/5 rounded-xl p-3 border border-white/10">
                          <h4 className="text-white font-medium mb-1">{med.name}</h4>
                          <p className="text-slate-400 text-sm">
                            {med.dosage} - {med.frequency}
                          </p>
                          {med.duration && (
                            <p className="text-slate-500 text-xs mt-1">Duración: {med.duration}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Próxima revisión */}
                {selectedDiagnosis.next_review && (
                  <div className="mt-6 p-4 bg-blue-500/10 rounded-xl border border-blue-500/20">
                    <p className="text-blue-300 flex items-center">
                      <Clock className="h-4 w-4 mr-2" />
                      Próxima revisión: {format(parseISO(selectedDiagnosis.next_review), "d 'de' MMMM, yyyy", { locale: es })}
                    </p>
                  </div>
                )}
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="backdrop-blur-lg bg-white/10 rounded-2xl p-12 border border-white/20 text-center h-full flex items-center justify-center"
              >
                <div>
                  <ClipboardList className="h-16 w-16 text-slate-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-white mb-2">Selecciona un Diagnóstico</h3>
                  <p className="text-slate-300">Elige un diagnóstico de la lista para ver sus detalles completos</p>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DiagnosisHistory;

