import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { 
  Smile, Search, Plus, Calendar, FileText, 
  AlertCircle, Activity, Zap, Shield, 
  ChevronRight, Eye, Edit, Trash2,
  Clock, User, MapPin
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Link } from 'react-router-dom';
import patientService from '../../services/patientService';
import dentalService from '../../services/dentalService';

const DentalHistory = () => {
  const [selectedPatientId, setSelectedPatientId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('odontogram');
  const [selectedTooth, setSelectedTooth] = useState(null);

  // Obtener lista de pacientes
  const { data: patientsData, isLoading: loadingPatients } = useQuery({
    queryKey: ['dentalPatients', searchTerm],
    queryFn: () => patientService.getDentalPatients(searchTerm),
  });

  // Obtener historial dental del paciente seleccionado
  const { data: dentalHistory, isLoading: loadingHistory } = useQuery({
    queryKey: ['dentalHistory', selectedPatientId],
    queryFn: () => dentalService.getPatientDentalHistory(selectedPatientId),
    enabled: !!selectedPatientId,
  });

  // Obtener odontograma
  const { data: odontogram, isLoading: loadingOdontogram } = useQuery({
    queryKey: ['odontogram', selectedPatientId],
    queryFn: () => dentalService.getPatientOdontogram(selectedPatientId),
    enabled: !!selectedPatientId,
  });

  // Obtener tratamientos dentales
  const { data: treatments, isLoading: loadingTreatments } = useQuery({
    queryKey: ['dentalTreatments', selectedPatientId],
    queryFn: () => dentalService.getPatientTreatments(selectedPatientId),
    enabled: !!selectedPatientId,
  });

  const patients = patientsData?.results || [];

  const tabs = [
    { id: 'odontogram', name: 'Odontograma', icon: Shield },
    { id: 'treatments', name: 'Tratamientos', icon: Activity },
    { id: 'procedures', name: 'Procedimientos', icon: Zap },
    { id: 'radiographs', name: 'Radiografías', icon: FileText },
  ];

  // Números de dientes según nomenclatura FDI
  const upperTeeth = [18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28];
  const lowerTeeth = [48, 47, 46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36, 37, 38];

  const getToothCondition = (toothNumber) => {
    const tooth = odontogram?.teeth?.find(t => t.number === toothNumber);
    if (!tooth) return { status: 'healthy', color: 'bg-white/10' };

    switch (tooth.condition) {
      case 'caries':
        return { status: 'Caries', color: 'bg-red-500' };
      case 'restoration':
        return { status: 'Obturación', color: 'bg-blue-500' };
      case 'crown':
        return { status: 'Corona', color: 'bg-yellow-500' };
      case 'missing':
        return { status: 'Ausente', color: 'bg-gray-500' };
      case 'root_canal':
        return { status: 'Endodoncia', color: 'bg-purple-500' };
      default:
        return { status: 'Sano', color: 'bg-white/10' };
    }
  };

  const selectedPatient = patients.find(p => p.id === selectedPatientId);

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
              Historial Dental
            </h1>
            <p className="text-cyan-200">
              {format(new Date(), "EEEE, d 'de' MMMM 'de' yyyy", { locale: es })}
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <Link
              to="/dental-procedures/new"
              className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-medium rounded-xl hover:from-cyan-600 hover:to-blue-700 transition duration-200 flex items-center"
            >
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Procedimiento
            </Link>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Lista de Pacientes */}
          <div className="lg:col-span-1">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="backdrop-blur-lg bg-white/10 rounded-2xl p-6 border border-white/20 h-fit"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-white flex items-center">
                  <Smile className="h-5 w-5 mr-2 text-cyan-400" />
                  Pacientes Dentales
                </h2>
                <Link
                  to="/patients/new"
                  className="text-cyan-300 hover:text-cyan-200 text-sm"
                >
                  <Plus className="h-4 w-4" />
                </Link>
              </div>

              {/* Búsqueda */}
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-5 w-5" />
                <input
                  type="text"
                  placeholder="Buscar pacientes..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>

              {/* Lista */}
              <div className="space-y-3 max-h-[600px] overflow-y-auto">
                {loadingPatients ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-500"></div>
                  </div>
                ) : patients.length === 0 ? (
                  <p className="text-cyan-200 text-center py-8">No se encontraron pacientes</p>
                ) : (
                  patients.map((patient, index) => (
                    <motion.div
                      key={patient.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      onClick={() => setSelectedPatientId(patient.id)}
                      className={`p-4 rounded-xl border cursor-pointer transition-all duration-200 ${
                        selectedPatientId === patient.id
                          ? 'bg-cyan-500/20 border-cyan-500/50'
                          : 'bg-white/5 border-white/10 hover:bg-white/10'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 flex items-center justify-center text-white font-semibold">
                            {patient.first_name?.charAt(0) || patient.name?.charAt(0) || 'P'}
                          </div>
                          <div>
                            <h4 className="text-white font-medium">
                              {patient.first_name && patient.last_name 
                                ? `${patient.first_name} ${patient.last_name}`
                                : patient.name || 'Sin nombre'}
                            </h4>
                            <p className="text-cyan-300 text-sm">
                              DNI: {patient.dni || 'N/A'}
                            </p>
                            {patient.last_dental_visit && (
                              <p className="text-cyan-400 text-xs">
                                Última visita: {format(new Date(patient.last_dental_visit), 'dd/MM/yy')}
                              </p>
                            )}
                          </div>
                        </div>
                        <ChevronRight className="h-5 w-5 text-slate-400" />
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            </motion.div>
          </div>

          {/* Contenido Principal */}
          <div className="lg:col-span-2">
            {selectedPatientId ? (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="backdrop-blur-lg bg-white/10 rounded-2xl p-6 border border-white/20"
              >
                {/* Header del Paciente */}
                {selectedPatient && (
                  <div className="mb-6 p-4 bg-white/5 rounded-xl border border-white/10">
                    <div className="flex items-center space-x-4">
                      <div className="w-16 h-16 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 flex items-center justify-center text-white font-bold text-xl">
                        {selectedPatient.first_name?.charAt(0) || selectedPatient.name?.charAt(0) || 'P'}
                      </div>
                      <div className="flex-1">
                        <h3 className="text-2xl font-bold text-white mb-1">
                          {selectedPatient.first_name && selectedPatient.last_name 
                            ? `${selectedPatient.first_name} ${selectedPatient.last_name}`
                            : selectedPatient.name || 'Sin nombre'}
                        </h3>
                        <div className="flex flex-wrap gap-4 text-sm text-cyan-300">
                          <span>DNI: {selectedPatient.dni || 'N/A'}</span>
                          <span>Edad: {selectedPatient.age || 'N/A'} años</span>
                          <span>Tel: {selectedPatient.phone || 'N/A'}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <button className="px-3 py-2 bg-cyan-500/20 text-cyan-300 rounded-lg hover:bg-cyan-500/30 transition-colors text-sm">
                          <Edit className="h-4 w-4 mr-1 inline" />
                          Editar
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Tabs */}
                <div className="flex flex-wrap gap-2 mb-6">
                  {tabs.map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center ${
                        activeTab === tab.id
                          ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                          : 'bg-white/5 text-slate-300 hover:bg-white/10'
                      }`}
                    >
                      <tab.icon className="h-4 w-4 mr-2" />
                      {tab.name}
                    </button>
                  ))}
                </div>

                {/* Contenido de Tabs */}
                <div className="min-h-[500px]">
                  {activeTab === 'odontogram' && (
                    <div className="space-y-6">
                      <div className="flex items-center justify-between">
                        <h3 className="text-xl font-semibold text-white">Odontograma</h3>
                        <button className="px-3 py-2 bg-cyan-500/20 text-cyan-300 rounded-lg hover:bg-cyan-500/30 transition-colors text-sm flex items-center">
                          <Plus className="h-4 w-4 mr-1" />
                          Registrar Estado
                        </button>
                      </div>

                      {/* Odontograma Visual */}
                      <div className="bg-white/5 rounded-xl p-6 border border-white/10">
                        {/* Dientes Superiores */}
                        <div className="mb-8">
                          <h4 className="text-cyan-300 text-sm mb-3 text-center">Maxilar Superior</h4>
                          <div className="grid grid-cols-8 gap-2 max-w-2xl mx-auto">
                            {upperTeeth.map((toothNumber) => {
                              const condition = getToothCondition(toothNumber);
                              return (
                                <motion.div
                                  key={toothNumber}
                                  whileHover={{ scale: 1.05 }}
                                  onClick={() => setSelectedTooth(toothNumber)}
                                  className={`aspect-square ${condition.color} rounded-lg border border-white/20 flex flex-col items-center justify-center text-white font-medium cursor-pointer transition-all hover:border-cyan-400 ${
                                    selectedTooth === toothNumber ? 'ring-2 ring-cyan-400' : ''
                                  }`}
                                  title={`Diente ${toothNumber} - ${condition.status}`}
                                >
                                  <span className="text-xs">{toothNumber}</span>
                                  {condition.status !== 'Sano' && (
                                    <span className="text-[8px] mt-1 text-center leading-tight">
                                      {condition.status}
                                    </span>
                                  )}
                                </motion.div>
                              );
                            })}
                          </div>
                        </div>

                        {/* Dientes Inferiores */}
                        <div>
                          <h4 className="text-cyan-300 text-sm mb-3 text-center">Maxilar Inferior</h4>
                          <div className="grid grid-cols-8 gap-2 max-w-2xl mx-auto">
                            {lowerTeeth.map((toothNumber) => {
                              const condition = getToothCondition(toothNumber);
                              return (
                                <motion.div
                                  key={toothNumber}
                                  whileHover={{ scale: 1.05 }}
                                  onClick={() => setSelectedTooth(toothNumber)}
                                  className={`aspect-square ${condition.color} rounded-lg border border-white/20 flex flex-col items-center justify-center text-white font-medium cursor-pointer transition-all hover:border-cyan-400 ${
                                    selectedTooth === toothNumber ? 'ring-2 ring-cyan-400' : ''
                                  }`}
                                  title={`Diente ${toothNumber} - ${condition.status}`}
                                >
                                  <span className="text-xs">{toothNumber}</span>
                                  {condition.status !== 'Sano' && (
                                    <span className="text-[8px] mt-1 text-center leading-tight">
                                      {condition.status}
                                    </span>
                                  )}
                                </motion.div>
                              );
                            })}
                          </div>
                        </div>

                        {/* Leyenda */}
                        <div className="mt-6 flex flex-wrap justify-center gap-4 text-xs">
                          <div className="flex items-center space-x-2">
                            <div className="w-4 h-4 bg-white/10 rounded border border-white/20"></div>
                            <span className="text-cyan-300">Sano</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <div className="w-4 h-4 bg-red-500 rounded"></div>
                            <span className="text-cyan-300">Caries</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <div className="w-4 h-4 bg-blue-500 rounded"></div>
                            <span className="text-cyan-300">Obturación</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <div className="w-4 h-4 bg-yellow-500 rounded"></div>
                            <span className="text-cyan-300">Corona</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <div className="w-4 h-4 bg-purple-500 rounded"></div>
                            <span className="text-cyan-300">Endodoncia</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <div className="w-4 h-4 bg-gray-500 rounded"></div>
                            <span className="text-cyan-300">Ausente</span>
                          </div>
                        </div>
                      </div>

                      {/* Información del diente seleccionado */}
                      {selectedTooth && (
                        <motion.div
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="bg-white/5 rounded-xl p-4 border border-white/10"
                        >
                          <h4 className="text-white font-medium mb-3">
                            Información del Diente {selectedTooth}
                          </h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="text-cyan-400">Estado:</span>
                              <span className="text-white ml-2">{getToothCondition(selectedTooth).status}</span>
                            </div>
                            <div>
                              <span className="text-cyan-400">Última revisión:</span>
                              <span className="text-white ml-2">15/01/2024</span>
                            </div>
                            <div>
                              <span className="text-cyan-400">Tratamiento:</span>
                              <span className="text-white ml-2">En seguimiento</span>
                            </div>
                            <div>
                              <span className="text-cyan-400">Notas:</span>
                              <span className="text-white ml-2">Control rutinario</span>
                            </div>
                          </div>
                          <div className="flex space-x-2 mt-4">
                            <button className="px-3 py-1 bg-cyan-500/20 text-cyan-300 rounded-lg hover:bg-cyan-500/30 transition-colors text-sm">
                              <Edit className="h-3 w-3 mr-1 inline" />
                              Editar
                            </button>
                            <button className="px-3 py-1 bg-blue-500/20 text-blue-300 rounded-lg hover:bg-blue-500/30 transition-colors text-sm">
                              <Plus className="h-3 w-3 mr-1 inline" />
                              Procedimiento
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </div>
                  )}

                  {activeTab === 'treatments' && (
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <h3 className="text-xl font-semibold text-white">Tratamientos Dentales</h3>
                        <button className="px-3 py-2 bg-cyan-500/20 text-cyan-300 rounded-lg hover:bg-cyan-500/30 transition-colors text-sm flex items-center">
                          <Plus className="h-4 w-4 mr-1" />
                          Nuevo Tratamiento
                        </button>
                      </div>

                      {loadingTreatments ? (
                        <div className="flex justify-center py-8">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-500"></div>
                        </div>
                      ) : treatments && treatments.length > 0 ? (
                        <div className="space-y-3">
                          {treatments.map((treatment) => (
                            <motion.div
                              key={treatment.id}
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="bg-white/5 rounded-xl p-4 border border-white/10 hover:bg-white/10 transition-colors"
                            >
                              <div className="flex justify-between items-start mb-3">
                                <div>
                                  <h4 className="text-white font-medium">{treatment.name}</h4>
                                  <p className="text-cyan-300 text-sm">Diente: {treatment.tooth_number}</p>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                                    treatment.status === 'completed' ? 'bg-green-500/20 text-green-300' :
                                    treatment.status === 'in_progress' ? 'bg-blue-500/20 text-blue-300' :
                                    'bg-yellow-500/20 text-yellow-300'
                                  }`}>
                                    {treatment.status === 'completed' ? 'Completado' :
                                     treatment.status === 'in_progress' ? 'En Progreso' : 'Planificado'}
                                  </span>
                                  <button className="text-cyan-300 hover:text-cyan-200">
                                    <Eye className="h-4 w-4" />
                                  </button>
                                </div>
                              </div>

                              <p className="text-slate-300 text-sm mb-3">{treatment.description}</p>

                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                                <div>
                                  <span className="text-cyan-400">Inicio:</span>
                                  <span className="text-white ml-2">
                                    {format(new Date(treatment.start_date), 'dd/MM/yyyy')}
                                  </span>
                                </div>
                                <div>
                                  <span className="text-cyan-400">Duración estimada:</span>
                                  <span className="text-white ml-2">{treatment.estimated_duration}</span>
                                </div>
                                <div>
                                  <span className="text-cyan-400">Costo:</span>
                                  <span className="text-white ml-2">S/. {treatment.cost}</span>
                                </div>
                              </div>

                              {treatment.status === 'in_progress' && (
                                <div className="mt-3">
                                  <div className="flex justify-between text-xs mb-1">
                                    <span className="text-cyan-400">Progreso</span>
                                    <span className="text-white">{treatment.progress}%</span>
                                  </div>
                                  <div className="w-full bg-white/10 rounded-full h-2">
                                    <div 
                                      className="bg-gradient-to-r from-cyan-500 to-blue-500 h-2 rounded-full transition-all duration-300"
                                      style={{ width: `${treatment.progress}%` }}
                                    ></div>
                                  </div>
                                </div>
                              )}
                            </motion.div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-cyan-300 text-center py-8">No hay tratamientos registrados</p>
                      )}
                    </div>
                  )}

                  {activeTab === 'procedures' && (
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <h3 className="text-xl font-semibold text-white">Procedimientos Realizados</h3>
                      </div>

                      <div className="space-y-3">
                        {dentalHistory?.procedures?.map((procedure, index) => (
                          <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-white/5 rounded-xl p-4 border border-white/10"
                          >
                            <div className="flex justify-between items-start mb-2">
                              <div>
                                <h4 className="text-white font-medium">{procedure.name}</h4>
                                <p className="text-cyan-300 text-sm">
                                  {format(new Date(procedure.date), 'dd/MM/yyyy')} - Diente {procedure.tooth_number}
                                </p>
                              </div>
                              <span className="text-xs text-cyan-400">
                                Dr. {procedure.doctor_name}
                              </span>
                            </div>
                            <p className="text-slate-300 text-sm">{procedure.notes}</p>
                          </motion.div>
                        )) || (
                          <p className="text-cyan-300 text-center py-8">No hay procedimientos registrados</p>
                        )}
                      </div>
                    </div>
                  )}

                  {activeTab === 'radiographs' && (
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <h3 className="text-xl font-semibold text-white">Radiografías</h3>
                        <button className="px-3 py-2 bg-cyan-500/20 text-cyan-300 rounded-lg hover:bg-cyan-500/30 transition-colors text-sm flex items-center">
                          <Plus className="h-4 w-4 mr-1" />
                          Subir Radiografía
                        </button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {dentalHistory?.radiographs?.map((xray, index) => (
                          <motion.div
                            key={index}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="bg-white/5 rounded-xl p-4 border border-white/10 hover:bg-white/10 transition-colors cursor-pointer"
                          >
                            <div className="aspect-video bg-slate-700 rounded-lg mb-3 flex items-center justify-center">
                              <Zap className="h-8 w-8 text-slate-400" />
                            </div>
                            <div className="flex justify-between items-start">
                              <div>
                                <h4 className="text-white font-medium">{xray.type}</h4>
                                <p className="text-cyan-300 text-sm">
                                  {format(new Date(xray.date), 'dd/MM/yyyy')}
                                </p>
                              </div>
                              <button className="text-cyan-300 hover:text-cyan-200">
                                <Eye className="h-4 w-4" />
                              </button>
                            </div>
                          </motion.div>
                        )) || (
                          <div className="col-span-2">
                            <p className="text-cyan-300 text-center py-8">No hay radiografías registradas</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="backdrop-blur-lg bg-white/10 rounded-2xl p-12 border border-white/20 text-center"
              >
                <Smile className="h-16 w-16 text-slate-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">Selecciona un Paciente</h3>
                <p className="text-cyan-300">Elige un paciente de la lista para ver su historial dental completo</p>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DentalHistory;
