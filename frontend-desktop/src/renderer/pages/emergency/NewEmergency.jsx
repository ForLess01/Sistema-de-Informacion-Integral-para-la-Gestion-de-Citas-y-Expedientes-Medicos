import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  AlertTriangle, User, Phone, Calendar, Clock, 
  MapPin, Save, X, ArrowLeft, Heart, 
  Thermometer, Activity, Shield, AlertCircle,
  UserPlus, Stethoscope, FileText, CheckCircle
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import emergencyService from '../../services/emergencyService';
import patientService from '../../services/patientService';

const NewEmergency = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  const [step, setStep] = useState(1); // 1: Patient Info, 2: Emergency Details, 3: Triage
  const [patientType, setPatientType] = useState('new'); // 'new', 'existing'
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [errors, setErrors] = useState({});
  const [successMessage, setSuccessMessage] = useState('');

  // Form data
  const [patientData, setPatientData] = useState({
    first_name: '',
    last_name: '',
    dni: '',
    date_of_birth: '',
    gender: '',
    phone: '',
    address: '',
    emergency_contact_name: '',
    emergency_contact_phone: ''
  });

  const [emergencyData, setEmergencyData] = useState({
    chief_complaint: '',
    onset_time: '',
    pain_level: 0,
    allergies: '',
    current_medications: '',
    medical_history: '',
    mechanism_of_injury: '',
    transport_method: 'walk_in'
  });

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
    notes: ''
  });

  // Search existing patients
  const { data: searchResults, isLoading: searchLoading } = useQuery({
    queryKey: ['patientSearch', searchTerm],
    queryFn: () => patientService.searchPatients({ query: searchTerm }),
    enabled: searchTerm.length >= 3 && patientType === 'existing'
  });

  // Create emergency patient mutation
  const createEmergencyMutation = useMutation({
    mutationFn: (data) => emergencyService.createEmergencyPatient(data),
    onSuccess: (data) => {
      setSuccessMessage(`Paciente de emergencia registrado exitosamente: ${data.patient_name}`);
      queryClient.invalidateQueries(['emergencyPatients']);
      setTimeout(() => {
        navigate('/emergency/queue');
      }, 2000);
    },
    onError: (error) => {
      const errorData = error.response?.data;
      if (errorData) {
        setErrors(errorData);
      }
    }
  });

  const handleInputChange = (section, field, value) => {
    if (section === 'patient') {
      setPatientData(prev => ({ ...prev, [field]: value }));
    } else if (section === 'emergency') {
      setEmergencyData(prev => ({ ...prev, [field]: value }));
    } else if (section === 'triage') {
      if (field.startsWith('vital_signs.')) {
        const vitalField = field.replace('vital_signs.', '');
        setTriageData(prev => ({
          ...prev,
          vital_signs: { ...prev.vital_signs, [vitalField]: value }
        }));
      } else {
        setTriageData(prev => ({ ...prev, [field]: value }));
      }
    }
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  const validateStep = (stepNumber) => {
    const newErrors = {};
    
    if (stepNumber === 1) {
      if (patientType === 'new') {
        if (!patientData.first_name?.trim()) newErrors.first_name = 'El nombre es requerido';
        if (!patientData.last_name?.trim()) newErrors.last_name = 'El apellido es requerido';
        if (!patientData.dni?.trim()) newErrors.dni = 'El DNI es requerido';
        if (!patientData.gender) newErrors.gender = 'El género es requerido';
        if (!patientData.phone?.trim()) newErrors.phone = 'El teléfono es requerido';
      } else {
        if (!selectedPatient) newErrors.patient = 'Debe seleccionar un paciente';
      }
    } else if (stepNumber === 2) {
      if (!emergencyData.chief_complaint?.trim()) newErrors.chief_complaint = 'El motivo de consulta es requerido';
      if (!emergencyData.onset_time) newErrors.onset_time = 'La hora de inicio es requerida';
    } else if (stepNumber === 3) {
      if (!triageData.triage_level) newErrors.triage_level = 'El nivel de triaje es requerido';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(step)) {
      setStep(step + 1);
    }
  };

  const handleSubmit = () => {
    if (!validateStep(3)) return;

    const submissionData = {
      patient: patientType === 'new' ? patientData : { id: selectedPatient.id },
      emergency: emergencyData,
      triage: triageData,
      patient_type: patientType,
      admission_time: new Date().toISOString()
    };

    createEmergencyMutation.mutate(submissionData);
  };

  const getTriageColor = (level) => {
    const colors = {
      1: 'bg-red-500 text-white',
      2: 'bg-orange-500 text-white',
      3: 'bg-yellow-500 text-black',
      4: 'bg-green-500 text-white',
      5: 'bg-blue-500 text-white'
    };
    return colors[level] || 'bg-gray-500 text-white';
  };

  const getTriageLabel = (level) => {
    const labels = {
      1: 'Resucitación - Inmediato',
      2: 'Emergencia - 15 min',
      3: 'Urgente - 30 min',
      4: 'Menos Urgente - 60 min',
      5: 'No Urgente - 120 min'
    };
    return labels[level] || 'Sin clasificar';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-900 via-red-800 to-orange-900 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-8"
        >
          <div className="flex items-center">
            <Link 
              to="/emergency/queue" 
              className="p-2 text-red-200 hover:text-white hover:bg-white/10 rounded-lg transition-colors mr-4"
            >
              <ArrowLeft className="h-6 w-6" />
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-white flex items-center">
                <AlertTriangle className="h-8 w-8 mr-3 text-red-400" />
                Nueva Emergencia
              </h1>
              <p className="text-red-200">Registro de nuevo caso de emergencia</p>
            </div>
          </div>
          <div className="text-right text-red-200">
            <p className="text-sm">Paso {step} de 3</p>
            <p className="text-xs">{format(new Date(), 'dd/MM/yyyy HH:mm')}</p>
          </div>
        </motion.div>

        {/* Success Message */}
        <AnimatePresence>
          {successMessage && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mb-6 p-4 bg-green-500/20 border border-green-500/30 rounded-xl text-green-300 flex items-center"
            >
              <CheckCircle className="h-5 w-5 mr-2" />
              {successMessage}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between mb-2">
            <span className={`text-sm ${step >= 1 ? 'text-white' : 'text-red-300'}`}>Información del Paciente</span>
            <span className={`text-sm ${step >= 2 ? 'text-white' : 'text-red-300'}`}>Detalles de Emergencia</span>
            <span className={`text-sm ${step >= 3 ? 'text-white' : 'text-red-300'}`}>Triaje</span>
          </div>
          <div className="w-full bg-white/10 rounded-full h-2">
            <div 
              className="bg-red-500 h-2 rounded-full transition-all duration-300" 
              style={{ width: `${(step / 3) * 100}%` }}
            ></div>
          </div>
        </div>

        {/* Step 1: Patient Information */}
        {step === 1 && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            {/* Patient Type Selection */}
            <div className="backdrop-blur-lg bg-white/10 rounded-2xl p-6 border border-white/20">
              <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
                <User className="h-5 w-5 mr-2 text-red-400" />
                Tipo de Paciente
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button
                  onClick={() => setPatientType('new')}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    patientType === 'new' 
                      ? 'border-red-500 bg-red-500/20 text-white' 
                      : 'border-white/20 bg-white/5 text-red-200 hover:border-red-400'
                  }`}
                >
                  <UserPlus className="h-6 w-6 mx-auto mb-2" />
                  <p className="font-medium">Paciente Nuevo</p>
                  <p className="text-sm opacity-75">Registrar nueva persona</p>
                </button>
                
                <button
                  onClick={() => setPatientType('existing')}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    patientType === 'existing' 
                      ? 'border-red-500 bg-red-500/20 text-white' 
                      : 'border-white/20 bg-white/5 text-red-200 hover:border-red-400'
                  }`}
                >
                  <User className="h-6 w-6 mx-auto mb-2" />
                  <p className="font-medium">Paciente Existente</p>
                  <p className="text-sm opacity-75">Buscar en registros</p>
                </button>
              </div>
            </div>

            {/* New Patient Form */}
            {patientType === 'new' && (
              <div className="backdrop-blur-lg bg-white/10 rounded-2xl p-6 border border-white/20">
                <h3 className="text-xl font-semibold text-white mb-4">Información del Nuevo Paciente</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">
                      Nombres *
                    </label>
                    <input
                      type="text"
                      value={patientData.first_name}
                      onChange={(e) => handleInputChange('patient', 'first_name', e.target.value)}
                      className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-red-300 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                      placeholder="Ingrese los nombres"
                    />
                    {errors.first_name && (
                      <p className="mt-1 text-red-300 text-sm flex items-center">
                        <AlertCircle className="h-4 w-4 mr-1" />
                        {errors.first_name}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-white mb-2">
                      Apellidos *
                    </label>
                    <input
                      type="text"
                      value={patientData.last_name}
                      onChange={(e) => handleInputChange('patient', 'last_name', e.target.value)}
                      className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-red-300 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                      placeholder="Ingrese los apellidos"
                    />
                    {errors.last_name && (
                      <p className="mt-1 text-red-300 text-sm flex items-center">
                        <AlertCircle className="h-4 w-4 mr-1" />
                        {errors.last_name}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-white mb-2">
                      DNI *
                    </label>
                    <input
                      type="text"
                      value={patientData.dni}
                      onChange={(e) => handleInputChange('patient', 'dni', e.target.value)}
                      maxLength={8}
                      className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-red-300 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                      placeholder="12345678"
                    />
                    {errors.dni && (
                      <p className="mt-1 text-red-300 text-sm flex items-center">
                        <AlertCircle className="h-4 w-4 mr-1" />
                        {errors.dni}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-white mb-2">
                      Fecha de Nacimiento
                    </label>
                    <input
                      type="date"
                      value={patientData.date_of_birth}
                      onChange={(e) => handleInputChange('patient', 'date_of_birth', e.target.value)}
                      max={format(new Date(), 'yyyy-MM-dd')}
                      className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-white mb-2">
                      Género *
                    </label>
                    <select
                      value={patientData.gender}
                      onChange={(e) => handleInputChange('patient', 'gender', e.target.value)}
                      className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    >
                      <option value="">Seleccionar género</option>
                      <option value="M">Masculino</option>
                      <option value="F">Femenino</option>
                      <option value="O">Otro</option>
                    </select>
                    {errors.gender && (
                      <p className="mt-1 text-red-300 text-sm flex items-center">
                        <AlertCircle className="h-4 w-4 mr-1" />
                        {errors.gender}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-white mb-2">
                      Teléfono *
                    </label>
                    <input
                      type="tel"
                      value={patientData.phone}
                      onChange={(e) => handleInputChange('patient', 'phone', e.target.value)}
                      className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-red-300 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                      placeholder="999999999"
                    />
                    {errors.phone && (
                      <p className="mt-1 text-red-300 text-sm flex items-center">
                        <AlertCircle className="h-4 w-4 mr-1" />
                        {errors.phone}
                      </p>
                    )}
                  </div>
                </div>

                <div className="mt-6">
                  <label className="block text-sm font-medium text-white mb-2">
                    Dirección
                  </label>
                  <textarea
                    value={patientData.address}
                    onChange={(e) => handleInputChange('patient', 'address', e.target.value)}
                    rows={2}
                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-red-300 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
                    placeholder="Dirección completa del paciente"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">
                      Contacto de Emergencia
                    </label>
                    <input
                      type="text"
                      value={patientData.emergency_contact_name}
                      onChange={(e) => handleInputChange('patient', 'emergency_contact_name', e.target.value)}
                      className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-red-300 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                      placeholder="Nombre del contacto"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-white mb-2">
                      Teléfono del Contacto
                    </label>
                    <input
                      type="tel"
                      value={patientData.emergency_contact_phone}
                      onChange={(e) => handleInputChange('patient', 'emergency_contact_phone', e.target.value)}
                      className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-red-300 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                      placeholder="999999999"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Existing Patient Search */}
            {patientType === 'existing' && (
              <div className="backdrop-blur-lg bg-white/10 rounded-2xl p-6 border border-white/20">
                <h3 className="text-xl font-semibold text-white mb-4">Buscar Paciente Existente</h3>
                
                <div className="relative mb-4">
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-red-300 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    placeholder="Buscar por nombre, DNI o teléfono..."
                  />
                  {searchLoading && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    </div>
                  )}
                </div>

                {searchResults && searchResults.length > 0 && (
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {searchResults.map((patient) => (
                      <div
                        key={patient.id}
                        onClick={() => setSelectedPatient(patient)}
                        className={`p-3 rounded-lg cursor-pointer transition-all ${
                          selectedPatient?.id === patient.id 
                            ? 'bg-red-500/20 border border-red-500' 
                            : 'bg-white/5 hover:bg-white/10 border border-white/10'
                        }`}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="text-white font-medium">
                              {patient.first_name} {patient.last_name}
                            </h4>
                            <p className="text-red-200 text-sm">DNI: {patient.dni}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-red-200 text-sm">{patient.phone}</p>
                            <p className="text-red-300 text-xs">
                              {patient.age ? `${patient.age} años` : 'Sin edad'}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {errors.patient && (
                  <p className="mt-2 text-red-300 text-sm flex items-center">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    {errors.patient}
                  </p>
                )}
              </div>
            )}
          </motion.div>
        )}

        {/* Step 2: Emergency Details */}
        {step === 2 && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="backdrop-blur-lg bg-white/10 rounded-2xl p-6 border border-white/20"
          >
            <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
              <Stethoscope className="h-5 w-5 mr-2 text-red-400" />
              Detalles de la Emergencia
            </h3>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Motivo de Consulta *
                </label>
                <textarea
                  value={emergencyData.chief_complaint}
                  onChange={(e) => handleInputChange('emergency', 'chief_complaint', e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-red-300 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
                  placeholder="Describa el motivo principal de la emergencia..."
                />
                {errors.chief_complaint && (
                  <p className="mt-1 text-red-300 text-sm flex items-center">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    {errors.chief_complaint}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Hora de Inicio *
                  </label>
                  <input
                    type="datetime-local"
                    value={emergencyData.onset_time}
                    onChange={(e) => handleInputChange('emergency', 'onset_time', e.target.value)}
                    max={format(new Date(), "yyyy-MM-dd'T'HH:mm")}
                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  />
                  {errors.onset_time && (
                    <p className="mt-1 text-red-300 text-sm flex items-center">
                      <AlertCircle className="h-4 w-4 mr-1" />
                      {errors.onset_time}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Nivel de Dolor (0-10)
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="10"
                    value={emergencyData.pain_level}
                    onChange={(e) => handleInputChange('emergency', 'pain_level', parseInt(e.target.value))}
                    className="w-full"
                  />
                  <div className="flex justify-between text-sm text-red-200 mt-1">
                    <span>0 (Sin dolor)</span>
                    <span className="font-medium">{emergencyData.pain_level}</span>
                    <span>10 (Dolor severo)</span>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Método de Transporte
                </label>
                <select
                  value={emergencyData.transport_method}
                  onChange={(e) => handleInputChange('emergency', 'transport_method', e.target.value)}
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                >
                  <option value="walk_in">Caminando</option>
                  <option value="ambulance">Ambulancia</option>
                  <option value="private_vehicle">Vehículo privado</option>
                  <option value="police">Policía</option>
                  <option value="helicopter">Helicóptero</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Mecanismo de Lesión
                </label>
                <textarea
                  value={emergencyData.mechanism_of_injury}
                  onChange={(e) => handleInputChange('emergency', 'mechanism_of_injury', e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-red-300 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
                  placeholder="Cómo ocurrió la lesión o enfermedad..."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Alergias Conocidas
                  </label>
                  <textarea
                    value={emergencyData.allergies}
                    onChange={(e) => handleInputChange('emergency', 'allergies', e.target.value)}
                    rows={2}
                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-red-300 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
                    placeholder="Medicamentos, alimentos, etc..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Medicamentos Actuales
                  </label>
                  <textarea
                    value={emergencyData.current_medications}
                    onChange={(e) => handleInputChange('emergency', 'current_medications', e.target.value)}
                    rows={2}
                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-red-300 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
                    placeholder="Medicamentos que toma actualmente..."
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Historial Médico Relevante
                </label>
                <textarea
                  value={emergencyData.medical_history}
                  onChange={(e) => handleInputChange('emergency', 'medical_history', e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-red-300 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
                  placeholder="Enfermedades crónicas, cirugías previas, etc..."
                />
              </div>
            </div>
          </motion.div>
        )}

        {/* Step 3: Triage */}
        {step === 3 && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            {/* Triage Level */}
            <div className="backdrop-blur-lg bg-white/10 rounded-2xl p-6 border border-white/20">
              <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
                <Shield className="h-5 w-5 mr-2 text-red-400" />
                Clasificación de Triaje
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-5 gap-3 mb-6">
                {[1, 2, 3, 4, 5].map((level) => (
                  <button
                    key={level}
                    onClick={() => handleInputChange('triage', 'triage_level', level)}
                    className={`p-3 rounded-lg text-center transition-all ${
                      triageData.triage_level === level 
                        ? getTriageColor(level) + ' ring-2 ring-white' 
                        : 'bg-white/10 text-red-200 hover:bg-white/20'
                    }`}
                  >
                    <div className="font-bold text-lg">{level}</div>
                    <div className="text-xs">{getTriageLabel(level).split(' - ')[0]}</div>
                  </button>
                ))}
              </div>

              <div className="text-center">
                <div className={`inline-block px-4 py-2 rounded-lg ${getTriageColor(triageData.triage_level)}`}>
                  <span className="font-medium">{getTriageLabel(triageData.triage_level)}</span>
                </div>
              </div>
            </div>

            {/* Vital Signs */}
            <div className="backdrop-blur-lg bg-white/10 rounded-2xl p-6 border border-white/20">
              <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
                <Activity className="h-5 w-5 mr-2 text-red-400" />
                Signos Vitales
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Presión Arterial
                  </label>
                  <div className="flex space-x-2">
                    <input
                      type="number"
                      value={triageData.vital_signs.blood_pressure_systolic}
                      onChange={(e) => handleInputChange('triage', 'vital_signs.blood_pressure_systolic', e.target.value)}
                      placeholder="120"
                      className="flex-1 px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-red-300 focus:outline-none focus:ring-2 focus:ring-red-500"
                    />
                    <span className="self-center text-white">/</span>
                    <input
                      type="number"
                      value={triageData.vital_signs.blood_pressure_diastolic}
                      onChange={(e) => handleInputChange('triage', 'vital_signs.blood_pressure_diastolic', e.target.value)}
                      placeholder="80"
                      className="flex-1 px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-red-300 focus:outline-none focus:ring-2 focus:ring-red-500"
                    />
                  </div>
                  <p className="text-xs text-red-300 mt-1">mmHg</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Frecuencia Cardíaca
                  </label>
                  <input
                    type="number"
                    value={triageData.vital_signs.heart_rate}
                    onChange={(e) => handleInputChange('triage', 'vital_signs.heart_rate', e.target.value)}
                    placeholder="72"
                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-red-300 focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                  <p className="text-xs text-red-300 mt-1">lpm</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Temperatura
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={triageData.vital_signs.temperature}
                    onChange={(e) => handleInputChange('triage', 'vital_signs.temperature', e.target.value)}
                    placeholder="36.5"
                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-red-300 focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                  <p className="text-xs text-red-300 mt-1">°C</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Frecuencia Respiratoria
                  </label>
                  <input
                    type="number"
                    value={triageData.vital_signs.respiratory_rate}
                    onChange={(e) => handleInputChange('triage', 'vital_signs.respiratory_rate', e.target.value)}
                    placeholder="16"
                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-red-300 focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                  <p className="text-xs text-red-300 mt-1">rpm</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Saturación de Oxígeno
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={triageData.vital_signs.oxygen_saturation}
                    onChange={(e) => handleInputChange('triage', 'vital_signs.oxygen_saturation', e.target.value)}
                    placeholder="98"
                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-red-300 focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                  <p className="text-xs text-red-300 mt-1">%</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Glucosa
                  </label>
                  <input
                    type="number"
                    value={triageData.vital_signs.glucose_level}
                    onChange={(e) => handleInputChange('triage', 'vital_signs.glucose_level', e.target.value)}
                    placeholder="100"
                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-red-300 focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                  <p className="text-xs text-red-300 mt-1">mg/dL</p>
                </div>
              </div>
            </div>

            {/* Additional Assessment */}
            <div className="backdrop-blur-lg bg-white/10 rounded-2xl p-6 border border-white/20">
              <h3 className="text-xl font-semibold text-white mb-4">Evaluación Adicional</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Nivel de Conciencia
                  </label>
                  <select
                    value={triageData.consciousness_level}
                    onChange={(e) => handleInputChange('triage', 'consciousness_level', e.target.value)}
                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500"
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
                    onChange={(e) => handleInputChange('triage', 'pain_scale', parseInt(e.target.value))}
                    className="w-full"
                  />
                  <div className="flex justify-between text-sm text-red-200 mt-1">
                    <span>0</span>
                    <span className="font-medium">{triageData.pain_scale}</span>
                    <span>10</span>
                  </div>
                </div>
              </div>

              <div className="mt-6">
                <label className="block text-sm font-medium text-white mb-2">
                  Notas del Triaje
                </label>
                <textarea
                  value={triageData.notes}
                  onChange={(e) => handleInputChange('triage', 'notes', e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-red-300 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
                  placeholder="Observaciones adicionales del triaje..."
                />
              </div>
            </div>
          </motion.div>
        )}

        {/* Navigation Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="flex justify-between items-center mt-8"
        >
          <div>
            {step > 1 && (
              <button
                onClick={() => setStep(step - 1)}
                className="px-6 py-3 text-red-200 hover:text-white border border-red-500 hover:border-red-400 rounded-xl transition duration-200 flex items-center"
              >
                <ArrowLeft className="h-5 w-5 mr-2" />
                Anterior
              </button>
            )}
          </div>

          <div>
            {step < 3 ? (
              <button
                onClick={handleNext}
                className="px-6 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white font-medium rounded-xl hover:from-red-600 hover:to-red-700 transition duration-200 flex items-center"
              >
                Siguiente
                <ArrowLeft className="h-5 w-5 ml-2 transform rotate-180" />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={createEmergencyMutation.isLoading}
                className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-medium rounded-xl hover:from-green-600 hover:to-emerald-700 transition duration-200 flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {createEmergencyMutation.isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Registrando...
                  </>
                ) : (
                  <>
                    <Save className="h-5 w-5 mr-2" />
                    Registrar Emergencia
                  </>
                )}
              </button>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default NewEmergency;
