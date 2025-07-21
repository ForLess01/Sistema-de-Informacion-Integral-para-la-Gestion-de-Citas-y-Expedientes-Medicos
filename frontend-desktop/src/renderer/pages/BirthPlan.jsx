import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { 
  Baby, Heart, Edit3, Eye, FileText, 
  ArrowLeft, Search, Plus, Stethoscope,
  Calendar, Clock, User, CheckCircle,
  AlertCircle, Filter, Phone, MapPin
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { format, differenceInDays } from 'date-fns';
import { es } from 'date-fns/locale';
import obstetricService from '../services/obstetricService';

const BirthPlan = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Queries
  const { data: birthPlans, isLoading } = useQuery({
    queryKey: ['birthPlans', { searchTerm, statusFilter }],
    queryFn: () => obstetricService.getBirthPlans({
      search: searchTerm,
      status: statusFilter !== 'all' ? statusFilter : undefined,
    }),
  });

  // Helper functions
  const getStatusColor = (status, doctorApproved) => {
    if (status === 'active' && doctorApproved) return 'bg-green-500/20 text-green-300';
    if (status === 'approved') return 'bg-blue-500/20 text-blue-300';
    if (status === 'pending') return 'bg-yellow-500/20 text-yellow-300';
    if (status === 'draft') return 'bg-gray-500/20 text-gray-300';
    return 'bg-pink-500/20 text-pink-300';
  };

  const getStatusText = (status, doctorApproved) => {
    if (status === 'active' && doctorApproved) return 'Aprobado';
    if (status === 'approved') return 'Revisado';
    if (status === 'pending') return 'Pendiente';
    if (status === 'draft') return 'Borrador';
    return status;
  };

  const getDaysUntilBirth = (edd) => {
    const daysLeft = differenceInDays(new Date(edd), new Date());
    return daysLeft;
  };

  const getUrgencyColor = (daysLeft) => {
    if (daysLeft <= 7) return 'text-red-300';
    if (daysLeft <= 30) return 'text-yellow-300';
    return 'text-green-300';
  };

  // Stats
  const planStats = {
    total: birthPlans?.length || 0,
    active: birthPlans?.filter(p => p.status === 'active').length || 0,
    pending: birthPlans?.filter(p => p.status === 'pending').length || 0,
    thisWeek: birthPlans?.filter(p => getDaysUntilBirth(p.estimated_due_date) <= 7).length || 0
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-900 via-purple-800 to-rose-900 p-6">
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-8"
        >
          <div className="flex items-center">
            <Link to="/obstetriz-dashboard" className="mr-4 p-2 hover:bg-white/10 rounded-lg transition-colors">
              <ArrowLeft className="h-6 w-6 text-white" />
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">
                Planes de Parto
              </h1>
              <p className="text-pink-200">
                Gestiona los planes y preferencias para los partos
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <Link to="/birth-plan/new">
              <button className="px-4 py-2 bg-gradient-to-r from-pink-500 to-purple-600 text-white font-medium rounded-lg hover:from-pink-600 hover:to-purple-700 transition duration-200 flex items-center">
                <Plus className="h-4 w-4 mr-2" />
                Nuevo Plan
              </button>
            </Link>
          </div>
        </motion.div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="backdrop-blur-lg bg-white/10 rounded-xl p-6 border border-white/20"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-pink-200 text-sm font-medium">Total Planes</p>
                <p className="text-2xl font-bold text-white">{planStats.total}</p>
              </div>
              <FileText className="h-8 w-8 text-pink-300" />
            </div>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="backdrop-blur-lg bg-white/10 rounded-xl p-6 border border-white/20"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-pink-200 text-sm font-medium">Planes Activos</p>
                <p className="text-2xl font-bold text-white">{planStats.active}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-300" />
            </div>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="backdrop-blur-lg bg-white/10 rounded-xl p-6 border border-white/20"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-pink-200 text-sm font-medium">Pendientes</p>
                <p className="text-2xl font-bold text-white">{planStats.pending}</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-300" />
            </div>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="backdrop-blur-lg bg-white/10 rounded-xl p-6 border border-white/20"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-pink-200 text-sm font-medium">Esta Semana</p>
                <p className="text-2xl font-bold text-white">{planStats.thisWeek}</p>
              </div>
              <Calendar className="h-8 w-8 text-red-300" />
            </div>
          </motion.div>
        </div>

        {/* Birth Plans List */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="lg:col-span-2 backdrop-blur-lg bg-white/10 rounded-2xl p-6 border border-white/20"
          >
            {/* Search */}
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="flex-1 relative">
                <Search className="h-5 w-5 text-pink-300 absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="Buscar por nombre de paciente..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-pink-300 focus:outline-none focus:ring-2 focus:ring-pink-400"
                />
              </div>
            </div>

            {isLoading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
              </div>
            ) : (
              <div className="space-y-4 max-h-[600px] overflow-y-auto">
                {(!birthPlans || birthPlans.length === 0) ? (
                  <p className="text-pink-200 text-center py-8">No hay planes de parto que coincidan con los criterios</p>
                ) : (
                  birthPlans.map((plan) => (
                    <motion.div
                      key={plan.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="bg-white/5 rounded-xl p-5 border border-white/10 hover:bg-white/10 transition-colors"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-r from-pink-500 to-purple-600 flex items-center justify-center text-white font-semibold text-sm">
                            {plan.patient_name.split(' ').map(n => n[0]).join('').substring(0, 2)}
                          </div>
                          <div>
                            <h4 className="text-white font-semibold text-lg">{plan.patient_name}</h4>
                            <p className="text-pink-200 text-sm">DNI: {plan.patient_dni} • {plan.weeks_pregnant} semanas</p>
                            <p className="text-pink-300 text-xs">{plan.plan_type} - {format(new Date(plan.estimated_due_date), 'dd/MM/yyyy', { locale: es })}</p>
                          </div>
                        </div>
                        <div className="flex flex-col items-end space-y-2">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(plan.status, plan.doctor_approved)}`}>
                            {getStatusText(plan.status, plan.doctor_approved)}
                          </span>
                          {(() => {
                            const daysLeft = getDaysUntilBirth(plan.estimated_due_date);
                            return (
                              <span className={`text-xs font-medium ${getUrgencyColor(daysLeft)}`}>
                                {daysLeft > 0 ? `${daysLeft} días` : daysLeft === 0 ? 'Hoy' : 'Vencido'}
                              </span>
                            );
                          })()} 
                        </div>
                      </div>

                      {/* Plan Details Grid */}
                      <div className="grid grid-cols-2 gap-4 mb-4 p-3 bg-white/5 rounded-lg">
                        <div>
                          <p className="text-xs text-pink-300 mb-1">Tipo de Parto</p>
                          <p className="text-sm text-white font-medium">{plan.birth_preference.replace('_', ' ')}</p>
                        </div>
                        <div>
                          <p className="text-xs text-pink-300 mb-1">Manejo del Dolor</p>
                          <p className="text-sm text-white font-medium">{plan.pain_management}</p>
                        </div>
                        <div>
                          <p className="text-xs text-pink-300 mb-1">Acompañante</p>
                          <p className="text-sm text-white font-medium">{plan.support_person}</p>
                        </div>
                        <div>
                          <p className="text-xs text-pink-300 mb-1">Posición</p>
                          <p className="text-sm text-white font-medium">{plan.birth_position}</p>
                        </div>
                      </div>

                      {plan.special_requests && (
                        <div className="mb-4">
                          <p className="text-xs text-pink-300 mb-1">Preferencias Especiales:</p>
                          <p className="text-pink-200 text-sm italic">
                            "{plan.special_requests}"
                          </p>
                        </div>
                      )}

                      {plan.medical_notes && (
                        <div className="mb-4">
                          <p className="text-xs text-pink-300 mb-1">Notas Médicas:</p>
                          <p className="text-pink-200 text-sm italic">
                            "{plan.medical_notes}"
                          </p>
                        </div>
                      )}

                      <div className="flex items-center justify-between">
                        <div className="flex space-x-2">
                          <Link
                            to={`/birth-plan/${plan.id}/view`}
                            className="p-2 text-pink-300 hover:text-pink-200 hover:bg-white/5 rounded-lg transition-colors"
                            title="Ver detalle"
                          >
                            <Eye className="h-4 w-4" />
                          </Link>
                          <Link
                            to={`/birth-plan/${plan.id}/edit`}
                            className="p-2 text-pink-300 hover:text-pink-200 hover:bg-white/5 rounded-lg transition-colors"
                            title="Editar"
                          >
                            <Edit3 className="h-4 w-4" />
                          </Link>
                          <Link
                            to={`/prenatal-control/new?patient_id=${plan.id}`}
                            className="p-2 text-pink-300 hover:text-pink-200 hover:bg-white/5 rounded-lg transition-colors"
                            title="Nuevo control"
                          >
                            <Stethoscope className="h-4 w-4" />
                          </Link>
                        </div>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            )}
          </motion.div>
          
          {/* Sidebar */}
          <div className="space-y-6">
            {/* Status Filter */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="backdrop-blur-lg bg-white/10 rounded-2xl p-6 border border-white/20"
            >
              <h3 className="text-lg font-semibold text-white mb-4">Filtros</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-pink-200 mb-2">Estado del Plan</label>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-pink-400"
                  >
                    <option value="all" className="bg-slate-800">Todos los estados</option>
                    <option value="active" className="bg-slate-800">Activos</option>
                    <option value="approved" className="bg-slate-800">Aprobados</option>
                    <option value="pending" className="bg-slate-800">Pendientes</option>
                    <option value="draft" className="bg-slate-800">Borradores</option>
                  </select>
                </div>
              </div>
            </motion.div>
            
            {/* Urgent Plans */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="backdrop-blur-lg bg-white/10 rounded-2xl p-6 border border-white/20"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white flex items-center">
                  <AlertCircle className="h-5 w-5 mr-2 text-red-400" />
                  Urgentes
                </h3>
              </div>
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {birthPlans?.filter(plan => getDaysUntilBirth(plan.estimated_due_date) <= 7)
                  .slice(0, 5)
                  .map((plan) => {
                    const daysLeft = getDaysUntilBirth(plan.estimated_due_date);
                    return (
                      <div
                        key={plan.id}
                        className="bg-white/5 rounded-lg p-3 border border-red-500/30"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="text-white font-medium text-sm">{plan.patient_name}</h4>
                          <span className="text-red-300 text-xs font-bold">
                            {daysLeft <= 0 ? 'HOY' : `${daysLeft}d`}
                          </span>
                        </div>
                        <p className="text-pink-200 text-xs">{plan.plan_type}</p>
                        <p className="text-pink-300 text-xs">
                          FPP: {format(new Date(plan.estimated_due_date), 'dd/MM', { locale: es })}
                        </p>
                      </div>
                    );
                  })}
                {(!birthPlans || birthPlans?.filter(plan => getDaysUntilBirth(plan.estimated_due_date) <= 7).length === 0) && (
                  <p className="text-pink-200 text-sm text-center py-4">No hay planes urgentes</p>
                )}
              </div>
            </motion.div>
            
            {/* Quick Actions */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              className="backdrop-blur-lg bg-white/10 rounded-2xl p-6 border border-white/20"
            >
              <h3 className="text-lg font-semibold text-white mb-4">Acciones Rápidas</h3>
              <div className="space-y-2">
                <Link to="/birth-plan/new">
                  <button className="w-full py-2 px-4 bg-gradient-to-r from-pink-500 to-purple-600 text-white font-medium rounded-lg hover:from-pink-600 hover:to-purple-700 transition duration-200 flex items-center justify-center text-sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Nuevo Plan
                  </button>
                </Link>
                <Link to="/pregnancy-tracking">
                  <button className="w-full py-2 px-4 bg-white/10 text-white font-medium rounded-lg hover:bg-white/20 transition duration-200 flex items-center justify-center border border-white/20 text-sm">
                    <Baby className="h-4 w-4 mr-2" />
                    Ver Embarazos
                  </button>
                </Link>
                <Link to="/postpartum-care">
                  <button className="w-full py-2 px-4 bg-white/10 text-white font-medium rounded-lg hover:bg-white/20 transition duration-200 flex items-center justify-center border border-white/20 text-sm">
                    <Heart className="h-4 w-4 mr-2" />
                    Cuidado Postparto
                  </button>
                </Link>
                <Link to="/prenatal-control/new">
                  <button className="w-full py-2 px-4 bg-white/10 text-white font-medium rounded-lg hover:bg-white/20 transition duration-200 flex items-center justify-center border border-white/20 text-sm">
                    <Stethoscope className="h-4 w-4 mr-2" />
                    Control Prenatal
                  </button>
                </Link>
                <Link to="/reports/birth-plans">
                  <button className="w-full py-2 px-4 bg-white/10 text-white font-medium rounded-lg hover:bg-white/20 transition duration-200 flex items-center justify-center border border-white/20 text-sm">
                    <FileText className="h-4 w-4 mr-2" />
                    Reportes
                  </button>
                </Link>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BirthPlan;

