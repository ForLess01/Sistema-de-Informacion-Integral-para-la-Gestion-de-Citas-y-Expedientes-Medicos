import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, Search, Filter, Plus, Eye, Edit2, 
  Phone, User, Calendar, ChevronLeft, ChevronRight,
  MapPin, Mail, Activity, Clock
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { format, differenceInYears } from 'date-fns';
import { es } from 'date-fns/locale';
import patientService from '../../services/patientService';

const PatientsList = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const [ageFilter, setAgeFilter] = useState('all');
  const [genderFilter, setGenderFilter] = useState('all');

  // Obtener pacientes con filtros
  const { data: patientsData, isLoading } = useQuery({
    queryKey: ['patients', {
      search: searchTerm,
      page: currentPage,
      age_range: ageFilter,
      gender: genderFilter
    }],
    queryFn: () => patientService.getPatients({
      search: searchTerm,
      page: currentPage,
      page_size: 20,
      age_range: ageFilter === 'all' ? undefined : ageFilter,
      gender: genderFilter === 'all' ? undefined : genderFilter
    }),
  });

  const patients = patientsData?.results || [];
  const totalPages = Math.ceil((patientsData?.count || 0) / 20);

  const getAgeFromBirthDate = (birthDate) => {
    if (!birthDate) return 'N/A';
    return differenceInYears(new Date(), new Date(birthDate));
  };

  const genderLabels = {
    'M': 'Masculino',
    'F': 'Femenino',
    'O': 'Otro'
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
              <Users className="h-8 w-8 mr-3 text-green-400" />
              Gestión de Pacientes
            </h1>
            <p className="text-slate-200">
              {patientsData?.count || 0} pacientes registrados
            </p>
          </div>
          <Link to="/patients/new">
            <button className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-medium rounded-xl hover:from-green-600 hover:to-emerald-700 transition duration-200 flex items-center">
              <Plus className="h-5 w-5 mr-2" />
              Nuevo Paciente
            </button>
          </Link>
        </motion.div>

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
                    <label className="block text-sm font-medium text-white mb-2">Rango de Edad</label>
                    <select
                      value={ageFilter}
                      onChange={(e) => setAgeFilter(e.target.value)}
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
              <h3 className="text-xl font-medium text-white mb-2">No hay pacientes</h3>
              <p className="text-slate-400">No se encontraron pacientes para los filtros seleccionados.</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-white/5">
                    <tr>
                      <th className="px-6 py-4 text-left text-sm font-medium text-white">Paciente</th>
                      <th className="px-6 py-4 text-left text-sm font-medium text-white">Información Personal</th>
                      <th className="px-6 py-4 text-left text-sm font-medium text-white">Contacto</th>
                      <th className="px-6 py-4 text-left text-sm font-medium text-white">Última Consulta</th>
                      <th className="px-6 py-4 text-center text-sm font-medium text-white">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/10">
                    {patients.map((patient, index) => (
                      <motion.tr
                        key={patient.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="hover:bg-white/5 transition-colors"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center">
                            <div className="w-12 h-12 rounded-full bg-gradient-to-r from-green-500 to-emerald-600 flex items-center justify-center text-white font-semibold mr-4">
                              {patient.first_name?.charAt(0)}{patient.last_name?.charAt(0)}
                            </div>
                            <div>
                              <div className="text-white font-medium">
                                {patient.first_name} {patient.last_name}
                              </div>
                              <div className="text-slate-400 text-sm">
                                DNI: {patient.dni}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-white">
                            {getAgeFromBirthDate(patient.date_of_birth)} años
                          </div>
                          <div className="text-slate-400 text-sm">
                            {genderLabels[patient.gender] || 'N/E'}
                          </div>
                          {patient.date_of_birth && (
                            <div className="text-slate-400 text-sm">
                              {format(new Date(patient.date_of_birth), 'dd/MM/yyyy')}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="space-y-1">
                            <div className="flex items-center text-slate-200">
                              <Phone className="h-4 w-4 mr-2 text-green-400" />
                              {patient.phone || 'N/D'}
                            </div>
                            <div className="flex items-center text-slate-200">
                              <Mail className="h-4 w-4 mr-2 text-green-400" />
                              {patient.email || 'N/D'}
                            </div>
                            {patient.address && (
                              <div className="flex items-center text-slate-200">
                                <MapPin className="h-4 w-4 mr-2 text-green-400" />
                                <span className="truncate max-w-32">
                                  {patient.address}
                                </span>
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          {patient.last_appointment ? (
                            <div>
                              <div className="flex items-center text-white">
                                <Calendar className="h-4 w-4 mr-2 text-blue-400" />
                                {format(new Date(patient.last_appointment.date), 'dd/MM/yyyy')}
                              </div>
                              <div className="text-slate-400 text-sm">
                                Dr. {patient.last_appointment.doctor_name}
                              </div>
                              <div className="text-slate-400 text-sm">
                                {patient.last_appointment.specialty}
                              </div>
                            </div>
                          ) : (
                            <div className="text-slate-400 text-sm">
                              Sin consultas previas
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex justify-center space-x-2">
                            <Link
                              to={`/patients/${patient.id}`}
                              className="p-2 text-green-400 hover:text-green-300 hover:bg-green-500/10 rounded-lg transition-colors"
                              title="Ver detalles"
                            >
                              <Eye className="h-4 w-4" />
                            </Link>
                            <Link
                              to={`/patients/${patient.id}/edit`}
                              className="p-2 text-slate-400 hover:text-slate-300 hover:bg-slate-500/10 rounded-lg transition-colors"
                              title="Editar"
                            >
                              <Edit2 className="h-4 w-4" />
                            </Link>
                            <Link
                              to={`/medical-records/${patient.id}`}
                              className="p-2 text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 rounded-lg transition-colors"
                              title="Historial médico"
                            >
                              <Activity className="h-4 w-4" />
                            </Link>
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-between items-center px-6 py-4 border-t border-white/10">
                  <div className="text-sm text-slate-400">
                    Mostrando {((currentPage - 1) * 20) + 1} - {Math.min(currentPage * 20, patientsData?.count || 0)} de {patientsData?.count || 0} pacientes
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
      </div>
    </div>
  );
};

export default PatientsList;
