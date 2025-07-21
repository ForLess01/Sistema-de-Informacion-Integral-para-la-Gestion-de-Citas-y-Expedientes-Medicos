import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { 
  UserPlus, Save, X, ArrowLeft, AlertCircle, CheckCircle,
  Mail, Phone, MapPin, Calendar, Users, Clock, 
  IdCard, Heart, Shield, FileText
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import patientService from '../../services/patientService';

const PatientRegistration = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    dni: '',
    date_of_birth: '',
    gender: '',
    phone: '',
    email: '',
    address: '',
    emergency_contact_name: '',
    emergency_contact_phone: '',
    blood_type: '',
    allergies: '',
    chronic_conditions: '',
    insurance_provider: '',
    insurance_number: ''
  });
  
  const [errors, setErrors] = useState({});
  const [step, setStep] = useState(1); // 1: Personal, 2: Contacto, 3: Médica/Seguro
  const [scheduleAppointment, setScheduleAppointment] = useState(false);

  // Crear paciente
  const createPatientMutation = useMutation({
    mutationFn: patientService.createPatient,
    onSuccess: (data) => {
      queryClient.invalidateQueries(['patients']);
      queryClient.invalidateQueries(['dashboard-stats']);
      
      if (scheduleAppointment) {
        // Redirigir a programar cita con el paciente ya seleccionado
        navigate('/reception/appointments/new', { 
          state: { selectedPatient: data } 
        });
      } else {
        // Redirigir al dashboard de recepción
        navigate('/dashboard');
      }
    },
    onError: (error) => {
      const errorData = error.response?.data;
      if (errorData) {
        setErrors(errorData);
      }
    },
  });

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Limpiar error del campo cuando el usuario empiece a escribir
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: null
      }));
    }
  };

  const validateStep = (stepNumber) => {
    const newErrors = {};
    
    if (stepNumber === 1) {
      // Validaciones básicas obligatorias
      if (!formData.first_name?.trim()) newErrors.first_name = 'El nombre es requerido';
      if (!formData.last_name?.trim()) newErrors.last_name = 'El apellido es requerido';
      if (!formData.dni?.trim()) newErrors.dni = 'El DNI es requerido';
      if (!formData.date_of_birth) newErrors.date_of_birth = 'La fecha de nacimiento es requerida';
      if (!formData.gender) newErrors.gender = 'El género es requerido';
      
      // Validar formato de DNI (8 dígitos)
      if (formData.dni && !/^\d{8}$/.test(formData.dni)) {
        newErrors.dni = 'El DNI debe tener 8 dígitos';
      }
      
      // Validar que la fecha de nacimiento no sea futura
      if (formData.date_of_birth && new Date(formData.date_of_birth) > new Date()) {
        newErrors.date_of_birth = 'La fecha de nacimiento no puede ser futura';
      }
    }
    
    if (stepNumber === 2) {
      // Validaciones de contacto
      if (!formData.phone?.trim()) newErrors.phone = 'El teléfono es requerido';
      
      // Validar formato de email si se proporciona
      if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        newErrors.email = 'El formato del email no es válido';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(step)) {
      setStep(step + 1);
    }
  };

  const handlePrevious = () => {
    setStep(step - 1);
    setErrors({}); // Limpiar errores al retroceder
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateStep(step)) {
      return;
    }
    
    createPatientMutation.mutate(formData);
  };

  const bloodTypes = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
  const totalSteps = 3;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-800 to-indigo-900 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-8"
        >
          <div className="flex items-center">
            <Link 
              to="/dashboard" 
              className="p-2 text-slate-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors mr-4"
            >
              <ArrowLeft className="h-6 w-6" />
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-white flex items-center">
                <UserPlus className="h-8 w-8 mr-3 text-green-400" />
                Registrar Nuevo Paciente
              </h1>
              <p className="text-slate-200">
                Registro rápido desde recepción
              </p>
            </div>
          </div>
          
          {/* Progress Indicator */}
          <div className="flex items-center space-x-3">
            {[1, 2, 3].map((stepNum) => (
              <div
                key={stepNum}
                className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                  stepNum === step
                    ? 'bg-blue-500 text-white'
                    : stepNum < step
                    ? 'bg-green-500 text-white'
                    : 'bg-white/10 text-slate-400'
                }`}
              >
                {stepNum < step ? <CheckCircle className="h-5 w-5" /> : stepNum}
              </div>
            ))}
          </div>
        </motion.div>

        {/* Progress Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex justify-between text-sm text-slate-300 mb-2">
            <span>Paso {step} de {totalSteps}</span>
            <span>{Math.round((step / totalSteps) * 100)}% completado</span>
          </div>
          <div className="w-full bg-white/10 rounded-full h-2">
            <motion.div
              className="bg-gradient-to-r from-blue-500 to-green-500 h-2 rounded-full"
              initial={{ width: `${(1 / totalSteps) * 100}%` }}
              animate={{ width: `${(step / totalSteps) * 100}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </motion.div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Paso 1: Información Personal */}
          {step === 1 && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="backdrop-blur-lg bg-white/10 rounded-2xl p-6 border border-white/20"
            >
              <h3 className="text-xl font-semibold text-white mb-6 flex items-center">
                <IdCard className="h-5 w-5 mr-2 text-green-400" />
                Información Personal
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Nombres *
                  </label>
                  <input
                    type="text"
                    value={formData.first_name}
                    onChange={(e) => handleInputChange('first_name', e.target.value)}
                    className="w-full px-3 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="Ingrese los nombres"
                    autoFocus
                  />
                  {errors.first_name && (
                    <p className="mt-1 text-red-400 text-sm flex items-center">
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
                    value={formData.last_name}
                    onChange={(e) => handleInputChange('last_name', e.target.value)}
                    className="w-full px-3 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="Ingrese los apellidos"
                  />
                  {errors.last_name && (
                    <p className="mt-1 text-red-400 text-sm flex items-center">
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
                    value={formData.dni}
                    onChange={(e) => handleInputChange('dni', e.target.value)}
                    maxLength={8}
                    className="w-full px-3 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="12345678"
                  />
                  {errors.dni && (
                    <p className="mt-1 text-red-400 text-sm flex items-center">
                      <AlertCircle className="h-4 w-4 mr-1" />
                      {errors.dni}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Fecha de Nacimiento *
                  </label>
                  <input
                    type="date"
                    value={formData.date_of_birth}
                    onChange={(e) => handleInputChange('date_of_birth', e.target.value)}
                    max={format(new Date(), 'yyyy-MM-dd')}
                    className="w-full px-3 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                  {errors.date_of_birth && (
                    <p className="mt-1 text-red-400 text-sm flex items-center">
                      <AlertCircle className="h-4 w-4 mr-1" />
                      {errors.date_of_birth}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Género *
                  </label>
                  <select
                    value={formData.gender}
                    onChange={(e) => handleInputChange('gender', e.target.value)}
                    className="w-full px-3 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  >
                    <option value="">Seleccionar género</option>
                    <option value="M">Masculino</option>
                    <option value="F">Femenino</option>
                    <option value="O">Otro</option>
                  </select>
                  {errors.gender && (
                    <p className="mt-1 text-red-400 text-sm flex items-center">
                      <AlertCircle className="h-4 w-4 mr-1" />
                      {errors.gender}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Tipo de Sangre
                  </label>
                  <select
                    value={formData.blood_type}
                    onChange={(e) => handleInputChange('blood_type', e.target.value)}
                    className="w-full px-3 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  >
                    <option value="">Seleccionar tipo de sangre</option>
                    {bloodTypes.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>
              </div>
            </motion.div>
          )}

          {/* Paso 2: Información de Contacto */}
          {step === 2 && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="backdrop-blur-lg bg-white/10 rounded-2xl p-6 border border-white/20"
            >
              <h3 className="text-xl font-semibold text-white mb-6 flex items-center">
                <Phone className="h-5 w-5 mr-2 text-green-400" />
                Información de Contacto
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Teléfono *
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    className="w-full px-3 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="999999999"
                    autoFocus
                  />
                  {errors.phone && (
                    <p className="mt-1 text-red-400 text-sm flex items-center">
                      <AlertCircle className="h-4 w-4 mr-1" />
                      {errors.phone}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className="w-full px-3 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="correo@ejemplo.com"
                  />
                  {errors.email && (
                    <p className="mt-1 text-red-400 text-sm flex items-center">
                      <AlertCircle className="h-4 w-4 mr-1" />
                      {errors.email}
                    </p>
                  )}
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-white mb-2">
                    Dirección
                  </label>
                  <textarea
                    value={formData.address}
                    onChange={(e) => handleInputChange('address', e.target.value)}
                    rows={3}
                    className="w-full px-3 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
                    placeholder="Ingrese la dirección completa"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Contacto de Emergencia
                  </label>
                  <input
                    type="text"
                    value={formData.emergency_contact_name}
                    onChange={(e) => handleInputChange('emergency_contact_name', e.target.value)}
                    className="w-full px-3 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="Nombre completo"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Teléfono de Emergencia
                  </label>
                  <input
                    type="tel"
                    value={formData.emergency_contact_phone}
                    onChange={(e) => handleInputChange('emergency_contact_phone', e.target.value)}
                    className="w-full px-3 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="999999999"
                  />
                </div>
              </div>
            </motion.div>
          )}

          {/* Paso 3: Información Médica y de Seguro */}
          {step === 3 && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              {/* Información Médica */}
              <div className="backdrop-blur-lg bg-white/10 rounded-2xl p-6 border border-white/20">
                <h3 className="text-xl font-semibold text-white mb-6 flex items-center">
                  <Heart className="h-5 w-5 mr-2 text-green-400" />
                  Información Médica
                </h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">
                      Alergias
                    </label>
                    <textarea
                      value={formData.allergies}
                      onChange={(e) => handleInputChange('allergies', e.target.value)}
                      rows={2}
                      className="w-full px-3 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
                      placeholder="Describa alergias conocidas (medicamentos, alimentos, etc.)"
                      autoFocus
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-white mb-2">
                      Condiciones Crónicas
                    </label>
                    <textarea
                      value={formData.chronic_conditions}
                      onChange={(e) => handleInputChange('chronic_conditions', e.target.value)}
                      rows={2}
                      className="w-full px-3 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
                      placeholder="Describa condiciones médicas crónicas"
                    />
                  </div>
                </div>
              </div>

              {/* Información de Seguro */}
              <div className="backdrop-blur-lg bg-white/10 rounded-2xl p-6 border border-white/20">
                <h3 className="text-xl font-semibold text-white mb-6 flex items-center">
                  <Shield className="h-5 w-5 mr-2 text-green-400" />
                  Información de Seguro
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">
                      Proveedor de Seguro
                    </label>
                    <input
                      type="text"
                      value={formData.insurance_provider}
                      onChange={(e) => handleInputChange('insurance_provider', e.target.value)}
                      className="w-full px-3 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="Nombre del seguro"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-white mb-2">
                      Número de Póliza
                    </label>
                    <input
                      type="text"
                      value={formData.insurance_number}
                      onChange={(e) => handleInputChange('insurance_number', e.target.value)}
                      className="w-full px-3 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="Número de póliza"
                    />
                  </div>
                </div>
              </div>

              {/* Opción de Programar Cita */}
              <div className="backdrop-blur-lg bg-white/10 rounded-2xl p-6 border border-white/20">
                <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
                  <Clock className="h-5 w-5 mr-2 text-green-400" />
                  Acción Posterior
                </h3>
                
                <div className="space-y-4">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="scheduleAppointment"
                      checked={scheduleAppointment}
                      onChange={(e) => setScheduleAppointment(e.target.checked)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="scheduleAppointment" className="ml-3 text-white">
                      Programar cita inmediatamente después del registro
                    </label>
                  </div>
                  
                  {scheduleAppointment && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="bg-blue-500/10 border border-blue-400/20 rounded-lg p-4"
                    >
                      <div className="flex items-center text-blue-300">
                        <FileText className="h-5 w-5 mr-2" />
                        <p className="text-sm">
                          Después de registrar al paciente, será redirigido automáticamente 
                          a la pantalla de programación de citas con este paciente ya seleccionado.
                        </p>
                      </div>
                    </motion.div>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {/* Botones de Navegación */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex justify-between items-center pt-6"
          >
            <div className="flex space-x-4">
              <Link to="/dashboard">
                <button
                  type="button"
                  className="px-6 py-3 text-slate-300 hover:text-white border border-slate-600 hover:border-slate-500 rounded-xl transition duration-200"
                >
                  Cancelar
                </button>
              </Link>
              
              {step > 1 && (
                <button
                  type="button"
                  onClick={handlePrevious}
                  className="px-6 py-3 bg-white/10 text-white border border-white/20 rounded-xl hover:bg-white/20 transition duration-200"
                >
                  Anterior
                </button>
              )}
            </div>

            <div className="flex space-x-4">
              {step < totalSteps ? (
                <button
                  type="button"
                  onClick={handleNext}
                  className="px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-medium rounded-xl hover:from-blue-600 hover:to-indigo-700 transition duration-200"
                >
                  Siguiente
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={createPatientMutation.isLoading}
                  className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-medium rounded-xl hover:from-green-600 hover:to-emerald-700 transition duration-200 flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {createPatientMutation.isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Registrando...
                    </>
                  ) : (
                    <>
                      <Save className="h-5 w-5 mr-2" />
                      {scheduleAppointment ? 'Registrar y Programar Cita' : 'Registrar Paciente'}
                    </>
                  )}
                </button>
              )}
            </div>
          </motion.div>
        </form>
      </div>
    </div>
  );
};

export default PatientRegistration;
