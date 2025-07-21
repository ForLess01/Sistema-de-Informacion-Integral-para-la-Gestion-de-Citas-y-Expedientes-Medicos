import React, { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, CheckCircle, Clock, User, Users,
  Phone, Calendar, MapPin, AlertCircle,
  CheckSquare, RefreshCw, Filter, UserCheck
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import patientService from '../../services/patientService';

const CheckIn = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [statusFilter, setStatusFilter] = useState('scheduled'); // scheduled, checked_in, all
  const [specialtyFilter, setSpecialtyFilter] = useState('all');
  const [checkedInPatients, setCheckedInPatients] = useState([]);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const queryClient = useQueryClient();

  // Obtener pacientes con citas programadas para hoy
  const { data: patientsData, isLoading, refetch } = useQuery({
    queryKey: ['todayAppointments', {
      search: searchTerm,
      status: statusFilter,
      specialty: specialtyFilter
    }],
    queryFn: () => patientService.getTodayAppointments({
      search: searchTerm,
      status: statusFilter === 'all' ? undefined : statusFilter,
      specialty: specialtyFilter === 'all' ? undefined : specialtyFilter
    }),
  });

  const patients = patientsData?.results || [];

  // Mutation para check-in
  const checkInMutation = useMutation({
    mutationFn: (data) => patientService.checkInPatient(data),
    onSuccess: (data) => {
      setCheckedInPatients(prev => [...prev, data.patient_id]);
      setSuccessMessage(`Check-in realizado exitosamente para ${data.patient_name}`);
      queryClient.invalidateQueries(['todayAppointments']);
      queryClient.invalidateQueries(['adminDashboardStats']);
      setTimeout(() => setSuccessMessage(''), 3000);
    },
    onError: (error) => {
      setErrorMessage(
        error.response?.data?.detail || 
        error.response?.data?.message || 
        'Error al realizar el check-in'
      );
      setTimeout(() => setErrorMessage(''), 3000);
    },
  });

  const handleCheckIn = (patient) => {
    setSelectedPatient(patient);
    checkInMutation.mutate({
      patient_id: patient.id,
      appointment_id: patient.appointment_id,
      check_in_time: new Date().toISOString()
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'checked_in':
        return 'bg-green-500/20 text-green-300';
      case 'scheduled':
        return 'bg-yellow-500/20 text-yellow-300';
      case 'cancelled':
        return 'bg-red-500/20 text-red-300';
      case 'completed':
        return 'bg-blue-500/20 text-blue-300';
      default:
        return 'bg-gray-500/20 text-gray-300';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'checked_in':
        return 'Registrado';
      case 'scheduled':
        return 'Programado';
      case 'cancelled':
        return 'Cancelado';
      case 'completed':
        return 'Completado';
      default:
        return status;
    }
  };

  const isCheckedIn = (patientId) => {
    return checkedInPatients.includes(patientId);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-800 to-indigo-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8"
        >
          <div className="mb-4 lg:mb-0">
            <h1 className="text-3xl font-bold text-white mb-2 flex items-center">
              <UserCheck className="h-8 w-8 mr-3 text-green-400" />
              Check-In de Pacientes
            </h1>
            <p className="text-slate-200">
              {format(new Date(), "EEEE, d 'de' MMMM 'de' yyyy", { locale: es })} • 
              {patients.length} citas programadas
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={() => refetch()}
              className="p-2 text-slate-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
              title="Actualizar lista"
            >
              <RefreshCw className="h-5 w-5" />
            </button>
          </div>
        </motion.div>

        {/* Success/Error Messages */}
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
          {errorMessage && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mb-6 p-4 bg-red-500/20 border border-red-500/30 rounded-xl text-red-300 flex items-center"
            >
              <AlertCircle className="h-5 w-5 mr-2" />
              {errorMessage}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Search and Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="backdrop-blur-lg bg-white/10 rounded-2xl p-6 border border-white/20 mb-6"
        >
          <div className="flex flex-col lg:flex-row lg:items-center lg:space-x-4 space-y-4 lg:space-y-0">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar por nombre, DNI, teléfono..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>

            {/* Filter Button */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="px-4 py-2 bg-white/10 text-white border border-white/20 rounded-lg hover:bg-white/20 transition duration-200 flex items-center"
            >
              <Filter className="h-5 w-5 mr-2" />
              Filtros
            </button>
          </div>

          {/* Expanded Filters */}
          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="mt-4 pt-4 border-t border-white/20"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">Estado</label>
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                    >
                      <option value="all">Todos los estados</option>
                      <option value="scheduled">Programados</option>
                      <option value="checked_in">Ya registrados</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">Especialidad</label>
                    <select
                      value={specialtyFilter}
                      onChange={(e) => setSpecialtyFilter(e.target.value)}
                      className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                    >
                      <option value="all">Todas las especialidades</option>
                      <option value="general">Medicina General</option>
                      <option value="obstetrics">Obstetricia</option>
                      <option value="dentistry">Odontología</option>
                    </select>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Patients List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="backdrop-blur-lg bg-white/10 rounded-2xl border border-white/20 overflow-hidden"
        >
          {isLoading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
            </div>
          ) : patients.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-16 w-16 text-slate-400 mx-auto mb-4" />
              <h3 className="text-xl font-medium text-white mb-2">No hay citas programadas</h3>
              <p className="text-slate-400">No se encontraron pacientes con citas para hoy.</p>
            </div>
          ) : (
            <div className="divide-y divide-white/10">
              {patients.map((patient, index) => (
                <motion.div
                  key={patient.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={`p-6 hover:bg-white/5 transition-colors ${
                    patient.status === 'checked_in' ? 'bg-green-500/10' : ''
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4 flex-1">
                      {/* Patient Avatar */}
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-semibold ${
                        patient.status === 'checked_in' 
                          ? 'bg-gradient-to-r from-green-500 to-emerald-600'
                          : 'bg-gradient-to-r from-blue-500 to-indigo-600'
                      }`}>
                        {patient.first_name?.charAt(0)}{patient.last_name?.charAt(0)}
                      </div>

                      {/* Patient Info */}
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="text-white font-medium text-lg">
                            {patient.first_name} {patient.last_name}
                          </h3>
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                            getStatusColor(patient.status)
                          }`}>
                            {getStatusText(patient.status)}
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                          <div className="flex items-center text-slate-200">
                            <User className="h-4 w-4 mr-2 text-slate-400" />
                            DNI: {patient.dni}
                          </div>
                          <div className="flex items-center text-slate-200">
                            <Phone className="h-4 w-4 mr-2 text-slate-400" />
                            {patient.phone || 'N/D'}
                          </div>
                          <div className="flex items-center text-slate-200">
                            <Calendar className="h-4 w-4 mr-2 text-slate-400" />
                            {patient.appointment_time}
                          </div>
                        </div>
                        
                        <div className="flex items-center mt-2 text-sm text-slate-300">
                          <MapPin className="h-4 w-4 mr-2 text-slate-400" />
                          Dr. {patient.doctor_name} • {patient.specialty}
                        </div>
                      </div>
                    </div>

                    {/* Action Button */}
                    <div className="ml-6">
                      {patient.status === 'checked_in' || isCheckedIn(patient.id) ? (
                        <div className="flex items-center text-green-300">
                          <CheckCircle className="h-5 w-5 mr-2" />
                          Ya registrado
                        </div>
                      ) : (
                        <button
                          onClick={() => handleCheckIn(patient)}
                          disabled={checkInMutation.isLoading && selectedPatient?.id === patient.id}
                          className="px-6 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-medium rounded-xl hover:from-green-600 hover:to-emerald-700 transition duration-200 flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {checkInMutation.isLoading && selectedPatient?.id === patient.id ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                              Registrando...
                            </>
                          ) : (
                            <>
                              <CheckSquare className="h-4 w-4 mr-2" />
                              Check-In
                            </>
                          )}
                        </button>
                      )}
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

export default CheckIn;
