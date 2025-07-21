import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, AlertTriangle, Clock, User, Activity, MapPin, Phone, AlertCircle } from 'lucide-react';
import emergencyService from '../../services/emergencyService';

const EmergencyQueue = () => {
  const { data: emergencyPatients, isLoading } = useQuery({
    queryKey: ['emergencyPatients'],
    queryFn: () => emergencyService.getEmergencyPatients('waiting')
  });

  const getTriageColor = (level) => {
    const colors = {
      1: 'bg-red-500',
      2: 'bg-orange-500',
      3: 'bg-yellow-500',
      4: 'bg-green-500',
      5: 'bg-blue-500',
    };
    return colors[level] || 'bg-gray-500';
  };

  const getTriageLabel = (level) => {
    const labels = {
      1: 'Resucitación',
      2: 'Emergencia',
      3: 'Urgente',
      4: 'Menos Urgente',
      5: 'No Urgente',
    };
    return labels[level] || 'Sin clasificar';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-900 via-red-800 to-red-600 p-6">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex justify-between items-center mb-8"
        >
          <h1 className="text-3xl font-bold text-white">Cola de Emergencias</h1>
          <p className="text-white opacity-75">Pacientes en espera de atención</p>
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
          ) : !emergencyPatients || emergencyPatients.length === 0 ? (
            <div className="text-center py-12">
              <AlertTriangle className="h-16 w-16 text-red-400 mx-auto mb-4" />
              <h3 className="text-xl font-medium text-white mb-2">No hay pacientes en espera</h3>
              <p className="text-red-200">La cola de emergencias está vacía.</p>
            </div>
          ) : (
            <div className="divide-y divide-white/10">
              {emergencyPatients.map((patient, index) => (
                <motion.div
                  key={patient.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="p-6 hover:bg-white/5 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className={`w-10 h-10 flex-shrink-0 rounded-full ${getTriageColor(patient.triage_level)} flex items-center justify-center text-white font-bold`}>
                        {getTriageLabel(patient.triage_level)[0]}
                      </div>
                      <div>
                        <h3 className="text-lg font-medium text-white">{patient.name}</h3>
                        <p className="text-red-200 text-sm">{patient.chief_complaint}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="flex items-center text-red-300">
                        <Clock className="h-5 w-5 mr-1" />
                        <span className="text-sm">{patient.wait_time} min</span>
                      </div>
                      <CheckCircle className="h-5 w-5 text-green-400" />
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default EmergencyQueue;
