import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { 
  Zap, MapPin, Phone, User, Clock, AlertTriangle, 
  CheckCircle, XCircle, Edit, Plus, Search, Filter,
  ArrowLeft, Activity, Bell, Navigation
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import ambulanceService from '../../services/ambulanceService';

const AmbulanceManagement = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedAmbulance, setSelectedAmbulance] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const queryClient = useQueryClient();

  // Obtener todas las ambulancias
  const { data: ambulances = [], isLoading } = useQuery({
    queryKey: ['ambulances'],
    queryFn: ambulanceService.getAllAmbulances,
    refetchInterval: 10000, // Actualizar cada 10 segundos para ubicaciones
  });

  // Obtener ambulancias disponibles
  const { data: availableAmbulances = [] } = useQuery({
    queryKey: ['availableAmbulances'],
    queryFn: ambulanceService.getAvailableAmbulances,
  });

  // Mutation para cambiar disponibilidad
  const toggleAvailabilityMutation = useMutation({
    mutationFn: ambulanceService.toggleAvailability,
    onSuccess: () => {
      queryClient.invalidateQueries(['ambulances']);
      queryClient.invalidateQueries(['availableAmbulances']);
    },
  });

  // Mutation para actualizar ubicación
  const updateLocationMutation = useMutation({
    mutationFn: ({ id, locationData }) => ambulanceService.updateLocation(id, locationData),
    onSuccess: () => {
      queryClient.invalidateQueries(['ambulances']);
    },
  });

  // Filtrar ambulancias
  const filteredAmbulances = ambulances.filter(ambulance => {
    const matchesSearch = searchTerm === '' ||
      ambulance.driver_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ambulance.plate_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ambulance.id?.toString().includes(searchTerm);
    
    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === 'available' && ambulance.is_available) ||
      (statusFilter === 'unavailable' && !ambulance.is_available) ||
      (statusFilter === 'on_duty' && ambulance.status === 'on_duty');
    
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status, isAvailable) => {
    if (!isAvailable) return 'bg-red-500';
    switch (status) {
      case 'available':
        return 'bg-green-500';
      case 'on_duty':
        return 'bg-blue-500';
      case 'maintenance':
        return 'bg-yellow-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusLabel = (status, isAvailable) => {
    if (!isAvailable) return 'No Disponible';
    switch (status) {
      case 'available':
        return 'Disponible';
      case 'on_duty':
        return 'En Servicio';
      case 'maintenance':
        return 'Mantenimiento';
      default:
        return 'Desconocido';
    }
  };

  const handleToggleAvailability = (id) => {
    toggleAvailabilityMutation.mutate(id);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-800 to-indigo-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white">Cargando ambulancias...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-800 to-indigo-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex justify-between items-center mb-8"
        >
          <div className="flex items-center">
            <Link 
              to="/emergency-dashboard" 
              className="p-2 text-slate-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors mr-4"
            >
              <ArrowLeft className="h-6 w-6" />
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">
                Gestión de Ambulancias
              </h1>
              <p className="text-slate-200">
                {format(new Date(), "EEEE, d 'de' MMMM 'de' yyyy HH:mm", { locale: es })}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <button className="relative p-2 text-slate-200 hover:text-white transition-colors">
              <Bell className="h-6 w-6" />
              <span className="absolute top-0 right-0 h-2 w-2 bg-red-500 rounded-full"></span>
            </button>
            <button 
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center"
            >
              <Plus className="h-4 w-4 mr-2" />
              Nueva Ambulancia
            </button>
          </div>
        </motion.div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[
            {
              title: 'Total Ambulancias',
              value: ambulances.length,
              change: 'En flota',
              icon: Zap,
              color: 'from-blue-500 to-blue-600',
            },
            {
              title: 'Disponibles',
              value: availableAmbulances.length,
              change: 'Listas para servicio',
              icon: CheckCircle,
              color: 'from-green-500 to-green-600',
            },
            {
              title: 'En Servicio',
              value: ambulances.filter(a => a.status === 'on_duty').length,
              change: 'Actualmente activas',
              icon: Activity,
              color: 'from-orange-500 to-orange-600',
            },
            {
              title: 'Mantenimiento',
              value: ambulances.filter(a => a.status === 'maintenance').length,
              change: 'Fuera de servicio',
              icon: AlertTriangle,
              color: 'from-red-500 to-red-600',
            },
          ].map((stat, index) => (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="backdrop-blur-lg bg-white/10 rounded-2xl p-6 border border-white/20"
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-xl bg-gradient-to-r ${stat.color}`}>
                  <stat.icon className="h-6 w-6 text-white" />
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-white">{stat.value}</p>
                  <p className="text-sm text-slate-200">{stat.change}</p>
                </div>
              </div>
              <h3 className="text-white/80 text-sm">{stat.title}</h3>
            </motion.div>
          ))}
        </div>

        {/* Filtros */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="backdrop-blur-lg bg-white/10 rounded-2xl p-6 border border-white/20 mb-6"
        >
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex-1 min-w-64">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-5 w-5" />
                <input
                  type="text"
                  placeholder="Buscar por conductor, placa o ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center">
                <Filter className="text-slate-400 mr-2 h-5 w-5" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="bg-white/5 border border-white/20 rounded-xl px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">Todos los estados</option>
                  <option value="available">Disponibles</option>
                  <option value="on_duty">En servicio</option>
                  <option value="unavailable">No disponibles</option>
                </select>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Lista de Ambulancias */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="backdrop-blur-lg bg-white/10 rounded-2xl p-6 border border-white/20"
        >
          <h2 className="text-xl font-semibold text-white mb-4 flex items-center">
            <Navigation className="h-5 w-5 mr-2 text-blue-400" />
            Flota de Ambulancias
          </h2>

          {filteredAmbulances.length === 0 ? (
            <div className="text-center py-8">
              <Zap className="h-12 w-12 text-slate-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">No se encontraron ambulancias</h3>
              <p className="text-slate-400">No hay ambulancias que coincidan con los filtros seleccionados.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredAmbulances.map((ambulance) => (
                <motion.div
                  key={ambulance.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-white/5 rounded-xl p-4 border border-white/10 hover:bg-white/10 transition-colors"
                >
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-white font-medium flex items-center">
                      <Zap className="h-4 w-4 mr-2 text-blue-400" />
                      Ambulancia #{ambulance.id}
                    </h3>
                    <div className="flex items-center space-x-2">
                      <div className={`w-3 h-3 rounded-full ${getStatusColor(ambulance.status, ambulance.is_available)}`}></div>
                      <span className="text-xs text-slate-300">
                        {getStatusLabel(ambulance.status, ambulance.is_available)}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2 mb-4">
                    <div className="flex items-center text-sm text-slate-300">
                      <User className="h-4 w-4 mr-2" />
                      <span>{ambulance.driver_name || 'Sin asignar'}</span>
                    </div>
                    <div className="flex items-center text-sm text-slate-300">
                      <Phone className="h-4 w-4 mr-2" />
                      <span>{ambulance.driver_phone || 'N/D'}</span>
                    </div>
                    <div className="flex items-center text-sm text-slate-300">
                      <MapPin className="h-4 w-4 mr-2" />
                      <span>{ambulance.current_location || 'Ubicación no disponible'}</span>
                    </div>
                    {ambulance.last_update && (
                      <div className="flex items-center text-sm text-slate-400">
                        <Clock className="h-4 w-4 mr-2" />
                        <span>Actualizado: {format(new Date(ambulance.last_update), 'HH:mm')}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleToggleAvailability(ambulance.id)}
                      disabled={toggleAvailabilityMutation.isLoading}
                      className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        ambulance.is_available
                          ? 'bg-red-500/20 text-red-300 hover:bg-red-500/30'
                          : 'bg-green-500/20 text-green-300 hover:bg-green-500/30'
                      } disabled:opacity-50`}
                    >
                      {ambulance.is_available ? (
                        <>
                          <XCircle className="h-4 w-4 mr-1 inline" />
                          Desactivar
                        </>
                      ) : (
                        <>
                          <CheckCircle className="h-4 w-4 mr-1 inline" />
                          Activar
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => setSelectedAmbulance(ambulance)}
                      className="px-3 py-2 bg-blue-500/20 text-blue-300 rounded-lg text-sm font-medium hover:bg-blue-500/30 transition-colors flex items-center"
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      Editar
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mt-6 backdrop-blur-lg bg-white/10 rounded-2xl p-6 border border-white/20"
        >
          <h2 className="text-xl font-semibold text-white mb-4">Acciones Rápidas</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <button
              onClick={() => setShowAddModal(true)}
              className="w-full py-3 px-4 bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-medium rounded-xl hover:from-blue-600 hover:to-indigo-700 transition duration-200 flex items-center justify-center"
            >
              <Plus className="h-5 w-5 mr-2" />
              Agregar Ambulancia
            </button>
            <Link to="/emergency/dispatch">
              <button className="w-full py-3 px-4 bg-white/10 text-white font-medium rounded-xl hover:bg-white/20 transition duration-200 flex items-center justify-center border border-white/20">
                <Navigation className="h-5 w-5 mr-2" />
                Despachar
              </button>
            </Link>
            <Link to="/emergency/routes">
              <button className="w-full py-3 px-4 bg-white/10 text-white font-medium rounded-xl hover:bg-white/20 transition duration-200 flex items-center justify-center border border-white/20">
                <MapPin className="h-5 w-5 mr-2" />
                Rutas
              </button>
            </Link>
            <Link to="/emergency/reports">
              <button className="w-full py-3 px-4 bg-white/10 text-white font-medium rounded-xl hover:bg-white/20 transition duration-200 flex items-center justify-center border border-white/20">
                <Activity className="h-5 w-5 mr-2" />
                Reportes
              </button>
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default AmbulanceManagement;
