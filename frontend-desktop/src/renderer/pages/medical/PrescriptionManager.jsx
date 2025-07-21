import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { 
  Pill, Plus, Search, Edit, Trash2, Eye, 
  User, Calendar, Filter, RefreshCw,
  CheckCircle, XCircle, Clock, FileText,
  Printer, Download, AlertCircle, History
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import medicalRecordService from '../../services/medicalRecordService';
import patientService from '../../services/patientService';
import { useAuth } from '../../hooks/useAuth';

const PrescriptionManager = () => {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingPrescription, setEditingPrescription] = useState(null);
  const [viewMode, setViewMode] = useState('my-prescriptions'); // 'my-prescriptions' or 'all-prescriptions'
  const [prescriptionForm, setPrescriptionForm] = useState({
    patient_id: '',
    medication: '',
    dosage: '',
    frequency: '',
    duration: '',
    instructions: '',
    notes: '',
    valid_until: '',
    diagnosis: ''
  });

  const queryClient = useQueryClient();

  // Obtener lista de pacientes para el selector
  const { data: patientsData } = useQuery({
    queryKey: ['patients'],
    queryFn: () => patientService.getPatients(),
  });

  // Obtener recetas del doctor actual
  const { data: doctorPrescriptions, isLoading: loadingDoctorPrescriptions } = useQuery({
    queryKey: ['doctorPrescriptions'],
    queryFn: () => medicalRecordService.getDoctorPrescriptions(),
    enabled: viewMode === 'my-prescriptions' && user?.role === 'doctor',
  });

  // Obtener todas las recetas
  const { data: allPrescriptions, isLoading: loadingPrescriptions, refetch } = useQuery({
    queryKey: ['allPrescriptions', searchTerm, statusFilter, selectedPatientId],
    queryFn: async () => {
      console.log('Obteniendo recetas...');
      
      if (selectedPatientId) {
        console.log('Obteniendo recetas para paciente específico:', selectedPatientId);
        const prescriptions = await medicalRecordService.getPrescriptions(selectedPatientId);
        console.log('Recetas obtenidas para paciente específico:', prescriptions);
        return prescriptions;
      }
      
      // Obtener recetas de todos los pacientes
      const patients = patientsData?.results || [];
      console.log('Total de pacientes:', patients.length);
      const allPrescriptions = [];
      
      // Limitar a los primeros 10 pacientes para evitar demasiadas llamadas
      const limitedPatients = patients.slice(0, 10);
      console.log('Obteniendo recetas de', limitedPatients.length, 'pacientes');
      
      for (const patient of limitedPatients) {
        try {
          console.log('Obteniendo recetas del paciente:', patient.id);
          const prescriptions = await medicalRecordService.getPrescriptions(patient.id);
          console.log(`Recetas encontradas para ${patient.id}:`, prescriptions.length);
          
          if (prescriptions && prescriptions.length > 0) {
            const prescriptionsWithPatient = prescriptions.map(prescription => ({
              ...prescription,
              patient_name: `${patient.first_name || patient.name || 'Sin nombre'} ${patient.last_name || ''}`.trim(),
              patient_id: patient.id
            }));
            allPrescriptions.push(...prescriptionsWithPatient);
          }
        } catch (error) {
          console.log(`Error obteniendo recetas del paciente ${patient.id}:`, error.message);
          // Continuar con el siguiente paciente si hay error
        }
      }
      
      console.log('Total de recetas encontradas:', allPrescriptions.length);
      return allPrescriptions;
    },
    enabled: !!patientsData?.results,
    staleTime: 0, // Hacer que siempre refetch
    cacheTime: 0, // No cachear
  });

  // Mutation para crear receta
  const createPrescriptionMutation = useMutation({
    mutationFn: (data) => medicalRecordService.createPrescription(data.patient, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['allPrescriptions']);
      queryClient.invalidateQueries(['prescriptions']);
      resetForm();
      setShowCreateForm(false);
      console.log('Receta creada exitosamente');
    },
    onError: (error) => {
      console.error('Error detallado al crear receta:', error);
      console.error('Response data:', JSON.stringify(error.response?.data, null, 2));
      console.error('Response status:', error.response?.status);
      console.error('Response headers:', error.response?.headers);
    },
  });

  // Mutation para actualizar receta
  const updatePrescriptionMutation = useMutation({
    mutationFn: async (data) => {
      const { id, ...updateData } = data;
      return medicalRecordService.updatePrescription(id, updateData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['allPrescriptions']);
      queryClient.invalidateQueries(['prescriptions']);
      setEditingPrescription(null);
      resetForm();
      setShowCreateForm(false);
      console.log('Receta actualizada exitosamente');
    },
    onError: (error) => {
      console.error('Error al actualizar receta:', error);
      console.error('Detalles del error:', error.response?.data);
    },
  });

  // Mutation para eliminar receta
  const deletePrescriptionMutation = useMutation({
    mutationFn: async (prescriptionId) => {
      return medicalRecordService.deletePrescription(prescriptionId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['allPrescriptions']);
      queryClient.invalidateQueries(['prescriptions']);
      console.log('Receta eliminada exitosamente');
    },
    onError: (error) => {
      console.error('Error al eliminar receta:', error);
    },
  });

  const patients = patientsData?.results || [];
  
  // Asegurar que doctorPrescriptions sea un array
  const doctorPrescriptionsArray = Array.isArray(doctorPrescriptions) 
    ? doctorPrescriptions 
    : (doctorPrescriptions?.results || doctorPrescriptions?.data || []);
  
  // Usar recetas del doctor o todas según el modo seleccionado
  const prescriptions = viewMode === 'my-prescriptions' && user?.role === 'doctor' 
    ? doctorPrescriptionsArray
    : (allPrescriptions || []);
  
  const isLoading = viewMode === 'my-prescriptions' && user?.role === 'doctor'
    ? loadingDoctorPrescriptions
    : loadingPrescriptions;

  console.log('Render - viewMode:', viewMode);
  console.log('Render - user role:', user?.role);
  console.log('Render - doctorPrescriptions:', doctorPrescriptions);
  console.log('Render - doctorPrescriptionsArray:', doctorPrescriptionsArray);
  console.log('Render - prescriptions:', prescriptions);
  console.log('Render - prescriptions type:', typeof prescriptions);
  console.log('Render - prescriptions is array?:', Array.isArray(prescriptions));
  console.log('Render - prescriptions length:', prescriptions.length);
  console.log('Render - allPrescriptions:', allPrescriptions);
  console.log('Render - loadingPrescriptions:', loadingPrescriptions);

  // Filtrar recetas
  const filteredPrescriptions = prescriptions.filter(prescription => {
    const matchesSearch = 
      prescription.medication?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      prescription.patient_name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || prescription.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  console.log('Render - filteredPrescriptions:', filteredPrescriptions);
  console.log('Render - filteredPrescriptions length:', filteredPrescriptions.length);
  
  // Log detallado de la primera receta
  if (filteredPrescriptions.length > 0) {
    console.log('Primera receta completa:', JSON.stringify(filteredPrescriptions[0], null, 2));
  }

  const resetForm = () => {
    setPrescriptionForm({
      patient_id: '',
      medication: '',
      dosage: '',
      frequency: '',
      duration: '',
      instructions: '',
      notes: '',
      valid_until: '',
      diagnosis: ''
    });
  };

  const handleInputChange = (field, value) => {
    setPrescriptionForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingPrescription) {
      updatePrescriptionMutation.mutate({
        ...prescriptionForm,
        id: editingPrescription.id
      });
    } else {
      // Mapear los datos al formato que espera el servidor
      const prescriptionData = {
        patient: prescriptionForm.patient_id, // El servidor espera 'patient', no 'patient_id'
        medication: prescriptionForm.medication,
        dosage: prescriptionForm.dosage,
        frequency: prescriptionForm.frequency,
        duration: prescriptionForm.duration,
        instructions: prescriptionForm.instructions,
        notes: prescriptionForm.notes,
        valid_until: prescriptionForm.valid_until,
        diagnosis: prescriptionForm.diagnosis,
        date: new Date().toISOString()
      };
      
      // Log para depuración
      console.log('Datos de receta a enviar:', JSON.stringify(prescriptionData, null, 2));
      console.log('Patient ID:', prescriptionData.patient);
      
      createPrescriptionMutation.mutate(prescriptionData);
    }
  };

  const handleEdit = (prescription) => {
    setEditingPrescription(prescription);
    setPrescriptionForm({
      patient_id: prescription.patient_id || prescription.patient || '',
      medication: prescription.medication || '',
      dosage: prescription.dosage || '',
      frequency: prescription.frequency || '',
      duration: prescription.duration || '',
      instructions: prescription.instructions || '',
      notes: prescription.notes || '',
      valid_until: prescription.valid_until || '',
      diagnosis: prescription.diagnosis || ''
    });
    setShowCreateForm(true);
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="h-4 w-4 text-green-400" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-blue-400" />;
      case 'cancelled':
        return <XCircle className="h-4 w-4 text-red-400" />;
      default:
        return <Clock className="h-4 w-4 text-yellow-400" />;
    }
  };

  const getStatusText = (status) => {
    const statusMap = {
      'active': 'Activa',
      'completed': 'Completada', 
      'cancelled': 'Cancelada',
      'pending': 'Pendiente'
    };
    return statusMap[status] || 'Pendiente';
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'bg-green-500/20 text-green-300 border-green-500/30';
      case 'completed':
        return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
      case 'cancelled':
        return 'bg-red-500/20 text-red-300 border-red-500/30';
      default:
        return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30';
    }
  };

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
              Gestor de Recetas Médicas
            </h1>
            <p className="text-slate-200">
              {format(new Date(), "EEEE, d 'de' MMMM 'de' yyyy", { locale: es })}
            </p>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={() => refetch()}
              className="bg-white/10 text-white px-4 py-3 rounded-xl font-medium hover:bg-white/20 transition duration-200 flex items-center border border-white/20"
            >
              <RefreshCw className="h-5 w-5 mr-2" />
              Actualizar
            </button>
            <button
              onClick={() => {
                resetForm();
                setEditingPrescription(null);
                setShowCreateForm(!showCreateForm);
              }}
              className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-6 py-3 rounded-xl font-medium hover:from-blue-600 hover:to-indigo-700 transition duration-200 flex items-center"
            >
              <Plus className="h-5 w-5 mr-2" />
              Nueva Receta
            </button>
          </div>
        </motion.div>

        {/* Formulario de Nueva/Editar Receta */}
        {showCreateForm && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="backdrop-blur-lg bg-white/10 rounded-2xl p-6 border border-white/20 mb-6"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-white flex items-center">
                <Pill className="h-5 w-5 mr-2 text-blue-400" />
                {editingPrescription ? 'Editar Receta' : 'Nueva Receta Médica'}
              </h2>
              <button
                onClick={() => {
                  setShowCreateForm(false);
                  setEditingPrescription(null);
                  resetForm();
                }}
                className="text-slate-400 hover:text-white"
              >
                <XCircle className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-white mb-2">Paciente</label>
                  <select
                    value={prescriptionForm.patient_id}
                    onChange={(e) => handleInputChange('patient_id', e.target.value)}
                    required
                    disabled={!!editingPrescription}
                    className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                  >
                    <option value="" className="bg-slate-800">Seleccionar paciente</option>
                    {patients.map(patient => (
                      <option key={patient.id} value={patient.id} className="bg-slate-800">
                        {`${patient.first_name || patient.name || 'Sin nombre'} ${patient.last_name || ''}`.trim()} - {patient.dni}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-white mb-2">Medicamento</label>
                  <input
                    type="text"
                    placeholder="Nombre del medicamento"
                    value={prescriptionForm.medication}
                    onChange={(e) => handleInputChange('medication', e.target.value)}
                    required
                    className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-white mb-2">Dosis</label>
                  <input
                    type="text"
                    placeholder="500mg"
                    value={prescriptionForm.dosage}
                    onChange={(e) => handleInputChange('dosage', e.target.value)}
                    required
                    className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-white mb-2">Frecuencia</label>
                  <input
                    type="text"
                    placeholder="Cada 8 horas"
                    value={prescriptionForm.frequency}
                    onChange={(e) => handleInputChange('frequency', e.target.value)}
                    required
                    className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-white mb-2">Duración</label>
                  <input
                    type="text"
                    placeholder="7 días"
                    value={prescriptionForm.duration}
                    onChange={(e) => handleInputChange('duration', e.target.value)}
                    required
                    className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-white mb-2">Instrucciones</label>
                  <input
                    type="text"
                    placeholder="Tomar con alimentos"
                    value={prescriptionForm.instructions}
                    onChange={(e) => handleInputChange('instructions', e.target.value)}
                    className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-white mb-2">Válida hasta</label>
                  <input
                    type="date"
                    value={prescriptionForm.valid_until}
                    onChange={(e) => handleInputChange('valid_until', e.target.value)}
                    required
                    className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-white mb-2">Diagnóstico</label>
                <textarea
                  rows="2"
                  placeholder="Diagnóstico médico..."
                  value={prescriptionForm.diagnosis}
                  onChange={(e) => handleInputChange('diagnosis', e.target.value)}
                  required
                  className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>

              <div>
                <label className="block text-white mb-2">Notas Adicionales</label>
                <textarea
                  rows="3"
                  placeholder="Observaciones adicionales..."
                  value={prescriptionForm.notes}
                  onChange={(e) => handleInputChange('notes', e.target.value)}
                  className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateForm(false);
                    setEditingPrescription(null);
                    resetForm();
                  }}
                  className="px-6 py-3 bg-white/10 text-white rounded-xl hover:bg-white/20 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={createPrescriptionMutation.isLoading || updatePrescriptionMutation.isLoading}
                  className="px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl hover:from-green-600 hover:to-green-700 transition-colors disabled:opacity-50 flex items-center"
                >
                  <Pill className="h-4 w-4 mr-2" />
                  {editingPrescription ? 'Actualizar' : 'Crear'} Receta
                </button>
              </div>
            </form>
          </motion.div>
        )}

        {/* Filtros y Búsqueda */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="backdrop-blur-lg bg-white/10 rounded-2xl p-6 border border-white/20 mb-6"
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-5 w-5" />
              <input
                type="text"
                placeholder="Buscar por medicamento o paciente..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <select
              value={selectedPatientId}
              onChange={(e) => setSelectedPatientId(e.target.value)}
              className="px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="" className="bg-slate-800">Todos los pacientes</option>
              {patients.map(patient => (
                <option key={patient.id} value={patient.id} className="bg-slate-800">
                  {`${patient.first_name || patient.name || 'Sin nombre'} ${patient.last_name || ''}`.trim()}
                </option>
              ))}
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all" className="bg-slate-800">Todos los estados</option>
              <option value="active" className="bg-slate-800">Activa</option>
              <option value="completed" className="bg-slate-800">Completada</option>
              <option value="cancelled" className="bg-slate-800">Cancelada</option>
              <option value="pending" className="bg-slate-800">Pendiente</option>
            </select>
          </div>
        </motion.div>

        {/* Lista de Recetas */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="backdrop-blur-lg bg-white/10 rounded-2xl p-6 border border-white/20"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-white flex items-center">
              <FileText className="h-5 w-5 mr-2 text-blue-400" />
              Recetas Médicas ({filteredPrescriptions.length})
            </h2>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          ) : filteredPrescriptions.length === 0 ? (
            <div className="text-center py-8">
              <Pill className="h-16 w-16 text-slate-400 mx-auto mb-4" />
              <p className="text-slate-200 text-lg mb-2">No se encontraron recetas</p>
              <p className="text-slate-400">Crea tu primera receta médica usando el botón "Nueva Receta"</p>
            </div>
          ) : (
            <div className="space-y-4 max-h-[600px] overflow-y-auto">
              {filteredPrescriptions.map((prescription, index) => (
                <motion.div
                  key={prescription.id || index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-white/5 rounded-xl p-4 border border-white/10 hover:bg-white/10 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 flex items-center justify-center">
                          <Pill className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <h4 className="text-white font-medium">{prescription.medication}</h4>
                          <p className="text-slate-300 text-sm">
                            Paciente: {prescription.patient_name || 'No especificado'}
                          </p>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
                        <div>
                          <span className="text-xs text-slate-400">Dosis</span>
                          <p className="text-white text-sm">{prescription.dosage}</p>
                        </div>
                        <div>
                          <span className="text-xs text-slate-400">Frecuencia</span>
                          <p className="text-white text-sm">{prescription.frequency}</p>
                        </div>
                        <div>
                          <span className="text-xs text-slate-400">Duración</span>
                          <p className="text-white text-sm">{prescription.duration}</p>
                        </div>
                      </div>

                      {prescription.instructions && (
                        <div className="mb-3">
                          <span className="text-xs text-slate-400">Instrucciones</span>
                          <p className="text-slate-300 text-sm">{prescription.instructions}</p>
                        </div>
                      )}

                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center space-x-4">
                          <span className="text-slate-400">
                            {prescription.date ? format(parseISO(prescription.date), 'dd/MM/yyyy HH:mm') : 'Fecha no disponible'}
                          </span>
                          <div className={`px-2 py-1 rounded-full border flex items-center ${getStatusColor(prescription.status || 'pending')}`}>
                            {getStatusIcon(prescription.status || 'pending')}
                            <span className="ml-1">{getStatusText(prescription.status || 'pending')}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex space-x-2 ml-4">
                      <button
                        onClick={() => handleEdit(prescription)}
                        className="p-2 text-slate-300 hover:text-white hover:bg-blue-500/20 rounded-lg transition-colors"
                        title="Editar receta"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        className="p-2 text-slate-300 hover:text-white hover:bg-green-500/20 rounded-lg transition-colors"
                        title="Imprimir receta"
                      >
                        <Printer className="h-4 w-4" />
                      </button>
                      <button
                        className="p-2 text-slate-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                        title="Ver detalles"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => {
                          if (window.confirm('¿Estás seguro de que deseas eliminar esta receta?')) {
                            deletePrescriptionMutation.mutate(prescription.id);
                          }
                        }}
                        className="p-2 text-slate-300 hover:text-white hover:bg-red-500/20 rounded-lg transition-colors"
                        title="Eliminar receta"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
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

export default PrescriptionManager;
