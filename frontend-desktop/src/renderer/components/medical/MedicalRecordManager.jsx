import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { 
  FileText, Plus, Search, Calendar, 
  User, Activity, Pill, AlertCircle,
  Download, Upload, Edit, Eye
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import medicalRecordService from '../../services/medicalRecordService';
import toast from 'react-hot-toast';

const MedicalRecordManager = ({ patientId }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const queryClient = useQueryClient();

  // Obtener expediente médico
  const { data: medicalRecord, isLoading } = useQuery({
    queryKey: ['medicalRecord', patientId],
    queryFn: () => medicalRecordService.getPatientRecord(patientId),
    enabled: !!patientId,
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
    { id: 'overview', label: 'Resumen', icon: FileText },
    { id: 'diagnoses', label: 'Diagnósticos', icon: Activity },
    { id: 'prescriptions', label: 'Recetas', icon: Pill },
    { id: 'labs', label: 'Laboratorio', icon: Activity },
    { id: 'documents', label: 'Documentos', icon: FileText },
    { id: 'vitals', label: 'Signos Vitales', icon: Activity },
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

  return (
    <div className="bg-white/10 rounded-2xl border border-white/20 p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-white">Expediente Médico</h2>
          <p className="text-gray-400">
            {medicalRecord?.patient?.name} - {medicalRecord?.patient?.medical_record_number}
          </p>
        </div>
        <div className="flex space-x-2">
          <button className="px-4 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition flex items-center">
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </button>
          <button className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition flex items-center">
            <Edit className="h-4 w-4 mr-2" />
            Editar
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 mb-6 border-b border-white/20">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 flex items-center space-x-2 transition-colors ${
              activeTab === tab.id
                ? 'text-blue-400 border-b-2 border-blue-400'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <tab.icon className="h-4 w-4" />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="mt-6">
        {renderTabContent()}
      </div>
    </div>
  );
};

// Componente de pestaña de resumen
const OverviewTab = ({ record }) => (
  <div className="space-y-6">
    {/* Información básica */}
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="bg-white/5 rounded-xl p-4">
        <h3 className="text-white font-semibold mb-3">Información Personal</h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-400">Edad:</span>
            <span className="text-white">{record?.patient?.age} años</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Tipo de Sangre:</span>
            <span className="text-white">{record?.blood_type || 'No registrado'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Alergias:</span>
            <span className="text-white">{record?.allergies?.length || 0}</span>
          </div>
        </div>
      </div>

      <div className="bg-white/5 rounded-xl p-4">
        <h3 className="text-white font-semibold mb-3">Última Visita</h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-400">Fecha:</span>
            <span className="text-white">
              {record?.last_visit ? 
                format(new Date(record.last_visit), 'dd/MM/yyyy') : 
                'Sin visitas'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Motivo:</span>
            <span className="text-white">{record?.last_visit_reason || '-'}</span>
          </div>
        </div>
      </div>
    </div>

    {/* Resumen de condiciones */}
    <div className="bg-white/5 rounded-xl p-4">
      <h3 className="text-white font-semibold mb-3">Condiciones Activas</h3>
      {record?.active_conditions?.length > 0 ? (
        <div className="space-y-2">
          {record.active_conditions.map((condition, index) => (
            <div key={index} className="flex items-center justify-between p-2 bg-white/5 rounded">
              <span className="text-white">{condition.name}</span>
              <span className="text-xs text-gray-400">
                Desde {format(new Date(condition.diagnosed_date), 'MM/yyyy')}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-gray-400">No hay condiciones activas registradas</p>
      )}
    </div>
  </div>
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
