import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Shield, Search, CheckCircle, XCircle, AlertCircle, Clock,
  Eye, FileText, Phone, Mail, User, Calendar, 
  ArrowLeft, RefreshCw, Filter, Download, ChevronRight,
  CreditCard, DollarSign, MapPin, Building, 
  Plus, Edit2, Save, X, Users
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { format, isValid } from 'date-fns';
import { es } from 'date-fns/locale';
import patientService from '../../services/patientService';

const InsuranceVerification = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Estados principales
  const [view, setView] = useState('search'); // 'search', 'verification', 'history'
  const [searchTerm, setSearchTerm] = useState('');
  const [searchType, setSearchType] = useState('patient'); // 'patient', 'policy'
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [verificationData, setVerificationData] = useState(null);
  const [showFilters, setShowFilters] = useState(false);

  // Estados de filtros
  const [statusFilter, setStatusFilter] = useState('all');
  const [insuranceFilter, setInsuranceFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('today');

  // Estados de verificación
  const [verificationStatus, setVerificationStatus] = useState('pending');
  const [verificationNotes, setVerificationNotes] = useState('');
  const [coverageDetails, setCoverageDetails] = useState({});
  const [authorizationRequired, setAuthorizationRequired] = useState(false);

  // Búsqueda de pacientes
  const { data: patients, isLoading: loadingPatients } = useQuery({
    queryKey: ['patients', searchTerm],
    queryFn: () => patientService.searchPatients(searchTerm),
    enabled: searchTerm.length > 2 && searchType === 'patient',
  });

  // Historial de verificaciones (mock data por ahora)
  const { data: verificationHistory, isLoading: loadingHistory } = useQuery({
    queryKey: ['insurance-verifications', { status: statusFilter, insurance: insuranceFilter, date: dateFilter }],
    queryFn: () => {
      // Mock data - en producción esto sería una llamada real al API
      return Promise.resolve({
        results: [
          {
            id: 1,
            patient_name: 'María González Pérez',
            patient_dni: '12345678',
            insurance_provider: 'EsSalud',
            policy_number: 'ES-123456789',
            verification_date: '2024-07-20T10:30:00',
            status: 'verified',
            coverage_amount: 5000,
            copay: 50,
            notes: 'Cobertura completa para consulta general',
            verified_by: 'Receptionist',
          },
          {
            id: 2,
            patient_name: 'Carlos Ruiz Mendoza',
            patient_dni: '87654321',
            insurance_provider: 'Rimac Seguros',
            policy_number: 'RM-987654321',
            verification_date: '2024-07-20T09:15:00',
            status: 'pending',
            coverage_amount: null,
            copay: null,
            notes: 'Esperando respuesta del sistema de seguros',
            verified_by: 'System',
          },
          {
            id: 3,
            patient_name: 'Ana Torres Silva',
            patient_dni: '11223344',
            insurance_provider: 'Mapfre',
            policy_number: 'MP-556677889',
            verification_date: '2024-07-20T08:45:00',
            status: 'rejected',
            coverage_amount: 0,
            copay: 0,
            notes: 'Póliza vencida - Requiere actualización',
            verified_by: 'Receptionist',
          },
        ],
        count: 3,
        page: 1,
        pages: 1,
      });
    },
  });

  // Simular verificación de seguro (mock)
  const verifyInsuranceMutation = useMutation({
    mutationFn: async (data) => {
      // Simular delay de API
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Mock response basado en el proveedor
      const mockResponse = {
        'EsSalud': {
          status: 'verified',
          coverage: {
            general_consultation: { covered: true, copay: 0, limit: 'unlimited' },
            specialist: { covered: true, copay: 20, limit: 'unlimited' },
            emergency: { covered: true, copay: 0, limit: 'unlimited' },
            dental: { covered: false, copay: 0, limit: 0 },
          },
          policy_status: 'active',
          expiry_date: '2024-12-31',
          authorization_required: false,
        },
        'Rimac Seguros': {
          status: 'verified',
          coverage: {
            general_consultation: { covered: true, copay: 30, limit: 50000 },
            specialist: { covered: true, copay: 50, limit: 30000 },
            emergency: { covered: true, copay: 100, limit: 100000 },
            dental: { covered: true, copay: 40, limit: 20000 },
          },
          policy_status: 'active',
          expiry_date: '2025-03-15',
          authorization_required: true,
        },
        default: {
          status: 'pending',
          coverage: {},
          policy_status: 'unknown',
          expiry_date: null,
          authorization_required: false,
        }
      };

      return mockResponse[data.insurance_provider] || mockResponse.default;
    },
    onSuccess: (data) => {
      setVerificationData(data);
      setVerificationStatus(data.status);
      setCoverageDetails(data.coverage);
      setAuthorizationRequired(data.authorization_required);
      setView('verification');
    }
  });

  const handlePatientSelect = (patient) => {
    setSelectedPatient(patient);
    setSearchTerm('');
  };

  const handleVerifyInsurance = () => {
    if (!selectedPatient) return;
    
    verifyInsuranceMutation.mutate({
      patient_id: selectedPatient.id,
      insurance_provider: selectedPatient.insurance_provider,
      policy_number: selectedPatient.insurance_number,
    });
  };

  const statusColors = {
    verified: 'bg-green-500/20 text-green-300 border-green-400',
    pending: 'bg-yellow-500/20 text-yellow-300 border-yellow-400',
    rejected: 'bg-red-500/20 text-red-300 border-red-400',
    expired: 'bg-gray-500/20 text-gray-300 border-gray-400',
  };

  const statusLabels = {
    verified: 'Verificado',
    pending: 'Pendiente',
    rejected: 'Rechazado',
    expired: 'Vencido',
  };

  const StatusIcon = ({ status }) => {
    switch (status) {
      case 'verified':
        return <CheckCircle className="h-4 w-4 text-green-400" />;
      case 'rejected':
      case 'expired':
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
                <Shield className="h-8 w-8 mr-3 text-blue-400" />
                Verificación de Seguros
              </h1>
            </div>
            <p className="text-slate-200 ml-14">
              Validar coberturas y autorizaciones médicas
            </p>
          </div>
          
          <div className="flex items-center space-x-3">
            <div className="flex bg-white/10 rounded-lg p-1 border border-white/20">
              <button
                onClick={() => setView('search')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  view === 'search' 
                    ? 'bg-blue-500 text-white' 
                    : 'text-slate-300 hover:text-white hover:bg-white/10'
                }`}
              >
                Verificar
              </button>
              <button
                onClick={() => setView('history')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  view === 'history' 
                    ? 'bg-blue-500 text-white' 
                    : 'text-slate-300 hover:text-white hover:bg-white/10'
                }`}
              >
                Historial
              </button>
            </div>
          </div>
        </motion.div>

        {/* Vista de Búsqueda y Verificación */}
        {view === 'search' && (
          <div className="space-y-6">
            {/* Panel de Búsqueda */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="backdrop-blur-lg bg-white/10 rounded-2xl p-6 border border-white/20"
            >
              <h3 className="text-xl font-semibold text-white mb-6 flex items-center">
                <Search className="h-5 w-5 mr-2 text-blue-400" />
                Buscar Paciente para Verificación
              </h3>

              <div className="space-y-4">
                <div className="flex flex-col lg:flex-row lg:items-center lg:space-x-4 space-y-4 lg:space-y-0">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Buscar por nombre, DNI o número de póliza..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <select
                    value={searchType}
                    onChange={(e) => setSearchType(e.target.value)}
                    className="px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="patient">Por Paciente</option>
                    <option value="policy">Por Póliza</option>
                  </select>
                </div>

                {/* Resultados de búsqueda de pacientes */}
                {searchTerm.length > 2 && searchType === 'patient' && patients && patients.length > 0 && (
                  <div className="bg-slate-800/50 border border-slate-700 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {patients.map((patient) => (
                      <button
                        key={patient.id}
                        onClick={() => handlePatientSelect(patient)}
                        className="w-full px-4 py-3 text-left hover:bg-slate-700 border-b border-slate-700 last:border-b-0 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="text-white font-medium">
                              {patient.first_name} {patient.last_name}
                            </div>
                            <div className="text-slate-400 text-sm">
                              DNI: {patient.dni} | Tel: {patient.phone}
                            </div>
                            {patient.insurance_provider && (
                              <div className="text-blue-300 text-xs flex items-center mt-1">
                                <Shield className="h-3 w-3 mr-1" />
                                {patient.insurance_provider}
                              </div>
                            )}
                          </div>
                          <ChevronRight className="h-5 w-5 text-slate-400" />
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>

            {/* Panel de Paciente Seleccionado */}
            {selectedPatient && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="backdrop-blur-lg bg-white/10 rounded-2xl p-6 border border-white/20"
              >
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-semibold text-white flex items-center">
                    <User className="h-5 w-5 mr-2 text-green-400" />
                    Paciente Seleccionado
                  </h3>
                  <button
                    onClick={() => setSelectedPatient(null)}
                    className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Información del Paciente */}
                  <div className="space-y-4">
                    <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                      <h4 className="text-white font-medium mb-3">Información Personal</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-slate-400">Nombre:</span>
                          <span className="text-white">{selectedPatient.first_name} {selectedPatient.last_name}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">DNI:</span>
                          <span className="text-white">{selectedPatient.dni}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Teléfono:</span>
                          <span className="text-white">{selectedPatient.phone}</span>
                        </div>
                        {selectedPatient.email && (
                          <div className="flex justify-between">
                            <span className="text-slate-400">Email:</span>
                            <span className="text-white">{selectedPatient.email}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Información del Seguro */}
                  <div className="space-y-4">
                    <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                      <h4 className="text-white font-medium mb-3">Información del Seguro</h4>
                      {selectedPatient.insurance_provider ? (
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-slate-400">Proveedor:</span>
                            <span className="text-white">{selectedPatient.insurance_provider}</span>
                          </div>
                          {selectedPatient.insurance_number && (
                            <div className="flex justify-between">
                              <span className="text-slate-400">Póliza:</span>
                              <span className="text-white font-mono">{selectedPatient.insurance_number}</span>
                            </div>
                          )}
                          <div className="mt-4">
                            <button
                              onClick={handleVerifyInsurance}
                              disabled={verifyInsuranceMutation.isLoading}
                              className="w-full px-4 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-medium rounded-lg hover:from-blue-600 hover:to-indigo-700 transition duration-200 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {verifyInsuranceMutation.isLoading ? (
                                <>
                                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                                  Verificando...
                                </>
                              ) : (
                                <>
                                  <Shield className="h-5 w-5 mr-2" />
                                  Verificar Seguro
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-4">
                          <Shield className="h-12 w-12 text-slate-400 mx-auto mb-2" />
                          <p className="text-slate-400 text-sm">No hay información de seguro registrada</p>
                          <Link to={`/patients/${selectedPatient.id}/edit`} className="text-blue-400 text-xs hover:text-blue-300">
                            Agregar información de seguro
                          </Link>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        )}

        {/* Vista de Resultados de Verificación */}
        {view === 'verification' && verificationData && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Estado de Verificación */}
            <div className="backdrop-blur-lg bg-white/10 rounded-2xl p-6 border border-white/20">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-white flex items-center">
                  <StatusIcon status={verificationStatus} />
                  <span className="ml-2">Estado de Verificación</span>
                </h3>
                <button
                  onClick={() => setView('search')}
                  className="px-4 py-2 bg-white/10 text-white border border-white/20 rounded-lg hover:bg-white/20 transition duration-200"
                >
                  Nueva Verificación
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-white font-medium">Estado de Póliza</h4>
                    <StatusIcon status={verificationStatus} />
                  </div>
                  <p className={`text-lg font-semibold ${
                    verificationStatus === 'verified' ? 'text-green-300' :
                    verificationStatus === 'pending' ? 'text-yellow-300' :
                    'text-red-300'
                  }`}>
                    {statusLabels[verificationStatus]}
                  </p>
                  {verificationData.expiry_date && (
                    <p className="text-slate-400 text-sm mt-1">
                      Vence: {format(new Date(verificationData.expiry_date), 'dd/MM/yyyy')}
                    </p>
                  )}
                </div>

                <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-white font-medium">Autorización</h4>
                    <FileText className="h-5 w-5 text-blue-400" />
                  </div>
                  <p className={`text-lg font-semibold ${
                    authorizationRequired ? 'text-yellow-300' : 'text-green-300'
                  }`}>
                    {authorizationRequired ? 'Requerida' : 'No Requerida'}
                  </p>
                  {authorizationRequired && (
                    <p className="text-slate-400 text-sm mt-1">
                      Contactar al seguro antes del procedimiento
                    </p>
                  )}
                </div>

                <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-white font-medium">Paciente</h4>
                    <User className="h-5 w-5 text-green-400" />
                  </div>
                  <p className="text-white font-medium">{selectedPatient?.first_name} {selectedPatient?.last_name}</p>
                  <p className="text-slate-400 text-sm">DNI: {selectedPatient?.dni}</p>
                </div>
              </div>
            </div>

            {/* Detalles de Cobertura */}
            {Object.keys(coverageDetails).length > 0 && (
              <div className="backdrop-blur-lg bg-white/10 rounded-2xl p-6 border border-white/20">
                <h3 className="text-xl font-semibold text-white mb-6 flex items-center">
                  <CreditCard className="h-5 w-5 mr-2 text-blue-400" />
                  Detalles de Cobertura
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.entries(coverageDetails).map(([service, details]) => (
                    <div key={service} className="bg-white/5 rounded-xl p-4 border border-white/10">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-white font-medium capitalize">
                          {service.replace('_', ' ')}
                        </h4>
                        <StatusIcon status={details.covered ? 'verified' : 'rejected'} />
                      </div>
                      
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-slate-400">Cubierto:</span>
                          <span className={details.covered ? 'text-green-300' : 'text-red-300'}>
                            {details.covered ? 'Sí' : 'No'}
                          </span>
                        </div>
                        {details.covered && (
                          <>
                            <div className="flex justify-between">
                              <span className="text-slate-400">Copago:</span>
                              <span className="text-white">S/ {details.copay}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-400">Límite:</span>
                              <span className="text-white">
                                {details.limit === 'unlimited' ? 'Ilimitado' : `S/ ${details.limit}`}
                              </span>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Notas y Acciones */}
            <div className="backdrop-blur-lg bg-white/10 rounded-2xl p-6 border border-white/20">
              <h3 className="text-xl font-semibold text-white mb-4">Notas y Acciones</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Notas de Verificación
                  </label>
                  <textarea
                    value={verificationNotes}
                    onChange={(e) => setVerificationNotes(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    placeholder="Agregar notas sobre la verificación..."
                  />
                </div>

                <div className="flex justify-end space-x-3">
                  <button className="px-4 py-2 bg-white/10 text-white border border-white/20 rounded-lg hover:bg-white/20 transition duration-200 flex items-center">
                    <Download className="h-4 w-4 mr-2" />
                    Exportar
                  </button>
                  <button className="px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg hover:from-green-600 hover:to-emerald-700 transition duration-200 flex items-center">
                    <Save className="h-4 w-4 mr-2" />
                    Guardar Verificación
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Vista de Historial */}
        {view === 'history' && (
          <div className="space-y-6">
            {/* Filtros */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="backdrop-blur-lg bg-white/10 rounded-2xl p-6 border border-white/20"
            >
              <div className="flex flex-col lg:flex-row lg:items-center lg:space-x-4 space-y-4 lg:space-y-0">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-white mb-2">Historial de Verificaciones</h3>
                </div>
                
                <div className="flex items-center space-x-3">
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">Todos los estados</option>
                    <option value="verified">Verificados</option>
                    <option value="pending">Pendientes</option>
                    <option value="rejected">Rechazados</option>
                  </select>
                  
                  <select
                    value={dateFilter}
                    onChange={(e) => setDateFilter(e.target.value)}
                    className="px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="today">Hoy</option>
                    <option value="week">Esta semana</option>
                    <option value="month">Este mes</option>
                  </select>

                  <button className="p-2 text-slate-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors">
                    <RefreshCw className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </motion.div>

            {/* Lista de Verificaciones */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="backdrop-blur-lg bg-white/10 rounded-2xl border border-white/20 overflow-hidden"
            >
              {loadingHistory ? (
                <div className="flex justify-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
                </div>
              ) : verificationHistory?.results?.length === 0 ? (
                <div className="text-center py-12">
                  <Shield className="h-16 w-16 text-slate-400 mx-auto mb-4" />
                  <h3 className="text-xl font-medium text-white mb-2">No hay verificaciones</h3>
                  <p className="text-slate-400">No se encontraron verificaciones para los filtros seleccionados.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-white/5">
                      <tr>
                        <th className="px-6 py-4 text-left text-sm font-medium text-white">Paciente</th>
                        <th className="px-6 py-4 text-left text-sm font-medium text-white">Seguro</th>
                        <th className="px-6 py-4 text-left text-sm font-medium text-white">Fecha</th>
                        <th className="px-6 py-4 text-left text-sm font-medium text-white">Estado</th>
                        <th className="px-6 py-4 text-left text-sm font-medium text-white">Cobertura</th>
                        <th className="px-6 py-4 text-center text-sm font-medium text-white">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/10">
                      {verificationHistory?.results?.map((verification, index) => (
                        <motion.tr
                          key={verification.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className="hover:bg-white/5 transition-colors"
                        >
                          <td className="px-6 py-4">
                            <div>
                              <div className="text-white font-medium">{verification.patient_name}</div>
                              <div className="text-slate-400 text-sm">DNI: {verification.patient_dni}</div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div>
                              <div className="text-white">{verification.insurance_provider}</div>
                              <div className="text-slate-400 text-sm font-mono">{verification.policy_number}</div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-white">
                              {format(new Date(verification.verification_date), 'dd/MM/yyyy')}
                            </div>
                            <div className="text-slate-400 text-sm">
                              {format(new Date(verification.verification_date), 'HH:mm')}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center">
                              <StatusIcon status={verification.status} />
                              <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium border ${statusColors[verification.status] || 'bg-gray-500/20 text-gray-300 border-gray-400'}`}>
                                {statusLabels[verification.status] || verification.status}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            {verification.coverage_amount ? (
                              <div>
                                <div className="text-white">S/ {verification.coverage_amount}</div>
                                <div className="text-slate-400 text-sm">Copago: S/ {verification.copay}</div>
                              </div>
                            ) : (
                              <span className="text-slate-400">N/D</span>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex justify-center space-x-2">
                              <button className="p-2 text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 rounded-lg transition-colors" title="Ver detalles">
                                <Eye className="h-4 w-4" />
                              </button>
                              <button className="p-2 text-slate-400 hover:text-slate-300 hover:bg-slate-500/10 rounded-lg transition-colors" title="Descargar">
                                <Download className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
};

export default InsuranceVerification;
