import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { 
  FileText, UserCheck, ClipboardList, Activity, 
  Search, Plus, User, Calendar, Stethoscope,
  Heart, AlertCircle, ChevronRight, Eye,
  Pill, TestTube, FileImage
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import medicalRecordService from '../../services/medicalRecordService';
import patientService from '../../services/patientService';

const MedicalRecords = () => {
  const [selectedPatientId, setSelectedPatientId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('general');

  // Obtener lista de pacientes
  const { data: patientsData, isLoading: loadingPatients } = useQuery({
    queryKey: ['patients', searchTerm],
    queryFn: () => patientService.getPatients(searchTerm),
  });

  // Obtener datos del paciente seleccionado
  const { data: selectedPatient } = useQuery({
    queryKey: ['patient', selectedPatientId],
    queryFn: () => patientService.getPatientById(selectedPatientId),
    enabled: !!selectedPatientId,
  });

  // Obtener expediente médico completo
  const { data: medicalRecord, isLoading: loadingRecord } = useQuery({
    queryKey: ['medicalRecord', selectedPatientId],
    queryFn: () => medicalRecordService.getPatientRecord(selectedPatientId),
    enabled: !!selectedPatientId,
  });

  // Obtener diagnósticos
  const { data: diagnoses } = useQuery({
    queryKey: ['diagnoses', selectedPatientId],
    queryFn: () => medicalRecordService.getDiagnoses(selectedPatientId),
    enabled: !!selectedPatientId,
  });

  // Obtener signos vitales
  const { data: vitalSigns } = useQuery({
    queryKey: ['vitalSigns', selectedPatientId],
    queryFn: () => medicalRecordService.getVitalSigns(selectedPatientId),
    enabled: !!selectedPatientId,
  });

  // Obtener alergias
  const { data: allergies } = useQuery({
    queryKey: ['allergies', selectedPatientId],
    queryFn: () => medicalRecordService.getAllergies(selectedPatientId),
    enabled: !!selectedPatientId,
  });

  // Obtener recetas
  const { data: prescriptions } = useQuery({
    queryKey: ['prescriptions', selectedPatientId],
    queryFn: () => medicalRecordService.getPrescriptions(selectedPatientId),
    enabled: !!selectedPatientId,
  });

  // Obtener documentos médicos
  const { data: documents } = useQuery({
    queryKey: ['documents', selectedPatientId],
    queryFn: () => medicalRecordService.getDocuments(selectedPatientId),
    enabled: !!selectedPatientId,
  });

  const patients = patientsData?.results || [];

  const tabs = [
    { id: 'general', name: 'General', icon: User },
    { id: 'diagnoses', name: 'Diagnósticos', icon: ClipboardList },
    { id: 'vitals', name: 'Signos Vitales', icon: Activity },
    { id: 'allergies', name: 'Alergias', icon: AlertCircle },
    { id: 'prescriptions', name: 'Recetas', icon: Pill },
    { id: 'documents', name: 'Documentos', icon: FileImage },
  ];

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
              Expedientes Médicos
            </h1>
            <p className="text-slate-200">
              {format(new Date(), "EEEE, d 'de' MMMM 'de' yyyy", { locale: es })}
            </p>
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
                  <User className="h-5 w-5 mr-2 text-blue-400" />
                  Pacientes
                </h2>
              </div>

              {/* Búsqueda */}
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-5 w-5" />
                <input
                  type="text"
                  placeholder="Buscar pacientes..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Lista */}
              <div className="space-y-3 max-h-[600px] overflow-y-auto">
                {loadingPatients ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                  </div>
                ) : patients.length === 0 ? (
                  <p className="text-slate-200 text-center py-8">No se encontraron pacientes</p>
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
                          ? 'bg-blue-500/20 border-blue-500/50'
                          : 'bg-white/5 border-white/10 hover:bg-white/10'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 flex items-center justify-center text-white font-semibold">
                            {patient.first_name?.charAt(0) || patient.name?.charAt(0) || 'P'}
                          </div>
                          <div>
                            <h4 className="text-white font-medium">
                              {patient.first_name && patient.last_name 
                                ? `${patient.first_name} ${patient.last_name}`
                                : patient.name || 'Sin nombre'}
                            </h4>
                            <p className="text-slate-300 text-sm">
                              DNI: {patient.dni || 'N/A'}
                            </p>
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

          {/* Detalles del Expediente */}
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
                      <div className="w-16 h-16 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-xl">
                        {selectedPatient.first_name?.charAt(0) || selectedPatient.name?.charAt(0) || 'P'}
                      </div>
                      <div className="flex-1">
                        <h3 className="text-2xl font-bold text-white mb-1">
                          {selectedPatient.first_name && selectedPatient.last_name 
                            ? `${selectedPatient.first_name} ${selectedPatient.last_name}`
                            : selectedPatient.name || 'Sin nombre'}
                        </h3>
                        <div className="flex flex-wrap gap-4 text-sm text-slate-300">
                          <span>DNI: {selectedPatient.dni || 'N/A'}</span>
                          <span>Edad: {selectedPatient.age || 'N/A'} años</span>
                          <span>Tel: {selectedPatient.phone || 'N/A'}</span>
                        </div>
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
                          ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                          : 'bg-white/5 text-slate-300 hover:bg-white/10'
                      }`}
                    >
                      <tab.icon className="h-4 w-4 mr-2" />
                      {tab.name}
                    </button>
                  ))}
                </div>

                {/* Contenido de Tabs */}
                <div className="min-h-[400px]">
                  {loadingRecord ? (
                    <div className="flex justify-center items-center h-64">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                    </div>
                  ) : (
                    <div>
                      {activeTab === 'general' && medicalRecord && (
                        <div className="space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                              <h4 className="text-white font-medium mb-2 flex items-center">
                                <FileText className="h-4 w-4 mr-2 text-blue-400" />
                                Información General
                              </h4>
                              <div className="text-sm text-slate-300 space-y-1">
                                <p>Número: {medicalRecord.number || 'N/A'}</p>
                                <p>Tipo de Sangre: {medicalRecord.blood_type || 'N/A'}</p>
                                <p>Última actualización: {medicalRecord.last_updated ? format(new Date(medicalRecord.last_updated), 'dd/MM/yyyy HH:mm') : 'N/A'}</p>
                              </div>
                            </div>
                            <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                              <h4 className="text-white font-medium mb-2 flex items-center">
                                <Stethoscope className="h-4 w-4 mr-2 text-green-400" />
                                Médico Tratante
                              </h4>
                              <div className="text-sm text-slate-300">
                                <p>Dr. {medicalRecord.doctor_name || 'No asignado'}</p>
                                <p>Especialidad: {medicalRecord.specialty || 'N/A'}</p>
                              </div>
                            </div>
                          </div>
                          {medicalRecord.notes && (
                            <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                              <h4 className="text-white font-medium mb-2">Notas Generales</h4>
                              <p className="text-sm text-slate-300">{medicalRecord.notes}</p>
                            </div>
                          )}
                        </div>
                      )}

                      {activeTab === 'diagnoses' && (
                        <div className="space-y-3">
                          <div className="flex justify-between items-center">
                            <h4 className="text-white font-medium">Historial de Diagnósticos</h4>
                            <button className="bg-blue-500/20 text-blue-300 px-3 py-2 rounded-lg text-sm hover:bg-blue-500/30 transition-colors flex items-center">
                              <Plus className="h-4 w-4 mr-1" />
                              Nuevo
                            </button>
                          </div>
                          {diagnoses && diagnoses.length > 0 ? (
                            diagnoses.map((diagnosis, index) => (
                              <div key={index} className="bg-white/5 rounded-xl p-4 border border-white/10">
                                <div className="flex justify-between items-start mb-2">
                                  <h5 className="text-white font-medium">{diagnosis.title}</h5>
                                  <span className="text-xs text-slate-400">
                                    {diagnosis.date ? format(new Date(diagnosis.date), 'dd/MM/yyyy') : 'N/A'}
                                  </span>
                                </div>
                                <p className="text-sm text-slate-300 mb-2">{diagnosis.description}</p>
                                <div className="flex items-center text-xs text-slate-400">
                                  <span>Dr. {diagnosis.doctor_name}</span>
                                  <span className="mx-2">•</span>
                                  <span>{diagnosis.specialty}</span>
                                </div>
                              </div>
                            ))
                          ) : (
                            <p className="text-slate-300 text-center py-8">No hay diagnósticos registrados</p>
                          )}
                        </div>
                      )}

                      {activeTab === 'vitals' && (
                        <div className="space-y-3">
                          <div className="flex justify-between items-center">
                            <h4 className="text-white font-medium">Signos Vitales Recientes</h4>
                            <button className="bg-blue-500/20 text-blue-300 px-3 py-2 rounded-lg text-sm hover:bg-blue-500/30 transition-colors flex items-center">
                              <Plus className="h-4 w-4 mr-1" />
                              Registrar
                            </button>
                          </div>
                          {vitalSigns && vitalSigns.length > 0 ? (
                            vitalSigns.slice(0, 5).map((vital, index) => (
                              <div key={index} className="bg-white/5 rounded-xl p-4 border border-white/10">
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                  <div>
                                    <span className="text-xs text-slate-400">Presión Arterial</span>
                                    <p className="text-white font-medium">{vital.blood_pressure || 'N/A'}</p>
                                  </div>
                                  <div>
                                    <span className="text-xs text-slate-400">Frecuencia Cardíaca</span>
                                    <p className="text-white font-medium">{vital.heart_rate || 'N/A'} bpm</p>
                                  </div>
                                  <div>
                                    <span className="text-xs text-slate-400">Temperatura</span>
                                    <p className="text-white font-medium">{vital.temperature || 'N/A'} °C</p>
                                  </div>
                                  <div>
                                    <span className="text-xs text-slate-400">Fecha</span>
                                    <p className="text-white font-medium">
                                      {vital.date ? format(new Date(vital.date), 'dd/MM/yyyy') : 'N/A'}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            ))
                          ) : (
                            <p className="text-slate-300 text-center py-8">No hay signos vitales registrados</p>
                          )}
                        </div>
                      )}

                      {activeTab === 'allergies' && (
                        <div className="space-y-3">
                          <div className="flex justify-between items-center">
                            <h4 className="text-white font-medium">Alergias</h4>
                            <button className="bg-red-500/20 text-red-300 px-3 py-2 rounded-lg text-sm hover:bg-red-500/30 transition-colors flex items-center">
                              <Plus className="h-4 w-4 mr-1" />
                              Agregar
                            </button>
                          </div>
                          {allergies && allergies.length > 0 ? (
                            allergies.map((allergy, index) => (
                              <div key={index} className="bg-red-500/10 rounded-xl p-4 border border-red-500/20">
                                <div className="flex items-center justify-between">
                                  <div>
                                    <h5 className="text-red-300 font-medium">{allergy.allergen}</h5>
                                    <p className="text-sm text-red-200">{allergy.reaction}</p>
                                    <p className="text-xs text-red-400 mt-1">Severidad: {allergy.severity}</p>
                                  </div>
                                  <AlertCircle className="h-5 w-5 text-red-400" />
                                </div>
                              </div>
                            ))
                          ) : (
                            <p className="text-slate-300 text-center py-8">No hay alergias registradas</p>
                          )}
                        </div>
                      )}

                      {activeTab === 'prescriptions' && (
                        <div className="space-y-3">
                          <h4 className="text-white font-medium">Recetas Médicas</h4>
                          {prescriptions && prescriptions.length > 0 ? (
                            prescriptions.slice(0, 10).map((prescription, index) => (
                              <div key={index} className="bg-white/5 rounded-xl p-4 border border-white/10">
                                <div className="flex justify-between items-start mb-2">
                                  <h5 className="text-white font-medium">{prescription.medication}</h5>
                                  <span className="text-xs text-slate-400">
                                    {prescription.date ? format(new Date(prescription.date), 'dd/MM/yyyy') : 'N/A'}
                                  </span>
                                </div>
                                <p className="text-sm text-slate-300 mb-1">{prescription.instructions}</p>
                                <div className="flex items-center text-xs text-slate-400">
                                  <span>Dosificación: {prescription.dosage}</span>
                                  <span className="mx-2">•</span>
                                  <span>Duración: {prescription.duration}</span>
                                </div>
                              </div>
                            ))
                          ) : (
                            <p className="text-slate-300 text-center py-8">No hay recetas registradas</p>
                          )}
                        </div>
                      )}

                      {activeTab === 'documents' && (
                        <div className="space-y-3">
                          <div className="flex justify-between items-center">
                            <h4 className="text-white font-medium">Documentos Médicos</h4>
                            <button className="bg-blue-500/20 text-blue-300 px-3 py-2 rounded-lg text-sm hover:bg-blue-500/30 transition-colors flex items-center">
                              <Plus className="h-4 w-4 mr-1" />
                              Subir
                            </button>
                          </div>
                          {documents && documents.length > 0 ? (
                            documents.map((doc, index) => (
                              <div key={index} className="bg-white/5 rounded-xl p-4 border border-white/10">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center space-x-3">
                                    <FileImage className="h-8 w-8 text-blue-400" />
                                    <div>
                                      <h5 className="text-white font-medium">{doc.name}</h5>
                                      <p className="text-xs text-slate-400">
                                        {doc.uploaded_at ? format(new Date(doc.uploaded_at), 'dd/MM/yyyy HH:mm') : 'N/A'}
                                      </p>
                                    </div>
                                  </div>
                                  <button className="p-2 text-slate-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors">
                                    <Eye className="h-4 w-4" />
                                  </button>
                                </div>
                              </div>
                            ))
                          ) : (
                            <p className="text-slate-300 text-center py-8">No hay documentos subidos</p>
                          )}
                        </div>
                      )}
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
                <FileText className="h-16 w-16 text-slate-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">Selecciona un Paciente</h3>
                <p className="text-slate-300">Elige un paciente de la lista para ver su expediente médico completo</p>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MedicalRecords;

