import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocation, useSearchParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  FileText, Plus, Search, Calendar, 
  User, Activity, Pill, AlertCircle,
  Download, Upload, Edit, Eye, ArrowLeft,
  Heart, Thermometer, Wind, Droplet,
  FileCheck, Folder, ClipboardList,
  UserCircle, Clock, ChevronRight,
  Stethoscope, TestTube, Syringe,
  Shield, Hash, TrendingUp
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import medicalRecordService from '../../services/medicalRecordService';
import toast from 'react-hot-toast';

const MedicalRecordManager = ({ patientId: propPatientId }) => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPatientId, setSelectedPatientId] = useState(null);
  const queryClient = useQueryClient();

  // Obtener patientId de props o URL params
  const patientId = propPatientId || searchParams.get('patient');

  useEffect(() => {
    if (patientId) {
      setSelectedPatientId(patientId);
    }
  }, [patientId]);

  // Obtener expediente médico
  const { data: medicalRecord, isLoading, error } = useQuery({
    queryKey: ['medicalRecord', patientId],
    queryFn: () => medicalRecordService.getPatientRecord(patientId),
    enabled: !!patientId,
    retry: false, // No reintentar si es 404
    onError: (error) => {
      if (error.response?.status !== 404) {
        toast.error('Error al cargar el expediente médico');
      }
    }
  });

  // Mutation para actualizar expediente
  const updateRecordMutation = useMutation({
    mutationFn: (data) => medicalRecordService.updateRecord(patientId, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['medicalRecord', patientId]);
      toast.success('Expediente actualizado exitosamente');
    },
    onError: () => {
      toast.error('Error al actualizar expediente');
    },
  });

  const tabs = [
    { id: 'overview', label: 'Resumen General', icon: ClipboardList },
    { id: 'vitals', label: 'Signos Vitales', icon: Heart },
    { id: 'diagnoses', label: 'Diagnósticos', icon: Stethoscope },
    { id: 'prescriptions', label: 'Recetas', icon: Pill },
    { id: 'labs', label: 'Laboratorio', icon: TestTube },
    { id: 'documents', label: 'Documentos', icon: Folder },
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return <OverviewTab record={medicalRecord} />;
      case 'diagnoses':
        return <DiagnosesTab diagnoses={medicalRecord?.diagnoses} />;
      case 'prescriptions':
        return <PrescriptionsTab prescriptions={medicalRecord?.prescriptions} />;
      case 'labs':
        return <LabResultsTab labResults={medicalRecord?.lab_results} />;
      case 'documents':
        return <DocumentsTab documents={medicalRecord?.documents} patientId={patientId} />;
      case 'vitals':
        return <VitalSignsTab vitalSigns={medicalRecord?.vital_signs} />;
      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // Manejar cuando no existe expediente médico
  if (error?.response?.status === 404) {
    return (
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900"
      >
        <div className="max-w-4xl mx-auto p-6">
          <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 backdrop-blur-lg rounded-3xl shadow-2xl border border-white/10 p-8">
            {/* Header */}
            <div className="flex items-center space-x-4 mb-8">
              {searchParams.get('patient') && (
                <button
                  onClick={() => navigate('/appointments')}
                  className="p-3 bg-white/5 hover:bg-white/10 rounded-xl transition-all duration-300 group"
                  title="Volver a citas"
                >
                  <ArrowLeft className="h-5 w-5 text-gray-400 group-hover:text-white transition-colors" />
                </button>
              )}
              <div>
                <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                  Expediente Médico
                </h2>
                <p className="text-gray-400 mt-1">Sistema de Gestión Médica</p>
              </div>
            </div>
            
            {/* Content */}
            <div className="text-center py-16">
              <motion.div
                animate={{ 
                  scale: [1, 1.1, 1],
                  rotate: [0, 5, -5, 0]
                }}
                transition={{ 
                  duration: 2,
                  repeat: Infinity,
                  repeatDelay: 3
                }}
              >
                <FileText className="h-24 w-24 text-gray-600 mx-auto mb-6" />
              </motion.div>
              
              <h3 className="text-2xl font-semibold text-white mb-3">
                No existe expediente médico
              </h3>
              <p className="text-gray-400 mb-8 max-w-md mx-auto">
                Este paciente aún no tiene un expediente médico registrado. 
                Crea uno nuevo para comenzar a registrar su historial clínico.
              </p>
              
              <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  toast.info('La creación de expedientes estará disponible próximamente');
                }}
                className="px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-2xl 
                         hover:from-blue-600 hover:to-purple-700 transition-all duration-300 
                         flex items-center mx-auto shadow-lg hover:shadow-xl transform hover:-translate-y-1"
              >
                <Plus className="h-5 w-5 mr-2" />
                Crear Nuevo Expediente
              </motion.button>
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-6"
    >
      <div className="max-w-7xl mx-auto">
        {/* Modern Header */}
        <motion.div 
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 backdrop-blur-lg rounded-3xl shadow-2xl border border-white/10 p-6 mb-6"
        >
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              {searchParams.get('patient') && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => navigate('/appointments')}
                  className="p-3 bg-white/5 hover:bg-white/10 rounded-xl transition-all duration-300 group"
                >
                  <ArrowLeft className="h-5 w-5 text-gray-400 group-hover:text-white transition-colors" />
                </motion.button>
              )}
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                  Expediente Médico Electrónico
                </h1>
                <div className="flex items-center space-x-3 mt-2">
                  <div className="flex items-center space-x-2">
                    <UserCircle className="h-5 w-5 text-blue-400" />
                    <span className="text-gray-300 font-medium">
                      {medicalRecord?.patient?.name || 'Cargando...'}
                    </span>
                  </div>
                  <span className="text-gray-500">•</span>
                  <div className="flex items-center space-x-2">
                    <Hash className="h-4 w-4 text-purple-400" />
                    <span className="text-gray-400 text-sm">
                      {medicalRecord?.patient?.medical_record_number || 'N/A'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-5 py-2.5 bg-white/10 backdrop-blur-sm text-white rounded-xl hover:bg-white/20 transition-all duration-300 flex items-center border border-white/10"
              >
                <Download className="h-4 w-4 mr-2" />
                Exportar
              </motion.button>
              <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-5 py-2.5 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl hover:from-blue-600 hover:to-purple-700 transition-all duration-300 flex items-center shadow-lg"
              >
                <Edit className="h-4 w-4 mr-2" />
                Editar
              </motion.button>
            </div>
          </div>
        </motion.div>

        {/* Modern Tabs */}
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="bg-white/5 backdrop-blur-lg rounded-2xl shadow-xl border border-white/10 p-2 mb-6"
        >
          <div className="flex flex-wrap gap-2">
            {tabs.map((tab, index) => (
              <motion.button
                key={tab.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-3 rounded-xl flex items-center space-x-2 transition-all duration-300 ${
                  activeTab === tab.id
                    ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg'
                    : 'text-gray-400 hover:text-white hover:bg-white/10'
                }`}
              >
                <tab.icon className={`h-5 w-5 ${
                  activeTab === tab.id ? 'text-white' : ''
                }`} />
                <span className="font-medium">{tab.label}</span>
              </motion.button>
            ))}
          </div>
        </motion.div>

        {/* Tab Content with Animation */}
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
          className="bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-lg rounded-3xl shadow-2xl border border-white/10 p-6"
        >
          {renderTabContent()}
        </motion.div>
      </div>
    </motion.div>
  );
};

// Componente de pestaña de resumen
const OverviewTab = ({ record }) => (
  <motion.div 
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    className="space-y-6"
  >
    {/* Información básica con nuevo diseño */}
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {/* Tarjeta de Información Personal */}
      <motion.div 
        whileHover={{ scale: 1.02 }}
        className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-2xl p-6 border border-white/10 backdrop-blur-sm"
      >
        <div className="flex items-center space-x-3 mb-4">
          <div className="p-3 bg-blue-500/20 rounded-xl">
            <UserCircle className="h-6 w-6 text-blue-400" />
          </div>
          <h3 className="text-white font-semibold text-lg">Información Personal</h3>
        </div>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-gray-400 flex items-center space-x-2">
              <Calendar className="h-4 w-4" />
              <span>Edad</span>
            </span>
            <span className="text-white font-medium">{record?.patient?.age || '-'} años</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-400 flex items-center space-x-2">
              <Droplet className="h-4 w-4" />
              <span>Tipo de Sangre</span>
            </span>
            <span className="text-white font-medium bg-red-500/20 px-2 py-1 rounded">
              {record?.blood_type || 'No registrado'}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-400 flex items-center space-x-2">
              <Shield className="h-4 w-4" />
              <span>Alergias</span>
            </span>
            <span className={`font-medium px-2 py-1 rounded ${
              record?.allergies?.length > 0 
                ? 'text-yellow-300 bg-yellow-500/20' 
                : 'text-green-300 bg-green-500/20'
            }`}>
              {record?.allergies?.length || 0}
            </span>
          </div>
        </div>
      </motion.div>

      {/* Tarjeta de Última Visita */}
      <motion.div 
        whileHover={{ scale: 1.02 }}
        className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-2xl p-6 border border-white/10 backdrop-blur-sm"
      >
        <div className="flex items-center space-x-3 mb-4">
          <div className="p-3 bg-purple-500/20 rounded-xl">
            <Clock className="h-6 w-6 text-purple-400" />
          </div>
          <h3 className="text-white font-semibold text-lg">Última Visita</h3>
        </div>
        <div className="space-y-3">
          <div>
            <span className="text-gray-400 text-sm">Fecha</span>
            <p className="text-white font-medium text-lg">
              {record?.last_visit ? 
                format(new Date(record.last_visit), 'dd MMMM yyyy', { locale: es }) : 
                'Sin visitas registradas'}
            </p>
          </div>
          <div>
            <span className="text-gray-400 text-sm">Motivo de consulta</span>
            <p className="text-white">
              {record?.last_visit_reason || 'No especificado'}
            </p>
          </div>
        </div>
      </motion.div>

      {/* Tarjeta de Estadísticas Rápidas */}
      <motion.div 
        whileHover={{ scale: 1.02 }}
        className="bg-gradient-to-br from-green-500/10 to-blue-500/10 rounded-2xl p-6 border border-white/10 backdrop-blur-sm"
      >
        <div className="flex items-center space-x-3 mb-4">
          <div className="p-3 bg-green-500/20 rounded-xl">
            <TrendingUp className="h-6 w-6 text-green-400" />
          </div>
          <h3 className="text-white font-semibold text-lg">Resumen Clínico</h3>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-white">
              {record?.total_visits || 0}
            </p>
            <span className="text-gray-400 text-sm">Visitas totales</span>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-white">
              {record?.active_prescriptions || 0}
            </p>
            <span className="text-gray-400 text-sm">Recetas activas</span>
          </div>
        </div>
      </motion.div>
    </div>

    {/* Condiciones Activas con nuevo diseño */}
    <motion.div 
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.2 }}
      className="bg-gradient-to-br from-orange-500/10 to-red-500/10 rounded-2xl p-6 border border-white/10 backdrop-blur-sm"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-orange-500/20 rounded-xl">
            <AlertCircle className="h-6 w-6 text-orange-400" />
          </div>
          <h3 className="text-white font-semibold text-lg">Condiciones Activas</h3>
        </div>
        <span className="text-sm text-gray-400">
          {record?.active_conditions?.length || 0} condición(es)
        </span>
      </div>
      
      {record?.active_conditions?.length > 0 ? (
        <div className="space-y-3">
          {record.active_conditions.map((condition, index) => (
            <motion.div 
              key={index}
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: index * 0.1 }}
              className="flex items-center justify-between p-4 bg-white/5 rounded-xl hover:bg-white/10 transition-colors"
            >
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-orange-400 rounded-full"></div>
                <span className="text-white font-medium">{condition.name}</span>
              </div>
              <span className="text-sm text-gray-400 bg-white/5 px-3 py-1 rounded-lg">
                {format(new Date(condition.diagnosed_date), 'MMM yyyy', { locale: es })}
              </span>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8">
          <Shield className="h-12 w-12 text-gray-600 mx-auto mb-3" />
          <p className="text-gray-400">No hay condiciones activas registradas</p>
        </div>
      )}
    </motion.div>
  </motion.div>
);

// Componente de pestaña de diagnósticos
const DiagnosesTab = ({ diagnoses = [] }) => (
  <div className="space-y-4">
    {diagnoses.length > 0 ? (
      diagnoses.map((diagnosis) => (
        <motion.div
          key={diagnosis.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/5 rounded-xl p-4 border border-white/10"
        >
          <div className="flex justify-between items-start mb-2">
            <div>
              <h4 className="text-white font-medium">{diagnosis.diagnosis}</h4>
              <p className="text-sm text-gray-400">CIE-10: {diagnosis.icd10_code}</p>
            </div>
            <span className="text-sm text-gray-400">
              {format(new Date(diagnosis.date), 'dd/MM/yyyy')}
            </span>
          </div>
          <p className="text-gray-300 text-sm">{diagnosis.notes}</p>
          <div className="mt-2 flex items-center">
            <User className="h-4 w-4 text-gray-400 mr-1" />
            <span className="text-sm text-gray-400">Dr. {diagnosis.doctor_name}</span>
          </div>
        </motion.div>
      ))
    ) : (
      <p className="text-center text-gray-400 py-8">No hay diagnósticos registrados</p>
    )}
  </div>
);

// Componente de pestaña de recetas
const PrescriptionsTab = ({ prescriptions = [] }) => (
  <div className="space-y-4">
    {prescriptions.length > 0 ? (
      prescriptions.map((prescription) => (
        <motion.div
          key={prescription.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/5 rounded-xl p-4 border border-white/10"
        >
          <div className="flex justify-between items-start mb-3">
            <h4 className="text-white font-medium">Receta #{prescription.id}</h4>
            <span className={`px-2 py-1 rounded text-xs ${
              prescription.status === 'active' 
                ? 'bg-green-500/20 text-green-300'
                : 'bg-gray-500/20 text-gray-300'
            }`}>
              {prescription.status === 'active' ? 'Activa' : 'Completada'}
            </span>
          </div>
          <div className="space-y-2">
            {prescription.medications.map((med, index) => (
              <div key={index} className="flex justify-between items-center">
                <div>
                  <p className="text-white">{med.name}</p>
                  <p className="text-sm text-gray-400">
                    {med.dosage} - {med.frequency} por {med.duration}
                  </p>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-3 pt-3 border-t border-white/10">
            <p className="text-sm text-gray-400">
              Prescrito el {format(new Date(prescription.date), 'dd/MM/yyyy')} 
              por Dr. {prescription.doctor_name}
            </p>
          </div>
        </motion.div>
      ))
    ) : (
      <p className="text-center text-gray-400 py-8">No hay recetas registradas</p>
    )}
  </div>
);

// Componente de pestaña de resultados de laboratorio
const LabResultsTab = ({ labResults = [] }) => (
  <div className="space-y-4">
    {labResults.length > 0 ? (
      labResults.map((result) => (
        <motion.div
          key={result.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/5 rounded-xl p-4 border border-white/10"
        >
          <div className="flex justify-between items-start mb-3">
            <div>
              <h4 className="text-white font-medium">{result.test_name}</h4>
              <p className="text-sm text-gray-400">Orden #{result.order_number}</p>
            </div>
            <span className={`px-2 py-1 rounded text-xs ${
              result.status === 'completed' 
                ? 'bg-green-500/20 text-green-300'
                : result.status === 'pending'
                ? 'bg-yellow-500/20 text-yellow-300'
                : 'bg-gray-500/20 text-gray-300'
            }`}>
              {result.status === 'completed' ? 'Completado' : 
               result.status === 'pending' ? 'Pendiente' : 'En proceso'}
            </span>
          </div>
          {result.results && (
            <div className="space-y-2">
              {result.results.map((item, index) => (
                <div key={index} className="flex justify-between items-center py-1">
                  <span className="text-gray-300">{item.parameter}</span>
                  <div className="flex items-center space-x-2">
                    <span className="text-white font-medium">{item.value} {item.unit}</span>
                    {item.is_abnormal && (
                      <AlertCircle className="h-4 w-4 text-red-400" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
          <div className="mt-3 pt-3 border-t border-white/10">
            <p className="text-sm text-gray-400">
              Solicitado el {format(new Date(result.requested_date), 'dd/MM/yyyy')}
              {result.completed_date && (
                <> - Completado el {format(new Date(result.completed_date), 'dd/MM/yyyy')}</>
              )}
            </p>
          </div>
        </motion.div>
      ))
    ) : (
      <p className="text-center text-gray-400 py-8">No hay resultados de laboratorio</p>
    )}
  </div>
);

// Componente de pestaña de documentos
const DocumentsTab = ({ documents = [], patientId }) => {
  const [uploading, setUploading] = useState(false);
  const queryClient = useQueryClient();

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('patient_id', patientId);

    try {
      await medicalRecordService.uploadDocument(formData);
      queryClient.invalidateQueries(['medicalRecord', patientId]);
      toast.success('Documento cargado exitosamente');
    } catch (error) {
      toast.error('Error al cargar el documento');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end mb-4">
        <label className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition cursor-pointer flex items-center">
          <Upload className="h-4 w-4 mr-2" />
          {uploading ? 'Cargando...' : 'Cargar Documento'}
          <input
            type="file"
            onChange={handleFileUpload}
            disabled={uploading}
            className="hidden"
            accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
          />
        </label>
      </div>

      {documents.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {documents.map((doc) => (
            <motion.div
              key={doc.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white/5 rounded-xl p-4 border border-white/10 hover:bg-white/10 transition-colors"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center space-x-3">
                  <FileText className="h-8 w-8 text-blue-400" />
                  <div>
                    <h4 className="text-white font-medium">{doc.name}</h4>
                    <p className="text-sm text-gray-400">{doc.type}</p>
                  </div>
                </div>
                <button className="text-gray-400 hover:text-white transition">
                  <Eye className="h-5 w-5" />
                </button>
              </div>
              <div className="text-xs text-gray-400 mt-2">
                <p>Cargado el {format(new Date(doc.uploaded_date), 'dd/MM/yyyy HH:mm')}</p>
                <p>Por: {doc.uploaded_by}</p>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <p className="text-center text-gray-400 py-8">No hay documentos cargados</p>
      )}
    </div>
  );
};

// Componente de pestaña de signos vitales
const VitalSignsTab = ({ vitalSigns = [] }) => {
  const latestVitals = vitalSigns[0] || {};
  
  const vitalItems = [
    { label: 'Presión Arterial', value: latestVitals.blood_pressure, unit: 'mmHg', icon: Activity },
    { label: 'Frecuencia Cardíaca', value: latestVitals.heart_rate, unit: 'bpm', icon: Activity },
    { label: 'Temperatura', value: latestVitals.temperature, unit: '°C', icon: Activity },
    { label: 'Saturación O2', value: latestVitals.oxygen_saturation, unit: '%', icon: Activity },
    { label: 'Frecuencia Respiratoria', value: latestVitals.respiratory_rate, unit: 'rpm', icon: Activity },
    { label: 'Peso', value: latestVitals.weight, unit: 'kg', icon: Activity },
  ];

  return (
    <div className="space-y-6">
      {/* Últimos signos vitales */}
      <div>
        <h3 className="text-white font-semibold mb-4">Últimos Signos Vitales</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {vitalItems.map((item, index) => (
            <div key={index} className="bg-white/5 rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-400">{item.label}</span>
                <item.icon className="h-4 w-4 text-gray-400" />
              </div>
              <p className="text-2xl font-bold text-white">
                {item.value || '-'} 
                <span className="text-sm font-normal text-gray-400 ml-1">{item.unit}</span>
              </p>
            </div>
          ))}
        </div>
        {latestVitals.recorded_at && (
          <p className="text-sm text-gray-400 mt-4">
            Registrado el {format(new Date(latestVitals.recorded_at), 'dd/MM/yyyy HH:mm')}
          </p>
        )}
      </div>

      {/* Historial de signos vitales */}
      <div>
        <h3 className="text-white font-semibold mb-4">Historial</h3>
        {vitalSigns.length > 0 ? (
          <div className="space-y-2">
            {vitalSigns.map((vital) => (
              <div key={vital.id} className="bg-white/5 rounded-lg p-3 flex justify-between items-center">
                <div className="text-sm">
                  <p className="text-white">
                    PA: {vital.blood_pressure} | FC: {vital.heart_rate} | T°: {vital.temperature}°C
                  </p>
                  <p className="text-gray-400">
                    {format(new Date(vital.recorded_at), 'dd/MM/yyyy HH:mm')}
                  </p>
                </div>
                <button className="text-blue-400 hover:text-blue-300">
                  <Eye className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-center text-gray-400 py-4">No hay registros de signos vitales</p>
        )}
      </div>
    </div>
  );
};

export default MedicalRecordManager;
