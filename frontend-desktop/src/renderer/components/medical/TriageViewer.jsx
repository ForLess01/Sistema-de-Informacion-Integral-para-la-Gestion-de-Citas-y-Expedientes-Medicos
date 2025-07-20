import React from 'react';
import { motion } from 'framer-motion';
import { 
  X, User, Heart, Activity, Thermometer, 
  Clock, AlertTriangle, FileText, Eye
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const TriageViewer = ({ triageData, onClose }) => {
  if (!triageData) return null;

  const getPriorityColor = (priority) => {
    switch(priority) {
      case 1: return 'bg-red-600 text-white border-red-500';
      case 2: return 'bg-orange-500 text-white border-orange-400';
      case 3: return 'bg-yellow-500 text-white border-yellow-400';
      case 4: return 'bg-green-500 text-white border-green-400';
      case 5: return 'bg-blue-500 text-white border-blue-400';
      default: return 'bg-gray-500 text-white border-gray-400';
    }
  };

  const getPriorityLabel = (priority) => {
    switch(priority) {
      case 1: return '🔴 INMEDIATA - Riesgo vital';
      case 2: return '🟠 MUY URGENTE - < 15 min';
      case 3: return '🟡 URGENTE - < 60 min';
      case 4: return '🟢 NORMAL - < 2 horas';
      case 5: return '🔵 NO URGENTE - < 4 horas';
      default: return 'SIN CLASIFICAR';
    }
  };

  const getVitalSignStatus = (vital, normal_range) => {
    // Función para determinar si un signo vital está dentro del rango normal
    // Esto sería más sofisticado en un sistema real
    return 'normal'; // simplified for now
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-gradient-to-br from-blue-900 via-indigo-800 to-purple-900 rounded-2xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto border border-white/20"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-white flex items-center">
              <Eye className="h-6 w-6 mr-2 text-blue-400" />
              Información de Triaje
            </h2>
            <p className="text-blue-200">
              Paciente: {triageData.patient_name}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-blue-200 hover:text-white transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Información Básica */}
          <div className="lg:col-span-2 space-y-6">
            {/* Datos del Paciente */}
            <div className="bg-white/5 rounded-xl p-4 border border-white/10">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                <User className="h-5 w-5 mr-2" />
                Información del Paciente
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-blue-200">Nombre</p>
                  <p className="text-white font-medium">{triageData.patient_name}</p>
                </div>
                <div>
                  <p className="text-sm text-blue-200">Edad</p>
                  <p className="text-white font-medium">{triageData.age} años</p>
                </div>
                <div>
                  <p className="text-sm text-blue-200">Llegada</p>
                  <p className="text-white font-medium">
                    {triageData.arrival_time && format(new Date(triageData.arrival_time), 'dd/MM/yyyy HH:mm', { locale: es })}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-blue-200">Método de Llegada</p>
                  <p className="text-white font-medium">
                    {triageData.arrival_method === 'walking' ? 'Caminando' :
                     triageData.arrival_method === 'ambulance' ? 'Ambulancia' :
                     triageData.arrival_method === 'wheelchair' ? 'Silla de ruedas' :
                     triageData.arrival_method === 'stretcher' ? 'Camilla' :
                     triageData.arrival_method === 'family_transport' ? 'Transporte familiar' :
                     triageData.arrival_method || 'No especificado'}
                  </p>
                </div>
              </div>
            </div>

            {/* Motivo de Consulta */}
            <div className="bg-white/5 rounded-xl p-4 border border-white/10">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                <FileText className="h-5 w-5 mr-2" />
                Motivo Principal de Consulta
              </h3>
              <p className="text-blue-100 bg-white/5 p-3 rounded-lg border border-white/10">
                {triageData.chief_complaint}
              </p>
            </div>

            {/* Signos Vitales */}
            <div className="bg-white/5 rounded-xl p-4 border border-white/10">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                <Activity className="h-5 w-5 mr-2" />
                Signos Vitales
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {triageData.blood_pressure && (
                  <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                    <p className="text-xs text-blue-200">Presión Arterial</p>
                    <p className="text-lg font-bold text-white">{triageData.blood_pressure}</p>
                    <p className="text-xs text-blue-300">mmHg</p>
                  </div>
                )}
                {triageData.heart_rate && (
                  <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                    <p className="text-xs text-blue-200">Frecuencia Cardíaca</p>
                    <p className="text-lg font-bold text-white">{triageData.heart_rate}</p>
                    <p className="text-xs text-blue-300">bpm</p>
                  </div>
                )}
                {triageData.temperature && (
                  <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                    <p className="text-xs text-blue-200">Temperatura</p>
                    <p className="text-lg font-bold text-white">{triageData.temperature}</p>
                    <p className="text-xs text-blue-300">°C</p>
                  </div>
                )}
                {triageData.oxygen_saturation && (
                  <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                    <p className="text-xs text-blue-200">SpO₂</p>
                    <p className="text-lg font-bold text-white">{triageData.oxygen_saturation}</p>
                    <p className="text-xs text-blue-300">%</p>
                  </div>
                )}
                {triageData.respiratory_rate && (
                  <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                    <p className="text-xs text-blue-200">Frecuencia Respiratoria</p>
                    <p className="text-lg font-bold text-white">{triageData.respiratory_rate}</p>
                    <p className="text-xs text-blue-300">rpm</p>
                  </div>
                )}
                {triageData.weight && (
                  <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                    <p className="text-xs text-blue-200">Peso</p>
                    <p className="text-lg font-bold text-white">{triageData.weight}</p>
                    <p className="text-xs text-blue-300">kg</p>
                  </div>
                )}
                {triageData.height && (
                  <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                    <p className="text-xs text-blue-200">Altura</p>
                    <p className="text-lg font-bold text-white">{triageData.height}</p>
                    <p className="text-xs text-blue-300">cm</p>
                  </div>
                )}
                {triageData.bmi && (
                  <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                    <p className="text-xs text-blue-200">IMC</p>
                    <p className="text-lg font-bold text-white">{triageData.bmi}</p>
                    <p className="text-xs text-blue-300">kg/m²</p>
                  </div>
                )}
              </div>
            </div>

            {/* Síntomas y Observaciones */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Síntomas Adicionales */}
              {triageData.symptoms && (
                <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                  <h3 className="text-lg font-semibold text-white mb-4">
                    Síntomas Adicionales
                  </h3>
                  <div className="space-y-2">
                    {triageData.symptoms.split(', ').map((symptom, index) => (
                      <span key={index} className="inline-block bg-blue-500/20 text-blue-300 px-3 py-1 rounded-full text-sm mr-2 mb-2">
                        {symptom}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Escala de Dolor */}
              {triageData.pain_scale && (
                <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                  <h3 className="text-lg font-semibold text-white mb-4">
                    Evaluación de Dolor
                  </h3>
                  <div className="flex items-center space-x-4">
                    <div className="text-center">
                      <p className="text-sm text-blue-200">Escala (0-10)</p>
                      <p className="text-3xl font-bold text-white">{triageData.pain_scale}</p>
                      <p className="text-xs text-blue-300">
                        {triageData.pain_scale <= 3 ? 'Leve' : 
                         triageData.pain_scale <= 6 ? 'Moderado' : 'Severo'}
                      </p>
                    </div>
                    {triageData.pain_location && (
                      <div>
                        <p className="text-sm text-blue-200">Ubicación</p>
                        <p className="text-white">{triageData.pain_location}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Observaciones */}
            {triageData.observations && (
              <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                <h3 className="text-lg font-semibold text-white mb-4">
                  Observaciones de Enfermería
                </h3>
                <p className="text-blue-100 bg-white/5 p-3 rounded-lg border border-white/10">
                  {triageData.observations}
                </p>
              </div>
            )}
          </div>

          {/* Panel Lateral - Prioridad y Tiempo */}
          <div className="space-y-6">
            {/* Nivel de Prioridad */}
            <div className="bg-white/5 rounded-xl p-4 border border-white/10">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                <AlertTriangle className="h-5 w-5 mr-2 text-red-400" />
                Nivel de Prioridad
              </h3>
              <div className="text-center">
                <span className={`inline-block px-4 py-2 rounded-lg text-sm font-medium ${getPriorityColor(triageData.triage_priority)}`}>
                  {getPriorityLabel(triageData.triage_priority)}
                </span>
                <p className="text-blue-200 text-sm mt-3">
                  Clasificación Manchester
                </p>
              </div>
            </div>

            {/* Información Temporal */}
            <div className="bg-white/5 rounded-xl p-4 border border-white/10">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                <Clock className="h-5 w-5 mr-2 text-blue-400" />
                Información Temporal
              </h3>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-blue-200">Triaje completado</p>
                  <p className="text-white font-medium">
                    {triageData.completed_at && format(new Date(triageData.completed_at), 'dd/MM/yyyy HH:mm', { locale: es })}
                  </p>
                </div>
                {triageData.nurse_name && (
                  <div>
                    <p className="text-sm text-blue-200">Realizado por</p>
                    <p className="text-white font-medium">{triageData.nurse_name}</p>
                  </div>
                )}
                {triageData.waiting_time && (
                  <div>
                    <p className="text-sm text-blue-200">Tiempo de espera</p>
                    <p className="text-white font-medium">{triageData.waiting_time} minutos</p>
                  </div>
                )}
              </div>
            </div>

            {/* Alergias y Medicamentos */}
            {(triageData.allergies || triageData.current_medications) && (
              <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                <h3 className="text-lg font-semibold text-white mb-4">
                  Información Clínica Adicional
                </h3>
                {triageData.allergies && (
                  <div className="mb-3">
                    <p className="text-sm text-blue-200">Alergias</p>
                    <p className="text-white text-sm">{triageData.allergies}</p>
                  </div>
                )}
                {triageData.current_medications && (
                  <div>
                    <p className="text-sm text-blue-200">Medicamentos actuales</p>
                    <p className="text-white text-sm">{triageData.current_medications}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Botón de Cerrar */}
        <div className="flex justify-end mt-6 pt-4 border-t border-white/10">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition duration-200"
          >
            Cerrar
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default TriageViewer;
