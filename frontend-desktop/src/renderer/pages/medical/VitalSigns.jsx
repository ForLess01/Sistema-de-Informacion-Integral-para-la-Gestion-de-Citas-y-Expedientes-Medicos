import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { 
  Activity, Heart, Thermometer, Droplets, Eye, 
  Plus, Save, AlertTriangle, TrendingUp, TrendingDown,
  User, Search, ChevronRight, Calendar, Clock,
  Zap, Wind, Target
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import medicalRecordService from '../../services/medicalRecordService';
import patientService from '../../services/patientService';

const VitalSigns = () => {
  const [selectedPatientId, setSelectedPatientId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    systolic_bp: '',
    diastolic_bp: '',
    heart_rate: '',
    temperature: '',
    respiratory_rate: '',
    oxygen_saturation: '',
    weight: '',
    height: '',
    notes: ''
  });

  const queryClient = useQueryClient();

  // Obtener lista de pacientes
  const { data: patientsData, isLoading: loadingPatients } = useQuery({
    queryKey: ['patients', searchTerm],
    queryFn: () => patientService.getPatients(searchTerm),
  });

  // Obtener paciente seleccionado
  const { data: selectedPatient } = useQuery({
    queryKey: ['patient', selectedPatientId],
    queryFn: () => patientService.getPatientById(selectedPatientId),
    enabled: !!selectedPatientId,
  });

  // Obtener signos vitales del paciente
  const { data: vitalSigns, isLoading: loadingVitals } = useQuery({
    queryKey: ['vitalSigns', selectedPatientId],
    queryFn: () => medicalRecordService.getVitalSigns(selectedPatientId),
    enabled: !!selectedPatientId,
  });

  // Mutation para guardar signos vitales
  const saveMutation = useMutation({
    mutationFn: (data) => medicalRecordService.saveVitalSigns(selectedPatientId, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['vitalSigns', selectedPatientId]);
      setShowForm(false);
      setFormData({
        systolic_bp: '',
        diastolic_bp: '',
        heart_rate: '',
        temperature: '',
        respiratory_rate: '',
        oxygen_saturation: '',
        weight: '',
        height: '',
        notes: ''
      });
    },
  });

  const patients = patientsData?.results || [];

  // Función para determinar si un valor está fuera de rango
  const getValueStatus = (type, value) => {
    const ranges = {
      systolic_bp: { min: 90, max: 140, unit: 'mmHg' },
      diastolic_bp: { min: 60, max: 90, unit: 'mmHg' },
      heart_rate: { min: 60, max: 100, unit: 'bpm' },
      temperature: { min: 36.1, max: 37.2, unit: '°C' },
      respiratory_rate: { min: 12, max: 20, unit: '/min' },
      oxygen_saturation: { min: 95, max: 100, unit: '%' }
    };

    const range = ranges[type];
    if (!range || !value) return { status: 'normal', color: 'text-green-400' };

    const numValue = parseFloat(value);
    if (numValue < range.min || numValue > range.max) {
      return { status: 'abnormal', color: 'text-red-400' };
    }
    return { status: 'normal', color: 'text-green-400' };
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    saveMutation.mutate(formData);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-indigo-800 to-purple-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 space-y-4 sm:space-y-0"
        >
          <div>
            <h1 className="text-3xl font-bold text-white mb-2 flex items-center">
              <Activity className="h-8 w-8 mr-3 text-red-400" />
              Signos Vitales
            </h1>
            <p className="text-blue-200">
              {format(new Date(), "EEEE, d 'de' MMMM 'de' yyyy", { locale: es })}
            </p>
          </div>
          {selectedPatientId && (
            <button
              onClick={() => setShowForm(!showForm)}
              className="flex items-center px-4 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl hover:from-green-600 hover:to-green-700 transition-colors"
            >
              <Plus className="h-5 w-5 mr-2" />
              Registrar Signos Vitales
            </button>
          )}
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
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-300 h-5 w-5" />
                <input
                  type="text"
                  placeholder="Buscar pacientes..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Lista */}
              <div className="space-y-3 max-h-[600px] overflow-y-auto">
                {loadingPatients ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                  </div>
                ) : patients.length === 0 ? (
                  <p className="text-blue-200 text-center py-8">No se encontraron pacientes</p>
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
                          <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold">
                            {patient.first_name?.charAt(0) || patient.name?.charAt(0) || 'P'}
                          </div>
                          <div>
                            <h4 className="text-white font-medium">
                              {patient.first_name && patient.last_name 
                                ? `${patient.first_name} ${patient.last_name}`
                                : patient.name || 'Sin nombre'}
                            </h4>
                            <p className="text-blue-300 text-sm">
                              DNI: {patient.dni || 'N/A'}
                            </p>
                          </div>
                        </div>
                        <ChevronRight className="h-5 w-5 text-blue-400" />
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            </motion.div>
          </div>

          {/* Área Principal */}
          <div className="lg:col-span-2">
            {selectedPatientId ? (
              <div className="space-y-6">
                {/* Header del Paciente */}
                {selectedPatient && (
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="backdrop-blur-lg bg-white/10 rounded-2xl p-6 border border-white/20"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="w-16 h-16 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-xl">
                        {selectedPatient.first_name?.charAt(0) || selectedPatient.name?.charAt(0) || 'P'}
                      </div>
                      <div className="flex-1">
                        <h3 className="text-2xl font-bold text-white mb-1">
                          {selectedPatient.first_name && selectedPatient.last_name 
                            ? `${selectedPatient.first_name} ${selectedPatient.last_name}`
                            : selectedPatient.name || 'Sin nombre'}
                        </h3>
                        <div className="flex flex-wrap gap-4 text-sm text-blue-200">
                          <span>DNI: {selectedPatient.dni}</span>
                          <span>Edad: {selectedPatient.age} años</span>
                          <span>Teléfono: {selectedPatient.phone}</span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Formulario de Registro */}
                {showForm && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="backdrop-blur-lg bg-white/10 rounded-2xl p-6 border border-white/20"
                  >
                    <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
                      <Plus className="h-5 w-5 mr-2 text-green-400" />
                      Registrar Signos Vitales
                    </h3>

                    <form onSubmit={handleSubmit} className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Presión Arterial */}
                        <div className="space-y-2">
                          <label className="text-white font-medium flex items-center">
                            <Heart className="h-4 w-4 mr-2 text-red-400" />
                            Presión Arterial (mmHg)
                          </label>
                          <div className="grid grid-cols-2 gap-2">
                            <input
                              type="number"
                              placeholder="Sistólica"
                              value={formData.systolic_bp}
                              onChange={(e) => handleInputChange('systolic_bp', e.target.value)}
                              className="w-full px-3 py-2 bg-white/5 border border-white/20 rounded-lg text-white placeholder-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            <input
                              type="number"
                              placeholder="Diastólica"
                              value={formData.diastolic_bp}
                              onChange={(e) => handleInputChange('diastolic_bp', e.target.value)}
                              className="w-full px-3 py-2 bg-white/5 border border-white/20 rounded-lg text-white placeholder-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                        </div>

                        {/* Frecuencia Cardíaca */}
                        <div className="space-y-2">
                          <label className="text-white font-medium flex items-center">
                            <Activity className="h-4 w-4 mr-2 text-green-400" />
                            Frecuencia Cardíaca (bpm)
                          </label>
                          <input
                            type="number"
                            value={formData.heart_rate}
                            onChange={(e) => handleInputChange('heart_rate', e.target.value)}
                            className="w-full px-3 py-2 bg-white/5 border border-white/20 rounded-lg text-white placeholder-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>

                        {/* Temperatura */}
                        <div className="space-y-2">
                          <label className="text-white font-medium flex items-center">
                            <Thermometer className="h-4 w-4 mr-2 text-orange-400" />
                            Temperatura (°C)
                          </label>
                          <input
                            type="number"
                            step="0.1"
                            value={formData.temperature}
                            onChange={(e) => handleInputChange('temperature', e.target.value)}
                            className="w-full px-3 py-2 bg-white/5 border border-white/20 rounded-lg text-white placeholder-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>

                        {/* Frecuencia Respiratoria */}
                        <div className="space-y-2">
                          <label className="text-white font-medium flex items-center">
                            <Wind className="h-4 w-4 mr-2 text-cyan-400" />
                            Frecuencia Respiratoria (/min)
                          </label>
                          <input
                            type="number"
                            value={formData.respiratory_rate}
                            onChange={(e) => handleInputChange('respiratory_rate', e.target.value)}
                            className="w-full px-3 py-2 bg-white/5 border border-white/20 rounded-lg text-white placeholder-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>

                        {/* Saturación de Oxígeno */}
                        <div className="space-y-2">
                          <label className="text-white font-medium flex items-center">
                            <Droplets className="h-4 w-4 mr-2 text-blue-400" />
                            Saturación de Oxígeno (%)
                          </label>
                          <input
                            type="number"
                            value={formData.oxygen_saturation}
                            onChange={(e) => handleInputChange('oxygen_saturation', e.target.value)}
                            className="w-full px-3 py-2 bg-white/5 border border-white/20 rounded-lg text-white placeholder-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>

                        {/* Peso */}
                        <div className="space-y-2">
                          <label className="text-white font-medium flex items-center">
                            <Target className="h-4 w-4 mr-2 text-purple-400" />
                            Peso (kg)
                          </label>
                          <input
                            type="number"
                            step="0.1"
                            value={formData.weight}
                            onChange={(e) => handleInputChange('weight', e.target.value)}
                            className="w-full px-3 py-2 bg-white/5 border border-white/20 rounded-lg text-white placeholder-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      </div>

                      {/* Notas */}
                      <div className="space-y-2">
                        <label className="text-white font-medium">Notas</label>
                        <textarea
                          rows={3}
                          value={formData.notes}
                          onChange={(e) => handleInputChange('notes', e.target.value)}
                          className="w-full px-3 py-2 bg-white/5 border border-white/20 rounded-lg text-white placeholder-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                          placeholder="Observaciones adicionales..."
                        />
                      </div>

                      <div className="flex justify-end space-x-3">
                        <button
                          type="button"
                          onClick={() => setShowForm(false)}
                          className="px-4 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors border border-white/20"
                        >
                          Cancelar
                        </button>
                        <button
                          type="submit"
                          disabled={saveMutation.isPending}
                          className="px-4 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:from-green-600 hover:to-green-700 transition-colors flex items-center"
                        >
                          <Save className="h-4 w-4 mr-2" />
                          {saveMutation.isPending ? 'Guardando...' : 'Guardar'}
                        </button>
                      </div>
                    </form>
                  </motion.div>
                )}

                {/* Historial de Signos Vitales */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="backdrop-blur-lg bg-white/10 rounded-2xl p-6 border border-white/20"
                >
                  <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
                    <Activity className="h-5 w-5 mr-2 text-red-400" />
                    Historial de Signos Vitales
                  </h3>

                  {loadingVitals ? (
                    <div className="flex justify-center py-12">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
                    </div>
                  ) : !vitalSigns || vitalSigns.length === 0 ? (
                    <div className="text-center py-12">
                      <Activity className="h-16 w-16 text-blue-300 mx-auto mb-4" />
                      <p className="text-blue-200 text-lg">No hay registros de signos vitales</p>
                    </div>
                  ) : (
                    <div className="space-y-4 max-h-96 overflow-y-auto">
                      {vitalSigns.map((vital, index) => (
                        <motion.div
                          key={vital.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className="bg-white/5 rounded-xl p-4 border border-white/10"
                        >
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center space-x-2">
                              <Calendar className="h-4 w-4 text-blue-400" />
                              <span className="text-white font-medium">
                                {format(new Date(vital.recorded_at), 'dd/MM/yyyy', { locale: es })}
                              </span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Clock className="h-4 w-4 text-blue-300" />
                              <span className="text-blue-200 text-sm">
                                {format(new Date(vital.recorded_at), 'HH:mm')}
                              </span>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            {vital.systolic_bp && vital.diastolic_bp && (
                              <div className="flex items-center space-x-2">
                                <Heart className="h-4 w-4 text-red-400" />
                                <span className={`text-sm ${getValueStatus('systolic_bp', vital.systolic_bp).color}`}>
                                  {vital.systolic_bp}/{vital.diastolic_bp} mmHg
                                </span>
                              </div>
                            )}
                            {vital.heart_rate && (
                              <div className="flex items-center space-x-2">
                                <Activity className="h-4 w-4 text-green-400" />
                                <span className={`text-sm ${getValueStatus('heart_rate', vital.heart_rate).color}`}>
                                  {vital.heart_rate} bpm
                                </span>
                              </div>
                            )}
                            {vital.temperature && (
                              <div className="flex items-center space-x-2">
                                <Thermometer className="h-4 w-4 text-orange-400" />
                                <span className={`text-sm ${getValueStatus('temperature', vital.temperature).color}`}>
                                  {vital.temperature}°C
                                </span>
                              </div>
                            )}
                            {vital.respiratory_rate && (
                              <div className="flex items-center space-x-2">
                                <Wind className="h-4 w-4 text-cyan-400" />
                                <span className={`text-sm ${getValueStatus('respiratory_rate', vital.respiratory_rate).color}`}>
                                  {vital.respiratory_rate}/min
                                </span>
                              </div>
                            )}
                            {vital.oxygen_saturation && (
                              <div className="flex items-center space-x-2">
                                <Droplets className="h-4 w-4 text-blue-400" />
                                <span className={`text-sm ${getValueStatus('oxygen_saturation', vital.oxygen_saturation).color}`}>
                                  {vital.oxygen_saturation}%
                                </span>
                              </div>
                            )}
                            {vital.weight && (
                              <div className="flex items-center space-x-2">
                                <Target className="h-4 w-4 text-purple-400" />
                                <span className="text-blue-200 text-sm">
                                  {vital.weight} kg
                                </span>
                              </div>
                            )}
                          </div>

                          {vital.notes && (
                            <div className="mt-3 pt-3 border-t border-white/10">
                              <p className="text-blue-200 text-sm">{vital.notes}</p>
                            </div>
                          )}
                        </motion.div>
                      ))}
                    </div>
                  )}
                </motion.div>
              </div>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="backdrop-blur-lg bg-white/10 rounded-2xl p-12 border border-white/20 text-center"
              >
                <Activity className="h-16 w-16 text-blue-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">
                  Selecciona un Paciente
                </h3>
                <p className="text-blue-200">
                  Selecciona un paciente de la lista para registrar o ver sus signos vitales
                </p>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VitalSigns;
