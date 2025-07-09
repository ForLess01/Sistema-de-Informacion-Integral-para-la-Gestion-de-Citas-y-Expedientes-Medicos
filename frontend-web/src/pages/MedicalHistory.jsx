import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import medicalRecordService from '../services/medicalRecordService';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Link } from 'react-router-dom';
import { ChevronLeft, FileText, Calendar, User, Activity, Download, Pill, TestTube, AlertCircle } from 'lucide-react';

const MedicalHistory = () => {
  const [activeTab, setActiveTab] = useState('timeline');

  // Queries para obtener diferentes tipos de datos
  const { data: medicalRecord, isLoading: loadingRecord } = useQuery({
    queryKey: ['medicalRecord'],
    queryFn: medicalRecordService.getMedicalRecord,
  });

  const { data: diagnoses, isLoading: loadingDiagnoses } = useQuery({
    queryKey: ['diagnoses'],
    queryFn: medicalRecordService.getDiagnoses,
  });

  const { data: prescriptions, isLoading: loadingPrescriptions } = useQuery({
    queryKey: ['prescriptions'],
    queryFn: medicalRecordService.getPrescriptions,
  });

  const { data: labResults, isLoading: loadingLabResults } = useQuery({
    queryKey: ['labResults'],
    queryFn: medicalRecordService.getLabResults,
  });

  const { data: allergies } = useQuery({
    queryKey: ['allergies'],
    queryFn: medicalRecordService.getAllergies,
  });

  const { data: timeline, isLoading: loadingTimeline } = useQuery({
    queryKey: ['medicalTimeline'],
    queryFn: medicalRecordService.getMedicalTimeline,
  });

  const isLoading = loadingRecord || loadingDiagnoses || loadingPrescriptions || loadingLabResults || loadingTimeline;

  const tabs = [
    { id: 'timeline', label: 'Línea de Tiempo', icon: Activity },
    { id: 'diagnoses', label: 'Diagnósticos', icon: FileText },
    { id: 'prescriptions', label: 'Medicamentos', icon: Pill },
    { id: 'labs', label: 'Exámenes', icon: TestTube },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      {/* Header */}
      <header className="backdrop-blur-lg bg-white/10 border-b border-white/20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Link to="/dashboard" className="text-white hover:text-blue-400 transition-colors">
                <ChevronLeft className="h-6 w-6" />
              </Link>
              <h1 className="text-xl font-bold text-white">Historial Médico</h1>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto p-6">
        {/* Información del paciente y alergias */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="backdrop-blur-lg bg-white/10 rounded-2xl p-6 border border-white/20 mb-6"
        >
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
            <div>
              <h2 className="text-2xl font-bold text-white mb-2">{medicalRecord?.patient_name || 'Paciente'}</h2>
              <p className="text-gray-400">Edad: {medicalRecord?.age || 'N/A'} años | Tipo de sangre: {medicalRecord?.blood_type || 'N/A'}</p>
            </div>
            {allergies?.length > 0 && (
              <div className="mt-4 md:mt-0">
                <div className="flex items-center space-x-2 text-red-400">
                  <AlertCircle className="h-5 w-5" />
                  <span className="font-medium">Alergias:</span>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {allergies.map((allergy, index) => (
                    <span key={index} className="px-3 py-1 bg-red-500/20 text-red-300 rounded-full text-sm">
                      {allergy.name}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </motion.div>

        {/* Tabs */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="mb-6"
        >
          <div className="flex flex-wrap gap-2">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all ${
                    activeTab === tab.id
                      ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white'
                      : 'bg-white/10 text-gray-300 hover:bg-white/20'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </motion.div>

        {/* Contenido según tab activa */}
        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto"></div>
          </div>
        ) : (
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            {activeTab === 'timeline' && (
              <div className="space-y-4">
                {timeline?.map((event, index) => (
                  <div key={index} className="backdrop-blur-lg bg-white/10 rounded-2xl p-6 border border-white/20">
                    <div className="flex items-start space-x-4">
                      <div className="flex-shrink-0">
                        <div className="h-12 w-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                          <Calendar className="h-6 w-6 text-white" />
                        </div>
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-white">{event.title}</h3>
                        <p className="text-gray-400 text-sm mt-1">
                          {format(new Date(event.date), "d 'de' MMMM 'de' yyyy", { locale: es })}
                        </p>
                        <p className="text-gray-300 mt-2">{event.description}</p>
                        {event.doctor && (
                          <p className="text-gray-400 text-sm mt-2">
                            <User className="inline h-4 w-4 mr-1" />
                            Dr. {event.doctor}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'diagnoses' && (
              <div className="grid gap-4">
                {diagnoses?.map((diagnosis, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="backdrop-blur-lg bg-white/10 rounded-2xl p-6 border border-white/20"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-lg font-semibold text-white">{diagnosis.condition}</h3>
                        <p className="text-gray-400 text-sm mt-1">
                          {format(new Date(diagnosis.date), "d 'de' MMMM 'de' yyyy", { locale: es })}
                        </p>
                        <p className="text-gray-300 mt-2">{diagnosis.description}</p>
                        <p className="text-gray-400 text-sm mt-2">Dr. {diagnosis.doctor_name}</p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        diagnosis.status === 'active' 
                          ? 'bg-green-500/20 text-green-300' 
                          : 'bg-gray-500/20 text-gray-300'
                      }`}>
                        {diagnosis.status === 'active' ? 'Activo' : 'Resuelto'}
                      </span>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}

            {activeTab === 'prescriptions' && (
              <div className="grid gap-4">
                {prescriptions?.map((prescription, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="backdrop-blur-lg bg-white/10 rounded-2xl p-6 border border-white/20"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-white">{prescription.medication_name}</h3>
                        <p className="text-gray-400 text-sm mt-1">
                          {prescription.dosage} - {prescription.frequency}
                        </p>
                        <p className="text-gray-300 mt-2">{prescription.instructions}</p>
                        <div className="flex items-center space-x-4 mt-3">
                          <p className="text-gray-400 text-sm">
                            Desde: {format(new Date(prescription.start_date), "d/MM/yyyy", { locale: es })}
                          </p>
                          <p className="text-gray-400 text-sm">
                            Hasta: {format(new Date(prescription.end_date), "d/MM/yyyy", { locale: es })}
                          </p>
                        </div>
                      </div>
                      <button className="ml-4 p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors">
                        <Download className="h-5 w-5 text-white" />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}

            {activeTab === 'labs' && (
              <div className="grid gap-4">
                {labResults?.map((lab, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="backdrop-blur-lg bg-white/10 rounded-2xl p-6 border border-white/20"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-white">{lab.test_name}</h3>
                        <p className="text-gray-400 text-sm mt-1">
                          {format(new Date(lab.date), "d 'de' MMMM 'de' yyyy", { locale: es })}
                        </p>
                        <p className="text-gray-300 mt-2">{lab.result_summary}</p>
                        <p className="text-gray-400 text-sm mt-2">Ordenado por: Dr. {lab.doctor_name}</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          lab.status === 'completed' 
                            ? 'bg-green-500/20 text-green-300' 
                            : 'bg-yellow-500/20 text-yellow-300'
                        }`}>
                          {lab.status === 'completed' ? 'Completado' : 'Pendiente'}
                        </span>
                        {lab.status === 'completed' && (
                          <button className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors">
                            <Download className="h-5 w-5 text-white" />
                          </button>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default MedicalHistory;
