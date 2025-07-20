import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { 
  X, Save, AlertTriangle, Heart, Thermometer, 
  Activity, User, FileText, Clock
} from 'lucide-react';
import toast from 'react-hot-toast';

const TriageForm = ({ patient, onClose, onSuccess }) => {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    // Información básica del paciente
    patient_id: patient?.id || '',
    patient_name: patient?.patient_name || patient?.name || '',
    age: patient?.age || '',
    gender: patient?.gender || '',
    
    // Motivo principal de consulta
    chief_complaint: patient?.chief_complaint || '',
    
    // Signos vitales
    blood_pressure_systolic: '',
    blood_pressure_diastolic: '',
    heart_rate: '',
    respiratory_rate: '',
    temperature: '',
    oxygen_saturation: '',
    weight: '',
    height: '',
    
    // Evaluación de dolor
    pain_scale: '',
    pain_location: '',
    
    // Síntomas adicionales
    symptoms: [],
    allergies: '',
    current_medications: '',
    
    // Evaluación de prioridad
    triage_priority: null,
    urgency_level: '',
    
    // Observaciones adicionales
    observations: '',
    
    // Información de llegada
    arrival_method: '',
    accompanied_by: ''
  });

  const symptoms_options = [
    'Dolor de pecho', 'Dificultad respiratoria', 'Náuseas/Vómitos', 
    'Mareos', 'Fiebre', 'Dolor de cabeza', 'Dolor abdominal',
    'Sangrado', 'Pérdida de conciencia', 'Convulsiones',
    'Debilidad muscular', 'Visión borrosa'
  ];

  const urgency_levels = [
    { value: 1, label: '🔴 INMEDIATA - Riesgo vital', color: 'bg-red-600' },
    { value: 2, label: '🟠 MUY URGENTE - < 15 min', color: 'bg-orange-500' },
    { value: 3, label: '🟡 URGENTE - < 60 min', color: 'bg-yellow-500' },
    { value: 4, label: '🟢 NORMAL - < 2 horas', color: 'bg-green-500' },
    { value: 5, label: '🔵 NO URGENTE - < 4 horas', color: 'bg-blue-500' }
  ];

  const triageMutation = useMutation({
    mutationFn: async (triageData) => {
      const response = await fetch('/api/triage/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        },
        body: JSON.stringify(triageData)
      });
      
      if (!response.ok) {
        throw new Error('Error al guardar el triaje');
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast.success('Triaje completado exitosamente');
      queryClient.invalidateQueries(['nurseTriageQueue']);
      queryClient.invalidateQueries(['completedTriage']);
      onSuccess && onSuccess();
    },
    onError: (error) => {
      toast.error('Error al guardar el triaje: ' + error.message);
    }
  });

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSymptomToggle = (symptom) => {
    setFormData(prev => ({
      ...prev,
      symptoms: prev.symptoms.includes(symptom)
        ? prev.symptoms.filter(s => s !== symptom)
        : [...prev.symptoms, symptom]
    }));
  };

  const calculateBMI = () => {
    const weight = parseFloat(formData.weight);
    const height = parseFloat(formData.height) / 100; // convert cm to m
    if (weight && height) {
      return (weight / (height * height)).toFixed(1);
    }
    return '';
  };

  const getBloodPressure = () => {
    if (formData.blood_pressure_systolic && formData.blood_pressure_diastolic) {
      return `${formData.blood_pressure_systolic}/${formData.blood_pressure_diastolic}`;
    }
    return '';
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validaciones básicas
    if (!formData.chief_complaint.trim()) {
      toast.error('El motivo de consulta es obligatorio');
      return;
    }
    
    if (!formData.triage_priority) {
      toast.error('Debe asignar un nivel de prioridad');
      return;
    }

    // Preparar datos para envío
    const triageData = {
      ...formData,
      blood_pressure: getBloodPressure(),
      bmi: calculateBMI(),
      symptoms: formData.symptoms.join(', '),
      completed_at: new Date().toISOString()
    };

    triageMutation.mutate(triageData);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-gradient-to-br from-teal-900 via-green-800 to-emerald-900 rounded-2xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto border border-white/20"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-white flex items-center">
              <Heart className="h-6 w-6 mr-2 text-red-400" />
              Formulario de Triaje
            </h2>
            <p className="text-green-200">
              {formData.patient_name && `Paciente: ${formData.patient_name}`}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-green-200 hover:text-white transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Información Básica */}
          <div className="bg-white/5 rounded-xl p-4 border border-white/10">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
              <User className="h-5 w-5 mr-2" />
              Información del Paciente
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-green-200 mb-2">
                  Nombre Completo
                </label>
                <input
                  type="text"
                  value={formData.patient_name}
                  onChange={(e) => handleInputChange('patient_name', e.target.value)}
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-green-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-green-200 mb-2">
                  Edad
                </label>
                <input
                  type="number"
                  value={formData.age}
                  onChange={(e) => handleInputChange('age', e.target.value)}
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-green-500"
                  min="0"
                  max="120"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-green-200 mb-2">
                  Método de Llegada
                </label>
                <select
                  value={formData.arrival_method}
                  onChange={(e) => handleInputChange('arrival_method', e.target.value)}
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-green-500"
                >
                  <option value="">Seleccionar</option>
                  <option value="walking">Caminando</option>
                  <option value="ambulance">Ambulancia</option>
                  <option value="wheelchair">Silla de ruedas</option>
                  <option value="stretcher">Camilla</option>
                  <option value="family_transport">Transporte familiar</option>
                </select>
              </div>
            </div>
          </div>

          {/* Motivo de Consulta */}
          <div className="bg-white/5 rounded-xl p-4 border border-white/10">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
              <FileText className="h-5 w-5 mr-2" />
              Motivo Principal de Consulta
            </h3>
            <textarea
              value={formData.chief_complaint}
              onChange={(e) => handleInputChange('chief_complaint', e.target.value)}
              className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-green-500"
              rows="3"
              placeholder="Describa el motivo principal por el cual el paciente busca atención médica..."
              required
            />
          </div>

          {/* Signos Vitales */}
          <div className="bg-white/5 rounded-xl p-4 border border-white/10">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
              <Activity className="h-5 w-5 mr-2" />
              Signos Vitales
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-green-200 mb-2">
                  Presión Arterial (mmHg)
                </label>
                <div className="flex space-x-2">
                  <input
                    type="number"
                    placeholder="Sistólica"
                    value={formData.blood_pressure_systolic}
                    onChange={(e) => handleInputChange('blood_pressure_systolic', e.target.value)}
                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-green-500"
                  />
                  <span className="text-white self-center">/</span>
                  <input
                    type="number"
                    placeholder="Diastólica"
                    value={formData.blood_pressure_diastolic}
                    onChange={(e) => handleInputChange('blood_pressure_diastolic', e.target.value)}
                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-green-500"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-green-200 mb-2">
                  Frecuencia Cardíaca (bpm)
                </label>
                <input
                  type="number"
                  value={formData.heart_rate}
                  onChange={(e) => handleInputChange('heart_rate', e.target.value)}
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-green-500"
                  min="40"
                  max="200"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-green-200 mb-2">
                  Temperatura (°C)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.temperature}
                  onChange={(e) => handleInputChange('temperature', e.target.value)}
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-green-500"
                  min="35"
                  max="45"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-green-200 mb-2">
                  SpO₂ (%)
                </label>
                <input
                  type="number"
                  value={formData.oxygen_saturation}
                  onChange={(e) => handleInputChange('oxygen_saturation', e.target.value)}
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-green-500"
                  min="70"
                  max="100"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-green-200 mb-2">
                  Peso (kg)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.weight}
                  onChange={(e) => handleInputChange('weight', e.target.value)}
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-green-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-green-200 mb-2">
                  Altura (cm)
                </label>
                <input
                  type="number"
                  value={formData.height}
                  onChange={(e) => handleInputChange('height', e.target.value)}
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-green-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-green-200 mb-2">
                  Escala de Dolor (0-10)
                </label>
                <select
                  value={formData.pain_scale}
                  onChange={(e) => handleInputChange('pain_scale', e.target.value)}
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-green-500"
                >
                  <option value="">Sin dolor</option>
                  {[1,2,3,4,5,6,7,8,9,10].map(num => (
                    <option key={num} value={num}>{num} - {num <= 3 ? 'Leve' : num <= 6 ? 'Moderado' : 'Severo'}</option>
                  ))}
                </select>
              </div>

              {calculateBMI() && (
                <div>
                  <label className="block text-sm font-medium text-green-200 mb-2">
                    IMC Calculado
                  </label>
                  <div className="px-3 py-2 bg-green-500/20 border border-green-500/50 rounded-lg text-green-300">
                    {calculateBMI()}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Síntomas Adicionales */}
          <div className="bg-white/5 rounded-xl p-4 border border-white/10">
            <h3 className="text-lg font-semibold text-white mb-4">
              Síntomas Adicionales
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {symptoms_options.map(symptom => (
                <label key={symptom} className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.symptoms.includes(symptom)}
                    onChange={() => handleSymptomToggle(symptom)}
                    className="rounded border-white/20 bg-white/10 text-green-500 focus:ring-green-500"
                  />
                  <span className="text-green-200 text-sm">{symptom}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Nivel de Prioridad */}
          <div className="bg-white/5 rounded-xl p-4 border border-white/10">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
              <AlertTriangle className="h-5 w-5 mr-2 text-red-400" />
              Nivel de Prioridad (Triaje Manchester)
            </h3>
            <div className="grid grid-cols-1 gap-3">
              {urgency_levels.map(level => (
                <label key={level.value} className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="radio"
                    name="triage_priority"
                    value={level.value}
                    checked={formData.triage_priority === level.value}
                    onChange={() => handleInputChange('triage_priority', level.value)}
                    className="text-green-500 focus:ring-green-500"
                  />
                  <span className={`px-3 py-1 rounded text-white text-sm font-medium ${level.color}`}>
                    {level.label}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Observaciones */}
          <div className="bg-white/5 rounded-xl p-4 border border-white/10">
            <h3 className="text-lg font-semibold text-white mb-4">
              Observaciones Adicionales
            </h3>
            <textarea
              value={formData.observations}
              onChange={(e) => handleInputChange('observations', e.target.value)}
              className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-green-500"
              rows="3"
              placeholder="Observaciones adicionales del personal de enfermería..."
            />
          </div>

          {/* Botones de Acción */}
          <div className="flex items-center justify-end space-x-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 text-green-200 hover:text-white transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={triageMutation.isPending}
              className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-medium rounded-xl hover:from-green-600 hover:to-emerald-700 transition duration-200 flex items-center disabled:opacity-50"
            >
              {triageMutation.isPending ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              {triageMutation.isPending ? 'Guardando...' : 'Completar Triaje'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default TriageForm;
