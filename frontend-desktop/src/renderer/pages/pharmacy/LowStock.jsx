import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { 
  AlertTriangle, ShoppingCart, Package, TrendingDown,
  Calendar, Bell, RefreshCw, Plus, Search, Filter,
  ChevronRight, Pill, Clock, Edit
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import pharmacyService from '../../services/pharmacyService';

const LowStock = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const queryClient = useQueryClient();

  // Obtener medicamentos con stock bajo
  const { data: lowStock, isLoading: loadingLowStock, refetch } = useQuery({
    queryKey: ['lowStockReport'],
    queryFn: pharmacyService.getLowStockReport,
  });

  // Obtener inventario completo para estadísticas
  const { data: inventory } = useQuery({
    queryKey: ['pharmacyInventory'],
    queryFn: pharmacyService.getInventory,
  });

  // Mutation para crear orden de compra
  const createPurchaseOrderMutation = useMutation({
    mutationFn: pharmacyService.createPurchaseOrder,
    onSuccess: () => {
      queryClient.invalidateQueries(['lowStockReport']);
      queryClient.invalidateQueries(['purchaseOrders']);
    },
  });

  // Filtrar medicamentos según búsqueda y prioridad
  const filteredLowStock = lowStock?.filter(med => {
    const matchesSearch = med.name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (priorityFilter === 'all') return matchesSearch;
    if (priorityFilter === 'critical' && med.quantity === 0) return matchesSearch;
    if (priorityFilter === 'urgent' && med.quantity > 0 && med.quantity <= (med.min_stock * 0.5)) return matchesSearch;
    if (priorityFilter === 'warning' && med.quantity > (med.min_stock * 0.5) && med.quantity <= med.min_stock) return matchesSearch;
    
    return matchesSearch;
  }) || [];

  const getPriorityLevel = (med) => {
    if (med.quantity === 0) {
      return { level: 'critical', color: 'bg-red-500/20 text-red-300 border-red-500/30', text: 'CRÍTICO - Agotado' };
    }
    if (med.quantity <= (med.min_stock * 0.5)) {
      return { level: 'urgent', color: 'bg-orange-500/20 text-orange-300 border-orange-500/30', text: 'URGENTE' };
    }
    return { level: 'warning', color: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30', text: 'ADVERTENCIA' };
  };

  const handleCreatePurchaseOrder = (medications) => {
    const orderData = {
      medications: medications.map(med => ({
        medication_id: med.id,
        quantity: Math.max(med.min_stock * 2, 50) // Ordenar el doble del mínimo o 50 unidades
      })),
      urgent: medications.some(med => med.quantity === 0)
    };
    
    createPurchaseOrderMutation.mutate(orderData);
  };

  const statsCards = [
    {
      title: 'Stock Bajo Total',
      value: lowStock?.length || 0,
      icon: AlertTriangle,
      color: 'from-yellow-500 to-yellow-600',
    },
    {
      title: 'Críticos (Agotados)',
      value: lowStock?.filter(med => med.quantity === 0).length || 0,
      icon: Package,
      color: 'from-red-500 to-red-600',
    },
    {
      title: 'Valor en Riesgo',
      value: lowStock?.reduce((total, med) => total + (med.unit_price * med.quantity), 0).toFixed(2) || '0.00',
      icon: TrendingDown,
      color: 'from-purple-500 to-purple-600',
      prefix: 'S/ '
    },
    {
      title: 'Órdenes Pendientes',
      value: '2', // Esta sería una query separada en un caso real
      icon: ShoppingCart,
      color: 'from-blue-500 to-blue-600',
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
              Medicamentos con Stock Bajo
            </h1>
            <p className="text-slate-200">
              {format(new Date(), "EEEE, d 'de' MMMM 'de' yyyy", { locale: es })}
            </p>
          </div>
          <div className="flex space-x-3">
            <button 
              onClick={() => refetch()}
              className="bg-white/10 text-white px-4 py-3 rounded-xl font-medium hover:bg-white/20 transition duration-200 flex items-center border border-white/20"
            >
              <RefreshCw className="h-5 w-5 mr-2" />
              Actualizar
            </button>
            <button 
              onClick={() => handleCreatePurchaseOrder(lowStock?.filter(med => med.quantity === 0) || [])}
              className="bg-gradient-to-r from-red-500 to-red-600 text-white px-6 py-3 rounded-xl font-medium hover:from-red-600 hover:to-red-700 transition duration-200 flex items-center"
              disabled={createPurchaseOrderMutation.isLoading}
            >
              <ShoppingCart className="h-5 w-5 mr-2" />
              Orden Urgente
            </button>
          </div>
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
                placeholder="Buscar medicamentos con stock bajo..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-yellow-500"
              />
            </div>
            <div className="flex gap-2">
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-yellow-500"
              >
                <option value="all" className="bg-slate-800">Todas las Prioridades</option>
                <option value="critical" className="bg-slate-800">Crítico (Agotado)</option>
                <option value="urgent" className="bg-slate-800">Urgente</option>
                <option value="warning" className="bg-slate-800">Advertencia</option>
              </select>
            </div>
          </div>
        </motion.div>

        {/* Low Stock Alert */}
        {lowStock?.some(med => med.quantity === 0) && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-red-500/20 border border-red-500/30 rounded-2xl p-6 mb-6"
          >
            <div className="flex items-center">
              <Bell className="h-8 w-8 text-red-300 mr-4 animate-pulse" />
              <div>
                <h3 className="text-red-300 font-bold text-lg mb-1">¡ALERTA CRÍTICA!</h3>
                <p className="text-red-200">
                  {lowStock.filter(med => med.quantity === 0).length} medicamentos están completamente agotados. 
                  Se requiere acción inmediata.
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Low Stock List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="backdrop-blur-lg bg-white/10 rounded-2xl p-6 border border-white/20"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-white flex items-center">
              <AlertTriangle className="h-5 w-5 mr-2 text-yellow-400" />
              Medicamentos ({filteredLowStock.length})
            </h2>
            {filteredLowStock.length > 0 && (
              <button 
                onClick={() => handleCreatePurchaseOrder(filteredLowStock)}
                className="text-sm bg-blue-500/20 text-blue-300 hover:bg-blue-500/30 px-4 py-2 rounded-lg transition-colors flex items-center"
              >
                <ShoppingCart className="h-4 w-4 mr-2" />
                Ordenar Todo
              </button>
            )}
          </div>

          {loadingLowStock ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-500"></div>
            </div>
          ) : filteredLowStock.length === 0 ? (
            <div className="text-center py-8">
              <Package className="h-16 w-16 text-slate-400 mx-auto mb-4" />
              <p className="text-slate-200 text-lg mb-2">No se encontraron medicamentos con stock bajo</p>
              <p className="text-slate-400">¡Excelente! El inventario está en buen estado.</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-[600px] overflow-y-auto">
              {filteredLowStock.map((med, index) => {
                const priority = getPriorityLevel(med);
                return (
                  <motion.div
                    key={med.id || index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className={`bg-white/5 rounded-xl p-4 border hover:bg-white/10 transition-colors ${priority.color}`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4 flex-1">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                          priority.level === 'critical' ? 'bg-gradient-to-r from-red-500 to-red-600' :
                          priority.level === 'urgent' ? 'bg-gradient-to-r from-orange-500 to-orange-600' :
                          'bg-gradient-to-r from-yellow-500 to-yellow-600'
                        }`}>
                          <Pill className="h-6 w-6 text-white" />
                        </div>
                        <div className="flex-1">
                          <h4 className="text-white font-medium mb-1">{med.name}</h4>
                          <div className="flex flex-wrap gap-4 text-sm text-slate-300">
                            <span>Disponible: {med.quantity}</span>
                            <span>Mínimo: {med.min_stock}</span>
                            <span>Déficit: {Math.max(0, med.min_stock - med.quantity)}</span>
                            {med.last_restocked && (
                              <span className="flex items-center">
                                <Clock className="h-3 w-3 mr-1" />
                                Último: {format(new Date(med.last_restocked), 'dd/MM/yyyy')}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-4">
                        <div className="text-right">
                          <div className={`text-xs font-bold px-2 py-1 rounded-full mb-2 ${priority.color}`}>
                            {priority.text}
                          </div>
                          {med.unit_price && (
                            <div className="text-xs text-slate-300">
                              S/ {med.unit_price} c/u
                            </div>
                          )}
                        </div>
                        
                        <div className="flex space-x-2">
                          <button 
                            onClick={() => handleCreatePurchaseOrder([med])}
                            className="p-2 text-slate-300 hover:text-white hover:bg-blue-500/20 rounded-lg transition-colors"
                            title="Crear orden de compra"
                          >
                            <ShoppingCart className="h-4 w-4" />
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

export default LowStock;

