import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { 
  AlertCircle, Clock, User, Activity, 
  Plus, Edit, Eye, Shield
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import emergencyService from '../../services/emergencyService';
import toast from 'react-hot-toast';

const EmergencyManager = () => {
  const [activeTab, setActiveTab] = useState('active');
  const queryClient = useQueryClient();

  // Obtener pacientes de emergencia
  const { data: emergencyPatients, isLoading } = useQuery({
    queryKey: ['emergencyPatients', activeTab],
    queryFn: () => emergencyService.getEmergencyPatients(activeTab),
  });

  // Mutation para actualizar triaje
  const updateTriageMutation = useMutation({
    mutationFn: ({ patientId, data }) => emergencyService.updateTriage(patientId, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['emergencyPatients']);
      toast.success('Triaje actualizado exitosamente');
    },
  });

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

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white/10 rounded-2xl border border-white/20 p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-white">Gestión de Emergencias</h2>
          <button className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition flex items-center">
            <Plus className="h-4 w-4 mr-2" />
            Nuevo Ingreso
          </button>
        </div>

        {/* Tabs */}
        <div className="flex space-x-1 mb-6 border-b border-white/20">
          <button
            onClick={() => setActiveTab('active')}
            className={`px-4 py-2 transition-colors ${
              activeTab === 'active'
                ? 'text-blue-400 border-b-2 border-blue-400'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Activos
          </button>
          <button
            onClick={() => setActiveTab('waiting')}
            className={`px-4 py-2 transition-colors ${
              activeTab === 'waiting'
                ? 'text-blue-400 border-b-2 border-blue-400'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            En Espera
          </button>
          <button
            onClick={() => setActiveTab('discharged')}
            className={`px-4 py-2 transition-colors ${
              activeTab === 'discharged'
                ? 'text-blue-400 border-b-2 border-blue-400'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Alta
          </button>
        </div>

        {/* Lista de pacientes */}
        <div className="space-y-4">
          {emergencyPatients?.map((patient) => (
            <motion.div
              key={patient.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white/5 rounded-xl p-4 border border-white/10"
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <div className={`w-3 h-3 rounded-full ${getTriageColor(patient.triage_level)}`}></div>
                    <h3 className="text-white font-medium">{patient.name}</h3>
                    <span className="text-sm text-gray-400">#{patient.record_number}</span>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-gray-400">Edad:</span>
                      <span className="text-white ml-2">{patient.age} años</span>
                    </div>
                    <div>
                      <span className="text-gray-400">Triaje:</span>
                      <span className="text-white ml-2">{getTriageLabel(patient.triage_level)}</span>
                    </div>
                    <div>
                      <span className="text-gray-400">Ingreso:</span>
                      <span className="text-white ml-2">
                        {format(new Date(patient.admission_time), 'HH:mm', { locale: es })}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-400">Tiempo:</span>
                      <span className="text-white ml-2">{patient.wait_time} min</span>
                    </div>
                  </div>

                  <div className="mt-2">
                    <p className="text-sm text-gray-300">{patient.chief_complaint}</p>
                  </div>
                </div>

                <div className="flex space-x-2 ml-4">
                  <button className="p-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition">
                    <Eye className="h-4 w-4" />
                  </button>
                  <button className="p-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition">
                    <Edit className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Signos vitales */}
              {patient.vital_signs && (
                <div className="mt-4 pt-4 border-t border-white/10">
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-sm">
                    <div className="bg-white/5 rounded p-2">
                      <span className="text-gray-400 block">T.A.</span>
                      <span className="text-white">{patient.vital_signs.blood_pressure}</span>
                    </div>
                    <div className="bg-white/5 rounded p-2">
                      <span className="text-gray-400 block">F.C.</span>
                      <span className="text-white">{patient.vital_signs.heart_rate} lpm</span>
                    </div>
                    <div className="bg-white/5 rounded p-2">
                      <span className="text-gray-400 block">Temp.</span>
                      <span className="text-white">{patient.vital_signs.temperature}°C</span>
                    </div>
                    <div className="bg-white/5 rounded p-2">
                      <span className="text-gray-400 block">F.R.</span>
                      <span className="text-white">{patient.vital_signs.respiratory_rate} rpm</span>
                    </div>
                    <div className="bg-white/5 rounded p-2">
                      <span className="text-gray-400 block">SpO2</span>
                      <span className="text-white">{patient.vital_signs.oxygen_saturation}%</span>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          ))}

          {emergencyPatients?.length === 0 && (
            <div className="text-center py-8">
              <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-400">No hay pacientes en esta categoría</p>
            </div>
          )}
        </div>
      </div>

      {/* Estadísticas rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white/10 rounded-xl p-4 border border-white/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Total Activos</p>
              <p className="text-2xl font-bold text-white">12</p>
            </div>
            <Activity className="h-8 w-8 text-blue-400" />
          </div>
        </div>
        <div className="bg-white/10 rounded-xl p-4 border border-white/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Tiempo Promedio</p>
              <p className="text-2xl font-bold text-white">28 min</p>
            </div>
            <Clock className="h-8 w-8 text-yellow-400" />
          </div>
        </div>
        <div className="bg-white/10 rounded-xl p-4 border border-white/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Camas Disponibles</p>
              <p className="text-2xl font-bold text-white">8</p>
            </div>
            <Shield className="h-8 w-8 text-green-400" />
          </div>
        </div>
        <div className="bg-white/10 rounded-xl p-4 border border-white/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Críticos</p>
              <p className="text-2xl font-bold text-white">3</p>
            </div>
            <AlertCircle className="h-8 w-8 text-red-400" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmergencyManager;
