import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { 
  AlertTriangle, Clock, Heart, Eye, Edit, Plus, Filter, Search,
  User, Stethoscope, Activity, TrendingUp, Bell, ArrowLeft
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import emergencyService from '../../services/emergencyService';

const CriticalCases = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [severityFilter, setSeverityFilter] = useState('all');
  const [timeFilter, setTimeFilter] = useState('all');

  // Obtener casos críticos usando React Query
  const { data: criticalCases = [], isLoading } = useQuery({
    queryKey: ['criticalCases'],
    queryFn: emergencyService.getCriticalCases,
    refetchInterval: 30000, // Actualizar cada 30 segundos
  });

  // Filtrar casos en tiempo real
  const filteredCases = criticalCases.filter(caseItem => {
    const matchesSearch = searchTerm === '' || 
      caseItem.patient_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      caseItem.patient_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      caseItem.diagnosis?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesSeverity = severityFilter === 'all' || caseItem.severity === severityFilter;
    
    let matchesTime = true;
    if (timeFilter !== 'all') {
      const now = new Date();
      const caseTime = new Date(caseItem.created_at);
      const hoursDiff = (now - caseTime) / (1000 * 60 * 60);
      
      switch (timeFilter) {
        case 'last_hour':
          matchesTime = hoursDiff <= 1;
          break;
        case 'last_6_hours':
          matchesTime = hoursDiff <= 6;
          break;
        case 'last_24_hours':
          matchesTime = hoursDiff <= 24;
          break;
      }
    }
    
    return matchesSearch && matchesSeverity && matchesTime;
  });

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-500/20 text-red-300 border-red-500/50';
      case 'high':
        return 'bg-orange-500/20 text-orange-300 border-orange-500/50';
      case 'medium':
        return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/50';
      default:
        return 'bg-gray-500/20 text-gray-300 border-gray-500/50';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'critical':
        return 'bg-red-500';
      case 'deteriorating':
        return 'bg-red-400';
      case 'stable':
        return 'bg-green-500';
      case 'improving':
        return 'bg-blue-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getTimeAgo = (datetime) => {
    if (!datetime) return 'N/A';
    const now = new Date();
    const past = new Date(datetime);
    const diffInHours = Math.floor((now - past) / (1000 * 60 * 60));
    const diffInMinutes = Math.floor((now - past) / (1000 * 60));

    if (diffInHours > 0) {
      return `hace ${diffInHours}h`;
    } else {
      return `hace ${diffInMinutes}m`;
    }
  };

  const getPriorityLabel = (severity) => {
    switch (severity) {
      case 'critical': return '🔴 CRÍTICO';
      case 'high': return '🟠 ALTA';
      case 'medium': return '🟡 MEDIA';
      default: return '🟢 BAJA';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando casos críticos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-red-800 to-red-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex justify-between items-center mb-8"
        >
          <div className="flex items-center">
            <AlertTriangle className="h-8 w-8 text-red-400 mr-3" />
            <h1 className="text-3xl text-white font-bold">Casos Críticos</h1>
          </div>
          <Link
            to="/emergency-dashboard"
            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-800 flex items-center"
          >
            <ArrowLeft className="h-4 w-4 mr-2" /> Volver
          </Link>
        </motion.div>

        {/* Filters */}
        <div className="bg-white/10 rounded-2xl p-6 border border-white/10 mb-8">
          <div className="flex justify-between">
            <div className="relative w-80">
              <Search className="absolute top-3 left-4 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar casos..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-2 rounded-xl border-none focus:ring-2 focus:ring-red-500"
              />
            </div>
            <div className="flex space-x-4">
              <select
                value={severityFilter}
                onChange={e => setSeverityFilter(e.target.value)}
                className="px-3 py-2 rounded-xl focus:ring-2 focus:ring-red-500"
              >
                <option value="all">Todas las Severidades</option>
                <option value="critical">Crítico</option>
                <option value="high">Alta</option>
                <option value="medium">Media</option>
              </select>
              <select
                value={timeFilter}
                onChange={e => setTimeFilter(e.target.value)}
                className="px-3 py-2 rounded-xl focus:ring-2 focus:ring-red-500"
              >
                <option value="all">Todo el Tiempo</option>
                <option value="last_hour">Última Hora</option>
                <option value="last_6_hours">Últimas 6 Horas</option>
                <option value="last_24_hours">Últimas 24 Horas</option>
              </select>
            </div>
          </div>
        </div>

        {/* Critical Cases List */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-8"
        >
          {filteredCases.map(case_ => (
            <motion.div
              key={case_.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white/10 rounded-lg p-6 border border-white/10 hover:bg-white/20 transition"
            >
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-xl text-white font-bold">{case_.patient_name}</h3>
                <span className={`px-3 py-1 rounded-full font-medium text-sm ${getSeverityColor(case_.severity)}`}>
                  {getPriorityLabel(case_.severity)}
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-4">
                <div>
                  <div className="text-sm text-white">
                    <strong>ID:</strong> {case_.patient_id}
                  </div>
                  <div className="text-sm text-white">
                    <strong>Edad:</strong> {case_.age}
                  </div>
                  <div className="text-sm text-white">
                    <strong>Género:</strong> {case_.gender}
                  </div>
                  <div className="text-sm text-white">
                    <strong>Diagnóstico:</strong> {case_.diagnosis}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-white">
                    <strong>Ingreso:</strong> {getTimeAgo(case_.created_at)}
                  </div>
                  <div className="text-sm text-white">
                    <strong>Doctor:</strong> {case_.assigned_doctor}
                  </div>
                  <div className="text-sm text-white">
                    <strong>Ubicación:</strong> {case_.location}
                  </div>
                </div>
                <div className="flex justify-end">
                  <Link className="bg-blue-600 text-white px-4 py-2 rounded-lg mr-2 hover:bg-blue-800" to={`/details/${case_.id}`}>
                    <Eye className="mr-1" /> Detalles
                  </Link>
                  <Link className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-800" to={`/edit/${case_.id}`}>
                    <Edit className="mr-1" /> Editar
                  </Link>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </div>
  );
};

export default CriticalCases;

