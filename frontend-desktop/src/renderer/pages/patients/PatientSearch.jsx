import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, Eye, MapPin, Phone, Mail, Users, 
  Calendar, User, Clock, Activity, Filter,
  Edit2, AlertCircle, CheckCircle, XCircle,
  Heart, FileText
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { format, differenceInYears } from 'date-fns';
import { es } from 'date-fns/locale';
import patientService from '../../services/patientService';

const PatientSearch = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [selectedSearchType, setSelectedSearchType] = useState('all'); // all, name, dni, phone
  const [showFilters, setShowFilters] = useState(false);
  const [genderFilter, setGenderFilter] = useState('all');
  const [ageRangeFilter, setAgeRangeFilter] = useState('all');
  const [hasInsuranceFilter, setHasInsuranceFilter] = useState('all');

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  const { data: patientsData, isLoading, error } = useQuery({
    queryKey: ['patientSearch', {
      search: debouncedSearchTerm,
      searchType: selectedSearchType,
      gender: genderFilter,
      ageRange: ageRangeFilter,
      hasInsurance: hasInsuranceFilter
    }],
    queryFn: () => patientService.searchPatients({
      query: debouncedSearchTerm,
      searchType: selectedSearchType === 'all' ? undefined : selectedSearchType,
      gender: genderFilter === 'all' ? undefined : genderFilter,
      age_range: ageRangeFilter === 'all' ? undefined : ageRangeFilter,
      has_insurance: hasInsuranceFilter === 'all' ? undefined : hasInsuranceFilter
    }),
    enabled: debouncedSearchTerm.length >= 3 || Object.values({ genderFilter, ageRangeFilter, hasInsuranceFilter }).some(f => f !== 'all')
  });

  const patients = patientsData?.results || [];
  const totalResults = patientsData?.count || 0;

  const getAgeFromBirthDate = (birthDate) => {
    if (!birthDate) return 'N/A';
    return differenceInYears(new Date(), new Date(birthDate));
  };

  const genderLabels = {
    'M': 'Masculino',
    'F': 'Femenino',
    'O': 'Otro'
  };

  const getBloodTypeColor = (bloodType) => {
    const colors = {
      'A+': 'text-red-400',
      'A-': 'text-red-300',
      'B+': 'text-blue-400',
      'B-': 'text-blue-300',
      'AB+': 'text-purple-400',
      'AB-': 'text-purple-300',
      'O+': 'text-green-400',
      'O-': 'text-green-300'
    };
    return colors[bloodType] || 'text-slate-400';
  };

  const hasMinimumSearchCriteria = debouncedSearchTerm.length >= 3 || 
    Object.values({ genderFilter, ageRangeFilter, hasInsuranceFilter }).some(f => f !== 'all');

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
              <Search className="h-8 w-8 mr-3 text-green-400" />
              Búsqueda Avanzada de Pacientes
            </h1>
            <p className="text-slate-200">
              {totalResults > 0 ? `${totalResults} paciente${totalResults !== 1 ? 's' : ''} encontrado${totalResults !== 1 ? 's' : ''}` : 'Sistema de búsqueda de pacientes'}
            </p>
          </div>
        </motion.div>

        {/* Search and Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="backdrop-blur-lg bg-white/10 rounded-2xl p-6 border border-white/20 mb-6"
        >
          <div className="space-y-4">
            {/* Main Search */}
            <div className="flex flex-col lg:flex-row lg:items-center lg:space-x-4 space-y-4 lg:space-y-0">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Buscar por nombre, apellido, DNI o teléfono (mínimo 3 caracteres)..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>

              {/* Search Type */}
              <div className="lg:w-48">
                <select
                  value={selectedSearchType}
                  onChange={(e) => setSelectedSearchType(e.target.value)}
                  className="w-full px-3 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="all">Buscar en todo</option>
                  <option value="name">Solo nombres</option>
                  <option value="dni">Solo DNI</option>
                  <option value="phone">Solo teléfono</option>
                </select>
              </div>

              {/* Filter Button */}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="px-4 py-3 bg-white/10 text-white border border-white/20 rounded-lg hover:bg-white/20 transition duration-200 flex items-center"
              >
                <Filter className="h-5 w-5 mr-2" />
                Filtros Avanzados
              </button>
            </div>

            {/* Advanced Filters */}
            <AnimatePresence>
              {showFilters && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="pt-4 border-t border-white/20"
                >
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-white mb-2">Género</label>
                      <select
                        value={genderFilter}
                        onChange={(e) => setGenderFilter(e.target.value)}
                        className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                      >
                        <option value="all">Todos</option>
                        <option value="M">Masculino</option>
                        <option value="F">Femenino</option>
                        <option value="O">Otro</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-white mb-2">Rango de Edad</label>
                      <select
                        value={ageRangeFilter}
                        onChange={(e) => setAgeRangeFilter(e.target.value)}
                        className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                      >
                        <option value="all">Todas las edades</option>
                        <option value="0-18">0-18 años</option>
                        <option value="19-35">19-35 años</option>
                        <option value="36-55">36-55 años</option>
                        <option value="56+">56+ años</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-white mb-2">Seguro Médico</label>
                      <select
                        value={hasInsuranceFilter}
                        onChange={(e) => setHasInsuranceFilter(e.target.value)}
                        className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                      >
                        <option value="all">Todos</option>
                        <option value="yes">Con seguro</option>
                        <option value="no">Sin seguro</option>
                      </select>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* Search Results */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="backdrop-blur-lg bg-white/10 rounded-2xl border border-white/20 overflow-hidden"
        >
          {!hasMinimumSearchCriteria ? (
            <div className="text-center py-12">
              <Search className="h-16 w-16 text-slate-400 mx-auto mb-4" />
              <h3 className="text-xl font-medium text-white mb-2">Inicia tu búsqueda</h3>
              <p className="text-slate-400">Ingresa al menos 3 caracteres o aplica filtros para buscar pacientes.</p>
            </div>
          ) : isLoading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <AlertCircle className="h-16 w-16 text-red-400 mx-auto mb-4" />
              <h3 className="text-xl font-medium text-white mb-2">Error en la búsqueda</h3>
              <p className="text-slate-400">Ocurrió un error al buscar pacientes. Por favor intenta nuevamente.</p>
            </div>
          ) : patients.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-16 w-16 text-slate-400 mx-auto mb-4" />
              <h3 className="text-xl font-medium text-white mb-2">No se encontraron pacientes</h3>
              <p className="text-slate-400">Prueba con otros términos de búsqueda o ajusta los filtros.</p>
            </div>
          ) : (
            <div className="divide-y divide-white/10">
              {patients.map((patient, index) => (
                <motion.div
                  key={patient.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="p-6 hover:bg-white/5 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4 flex-1">
                      {/* Patient Avatar */}
                      <div className="w-12 h-12 rounded-full bg-gradient-to-r from-green-500 to-emerald-600 flex items-center justify-center text-white font-semibold">
                        {patient.first_name?.charAt(0)}{patient.last_name?.charAt(0)}
                      </div>

                      {/* Patient Info */}
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="text-white font-medium text-lg">
                            {patient.first_name} {patient.last_name}
                          </h3>
                          <div className="flex items-center space-x-2">
                            {patient.blood_type && (
                              <span className={`px-2 py-1 rounded-full text-xs font-medium bg-white/10 ${getBloodTypeColor(patient.blood_type)}`}>
                                <Heart className="h-3 w-3 inline mr-1" />
                                {patient.blood_type}
                              </span>
                            )}
                            {patient.insurance_provider && (
                              <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-500/20 text-blue-300">
                                <CheckCircle className="h-3 w-3 inline mr-1" />
                                Asegurado
                              </span>
                            )}
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                          <div className="flex items-center text-slate-200">
                            <User className="h-4 w-4 mr-2 text-slate-400" />
                            DNI: {patient.dni}
                          </div>
                          <div className="flex items-center text-slate-200">
                            <Calendar className="h-4 w-4 mr-2 text-slate-400" />
                            {getAgeFromBirthDate(patient.date_of_birth)} años
                          </div>
                          <div className="flex items-center text-slate-200">
                            <Phone className="h-4 w-4 mr-2 text-slate-400" />
                            {patient.phone || 'N/D'}
                          </div>
                          <div className="flex items-center text-slate-200">
                            <Mail className="h-4 w-4 mr-2 text-slate-400" />
                            {patient.email || 'N/D'}
                          </div>
                        </div>
                        
                        {patient.address && (
                          <div className="flex items-center mt-2 text-sm text-slate-300">
                            <MapPin className="h-4 w-4 mr-2 text-slate-400" />
                            {patient.address}
                          </div>
                        )}
                        
                        {patient.last_appointment && (
                          <div className="flex items-center mt-2 text-sm text-slate-300">
                            <Clock className="h-4 w-4 mr-2 text-slate-400" />
                            Última consulta: {format(new Date(patient.last_appointment.date), 'dd/MM/yyyy')} - Dr. {patient.last_appointment.doctor_name}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="ml-6">
                      <div className="flex items-center space-x-2">
                        <Link
                          to={`/patients/${patient.id}`}
                          className="p-2 text-green-400 hover:text-green-300 hover:bg-green-500/10 rounded-lg transition-colors"
                          title="Ver detalles del paciente"
                        >
                          <Eye className="h-4 w-4" />
                        </Link>
                        <Link
                          to={`/patients/${patient.id}/edit`}
                          className="p-2 text-slate-400 hover:text-slate-300 hover:bg-slate-500/10 rounded-lg transition-colors"
                          title="Editar paciente"
                        >
                          <Edit2 className="h-4 w-4" />
                        </Link>
                        <Link
                          to={`/medical-records/${patient.id}`}
                          className="p-2 text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 rounded-lg transition-colors"
                          title="Ver historial médico"
                        >
                          <FileText className="h-4 w-4" />
                        </Link>
                      </div>
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

export default PatientSearch;

