import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  AlertCircle, Clock, User, Activity, CheckCircle, Heart, 
  Thermometer, Shield, List, AlertTriangle, X, Save,
  ArrowLeft, Stethoscope, Brain, Eye, RefreshCw,
  Calendar, Phone, MapPin, FileText
} from 'lucide-react';
import { format, differenceInMinutes } from 'date-fns';
import { es } from 'date-fns/locale';
import emergencyService from '../../services/emergencyService';

const TriagePage = () => {
  const queryClient = useQueryClient();
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [filterLevel, setFilterLevel] = useState('all');
  const [sortBy, setSortBy] = useState('wait_time'); // wait_time, triage_level, arrival_time
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Obtener pacientes en espera de triaje
  const { data: patientsData, isLoading, refetch } = useQuery({
    queryKey: ['emergencyPatientsForTriage', filterLevel],
    queryFn: () => emergencyService.getEmergencyPatients({
      status: 'waiting',
      triage_level: filterLevel === 'all' ? undefined : filterLevel
    }),
    refetchInterval: 30000 // Auto-refresh every 30 seconds
  });

  const patients = patientsData?.results || [];

  const [triageData, setTriageData] = useState({
    triage_level: 3,
    vital_signs: {
      blood_pressure_systolic: '',
      blood_pressure_diastolic: '',
      heart_rate: '',
      respiratory_rate: '',
      temperature: '',
      oxygen_saturation: '',
      glucose_level: ''
    },
    consciousness_level: 'alert',
    pain_scale: 0,
    notes: '',
    assessment_time: new Date().toISOString()
  });

  const updateTriageMutation = useMutation({
    mutationFn: ({ patientId, data }) => emergencyService.updateTriage(patientId, data),
    onSuccess: (data) => {
      setSuccessMessage(`Triaje actualizado exitosamente para ${data.patient_name}`);
      queryClient.invalidateQueries(['emergencyPatientsForTriage']);
      queryClient.invalidateQueries(['emergencyPatients']);
      setSelectedPatient(null);
      resetTriageData();
      setTimeout(() => setSuccessMessage(''), 3000);
    },
    onError: (error) => {
      setErrorMessage(
        error.response?.data?.detail || 
        error.response?.data?.message || 
        'Error al actualizar el triaje'
      );
      setTimeout(() => setErrorMessage(''), 3000);
    },
  });

  const resetTriageData = () => {
    setTriageData({
      triage_level: 3,
      vital_signs: {
        blood_pressure_systolic: '',
        blood_pressure_diastolic: '',
        heart_rate: '',
        respiratory_rate: '',
        temperature: '',
        oxygen_saturation: '',
        glucose_level: ''
      },
      consciousness_level: 'alert',
      pain_scale: 0,
      notes: '',
      assessment_time: new Date().toISOString()
    });
  };

  // Load existing triage data when patient is selected
  useEffect(() => {
    if (selectedPatient && selectedPatient.triage) {
      setTriageData({
        triage_level: selectedPatient.triage.triage_level || 3,
        vital_signs: selectedPatient.triage.vital_signs || {
          blood_pressure_systolic: '',
          blood_pressure_diastolic: '',
          heart_rate: '',
          respiratory_rate: '',
          temperature: '',
          oxygen_saturation: '',
          glucose_level: ''
        },
        consciousness_level: selectedPatient.triage.consciousness_level || 'alert',
        pain_scale: selectedPatient.triage.pain_scale || 0,
        notes: selectedPatient.triage.notes || '',
        assessment_time: new Date().toISOString()
      });
    } else if (selectedPatient) {
      resetTriageData();
    }
  }, [selectedPatient]);

  const handleTriageChange = (field, value) => {
    if (field.startsWith('vital_signs.')) {
      const vitalField = field.replace('vital_signs.', '');
      setTriageData(prev => ({
        ...prev,
        vital_signs: { ...prev.vital_signs, [vitalField]: value }
      }));
    } else {
      setTriageData(prev => ({ ...prev, [field]: value }));
    }
  };

  const handleSubmitTriage = () => {
    if (!selectedPatient) return;
    updateTriageMutation.mutate({
      patientId: selectedPatient.id,
      data: triageData
    });
  };

  const getTriageColor = (level) => {
    const colors = {
      1: 'bg-red-500',
      2: 'bg-orange-500',
      3: 'bg-yellow-500',
      4: 'bg-green-500',
      5: 'bg-blue-500'
    };
    return colors[level] || 'bg-gray-500';
  };

  const getTriageLabel = (level) => {
    const labels = {
      1: 'Resucitación',
      2: 'Emergencia',
      3: 'Urgente',
      4: 'Menos Urgente',
      5: 'No Urgente'
    };
    return labels[level] || 'Sin clasificar';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-900 via-red-800 to-indigo-900 p-6">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex justify-between items-center mb-8"
        >
          <h1 className="text-3xl font-bold text-white">Página de Triaje</h1>
          <p className="text-white opacity-75">Evaluación y clasificación de pacientes</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="backdrop-blur-lg bg-white/10 rounded-2xl border border-white/10 overflow-hidden"
        >
          {isLoading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
            </div>
          ) : !patients || patients.length === 0 ? (
            <div className="text-center py-12">
              <AlertTriangle className="h-16 w-16 text-red-400 mx-auto mb-4" />
              <h3 className="text-xl font-medium text-white mb-2">No hay pacientes en espera de triaje</h3>
              <p className="text-red-200">La lista está vacía.</p>
            </div>
          ) : selectedPatient ? (
            <div className="p-6">
              <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
                <Heart className="h-5 w-5 mr-2 text-red-400" />
                Datos de Triaje
              </h3>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Nivel de Triaje
                  </label>
                  <select
                    value={triageData.triage_level}
                    onChange={(e) => handleTriageChange('triage_level', e.target.value)}
                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
                  >
                    {[1, 2, 3, 4, 5].map((level) => (
                      <option key={level} value={level} className={getTriageColor(level)}>
                        {getTriageLabel(level)}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Signos Vitales
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <input
                      type="number"
                      placeholder="T.A. Sistólica"
                      value={triageData.vital_signs.blood_pressure_systolic}
                      onChange={(e) => handleTriageChange('vital_signs.blood_pressure_systolic', e.target.value)}
                      className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
                    />
                    <input
                      type="number"
                      placeholder="T.A. Diastólica"
                      value={triageData.vital_signs.blood_pressure_diastolic}
                      onChange={(e) => handleTriageChange('vital_signs.blood_pressure_diastolic', e.target.value)}
                      className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
                    />
                    <input
                      type="number"
                      placeholder="Frecuencia Cardíaca"
                      value={triageData.vital_signs.heart_rate}
                      onChange={(e) => handleTriageChange('vital_signs.heart_rate', e.target.value)}
                      className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
                    />
                    <input
                      type="number"
                      placeholder="Respiración"
                      value={triageData.vital_signs.respiratory_rate}
                      onChange={(e) => handleTriageChange('vital_signs.respiratory_rate', e.target.value)}
                      className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
                    />
                    <input
                      type="number"
                      placeholder="Temperatura"
                      value={triageData.vital_signs.temperature}
                      onChange={(e) => handleTriageChange('vital_signs.temperature', e.target.value)}
                      className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
                    />
                    <input
                      type="number"
                      placeholder="Oxígeno"
                      value={triageData.vital_signs.oxygen_saturation}
                      onChange={(e) => handleTriageChange('vital_signs.oxygen_saturation', e.target.value)}
                      className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
                    />
                    <input
                      type="number"
                      placeholder="Glucosa"
                      value={triageData.vital_signs.glucose_level}
                      onChange={(e) => handleTriageChange('vital_signs.glucose_level', e.target.value)}
                      className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Nivel de Conciencia
                  </label>
                  <select
                    value={triageData.consciousness_level}
                    onChange={(e) => handleTriageChange('consciousness_level', e.target.value)}
                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
                  >
                    <option value="alert">Alerta</option>
                    <option value="verbal">Responde a voz</option>
                    <option value="pain">Responde a dolor</option>
                    <option value="unresponsive">No responde</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Escala de Dolor (0-10)
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="10"
                    value={triageData.pain_scale}
                    onChange={(e) => handleTriageChange('pain_scale', e.target.value)}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-red-200 mt-1">
                    <span>0</span>
                    <span className="font-medium">{triageData.pain_scale}</span>
                    <span>10</span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Notas Adicionales
                  </label>
                  <textarea
                    rows="3"
                    value={triageData.notes}
                    onChange={(e) => handleTriageChange('notes', e.target.value)}
                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
                  ></textarea>
                </div>

                <div className="flex justify-end">
                  <button
                    onClick={handleSubmitTriage}
                    className="px-6 py-3 bg-green-500 text-white font-medium rounded-lg hover:bg-green-600"
                  >
                    Actualizar Triaje
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <ul className="divide-y divide-white/10">
              {patients?.map((patient) => (
                <li
                  key={patient.id}
                  className="p-4 hover:bg-red-500/10 cursor-pointer"
                  onClick={() => setSelectedPatient(patient)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className={`w-10 h-10 rounded-full ${getTriageColor(patient.triage_level)} flex items-center justify-center text-white font-bold`}>
                        {getTriageLabel(patient.triage_level)[0]}
                      </div>
                      <div>
                        <h4 className="text-lg font-medium text-white">{patient.name}</h4>
                        <p className="text-red-200 text-sm">Tiempo de espera: {patient.wait_time} min</p>
                      </div>
                    </div>
                    <CheckCircle className="h-5 w-5 text-green-400" />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default TriagePage;

