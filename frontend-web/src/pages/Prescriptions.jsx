import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Pill, Calendar, Clock, Download, Filter, Search, ChevronLeft, FileText } from 'lucide-react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import toast from 'react-hot-toast';
import medicalRecordService from '../services/medicalRecordService';

const Prescriptions = () => {
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Obtener prescripciones
  const { data: prescriptions, isLoading } = useQuery({
    queryKey: ['prescriptions'],
    queryFn: medicalRecordService.getPrescriptions,
  });

  // Obtener prescripciones activas
  const { data: activePrescriptions } = useQuery({
    queryKey: ['activePrescriptions'],
    queryFn: medicalRecordService.getActivePrescriptions,
  });

  const handleDownloadPrescription = async (prescriptionId) => {
    try {
      const blob = await medicalRecordService.downloadDocument(prescriptionId);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `receta_${prescriptionId}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success('Receta descargada exitosamente');
    } catch (error) {
      toast.error('Error al descargar la receta');
    }
  };

  // Filtrar prescripciones
  const filteredPrescriptions = prescriptions?.filter(prescription => {
    const matchesSearch = 
      prescription.medication_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      prescription.doctor_name.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (filterStatus === 'active') {
      const endDate = new Date(prescription.end_date);
      const today = new Date();
      return matchesSearch && endDate >= today;
    }
    
    if (filterStatus === 'completed') {
      const endDate = new Date(prescription.end_date);
      const today = new Date();
      return matchesSearch && endDate < today;
    }
    
    return matchesSearch;
  });

  const isActivePrescription = (prescription) => {
    const endDate = new Date(prescription.end_date);
    const today = new Date();
    return endDate >= today;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      {/* Header */}
      <header className="backdrop-blur-lg bg-white/10 border-b border-white/20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Link to="/dashboard" className="text-white hover:text-blue-400 transition-colors">
                <ChevronLeft className="h-6 w-6" />
              </Link>
              <h1 className="text-xl font-bold text-white">Mis Recetas Médicas</h1>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto p-6">
        {/* Resumen de prescripciones activas */}
        {activePrescriptions && activePrescriptions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 backdrop-blur-lg bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-2xl p-6 border border-green-500/30"
          >
            <div className="flex items-center space-x-3 mb-3">
              <div className="h-10 w-10 bg-green-500/30 rounded-full flex items-center justify-center">
                <Pill className="h-5 w-5 text-green-300" />
              </div>
              <h2 className="text-lg font-semibold text-white">Medicamentos Activos</h2>
            </div>
            <p className="text-green-200">
              Actualmente tiene {activePrescriptions.length} medicamento{activePrescriptions.length > 1 ? 's' : ''} activo{activePrescriptions.length > 1 ? 's' : ''}
            </p>
          </motion.div>
        )}

        {/* Filtros y búsqueda */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-6 backdrop-blur-lg bg-white/10 rounded-2xl p-6 border border-white/20"
        >
          <div className="flex flex-col md:flex-row gap-4">
            {/* Búsqueda */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar por medicamento o doctor..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-400"
                />
              </div>
            </div>

            {/* Filtro por estado */}
            <div className="flex items-center space-x-2">
              <Filter className="h-5 w-5 text-gray-400" />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-blue-400"
              >
                <option value="all">Todas</option>
                <option value="active">Activas</option>
                <option value="completed">Completadas</option>
              </select>
            </div>
          </div>
        </motion.div>

        {/* Lista de prescripciones */}
        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto"></div>
          </div>
        ) : filteredPrescriptions?.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="backdrop-blur-lg bg-white/10 rounded-2xl p-12 border border-white/20 text-center"
          >
            <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-400 text-lg">No se encontraron recetas médicas</p>
          </motion.div>
        ) : (
          <div className="grid gap-4">
            {filteredPrescriptions?.map((prescription, index) => (
              <motion.div
                key={prescription.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="backdrop-blur-lg bg-white/10 rounded-2xl p-6 border border-white/20 hover:bg-white/15 transition-all"
              >
                <div className="flex flex-col md:flex-row md:items-start justify-between">
                  <div className="flex-1 space-y-4">
                    {/* Encabezado */}
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-xl font-semibold text-white flex items-center gap-2">
                          <Pill className="h-5 w-5 text-blue-400" />
                          {prescription.medication_name}
                        </h3>
                        <p className="text-gray-400 mt-1">Recetado por Dr. {prescription.doctor_name}</p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        isActivePrescription(prescription)
                          ? 'bg-green-500/20 text-green-300 border border-green-500/30'
                          : 'bg-gray-500/20 text-gray-300 border border-gray-500/30'
                      }`}>
                        {isActivePrescription(prescription) ? 'Activo' : 'Completado'}
                      </span>
                    </div>

                    {/* Detalles de dosificación */}
                    <div className="bg-white/5 rounded-xl p-4 space-y-2">
                      <div className="flex items-center space-x-2">
                        <span className="text-gray-400">Dosis:</span>
                        <span className="text-white font-medium">{prescription.dosage}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-gray-400">Frecuencia:</span>
                        <span className="text-white font-medium">{prescription.frequency}</span>
                      </div>
                      {prescription.instructions && (
                        <div>
                          <span className="text-gray-400">Instrucciones:</span>
                          <p className="text-white mt-1">{prescription.instructions}</p>
                        </div>
                      )}
                    </div>

                    {/* Fechas */}
                    <div className="flex flex-wrap gap-4 text-sm">
                      <div className="flex items-center space-x-2 text-gray-300">
                        <Calendar className="h-4 w-4" />
                        <span>
                          Desde: {format(new Date(prescription.start_date), "d 'de' MMMM, yyyy", { locale: es })}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2 text-gray-300">
                        <Clock className="h-4 w-4" />
                        <span>
                          Hasta: {format(new Date(prescription.end_date), "d 'de' MMMM, yyyy", { locale: es })}
                        </span>
                      </div>
                    </div>

                    {/* Diagnóstico asociado */}
                    {prescription.diagnosis && (
                      <div className="text-sm">
                        <span className="text-gray-400">Diagnóstico asociado:</span>
                        <p className="text-gray-300">{prescription.diagnosis}</p>
                      </div>
                    )}
                  </div>

                  {/* Acciones */}
                  <div className="mt-4 md:mt-0 md:ml-6">
                    <button
                      onClick={() => handleDownloadPrescription(prescription.id)}
                      className="flex items-center space-x-2 px-4 py-2 bg-blue-500/20 text-blue-300 rounded-lg hover:bg-blue-500/30 transition-colors border border-blue-500/30"
                    >
                      <Download className="h-4 w-4" />
                      <span>Descargar</span>
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Información adicional */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-6 backdrop-blur-lg bg-white/10 rounded-2xl p-6 border border-white/20"
        >
          <h3 className="text-lg font-semibold text-white mb-3">Información Importante</h3>
          <ul className="space-y-2 text-gray-300">
            <li className="flex items-start">
              <span className="text-blue-400 mr-2">•</span>
              <span>Siempre siga las instrucciones de su médico al tomar medicamentos</span>
            </li>
            <li className="flex items-start">
              <span className="text-blue-400 mr-2">•</span>
              <span>No suspenda el tratamiento sin consultar a su médico</span>
            </li>
            <li className="flex items-start">
              <span className="text-blue-400 mr-2">•</span>
              <span>Informe a su médico sobre cualquier efecto secundario</span>
            </li>
            <li className="flex items-start">
              <span className="text-blue-400 mr-2">•</span>
              <span>Mantenga los medicamentos fuera del alcance de los niños</span>
            </li>
          </ul>
        </motion.div>
      </div>
    </div>
  );
};

export default Prescriptions;
