import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { 
  Package, AlertTriangle, Search, Plus, Edit, 
  Calendar, TrendingDown, TrendingUp, Filter,
  ChevronRight, Pill, Clock, Eye
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import pharmacyService from '../../services/pharmacyService';

const PharmacyInventory = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  // Obtener inventario completo
  const { data: inventory, isLoading: loadingInventory } = useQuery({
    queryKey: ['pharmacyInventory'],
    queryFn: pharmacyService.getInventory,
  });

  // Obtener medicamentos con bajo stock
  const { data: lowStock, isLoading: loadingLowStock } = useQuery({
    queryKey: ['lowStockReport'],
    queryFn: pharmacyService.getLowStockReport,
  });

  // Obtener medicamentos próximos a vencer
  const { data: expiring, isLoading: loadingExpiring } = useQuery({
    queryKey: ['expiringMedications'],
    queryFn: () => pharmacyService.getExpiringMedications(30),
  });

  // Filtrar inventario basado en búsqueda y filtros
  const filteredInventory = inventory?.filter(med => {
    const matchesSearch = med.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         med.generic_name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (filterStatus === 'all') return matchesSearch;
    if (filterStatus === 'low') return matchesSearch && med.quantity <= med.min_stock;
    if (filterStatus === 'normal') return matchesSearch && med.quantity > med.min_stock;
    if (filterStatus === 'expiring') {
      const expiringIds = expiring?.map(e => e.id) || [];
      return matchesSearch && expiringIds.includes(med.id);
    }
    return matchesSearch;
  }) || [];

  const getStockStatus = (med) => {
    if (med.quantity === 0) return { status: 'out', color: 'bg-red-500/20 text-red-300', text: 'Agotado' };
    if (med.quantity <= med.min_stock) return { status: 'low', color: 'bg-yellow-500/20 text-yellow-300', text: 'Stock Bajo' };
    return { status: 'normal', color: 'bg-green-500/20 text-green-300', text: 'Disponible' };
  };

  const statsCards = [
    {
      title: 'Total Medicamentos',
      value: inventory?.length || 0,
      icon: Package,
      color: 'from-blue-500 to-blue-600',
    },
    {
      title: 'Stock Bajo',
      value: lowStock?.length || 0,
      icon: AlertTriangle,
      color: 'from-yellow-500 to-yellow-600',
    },
    {
      title: 'Próximos a Vencer',
      value: expiring?.length || 0,
      icon: Clock,
      color: 'from-red-500 to-red-600',
    },
    {
      title: 'Valor Total',
      value: inventory?.reduce((total, med) => total + (med.unit_price * med.quantity), 0).toFixed(2) || '0.00',
      icon: TrendingUp,
      color: 'from-green-500 to-green-600',
      prefix: 'S/ '
    },
  ];

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
              Inventario de Farmacia
            </h1>
            <p className="text-slate-200">
              {format(new Date(), "EEEE, d 'de' MMMM 'de' yyyy", { locale: es })}
            </p>
          </div>
          <button className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-6 py-3 rounded-xl font-medium hover:from-blue-600 hover:to-indigo-700 transition duration-200 flex items-center">
            <Plus className="h-5 w-5 mr-2" />
            Agregar Medicamento
          </button>
        </motion.div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {statsCards.map((stat, index) => (
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
                  <p className="text-2xl font-bold text-white">
                    {stat.prefix || ''}{stat.value}
                  </p>
                </div>
              </div>
              <h3 className="text-white/80 text-sm">{stat.title}</h3>
            </motion.div>
          ))}
        </div>

        {/* Search and Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="backdrop-blur-lg bg-white/10 rounded-2xl p-6 border border-white/20 mb-6"
        >
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-5 w-5" />
              <input
                type="text"
                placeholder="Buscar medicamentos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex gap-2">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all" className="bg-slate-800">Todos</option>
                <option value="normal" className="bg-slate-800">Stock Normal</option>
                <option value="low" className="bg-slate-800">Stock Bajo</option>
                <option value="expiring" className="bg-slate-800">Por Vencer</option>
              </select>
            </div>
          </div>
        </motion.div>

        {/* Inventory List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="backdrop-blur-lg bg-white/10 rounded-2xl p-6 border border-white/20"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-white flex items-center">
              <Package className="h-5 w-5 mr-2 text-blue-400" />
              Medicamentos ({filteredInventory.length})
            </h2>
          </div>

          {loadingInventory ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
            </div>
          ) : filteredInventory.length === 0 ? (
            <div className="text-center py-8">
              <Package className="h-16 w-16 text-slate-400 mx-auto mb-4" />
              <p className="text-slate-200 text-lg mb-2">No se encontraron medicamentos</p>
              <p className="text-slate-400">Intenta ajustar los filtros de búsqueda</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-[600px] overflow-y-auto">
              {filteredInventory.map((med, index) => {
                const stockInfo = getStockStatus(med);
                return (
                  <motion.div
                    key={med.id || index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="bg-white/5 rounded-xl p-4 border border-white/10 hover:bg-white/10 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4 flex-1">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 flex items-center justify-center">
                          <Pill className="h-6 w-6 text-white" />
                        </div>
                        <div className="flex-1">
                          <h4 className="text-white font-medium mb-1">{med.name}</h4>
                          <div className="flex flex-wrap gap-4 text-sm text-slate-300">
                            <span>Dosis: {med.dosage || 'N/A'}</span>
                            <span>Lote: {med.batch_number || 'N/A'}</span>
                            {med.expiry_date && (
                              <span>Vence: {format(new Date(med.expiry_date), 'dd/MM/yyyy')}</span>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-4">
                        <div className="text-right">
                          <div className="text-2xl font-bold text-white mb-1">
                            {med.quantity}
                          </div>
                          <div className="text-xs text-slate-400">
                            Mín: {med.min_stock || 0}
                          </div>
                        </div>
                        
                        <div className="flex flex-col items-end space-y-2">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${stockInfo.color}`}>
                            {stockInfo.text}
                          </span>
                          {med.unit_price && (
                            <span className="text-xs text-slate-300">
                              S/ {med.unit_price}
                            </span>
                          )}
                        </div>
                        
                        <div className="flex space-x-2">
                          <button className="p-2 text-slate-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors">
                            <Eye className="h-4 w-4" />
                          </button>
                          <button className="p-2 text-slate-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors">
                            <Edit className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default PharmacyInventory;
