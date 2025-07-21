import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Calendar, Clock, User, Search, Plus, Save, X, Filter, 
  Edit2, CheckCircle, XCircle, Phone, Mail, AlertCircle,
  ChevronLeft, ChevronRight, Eye, RefreshCw, Users,
  MapPin, Stethoscope, CalendarDays, ArrowLeft
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { format, startOfDay, endOfDay, addDays, isBefore, subDays } from 'date-fns';
import { es } from 'date-fns/locale';
import appointmentService from '../../services/appointmentService';
import patientService from '../../services/patientService';

const AppointmentScheduling = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  // Estados principales
  const [view, setView] = useState('list'); // 'list', 'calendar', 'new'
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [statusFilter, setStatusFilter] = useState('all');
  const [specialtyFilter, setSpecialtyFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [showModal, setShowModal] = useState(false);
  
  // Formulario para nueva cita
  const [newAppointment, setNewAppointment] = useState({
    patient_id: '',
    doctor_id: '',
    specialty_id: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    time: '',
    reason: '',
    priority: 'normal',
    notes: ''
  });
  
  const [searchPatient, setSearchPatient] = useState('');
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [errors, setErrors] = useState({});

  // Queries para datos
  const { data: appointmentsData, isLoading, refetch } = useQuery({
    queryKey: ['appointments-admin', {
      search: searchTerm,
      date: selectedDate,
      status: statusFilter,
      specialty: specialtyFilter,
      page: currentPage
    }],
    queryFn: () => appointmentService.getAllAppointments({
      search: searchTerm,
      date_start: startOfDay(selectedDate),
      date_end: endOfDay(selectedDate),
      status: statusFilter === 'all' ? undefined : statusFilter,
      specialty: specialtyFilter === 'all' ? undefined : specialtyFilter,
      page: currentPage,
      page_size: 15
    }),
  });

  const { data: specialties } = useQuery({
    queryKey: ['specialties'],
    queryFn: appointmentService.getSpecialties,
  });

  const { data: doctors } = useQuery({
    queryKey: ['doctors', newAppointment.specialty_id],
    queryFn: () => appointmentService.getDoctorsBySpecialty(newAppointment.specialty_id),
    enabled: !!newAppointment.specialty_id,
  });

  const { data: patients, isLoading: loadingPatients } = useQuery({
    queryKey: ['patients', searchPatient],
    queryFn: () => patientService.searchPatients(searchPatient),
    enabled: searchPatient.length > 2,
  });

  const { data: timeSlots } = useQuery({
    queryKey: ['available-slots', newAppointment.doctor_id, newAppointment.date],
    queryFn: () => appointmentService.getAvailableSlots(newAppointment.doctor_id, newAppointment.date),
    enabled: !!(newAppointment.doctor_id && newAppointment.date),
  });

  // Mutations
  const createAppointmentMutation = useMutation({
    mutationFn: appointmentService.createAppointment,
    onSuccess: () => {
      queryClient.invalidateQueries(['appointments-admin']);
      queryClient.invalidateQueries(['dashboard-stats']);
      resetForm();
      setView('list');
    },
    onError: (error) => {
      const errorData = error.response?.data;
      if (errorData) {
        setErrors(errorData);
      }
    },
  });

  const confirmAppointmentMutation = useMutation({
    mutationFn: appointmentService.confirmAppointment,
    onSuccess: () => {
      queryClient.invalidateQueries(['appointments-admin']);
      refetch();
    }
  });

  const cancelAppointmentMutation = useMutation({
    mutationFn: ({ id, reason }) => appointmentService.cancelAppointment(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries(['appointments-admin']);
      refetch();
      setShowModal(false);
    }
  });

  // Handlers
  const resetForm = () => {
    setNewAppointment({
      patient_id: '',
      doctor_id: '',
      specialty_id: '',
      date: format(new Date(), 'yyyy-MM-dd'),
      time: '',
      reason: '',
      priority: 'normal',
      notes: ''
    });
    setSelectedPatient(null);
    setSearchPatient('');
    setErrors({});
  };

  const handlePatientSelect = (patient) => {
    setSelectedPatient(patient);
    setNewAppointment(prev => ({
      ...prev,
      patient_id: patient.id
    }));
    setSearchPatient('');
  };

  const handleInputChange = (field, value) => {
    setNewAppointment(prev => ({
      ...prev,
      [field]: value
    }));
    
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: null
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const appointmentData = {
      ...newAppointment,
      datetime: `${newAppointment.date}T${newAppointment.time}:00`
    };
    
    createAppointmentMutation.mutate(appointmentData);
  };

  const appointments = appointmentsData?.results || [];
  const totalPages = Math.ceil((appointmentsData?.count || 0) / 15);

  const statusColors = {
    'pending': 'bg-yellow-500/20 text-yellow-300 border-yellow-400',
    'confirmed': 'bg-green-500/20 text-green-300 border-green-400',
    'in_progress': 'bg-blue-500/20 text-blue-300 border-blue-400',
    'completed': 'bg-purple-500/20 text-purple-300 border-purple-400',
    'cancelled': 'bg-red-500/20 text-red-300 border-red-400',
    'no_show': 'bg-gray-500/20 text-gray-300 border-gray-400'
  };

  const statusLabels = {
    'pending': 'Pendiente',
    'confirmed': 'Confirmada',
    'in_progress': 'En Progreso',
    'completed': 'Completada',
    'cancelled': 'Cancelada',
    'no_show': 'No se presentó'
  };

  const StatusIcon = ({ status }) => {
    switch (status) {
      case 'confirmed':
        return <CheckCircle className="h-4 w-4 text-green-400" />;
      case 'cancelled':
        return <XCircle className="h-4 w-4 text-red-400" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-400" />;
      default:
        return <AlertCircle className="h-4 w-4 text-blue-400" />;
    }
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
            <div className="flex items-center mb-2">
              <Link 
                to="/dashboard" 
                className="p-2 text-slate-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors mr-4"
              >
                <ArrowLeft className="h-6 w-6" />
              </Link>
              <h1 className="text-3xl font-bold text-white flex items-center">
                <CalendarDays className="h-8 w-8 mr-3 text-blue-400" />
                Agendamiento de Citas
              </h1>
            </div>
            <p className="text-slate-200 ml-14">
              {format(selectedDate, "EEEE, d 'de' MMMM 'de' yyyy", { locale: es })}
            </p>
          </div>
          
          <div className="flex items-center space-x-3">
            <div className="flex bg-white/10 rounded-lg p-1 border border-white/20">
              <button
                onClick={() => setView('list')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  view === 'list' 
                    ? 'bg-blue-500 text-white' 
                    : 'text-slate-300 hover:text-white hover:bg-white/10'
                }`}
              >
                Lista
              </button>
              <button
                onClick={() => setView('calendar')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  view === 'calendar' 
                    ? 'bg-blue-500 text-white' 
                    : 'text-slate-300 hover:text-white hover:bg-white/10'
                }`}
              >
                Calendario
              </button>
            </div>
            <button
              onClick={() => setView('new')}
              className="px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-medium rounded-xl hover:from-blue-600 hover:to-indigo-700 transition duration-200 flex items-center"
            >
              <Plus className="h-5 w-5 mr-2" />
              Nueva Cita
            </button>
          </div>
        </motion.div>

        {/* Vista de Lista */}
        {view === 'list' && (
          <>
            {/* Filtros y Búsqueda */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="backdrop-blur-lg bg-white/10 rounded-2xl p-6 border border-white/20 mb-6"
            >
              <div className="flex flex-col lg:flex-row lg:items-center lg:space-x-4 space-y-4 lg:space-y-0">
                {/* Búsqueda */}
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Buscar por paciente, doctor o DNI..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* Selector de Fecha */}
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setSelectedDate(subDays(selectedDate, 1))}
                    className="p-2 text-slate-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <input
                    type="date"
                    value={format(selectedDate, 'yyyy-MM-dd')}
                    onChange={(e) => setSelectedDate(new Date(e.target.value))}
                    className="px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <button
                    onClick={() => setSelectedDate(addDays(selectedDate, 1))}
                    className="p-2 text-slate-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </div>

                {/* Botón de Filtros */}
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="px-4 py-2 bg-white/10 text-white border border-white/20 rounded-lg hover:bg-white/20 transition duration-200 flex items-center"
                >
                  <Filter className="h-5 w-5 mr-2" />
                  Filtros
                </button>

                {/* Refrescar */}
                <button
                  onClick={refetch}
                  className="p-2 text-slate-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                >
                  <RefreshCw className="h-5 w-5" />
                </button>
              </div>

              {/* Filtros Expandidos */}
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
                          className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="all">Todos los estados</option>
                          <option value="pending">Pendiente</option>
                          <option value="confirmed">Confirmada</option>
                          <option value="in_progress">En Progreso</option>
                          <option value="completed">Completada</option>
                          <option value="cancelled">Cancelada</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-white mb-2">Especialidad</label>
                        <select
                          value={specialtyFilter}
                          onChange={(e) => setSpecialtyFilter(e.target.value)}
                          className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="all">Todas las especialidades</option>
                          {specialties?.map((specialty) => (
                            <option key={specialty.id} value={specialty.id}>
                              {specialty.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>

            {/* Lista de Citas */}
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
              ) : appointments.length === 0 ? (
                <div className="text-center py-12">
                  <Calendar className="h-16 w-16 text-slate-400 mx-auto mb-4" />
                  <h3 className="text-xl font-medium text-white mb-2">No hay citas</h3>
                  <p className="text-slate-400 mb-4">No se encontraron citas para los filtros seleccionados.</p>
                  <button
                    onClick={() => setView('new')}
                    className="px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-medium rounded-xl hover:from-blue-600 hover:to-indigo-700 transition duration-200 flex items-center mx-auto"
                  >
                    <Plus className="h-5 w-5 mr-2" />
                    Crear Primera Cita
                  </button>
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-white/5">
                        <tr>
                          <th className="px-6 py-4 text-left text-sm font-medium text-white">Paciente</th>
                          <th className="px-6 py-4 text-left text-sm font-medium text-white">Doctor</th>
                          <th className="px-6 py-4 text-left text-sm font-medium text-white">Fecha/Hora</th>
                          <th className="px-6 py-4 text-left text-sm font-medium text-white">Especialidad</th>
                          <th className="px-6 py-4 text-left text-sm font-medium text-white">Estado</th>
                          <th className="px-6 py-4 text-center text-sm font-medium text-white">Acciones</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/10">
                        {appointments.map((appointment, index) => (
                          <motion.tr
                            key={appointment.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className="hover:bg-white/5 transition-colors"
                          >
                            <td className="px-6 py-4">
                              <div className="flex items-center">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 flex items-center justify-center text-white font-semibold mr-3">
                                  {appointment.patient_name?.charAt(0) || 'P'}
                                </div>
                                <div>
                                  <div className="text-white font-medium">{appointment.patient_name}</div>
                                  <div className="text-slate-400 text-sm">DNI: {appointment.patient_dni}</div>
                                  {appointment.patient_phone && (
                                    <div className="text-slate-400 text-xs flex items-center">
                                      <Phone className="h-3 w-3 mr-1" />
                                      {appointment.patient_phone}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center">
                                <Stethoscope className="h-4 w-4 text-blue-400 mr-2" />
                                <span className="text-white">Dr. {appointment.doctor_name}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center">
                                <Clock className="h-4 w-4 text-slate-400 mr-2" />
                                <div>
                                  <div className="text-white">{format(new Date(appointment.datetime), 'dd/MM/yyyy')}</div>
                                  <div className="text-slate-400 text-sm">{format(new Date(appointment.datetime), 'HH:mm')}</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <span className="text-slate-200">{appointment.specialty_name}</span>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center">
                                <StatusIcon status={appointment.status} />
                                <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium border ${statusColors[appointment.status] || 'bg-gray-500/20 text-gray-300 border-gray-400'}`}>
                                  {statusLabels[appointment.status] || appointment.status}
                                </span>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex justify-center space-x-2">
                                <Link
                                  to={`/appointments/${appointment.id}`}
                                  className="p-2 text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 rounded-lg transition-colors"
                                  title="Ver detalles"
                                >
                                  <Eye className="h-4 w-4" />
                                </Link>
                                <Link
                                  to={`/appointments/${appointment.id}/edit`}
                                  className="p-2 text-slate-400 hover:text-slate-300 hover:bg-slate-500/10 rounded-lg transition-colors"
                                  title="Editar"
                                >
                                  <Edit2 className="h-4 w-4" />
                                </Link>
                                {appointment.status === 'pending' && (
                                  <button
                                    onClick={() => confirmAppointmentMutation.mutate(appointment.id)}
                                    className="p-2 text-green-400 hover:text-green-300 hover:bg-green-500/10 rounded-lg transition-colors"
                                    title="Confirmar"
                                  >
                                    <CheckCircle className="h-4 w-4" />
                                  </button>
                                )}
                                {(appointment.status === 'pending' || appointment.status === 'confirmed') && (
                                  <button
                                    onClick={() => {
                                      setSelectedAppointment(appointment);
                                      setShowModal(true);
                                    }}
                                    className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors"
                                    title="Cancelar"
                                  >
                                    <XCircle className="h-4 w-4" />
                                  </button>
                                )}
                              </div>
                            </td>
                          </motion.tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Paginación */}
                  {totalPages > 1 && (
                    <div className="flex justify-between items-center px-6 py-4 border-t border-white/10">
                      <div className="text-sm text-slate-400">
                        Mostrando {((currentPage - 1) * 15) + 1} - {Math.min(currentPage * 15, appointmentsData?.count || 0)} de {appointmentsData?.count || 0} citas
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                          disabled={currentPage === 1}
                          className="px-3 py-1 bg-white/10 text-white rounded border border-white/20 hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          <ChevronLeft className="h-4 w-4" />
                        </button>
                        <span className="px-3 py-1 text-white">
                          {currentPage} / {totalPages}
                        </span>
                        <button
                          onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                          disabled={currentPage === totalPages}
                          className="px-3 py-1 bg-white/10 text-white rounded border border-white/20 hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          <ChevronRight className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </motion.div>
          </>
        )}

        {/* Vista de Nueva Cita */}
        {view === 'new' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-4xl mx-auto"
          >
            <div className="backdrop-blur-lg bg-white/10 rounded-2xl p-6 border border-white/20 mb-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white flex items-center">
                  <Plus className="h-6 w-6 mr-2 text-blue-400" />
                  Nueva Cita Médica
                </h2>
                <button
                  onClick={() => setView('list')}
                  className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Selección de Paciente */}
                <div>
                  <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                    <User className="h-5 w-5 mr-2 text-blue-400" />
                    Seleccionar Paciente
                  </h3>
                  
                  {selectedPatient ? (
                    <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 flex items-center justify-center text-white font-semibold mr-4">
                            {selectedPatient.first_name?.charAt(0)}
                          </div>
                          <div>
                            <h4 className="text-white font-medium">
                              {selectedPatient.first_name} {selectedPatient.last_name}
                            </h4>
                            <p className="text-slate-300 text-sm">DNI: {selectedPatient.dni}</p>
                            <p className="text-slate-300 text-sm">Teléfono: {selectedPatient.phone}</p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedPatient(null);
                            setNewAppointment(prev => ({ ...prev, patient_id: '' }));
                          }}
                          className="p-2 text-slate-400 hover:text-white hover:bg-red-500/10 rounded-lg transition-colors"
                        >
                          <X className="h-5 w-5" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Buscar paciente por nombre o DNI..."
                        value={searchPatient}
                        onChange={(e) => setSearchPatient(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      
                      {/* Resultados de búsqueda */}
                      {searchPatient.length > 2 && patients && patients.length > 0 && (
                        <div className="absolute top-full left-0 right-0 mt-1 bg-slate-800 border border-slate-700 rounded-lg shadow-lg z-10 max-h-60 overflow-y-auto">
                          {patients.map((patient) => (
                            <button
                              key={patient.id}
                              type="button"
                              onClick={() => handlePatientSelect(patient)}
                              className="w-full px-4 py-3 text-left hover:bg-slate-700 border-b border-slate-700 last:border-b-0 transition-colors"
                            >
                              <div className="text-white font-medium">
                                {patient.first_name} {patient.last_name}
                              </div>
                              <div className="text-slate-400 text-sm">
                                DNI: {patient.dni} | Tel: {patient.phone}
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                  
                  {errors.patient_id && (
                    <p className="mt-2 text-red-400 text-sm flex items-center">
                      <AlertCircle className="h-4 w-4 mr-1" />
                      {errors.patient_id}
                    </p>
                  )}
                </div>

                {/* Especialidad y Doctor */}
                <div>
                  <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                    <Stethoscope className="h-5 w-5 mr-2 text-blue-400" />
                    Especialidad y Doctor
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-white mb-2">
                        Especialidad *
                      </label>
                      <select
                        value={newAppointment.specialty_id}
                        onChange={(e) => {
                          handleInputChange('specialty_id', e.target.value);
                          handleInputChange('doctor_id', ''); // Reset doctor
                        }}
                        className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="">Seleccionar especialidad</option>
                        {specialties?.map((specialty) => (
                          <option key={specialty.id} value={specialty.id}>
                            {specialty.name}
                          </option>
                        ))}
                      </select>
                      {errors.specialty_id && (
                        <p className="mt-1 text-red-400 text-sm">{errors.specialty_id}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-white mb-2">
                        Doctor *
                      </label>
                      <select
                        value={newAppointment.doctor_id}
                        onChange={(e) => handleInputChange('doctor_id', e.target.value)}
                        disabled={!newAppointment.specialty_id}
                        className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <option value="">Seleccionar doctor</option>
                        {doctors?.map((doctor) => (
                          <option key={doctor.id} value={doctor.id}>
                            Dr. {doctor.first_name} {doctor.last_name}
                          </option>
                        ))}
                      </select>
                      {errors.doctor_id && (
                        <p className="mt-1 text-red-400 text-sm">{errors.doctor_id}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Fecha y Hora */}
                <div>
                  <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                    <Calendar className="h-5 w-5 mr-2 text-blue-400" />
                    Fecha y Hora
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-white mb-2">
                        Fecha *
                      </label>
                      <input
                        type="date"
                        value={newAppointment.date}
                        min={format(new Date(), 'yyyy-MM-dd')}
                        max={format(addDays(new Date(), 90), 'yyyy-MM-dd')}
                        onChange={(e) => handleInputChange('date', e.target.value)}
                        className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      {errors.date && (
                        <p className="mt-1 text-red-400 text-sm">{errors.date}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-white mb-2">
                        Hora *
                      </label>
                      <select
                        value={newAppointment.time}
                        onChange={(e) => handleInputChange('time', e.target.value)}
                        disabled={!newAppointment.doctor_id || !newAppointment.date}
                        className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <option value="">Seleccionar hora</option>
                        {timeSlots?.map((slot) => (
                          <option key={slot.time} value={slot.time} disabled={!slot.available}>
                            {slot.time} {!slot.available && '(Ocupado)'}
                          </option>
                        ))}
                      </select>
                      {errors.time && (
                        <p className="mt-1 text-red-400 text-sm">{errors.time}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Detalles */}
                <div>
                  <h3 className="text-lg font-semibold text-white mb-4">
                    Detalles de la Cita
                  </h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-white mb-2">
                        Motivo de la consulta *
                      </label>
                      <textarea
                        value={newAppointment.reason}
                        onChange={(e) => handleInputChange('reason', e.target.value)}
                        placeholder="Describa el motivo de la consulta..."
                        rows={3}
                        className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                      />
                      {errors.reason && (
                        <p className="mt-1 text-red-400 text-sm">{errors.reason}</p>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-white mb-2">
                          Prioridad
                        </label>
                        <select
                          value={newAppointment.priority}
                          onChange={(e) => handleInputChange('priority', e.target.value)}
                          className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="normal">Normal</option>
                          <option value="high">Alta</option>
                          <option value="urgent">Urgente</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-white mb-2">
                          Notas adicionales
                        </label>
                        <textarea
                          value={newAppointment.notes}
                          onChange={(e) => handleInputChange('notes', e.target.value)}
                          placeholder="Información adicional (opcional)..."
                          rows={2}
                          className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Botones */}
                <div className="flex justify-end space-x-4 pt-6">
                  <button
                    type="button"
                    onClick={() => setView('list')}
                    className="px-6 py-3 text-slate-300 hover:text-white border border-slate-600 hover:border-slate-500 rounded-xl transition duration-200"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={createAppointmentMutation.isLoading}
                    className="px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-medium rounded-xl hover:from-blue-600 hover:to-indigo-700 transition duration-200 flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {createAppointmentMutation.isLoading ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                        Programando...
                      </>
                    ) : (
                      <>
                        <Save className="h-5 w-5 mr-2" />
                        Programar Cita
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        )}

        {/* Vista de Calendario (placeholder) */}
        {view === 'calendar' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="backdrop-blur-lg bg-white/10 rounded-2xl p-6 border border-white/20"
          >
            <div className="text-center py-12">
              <Calendar className="h-16 w-16 text-slate-400 mx-auto mb-4" />
              <h3 className="text-xl font-medium text-white mb-2">Vista de Calendario</h3>
              <p className="text-slate-400">Esta funcionalidad estará disponible próximamente.</p>
            </div>
          </motion.div>
        )}
      </div>

      {/* Modal de Cancelación */}
      <AnimatePresence>
        {showModal && selectedAppointment && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-slate-800 rounded-2xl p-6 border border-slate-700 max-w-md w-full"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">Cancelar Cita</h3>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-slate-400 hover:text-white"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              
              <p className="text-slate-300 mb-4">
                ¿Está seguro que desea cancelar la cita de <strong>{selectedAppointment.patient_name}</strong>?
              </p>
              
              <div className="bg-slate-700/50 rounded-lg p-3 mb-4">
                <p className="text-sm text-slate-300">
                  <strong>Fecha:</strong> {format(new Date(selectedAppointment.datetime), 'dd/MM/yyyy HH:mm')}
                </p>
                <p className="text-sm text-slate-300">
                  <strong>Doctor:</strong> Dr. {selectedAppointment.doctor_name}
                </p>
                <p className="text-sm text-slate-300">
                  <strong>Especialidad:</strong> {selectedAppointment.specialty_name}
                </p>
              </div>
              
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-slate-300 hover:text-white border border-slate-600 hover:border-slate-500 rounded-lg transition-colors"
                >
                  No, mantener
                </button>
                <button
                  onClick={() => cancelAppointmentMutation.mutate({ 
                    id: selectedAppointment.id, 
                    reason: 'Cancelada por recepción' 
                  })}
                  disabled={cancelAppointmentMutation.isLoading}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors disabled:opacity-50"
                >
                  {cancelAppointmentMutation.isLoading ? 'Cancelando...' : 'Sí, cancelar'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AppointmentScheduling;
