import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { 
  Activity, ArrowUp, ArrowDown, FileText, 
  Search, Filter, Calendar, TrendingUp, TrendingDown,
  Package, Users, Pill, RefreshCw, Eye, Download
} from 'lucide-react';
import { format, parseISO, isToday, isYesterday, isThisWeek } from 'date-fns';
import { es } from 'date-fns/locale';
import pharmacyService from '../../services/pharmacyService';

const PharmacyMovements = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [movementTypeFilter, setMovementTypeFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [selectedMedication, setSelectedMedication] = useState('');

  // Obtener todos los movimientos (simulando que no necesitamos medicationId específico)
  const { data: allMovements, isLoading: loadingMovements, refetch } = useQuery({
    queryKey: ['allInventoryMovements'],
    queryFn: () => {
      // En una implementación real, esto sería un endpoint diferente
      // Por ahora simulamos que tenemos movimientos generales
      return pharmacyService.getInventoryMovements(null); // null para obtener todos
    },
  });

  // Obtener inventario para el selector de medicamentos
  const { data: inventory } = useQuery({
    queryKey: ['pharmacyInventory'],
    queryFn: pharmacyService.getInventory,
  });

  // Obtener movimientos específicos de un medicamento cuando se selecciona
  const { data: specificMovements } = useQuery({
    queryKey: ['specificMovements', selectedMedication],
    queryFn: () => pharmacyService.getInventoryMovements(selectedMedication),
    enabled: !!selectedMedication,
  });

  // Usar movimientos específicos si hay un medicamento seleccionado, sino usar todos
  const movements = selectedMedication ? specificMovements : allMovements;

  // Filtrar movimientos basado en criterios
  const filteredMovements = movements?.filter(movement => {
    const matchesSearch = movement.medication_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         movement.notes?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         movement.user_name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = movementTypeFilter === 'all' || movement.movement_type === movementTypeFilter;
    
    let matchesDate = true;
    if (dateFilter !== 'all' && movement.created_at) {
      const movementDate = parseISO(movement.created_at);
      switch (dateFilter) {
        case 'today':
          matchesDate = isToday(movementDate);
          break;
        case 'yesterday':
          matchesDate = isYesterday(movementDate);
          break;
        case 'week':
          matchesDate = isThisWeek(movementDate);
          break;
      }
    }
    
    return matchesSearch && matchesType && matchesDate;
  }) || [];

  const getMovementIcon = (type) => {
    switch (type) {
      case 'entry':
      case 'purchase':
      case 'adjustment_in':
        return { icon: ArrowUp, color: 'text-green-400' };
      case 'dispensation':
      case 'sale':
      case 'adjustment_out':
        return { icon: ArrowDown, color: 'text-red-400' };
      default:
        return { icon: Activity, color: 'text-blue-400' };
    }
  };

  const getMovementTypeText = (type) => {
    const types = {
      'entry': 'Entrada',
      'exit': 'Salida',
      'purchase': 'Compra',
      'dispensation': 'Dispensación',
      'sale': 'Venta',
      'adjustment_in': 'Ajuste (+)',
      'adjustment_out': 'Ajuste (-)',
      'transfer_in': 'Transferencia Entrada',
      'transfer_out': 'Transferencia Salida',
      'expiry': 'Vencimiento',
      'damage': 'Daño/Pérdida'
    };
    return types[type] || type;
  };

  const getRelativeTimeText = (dateString) => {
    if (!dateString) return '';
    const date = parseISO(dateString);
    if (isToday(date)) return 'Hoy';
    if (isYesterday(date)) return 'Ayer';
    if (isThisWeek(date)) return 'Esta semana';
    return format(date, 'dd/MM/yyyy');
  };

  // Estadísticas de los movimientos
  const statsData = {
    totalMovements: filteredMovements.length,
    entriesCount: filteredMovements.filter(m => ['entry', 'purchase', 'adjustment_in', 'transfer_in'].includes(m.movement_type)).length,
    exitsCount: filteredMovements.filter(m => ['exit', 'dispensation', 'sale', 'adjustment_out', 'transfer_out'].includes(m.movement_type)).length,
    todayMovements: filteredMovements.filter(m => m.created_at && isToday(parseISO(m.created_at))).length
  };

  const statsCards = [
    {
      title: 'Total Movimientos',
      value: statsData.totalMovements,
      icon: Activity,
      color: 'from-blue-500 to-blue-600',
    },
    {
      title: 'Entradas',
      value: statsData.entriesCount,
      icon: ArrowUp,
      color: 'from-green-500 to-green-600',
    },
    {
      title: 'Salidas',
      value: statsData.exitsCount,
      icon: ArrowDown,
      color: 'from-red-500 to-red-600',
    },
    {
      title: 'Hoy',
      value: statsData.todayMovements,
      icon: Calendar,
      color: 'from-purple-500 to-purple-600',
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
              Movimientos de Inventario
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
            <button className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-6 py-3 rounded-xl font-medium hover:from-blue-600 hover:to-indigo-700 transition duration-200 flex items-center">
              <Download className="h-5 w-5 mr-2" />
              Exportar
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
                  <p className="text-2xl font-bold text-white">{stat.value}</p>
                </div>
              </div>
              <h3 className="text-white/80 text-sm">{stat.title}</h3>
            </motion.div>
          ))}
        </div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="backdrop-blur-lg bg-white/10 rounded-2xl p-6 border border-white/20 mb-6"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-5 w-5" />
              <input
                type="text"
                placeholder="Buscar movimientos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            {/* Medication Filter */}
            <select
              value={selectedMedication}
              onChange={(e) => setSelectedMedication(e.target.value)}
              className="px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="" className="bg-slate-800">Todos los medicamentos</option>
              {inventory?.map((med) => (
                <option key={med.id} value={med.id} className="bg-slate-800">
                  {med.name}
                </option>
              ))}
            </select>
            
            {/* Movement Type Filter */}
            <select
              value={movementTypeFilter}
              onChange={(e) => setMovementTypeFilter(e.target.value)}
              className="px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all" className="bg-slate-800">Todos los tipos</option>
              <option value="entry" className="bg-slate-800">Entradas</option>
              <option value="exit" className="bg-slate-800">Salidas</option>
              <option value="purchase" className="bg-slate-800">Compras</option>
              <option value="dispensation" className="bg-slate-800">Dispensaciones</option>
              <option value="adjustment_in" className="bg-slate-800">Ajustes (+)</option>
              <option value="adjustment_out" className="bg-slate-800">Ajustes (-)</option>
            </select>
            
            {/* Date Filter */}
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all" className="bg-slate-800">Todas las fechas</option>
              <option value="today" className="bg-slate-800">Hoy</option>
              <option value="yesterday" className="bg-slate-800">Ayer</option>
              <option value="week" className="bg-slate-800">Esta semana</option>
            </select>
          </div>
        </motion.div>

        {/* Movements List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="backdrop-blur-lg bg-white/10 rounded-2xl p-6 border border-white/20"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-white flex items-center">
              <Activity className="h-5 w-5 mr-2 text-blue-400" />
              Movimientos ({filteredMovements.length})
            </h2>
          </div>

          {loadingMovements ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          ) : filteredMovements.length === 0 ? (
            <div className="text-center py-8">
              <Activity className="h-16 w-16 text-slate-400 mx-auto mb-4" />
              <p className="text-slate-200 text-lg mb-2">No se encontraron movimientos</p>
              <p className="text-slate-400">Ajusta los filtros para ver más resultados</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-[600px] overflow-y-auto">
              {filteredMovements.map((movement, index) => {
                const movementIcon = getMovementIcon(movement.movement_type);
                return (
                  <motion.div
                    key={movement.id || index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.03 }}
                    className="bg-white/5 rounded-xl p-4 border border-white/10 hover:bg-white/10 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4 flex-1">
                        <div className={`w-12 h-12 rounded-full bg-white/10 flex items-center justify-center`}>
                          <movementIcon.icon className={`h-6 w-6 ${movementIcon.color}`} />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-1">
                            <h4 className="text-white font-medium">{movement.medication_name || 'Medicamento'}</h4>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              ['entry', 'purchase', 'adjustment_in', 'transfer_in'].includes(movement.movement_type) 
                                ? 'bg-green-500/20 text-green-300' 
                                : 'bg-red-500/20 text-red-300'
                            }`}>
                              {getMovementTypeText(movement.movement_type)}
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-4 text-sm text-slate-300">
                            <span className="flex items-center">
                              <Package className="h-3 w-3 mr-1" />
                              Cantidad: {movement.quantity || 0}
                            </span>
                            {movement.user_name && (
                              <span className="flex items-center">
                                <Users className="h-3 w-3 mr-1" />
                                {movement.user_name}
                              </span>
                            )}
                            {movement.created_at && (
                              <span className="flex items-center">
                                <Calendar className="h-3 w-3 mr-1" />
                                {getRelativeTimeText(movement.created_at)} - {format(parseISO(movement.created_at), 'HH:mm')}
                              </span>
                            )}
                          </div>
                          {movement.notes && (
                            <p className="text-xs text-slate-400 mt-1 italic">{movement.notes}</p>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-4">
                        {movement.remaining_stock !== undefined && (
                          <div className="text-right">
                            <div className="text-sm text-slate-300 mb-1">
                              Stock resultante
                            </div>
                            <div className="text-lg font-bold text-white">
                              {movement.remaining_stock}
                            </div>
                          </div>
                        )}
                        
                        <button className="p-2 text-slate-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors">
                          <Eye className="h-4 w-4" />
                        </button>
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

export default PharmacyMovements;

