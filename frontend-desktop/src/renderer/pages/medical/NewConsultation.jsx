import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { 
  Plus, Save, Search, User, Calendar, 
  Stethoscope, FileText, AlertCircle, Pill,
  Clock, Activity, Heart, CheckCircle, X,
  Trash2, Edit, ArrowLeft, ArrowRight
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import patientService from '../../services/patientService';
import medicalRecordService from '../../services/medicalRecordService';

const NewConsultation = () => {
  const navigate = useNavigate();
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [consultationData, setConsultationData] = useState({
    chiefComplaint: '',
    currentIllnessHistory: '',
    physicalExamination: '',
    diagnosis: '',
    treatmentPlan: '',
    notes: '',
    vitalSigns: {
      bloodPressure: '',
      heartRate: '',
      temperature: '',
      respiratoryRate: '',
      weight: '',
      height: ''
    },
    prescriptions: []
  });
  const [newPrescription, setNewPrescription] = useState({
    medication: '',
    dosage: '',
    frequency: '',
    duration: '',
    instructions: ''
  });
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  const queryClient = useQueryClient();

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

  // Mutation para crear consulta completa
  const createConsultationMutation = useMutation({
    mutationFn: (data) => medicalRecordService.createMedicalRecord(selectedPatientId, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['consultations']);
      queryClient.invalidateQueries(['patientHistory', selectedPatientId]);
    },
  });

  const patients = patientsData?.results || [];

  const handleInputChange = (field, value) => {
    setConsultationData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleVitalSignChange = (field, value) => {
    setConsultationData(prev => ({
      ...prev,
      vitalSigns: {
        ...prev.vitalSigns,
        [field]: value
      }
    }));
  };

  const handleAddPrescription = () => {
    if (newPrescription.medication && newPrescription.dosage) {
      setConsultationData(prev => ({
        ...prev,
        prescriptions: [...prev.prescriptions, { ...newPrescription, id: Date.now() }]
      }));
      setNewPrescription({
        medication: '',
        dosage: '',
        frequency: '',
        duration: '',
        instructions: ''
      });
    }
  };

  const handleRemovePrescription = (id) => {
    setConsultationData(prev => ({
      ...prev,
      prescriptions: prev.prescriptions.filter(p => p.id !== id)
    }));
  };

  const handleSaveConsultation = async () => {
    if (!selectedPatientId) {
      toast.error('Por favor selecciona un paciente');
      return;
    }

    if (!consultationData.chiefComplaint) {
      toast.error('Por favor ingresa el motivo de consulta');
      setCurrentStep(3);
      return;
    }

    if (!consultationData.diagnosis) {
      toast.error('Por favor ingresa un diagnóstico');
      setCurrentStep(4);
      return;
    }

    setIsLoading(true);
    const toastId = toast.loading('Guardando consulta...');

    try {
      // Crear el registro médico completo
      const medicalRecordData = {
        description: consultationData.chiefComplaint,
        diagnosis: consultationData.diagnosis,
        treatment: consultationData.treatmentPlan,
        notes: `Motivo de consulta: ${consultationData.chiefComplaint}\n\n` +
               `Historia actual: ${consultationData.currentIllnessHistory}\n\n` +
               `Examen físico: ${consultationData.physicalExamination}\n\n` +
               `Notas adicionales: ${consultationData.notes}`,
        record_date: new Date().toISOString().split('T')[0] // Solo la fecha
      };

      await createConsultationMutation.mutateAsync(medicalRecordData);

      // Resetear formulario
      setConsultationData({
        chiefComplaint: '',
        currentIllnessHistory: '',
        physicalExamination: '',
        diagnosis: '',
        treatmentPlan: '',
        notes: '',
        vitalSigns: {
          bloodPressure: '',
          heartRate: '',
          temperature: '',
          respiratoryRate: '',
          weight: '',
          height: ''
        },
        prescriptions: []
      });
      setSelectedPatientId('');
      setCurrentStep(1);

      toast.success('Consulta guardada exitosamente', { id: toastId });
      
      // Redirigir después de 2 segundos
      setTimeout(() => {
        navigate('/consultations');
      }, 2000);

    } catch (error) {
      console.error('Error saving consultation:', error);
      toast.error(
        error.response?.data?.detail || 
        error.response?.data?.message || 
        'Error al guardar la consulta',
        { id: toastId }
      );
    } finally {
      setIsLoading(false);
    }
  };

  const steps = [
    { id: 1, name: 'Paciente', icon: User },
    { id: 2, name: 'Signos Vitales', icon: Activity },
    { id: 3, name: 'Examen Físico', icon: Stethoscope },
    { id: 4, name: 'Diagnóstico', icon: FileText },
    { id: 5, name: 'Recetas', icon: Pill },
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
              Nueva Consulta Médica
            </h1>
            <p className="text-slate-200">
              {format(new Date(), "EEEE, d 'de' MMMM 'de' yyyy", { locale: es })}
            </p>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={handleSaveConsultation}
              disabled={!selectedPatientId || createConsultationMutation.isLoading}
              className="bg-gradient-to-r from-green-500 to-green-600 text-white px-6 py-3 rounded-xl font-medium hover:from-green-600 hover:to-green-700 transition duration-200 flex items-center disabled:opacity-50"
            >
              <Save className="h-5 w-5 mr-2" />
              Guardar Consulta
            </button>
          </div>
        </motion.div>

        {/* Progress Steps */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="backdrop-blur-lg bg-white/10 rounded-2xl p-6 border border-white/20 mb-6"
        >
          <div className="flex items-center justify-between">
            {steps.map((step) => (
              <div key={step.id} className="flex items-center">
                <button
                  onClick={() => setCurrentStep(step.id)}
                  className={`flex items-center justify-center w-12 h-12 rounded-full border-2 transition-colors ${
                    currentStep === step.id
                      ? 'bg-blue-500 border-blue-500 text-white'
                      : currentStep > step.id
                      ? 'bg-green-500 border-green-500 text-white'
                      : 'border-slate-400 text-slate-400 hover:border-blue-400'
                  }`}
                >
                  {currentStep > step.id ? (
                    <CheckCircle className="h-6 w-6" />
                  ) : (
                    <step.icon className="h-6 w-6" />
                  )}
                </button>
                <span className={`ml-2 text-sm font-medium ${
                  currentStep >= step.id ? 'text-white' : 'text-slate-400'
                }`}>
                  {step.name}
                </span>
                {step.id < steps.length && (
                  <div className={`w-16 h-0.5 mx-4 ${
                    currentStep > step.id ? 'bg-green-500' : 'bg-slate-600'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Selección de Paciente */}
          {currentStep === 1 && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="lg:col-span-3"
            >
              <div className="backdrop-blur-lg bg-white/10 rounded-2xl p-6 border border-white/20">
                <h2 className="text-xl font-semibold text-white mb-4 flex items-center">
                  <User className="h-5 w-5 mr-2 text-blue-400" />
                  Seleccionar Paciente
                </h2>

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

                {/* Lista de Pacientes */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {loadingPatients ? (
                    <div className="col-span-full flex justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                    </div>
                  ) : patients.length === 0 ? (
                    <p className="col-span-full text-slate-200 text-center py-8">No se encontraron pacientes</p>
                  ) : (
                    patients.map((patient) => (
                      <motion.div
                        key={patient.id}
                        whileHover={{ scale: 1.02 }}
                        onClick={() => {
                          setSelectedPatientId(patient.id);
                          setCurrentStep(2);
                        }}
                        className={`p-4 rounded-xl border cursor-pointer transition-all duration-200 ${
                          selectedPatientId === patient.id
                            ? 'bg-blue-500/20 border-blue-500/50'
                            : 'bg-white/5 border-white/10 hover:bg-white/10'
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          <div className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 flex items-center justify-center text-white font-semibold">
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
                      </motion.div>
                    ))
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {/* Formulario de Consulta */}
          {currentStep > 1 && selectedPatient && (
            <>
              {/* Información del Paciente */}
              <div className="lg:col-span-3">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="backdrop-blur-lg bg-white/10 rounded-2xl p-6 border border-white/20 mb-6"
                >
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
                    <button
                      onClick={() => setCurrentStep(1)}
                      className="px-4 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors"
                    >
                      Cambiar Paciente
                    </button>
                  </div>
                </motion.div>
              </div>

              {/* Contenido del Paso Actual */}
              <div className="lg:col-span-3">
                <motion.div
                  key={currentStep}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="backdrop-blur-lg bg-white/10 rounded-2xl p-6 border border-white/20"
                >
                  {/* Signos Vitales */}
                  {currentStep === 2 && (
                    <div>
                      <h2 className="text-xl font-semibold text-white mb-6 flex items-center">
                        <Activity className="h-5 w-5 mr-2 text-green-400" />
                        Signos Vitales
                      </h2>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-white mb-2">Presión Arterial</label>
                          <input
                            type="text"
                            placeholder="120/80"
                            value={consultationData.vitalSigns.bloodPressure}
                            onChange={(e) => handleVitalSignChange('bloodPressure', e.target.value)}
                            className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-white mb-2">Frecuencia Cardíaca (bpm)</label>
                          <input
                            type="number"
                            placeholder="72"
                            value={consultationData.vitalSigns.heartRate}
                            onChange={(e) => handleVitalSignChange('heartRate', e.target.value)}
                            className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-white mb-2">Temperatura (°C)</label>
                          <input
                            type="number"
                            step="0.1"
                            placeholder="36.5"
                            value={consultationData.vitalSigns.temperature}
                            onChange={(e) => handleVitalSignChange('temperature', e.target.value)}
                            className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-white mb-2">Frecuencia Respiratoria</label>
                          <input
                            type="number"
                            placeholder="16"
                            value={consultationData.vitalSigns.respiratoryRate}
                            onChange={(e) => handleVitalSignChange('respiratoryRate', e.target.value)}
                            className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-white mb-2">Peso (kg)</label>
                          <input
                            type="number"
                            step="0.1"
                            placeholder="70.0"
                            value={consultationData.vitalSigns.weight}
                            onChange={(e) => handleVitalSignChange('weight', e.target.value)}
                            className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-white mb-2">Altura (cm)</label>
                          <input
                            type="number"
                            placeholder="175"
                            value={consultationData.vitalSigns.height}
                            onChange={(e) => handleVitalSignChange('height', e.target.value)}
                            className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      </div>
                      
                      <div className="flex justify-end mt-6">
                        <button
                          onClick={() => setCurrentStep(3)}
                          className="px-6 py-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors"
                        >
                          Siguiente
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Examen Físico */}
                  {currentStep === 3 && (
                    <div>
                      <h2 className="text-xl font-semibold text-white mb-6 flex items-center">
                        <Stethoscope className="h-5 w-5 mr-2 text-purple-400" />
                        Examen Físico y Anamnesis
                      </h2>
                      
                      <div className="space-y-6">
                        <div>
                          <label className="block text-white mb-2">Motivo de Consulta</label>
                          <textarea
                            rows="3"
                            placeholder="Describe el motivo principal de la consulta..."
                            value={consultationData.chiefComplaint}
                            onChange={(e) => handleInputChange('chiefComplaint', e.target.value)}
                            className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-white mb-2">Historia de Enfermedad Actual</label>
                          <textarea
                            rows="4"
                            placeholder="Describe la evolución y características de la enfermedad actual..."
                            value={consultationData.currentIllnessHistory}
                            onChange={(e) => handleInputChange('currentIllnessHistory', e.target.value)}
                            className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-white mb-2">Examen Físico</label>
                          <textarea
                            rows="5"
                            placeholder="Describe los hallazgos del examen físico..."
                            value={consultationData.physicalExamination}
                            onChange={(e) => handleInputChange('physicalExamination', e.target.value)}
                            className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                          />
                        </div>
                      </div>
                      
                      <div className="flex justify-between mt-6">
                        <button
                          onClick={() => setCurrentStep(2)}
                          className="px-6 py-3 bg-white/10 text-white rounded-xl hover:bg-white/20 transition-colors"
                        >
                          Anterior
                        </button>
                        <button
                          onClick={() => setCurrentStep(4)}
                          className="px-6 py-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors"
                        >
                          Siguiente
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Diagnóstico */}
                  {currentStep === 4 && (
                    <div>
                      <h2 className="text-xl font-semibold text-white mb-6 flex items-center">
                        <FileText className="h-5 w-5 mr-2 text-yellow-400" />
                        Diagnóstico y Plan de Tratamiento
                      </h2>
                      
                      <div className="space-y-6">
                        <div>
                          <label className="block text-white mb-2">Diagnóstico Principal</label>
                          <input
                            type="text"
                            placeholder="Diagnóstico principal..."
                            value={consultationData.diagnosis}
                            onChange={(e) => handleInputChange('diagnosis', e.target.value)}
                            className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-white mb-2">Plan de Tratamiento</label>
                          <textarea
                            rows="4"
                            placeholder="Describe el plan de tratamiento recomendado..."
                            value={consultationData.treatmentPlan}
                            onChange={(e) => handleInputChange('treatmentPlan', e.target.value)}
                            className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-white mb-2">Notas Adicionales</label>
                          <textarea
                            rows="3"
                            placeholder="Observaciones adicionales..."
                            value={consultationData.notes}
                            onChange={(e) => handleInputChange('notes', e.target.value)}
                            className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                          />
                        </div>
                      </div>
                      
                      <div className="flex justify-between mt-6">
                        <button
                          onClick={() => setCurrentStep(3)}
                          className="px-6 py-3 bg-white/10 text-white rounded-xl hover:bg-white/20 transition-colors"
                        >
                          Anterior
                        </button>
                        <button
                          onClick={() => setCurrentStep(5)}
                          className="px-6 py-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors"
                        >
                          Siguiente
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Recetas */}
                  {currentStep === 5 && (
                    <div>
                      <h2 className="text-xl font-semibold text-white mb-6 flex items-center">
                        <Pill className="h-5 w-5 mr-2 text-green-400" />
                        Prescripciones Médicas
                      </h2>
                      
                      {/* Agregar Nueva Receta */}
                      <div className="bg-white/5 rounded-xl p-4 border border-white/10 mb-6">
                        <h3 className="text-white font-medium mb-4">Agregar Medicamento</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                          <div>
                            <label className="block text-white mb-2">Medicamento</label>
                            <input
                              type="text"
                              placeholder="Nombre del medicamento"
                              value={newPrescription.medication}
                              onChange={(e) => setNewPrescription(prev => ({...prev, medication: e.target.value}))}
                              className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                          
                          <div>
                            <label className="block text-white mb-2">Dosis</label>
                            <input
                              type="text"
                              placeholder="500mg"
                              value={newPrescription.dosage}
                              onChange={(e) => setNewPrescription(prev => ({...prev, dosage: e.target.value}))}
                              className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                          
                          <div>
                            <label className="block text-white mb-2">Frecuencia</label>
                            <input
                              type="text"
                              placeholder="Cada 8 horas"
                              value={newPrescription.frequency}
                              onChange={(e) => setNewPrescription(prev => ({...prev, frequency: e.target.value}))}
                              className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                          <div>
                            <label className="block text-white mb-2">Duración</label>
                            <input
                              type="text"
                              placeholder="7 días"
                              value={newPrescription.duration}
                              onChange={(e) => setNewPrescription(prev => ({...prev, duration: e.target.value}))}
                              className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                          
                          <div>
                            <label className="block text-white mb-2">Instrucciones</label>
                            <input
                              type="text"
                              placeholder="Tomar con alimentos"
                              value={newPrescription.instructions}
                              onChange={(e) => setNewPrescription(prev => ({...prev, instructions: e.target.value}))}
                              className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                        </div>
                        
                        <button
                          onClick={handleAddPrescription}
                          className="px-4 py-2 bg-green-500/20 text-green-300 rounded-lg hover:bg-green-500/30 transition-colors flex items-center"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Agregar Medicamento
                        </button>
                      </div>
                      
                      {/* Lista de Recetas */}
                      {consultationData.prescriptions.length > 0 && (
                        <div className="space-y-3 mb-6">
                          <h3 className="text-white font-medium">Medicamentos Prescritos</h3>
                          {consultationData.prescriptions.map((prescription) => (
                            <div key={prescription.id} className="bg-white/5 rounded-xl p-4 border border-white/10">
                              <div className="flex justify-between items-start">
                                <div>
                                  <h4 className="text-white font-medium">{prescription.medication}</h4>
                                  <p className="text-slate-300 text-sm">
                                    {prescription.dosage} - {prescription.frequency} - {prescription.duration}
                                  </p>
                                  {prescription.instructions && (
                                    <p className="text-slate-400 text-xs mt-1">{prescription.instructions}</p>
                                  )}
                                </div>
                                <button
                                  onClick={() => handleRemovePrescription(prescription.id)}
                                  className="text-red-400 hover:text-red-300 text-sm"
                                >
                                  Eliminar
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                      
                      <div className="flex justify-between mt-6">
                        <button
                          onClick={() => setCurrentStep(4)}
                          className="px-6 py-3 bg-white/10 text-white rounded-xl hover:bg-white/20 transition-colors"
                        >
                          Anterior
                        </button>
                        <button
                          onClick={handleSaveConsultation}
                          disabled={createConsultationMutation.isLoading}
                          className="px-6 py-3 bg-green-500 text-white rounded-xl hover:bg-green-600 transition-colors disabled:opacity-50 flex items-center"
                        >
                          <Save className="h-4 w-4 mr-2" />
                          Finalizar Consulta
                        </button>
                      </div>
                    </div>
                  )}
                </motion.div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default NewConsultation;
