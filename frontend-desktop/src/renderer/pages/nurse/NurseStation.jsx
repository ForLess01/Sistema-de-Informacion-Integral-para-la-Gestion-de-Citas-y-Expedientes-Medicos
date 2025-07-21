import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { 
  Activity, Heart, Thermometer, Droplets, Clock,
  Bell, AlertTriangle, CheckCircle, Pill, FileText,
  User, Calendar, Monitor, Zap, RefreshCw,
  ChevronRight, Plus, Minus, Eye, Edit3,
  ClipboardList, Stethoscope, Shield, Users
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import dashboardService from '../../services/dashboardService';
import medicalRecordService from '../../services/medicalRecordService';

const NurseStation = () => {
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [activeTab, setActiveTab] = useState('monitoring');
  const [showMedForm, setShowMedForm] = useState(false);
  const [medicationNote, setMedicationNote] = useState('');

  const queryClient = useQueryClient();

  // Obtener pacientes asignados a la enfermera
  const { data: assignedPatients, isLoading: loadingPatients } = useQuery({
    queryKey: ['nurseAssignedPatients'],
    queryFn: dashboardService.getNurseAssignedPatients,
    refetchInterval: 30000,
  });

  // Obtener medicamentos programados
  const { data: scheduledMedications, isLoading: loadingMeds } = useQuery({
    queryKey: ['scheduledMedications'],
    queryFn: dashboardService.getScheduledMedications,
    refetchInterval: 60000,
  });

  // Obtener tareas del turno
  const { data: shiftTasks, isLoading: loadingTasks } = useQuery({
    queryKey: ['nurseShiftTasks'],
    queryFn: dashboardService.getNurseShiftTasks,
  });

  // Obtener alertas activas
  const { data: activeAlerts, isLoading: loadingAlerts } = useQuery({
    queryKey: ['nurseActiveAlerts'],
    queryFn: dashboardService.getNurseActiveAlerts,
    refetchInterval: 15000,
  });

  // Mutation para administrar medicamento
  const administerMedication = useMutation({
    mutationFn: (data) => medicalRecordService.administerMedication(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['scheduledMedications']);
      setShowMedForm(false);
      setMedicationNote('');
    },
  });

  // Mutation para completar tarea
  const completeTask = useMutation({
    mutationFn: (taskId) => dashboardService.completeNurseTask(taskId),
    onSuccess: () => {
      queryClient.invalidateQueries(['nurseShiftTasks']);
    },
  });

  const tabs = [
    { id: 'monitoring', name: 'Monitoreo', icon: Monitor },
    { id: 'medications', name: 'Medicamentos', icon: Pill },
    { id: 'tasks', name: 'Tareas', icon: ClipboardList },
    { id: 'notes', name: 'Notas', icon: FileText },
  ];

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'critical': return 'bg-red-600 text-white';
      case 'high': return 'bg-orange-500 text-white';
      case 'medium': return 'bg-yellow-500 text-white';
      case 'low': return 'bg-green-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  const getVitalStatus = (vital, value) => {
    const ranges = {
      heart_rate: { normal: [60, 100], warning: [50, 120] },
      temperature: { normal: [36.1, 37.2], warning: [35.5, 38.0] },
      blood_pressure_sys: { normal: [90, 140], warning: [80, 160] },
      oxygen_saturation: { normal: [95, 100], warning: [90, 100] }
    };

    const range = ranges[vital];
    if (!range || !value) return 'text-gray-400';

    const numValue = parseFloat(value);
    if (numValue >= range.normal[0] && numValue <= range.normal[1]) {
      return 'text-green-400';
    } else if (numValue >= range.warning[0] && numValue <= range.warning[1]) {
      return 'text-yellow-400';
    }
    return 'text-red-400';
  };

  const handleMedicationAdmin = (medication) => {
    administerMedication.mutate({
      medicationId: medication.id,
      patientId: medication.patient_id,
      notes: medicationNote,
      timestamp: new Date().toISOString()
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-900 via-teal-800 to-blue-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 space-y-4 sm:space-y-0"
        >
          <div>
            <h1 className="text-3xl font-bold text-white mb-2 flex items-center">
              <Shield className="h-8 w-8 mr-3 text-green-400" />
              Estación de Enfermería
            </h1>
            <p className="text-green-200">
              {format(new Date(), "EEEE, d 'de' MMMM 'de' yyyy - HH:mm", { locale: es })}
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <button className="flex items-center px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl border border-white/20 transition-colors">
              <RefreshCw className="h-4 w-4 mr-2" />
              Actualizar
            </button>
            <div className="relative">
              <Bell className="h-6 w-6 text-green-200" />
              {activeAlerts?.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {activeAlerts.length}
                </span>
              )}
            </div>
          </div>
        </motion.div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="backdrop-blur-lg bg-white/10 rounded-2xl p-6 border border-white/20"
          >
            <div className="flex items-center justify-between">
              <div className="p-3 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600">
                <Users className="h-6 w-6 text-white" />
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-white">{assignedPatients?.length || 0}</p>
                <p className="text-sm text-green-200">Pacientes Asignados</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="backdrop-blur-lg bg-white/10 rounded-2xl p-6 border border-white/20"
          >
            <div className="flex items-center justify-between">
              <div className="p-3 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600">
                <Pill className="h-6 w-6 text-white" />
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-white">
                  {scheduledMedications?.filter(m => m.status === 'pending').length || 0}
                </p>
                <p className="text-sm text-green-200">Medicamentos Pendientes</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="backdrop-blur-lg bg-white/10 rounded-2xl p-6 border border-white/20"
          >
            <div className="flex items-center justify-between">
              <div className="p-3 rounded-xl bg-gradient-to-r from-red-500 to-red-600">
                <AlertTriangle className="h-6 w-6 text-white" />
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-white">{activeAlerts?.length || 0}</p>
                <p className="text-sm text-green-200">Alertas Activas</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="backdrop-blur-lg bg-white/10 rounded-2xl p-6 border border-white/20"
          >
            <div className="flex items-center justify-between">
              <div className="p-3 rounded-xl bg-gradient-to-r from-green-500 to-green-600">
                <CheckCircle className="h-6 w-6 text-white" />
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-white">
                  {shiftTasks?.filter(t => t.status === 'completed').length || 0}
                </p>
                <p className="text-sm text-green-200">Tareas Completadas</p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Active Alerts */}
        {activeAlerts && activeAlerts.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mb-8 backdrop-blur-lg bg-red-500/10 rounded-2xl p-6 border border-red-500/20"
          >
            <h3 className="text-xl font-semibold text-red-300 mb-4 flex items-center">
              <AlertTriangle className="h-5 w-5 mr-2" />
              Alertas Críticas
            </h3>
            <div className="space-y-3">
              {activeAlerts.map((alert) => (
                <div
                  key={alert.id}
                  className="bg-red-500/10 rounded-xl p-4 border border-red-500/20 flex items-center justify-between"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                    <div>
                      <h4 className="text-white font-medium">{alert.patient_name}</h4>
                      <p className="text-red-200 text-sm">{alert.message}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getPriorityColor(alert.priority)}`}>
                      {alert.priority === 'critical' ? 'CRÍTICO' : alert.priority.toUpperCase()}
                    </span>
                    <p className="text-xs text-red-300 mt-1">
                      {format(new Date(alert.timestamp), 'HH:mm')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Patient List */}
          <div className="lg:col-span-1">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="backdrop-blur-lg bg-white/10 rounded-2xl p-6 border border-white/20 h-fit"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-white flex items-center">
                  <User className="h-5 w-5 mr-2 text-green-400" />
                  Mis Pacientes
                </h2>
              </div>

              <div className="space-y-3 max-h-[600px] overflow-y-auto">
                {loadingPatients ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                  </div>
                ) : assignedPatients?.length === 0 ? (
                  <p className="text-green-200 text-center py-8">No hay pacientes asignados</p>
                ) : (
                  assignedPatients?.map((patient) => (
                    <motion.div
                      key={patient.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      onClick={() => setSelectedPatient(patient)}
                      className={`p-4 rounded-xl border cursor-pointer transition-all duration-200 ${
                        selectedPatient?.id === patient.id
                          ? 'bg-green-500/20 border-green-500/50'
                          : 'bg-white/5 border-white/10 hover:bg-white/10'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-r from-green-500 to-teal-600 flex items-center justify-center text-white font-semibold">
                            {patient.name.charAt(0)}
                          </div>
                          <div>
                            <h4 className="text-white font-medium">{patient.name}</h4>
                            <p className="text-green-300 text-sm">Hab: {patient.room}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          {patient.alerts > 0 && (
                            <span className="inline-flex items-center px-2 py-1 rounded bg-red-500 text-white text-xs">
                              {patient.alerts}
                            </span>
                          )}
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="flex items-center">
                          <Heart className="h-3 w-3 mr-1 text-red-400" />
                          <span className={getVitalStatus('heart_rate', patient.heart_rate)}>
                            {patient.heart_rate || '--'} bpm
                          </span>
                        </div>
                        <div className="flex items-center">
                          <Thermometer className="h-3 w-3 mr-1 text-orange-400" />
                          <span className={getVitalStatus('temperature', patient.temperature)}>
                            {patient.temperature || '--'}°C
                          </span>
                        </div>
                        <div className="flex items-center">
                          <Activity className="h-3 w-3 mr-1 text-blue-400" />
                          <span className={getVitalStatus('blood_pressure_sys', patient.bp_systolic)}>
                            {patient.bp_systolic || '--'}/{patient.bp_diastolic || '--'}
                          </span>
                        </div>
                        <div className="flex items-center">
                          <Droplets className="h-3 w-3 mr-1 text-cyan-400" />
                          <span className={getVitalStatus('oxygen_saturation', patient.oxygen_saturation)}>
                            {patient.oxygen_saturation || '--'}%
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            </motion.div>
          </div>

          {/* Main Content Area */}
          <div className="lg:col-span-3">
            {selectedPatient ? (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="backdrop-blur-lg bg-white/10 rounded-2xl p-6 border border-white/20"
              >
                {/* Patient Header */}
                <div className="flex items-center justify-between mb-6 p-4 bg-white/5 rounded-xl border border-white/10">
                  <div className="flex items-center space-x-4">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-r from-green-500 to-teal-600 flex items-center justify-center text-white font-bold text-xl">
                      {selectedPatient.name.charAt(0)}
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-white">{selectedPatient.name}</h3>
                      <div className="flex items-center space-x-4 text-sm text-green-200">
                        <span>Habitación: {selectedPatient.room}</span>
                        <span>Edad: {selectedPatient.age} años</span>
                        <span>DNI: {selectedPatient.dni}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-green-300 text-sm">Último registro</p>
                    <p className="text-white font-medium">
                      {selectedPatient.last_vitals && format(new Date(selectedPatient.last_vitals), 'HH:mm')}
                    </p>
                  </div>
                </div>

                {/* Tabs */}
                <div className="flex space-x-1 mb-6 bg-white/5 p-1 rounded-xl">
                  {tabs.map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex-1 flex items-center justify-center px-4 py-2 rounded-lg font-medium transition-colors ${
                        activeTab === tab.id
                          ? 'bg-green-500 text-white'
                          : 'text-green-200 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      <tab.icon className="h-4 w-4 mr-2" />
                      {tab.name}
                    </button>
                  ))}
                </div>

                {/* Tab Content */}
                <div className="min-h-96">
                  {activeTab === 'monitoring' && (
                    <div className="space-y-6">
                      <h4 className="text-lg font-semibold text-white mb-4">Monitoreo en Tiempo Real</h4>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center">
                              <Heart className="h-5 w-5 mr-2 text-red-400" />
                              <span className="text-white font-medium">Frecuencia Cardíaca</span>
                            </div>
                            <span className={`text-2xl font-bold ${getVitalStatus('heart_rate', selectedPatient.heart_rate)}`}>
                              {selectedPatient.heart_rate || '--'} bpm
                            </span>
                          </div>
                          <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-gradient-to-r from-red-500 to-pink-500 transition-all duration-1000"
                              style={{ width: `${Math.min((selectedPatient.heart_rate || 0) / 120 * 100, 100)}%` }}
                            />
                          </div>
                        </div>

                        <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center">
                              <Thermometer className="h-5 w-5 mr-2 text-orange-400" />
                              <span className="text-white font-medium">Temperatura</span>
                            </div>
                            <span className={`text-2xl font-bold ${getVitalStatus('temperature', selectedPatient.temperature)}`}>
                              {selectedPatient.temperature || '--'}°C
                            </span>
                          </div>
                          <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-gradient-to-r from-orange-500 to-red-500 transition-all duration-1000"
                              style={{ width: `${Math.min(((selectedPatient.temperature || 36) - 35) / 5 * 100, 100)}%` }}
                            />
                          </div>
                        </div>

                        <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center">
                              <Activity className="h-5 w-5 mr-2 text-blue-400" />
                              <span className="text-white font-medium">Presión Arterial</span>
                            </div>
                            <span className={`text-2xl font-bold ${getVitalStatus('blood_pressure_sys', selectedPatient.bp_systolic)}`}>
                              {selectedPatient.bp_systolic || '--'}/{selectedPatient.bp_diastolic || '--'}
                            </span>
                          </div>
                        </div>

                        <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center">
                              <Droplets className="h-5 w-5 mr-2 text-cyan-400" />
                              <span className="text-white font-medium">Saturación O₂</span>
                            </div>
                            <span className={`text-2xl font-bold ${getVitalStatus('oxygen_saturation', selectedPatient.oxygen_saturation)}`}>
                              {selectedPatient.oxygen_saturation || '--'}%
                            </span>
                          </div>
                          <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all duration-1000"
                              style={{ width: `${selectedPatient.oxygen_saturation || 0}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeTab === 'medications' && (
                    <div>
                      <h4 className="text-lg font-semibold text-white mb-4">Medicamentos Programados</h4>
                      <div className="space-y-3">
                        {loadingMeds ? (
                          <div className="flex justify-center py-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                          </div>
                        ) : (
                          scheduledMedications?.filter(med => med.patient_id === selectedPatient.id).map((medication) => (
                            <div
                              key={medication.id}
                              className="bg-white/5 rounded-xl p-4 border border-white/10 flex items-center justify-between"
                            >
                              <div className="flex items-center space-x-4">
                                <div className="p-2 rounded-lg bg-gradient-to-r from-purple-500 to-indigo-600">
                                  <Pill className="h-5 w-5 text-white" />
                                </div>
                                <div>
                                  <h5 className="text-white font-medium">{medication.name}</h5>
                                  <p className="text-green-200 text-sm">
                                    {medication.dosage} - {medication.frequency}
                                  </p>
                                  <p className="text-green-300 text-xs">
                                    Próxima dosis: {format(new Date(medication.next_dose), 'HH:mm')}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center space-x-2">
                                {medication.status === 'pending' ? (
                                  <button
                                    onClick={() => {
                                      setShowMedForm(medication);
                                    }}
                                    className="px-3 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg text-sm transition-colors"
                                  >
                                    Administrar
                                  </button>
                                ) : (
                                  <span className="px-3 py-2 bg-gray-500 text-white rounded-lg text-sm">
                                    Administrado
                                  </span>
                                )}
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}

                  {activeTab === 'tasks' && (
                    <div>
                      <h4 className="text-lg font-semibold text-white mb-4">Tareas del Turno</h4>
                      <div className="space-y-3">
                        {shiftTasks?.map((task) => (
                          <div
                            key={task.id}
                            className="bg-white/5 rounded-xl p-4 border border-white/10 flex items-center justify-between"
                          >
                            <div className="flex items-center space-x-4">
                              <div className={`p-2 rounded-lg ${task.status === 'completed' ? 'bg-green-500' : 'bg-orange-500'}`}>
                                <ClipboardList className="h-5 w-5 text-white" />
                              </div>
                              <div>
                                <h5 className="text-white font-medium">{task.title}</h5>
                                <p className="text-green-200 text-sm">{task.description}</p>
                                <p className="text-green-300 text-xs">
                                  {task.due_time && format(new Date(task.due_time), 'HH:mm')}
                                </p>
                              </div>
                            </div>
                            <div>
                              {task.status === 'pending' ? (
                                <button
                                  onClick={() => completeTask.mutate(task.id)}
                                  className="px-3 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg text-sm transition-colors"
                                >
                                  Completar
                                </button>
                              ) : (
                                <CheckCircle className="h-6 w-6 text-green-400" />
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {activeTab === 'notes' && (
                    <div>
                      <h4 className="text-lg font-semibold text-white mb-4">Notas de Enfermería</h4>
                      <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                        <textarea
                          rows={8}
                          placeholder="Escribir nota de enfermería..."
                          className="w-full bg-transparent text-white placeholder-green-300 border border-white/20 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
                        />
                        <div className="flex justify-end mt-3">
                          <button className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors">
                            Guardar Nota
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="backdrop-blur-lg bg-white/10 rounded-2xl p-12 border border-white/20 text-center"
              >
                <Shield className="h-16 w-16 text-green-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">
                  Selecciona un Paciente
                </h3>
                <p className="text-green-200">
                  Selecciona un paciente de la lista para ver su información detallada y realizar tareas de enfermería
                </p>
              </motion.div>
            )}
          </div>
        </div>

        {/* Medication Administration Modal */}
        {showMedForm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-gradient-to-br from-green-900 to-teal-900 rounded-2xl p-6 w-full max-w-md border border-white/20"
            >
              <h3 className="text-xl font-semibold text-white mb-4">
                Confirmar Administración
              </h3>
              <div className="mb-4">
                <p className="text-green-200 mb-2">Medicamento: <span className="text-white font-medium">{showMedForm.name}</span></p>
                <p className="text-green-200 mb-2">Dosificación: <span className="text-white font-medium">{showMedForm.dosage}</span></p>
                <p className="text-green-200 mb-4">Paciente: <span className="text-white font-medium">{selectedPatient?.name}</span></p>
                
                <textarea
                  rows={3}
                  placeholder="Notas sobre la administración (opcional)..."
                  value={medicationNote}
                  onChange={(e) => setMedicationNote(e.target.value)}
                  className="w-full bg-white/5 text-white placeholder-green-300 border border-white/20 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
                />
              </div>
              
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowMedForm(false)}
                  className="px-4 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors border border-white/20"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => handleMedicationAdmin(showMedForm)}
                  disabled={administerMedication.isPending}
                  className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors"
                >
                  {administerMedication.isPending ? 'Procesando...' : 'Confirmar'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
};

export default NurseStation;
