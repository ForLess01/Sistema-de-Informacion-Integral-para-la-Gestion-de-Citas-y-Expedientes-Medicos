import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { 
  Package, ShoppingCart, AlertTriangle, TrendingUp,
  FileText, Bell, ChevronRight, Clock,
  Plus, Minus, Search, Pill
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import dashboardService from '../services/dashboardService';

const PharmacyDashboard = () => {
  // Obtener estadísticas del dashboard para farmacia
  const { data: stats, isLoading: loadingStats } = useQuery({
    queryKey: ['pharmacyDashboardStats'],
    queryFn: dashboardService.getPharmacyDashboardStats,
  });

  // Obtener medicamentos con stock bajo
  const { data: lowStock, isLoading: loadingLowStock } = useQuery({
    queryKey: ['lowStockMedicines'],
    queryFn: dashboardService.getLowStockMedicines,
  });

  // Obtener recetas pendientes
  const { data: pendingPrescriptions, isLoading: loadingPrescriptions } = useQuery({
    queryKey: ['pendingPrescriptions'],
    queryFn: dashboardService.getPendingPrescriptions,
  });

  // Obtener movimientos recientes
  const { data: recentMovements, isLoading: loadingMovements } = useQuery({
    queryKey: ['recentMedicineMovements'],
    queryFn: dashboardService.getRecentMedicineMovements,
  });

  const statsCards = [
    {
      title: 'Total Medicamentos',
      value: stats?.total_medicines || 0,
      change: stats?.medicines_change || '+0%',
      icon: Pill,
      color: 'from-blue-500 to-blue-600',
      link: '/pharmacy/inventory',
    },
    {
      title: 'Stock Bajo',
      value: stats?.low_stock_count || 0,
      change: 'Requieren reposición',
      icon: AlertTriangle,
      color: 'from-red-500 to-red-600',
      link: '/pharmacy/low-stock',
    },
    {
      title: 'Recetas Pendientes',
      value: stats?.pending_prescriptions || 0,
      change: 'Por despachar',
      icon: FileText,
      color: 'from-orange-500 to-orange-600',
      link: '/pharmacy/prescriptions',
    },
    {
      title: 'Ventas Hoy',
      value: `S/ ${stats?.sales_today || 0}`,
      change: stats?.sales_change || '+0%',
      icon: ShoppingCart,
      color: 'from-green-500 to-green-600',
      link: '/pharmacy/sales',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-800 to-blue-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex justify-between items-center mb-8"
        >
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">
              Panel de Control - Farmacia
            </h1>
            <p className="text-purple-200">
              {format(new Date(), "EEEE, d 'de' MMMM 'de' yyyy", { locale: es })}
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <button className="relative p-2 text-purple-200 hover:text-white transition-colors">
              <Bell className="h-6 w-6" />
              {stats?.urgent_alerts > 0 && (
                <span className="absolute top-0 right-0 h-2 w-2 bg-red-500 rounded-full"></span>
              )}
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
            >
              <Link to={stat.link}>
                <div className="backdrop-blur-lg bg-white/10 rounded-2xl p-6 border border-white/20 hover:bg-white/20 transition-all duration-300 cursor-pointer">
                  <div className="flex items-center justify-between mb-4">
                    <div className={`p-3 rounded-xl bg-gradient-to-r ${stat.color}`}>
                      <stat.icon className="h-6 w-6 text-white" />
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-white">{stat.value}</p>
                      <p className="text-sm text-purple-200">{stat.change}</p>
                    </div>
                  </div>
                  <h3 className="text-white/80 text-sm">{stat.title}</h3>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Stock Bajo - Alerta Prioritaria */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="backdrop-blur-lg bg-white/10 rounded-2xl p-6 border border-white/20"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-white flex items-center">
                <AlertTriangle className="h-5 w-5 mr-2 text-red-400" />
                Stock Bajo
              </h2>
              <Link to="/pharmacy/low-stock" className="text-purple-300 hover:text-purple-200 text-sm flex items-center">
                Ver todos <ChevronRight className="h-4 w-4 ml-1" />
              </Link>
            </div>

            {loadingLowStock ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
              </div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {lowStock?.length === 0 ? (
                  <p className="text-purple-200 text-center py-8">No hay medicamentos con stock bajo</p>
                ) : (
                  lowStock?.map((medicine) => (
                    <div
                      key={medicine.id}
                      className={`bg-white/5 rounded-xl p-4 border border-white/10 ${
                        medicine.stock === 0 ? 'border-red-500/50' : 'border-orange-500/50'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-white font-medium">{medicine.name}</h4>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          medicine.stock === 0 ? 'bg-red-600 text-white' : 'bg-orange-500 text-white'
                        }`}>
                          {medicine.stock === 0 ? 'AGOTADO' : `${medicine.stock} unidades`}
                        </span>
                      </div>
                      <p className="text-purple-200 text-sm mb-1">
                        {medicine.generic_name}
                      </p>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-purple-300">
                          Mín: {medicine.min_stock}
                        </span>
                        <span className="text-purple-400">
                          Código: {medicine.code}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </motion.div>

          {/* Recetas Pendientes */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="lg:col-span-2 backdrop-blur-lg bg-white/10 rounded-2xl p-6 border border-white/20"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-white flex items-center">
                <FileText className="h-5 w-5 mr-2 text-orange-400" />
                Recetas Pendientes
              </h2>
              <Link to="/pharmacy/prescriptions" className="text-purple-300 hover:text-purple-200 text-sm flex items-center">
                Ver todas <ChevronRight className="h-4 w-4 ml-1" />
              </Link>
            </div>

            {loadingPrescriptions ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
              </div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {pendingPrescriptions?.length === 0 ? (
                  <p className="text-purple-200 text-center py-8">No hay recetas pendientes</p>
                ) : (
                  pendingPrescriptions?.map((prescription) => (
                    <div
                      key={prescription.id}
                      className="bg-white/5 rounded-xl p-4 border border-white/10 hover:bg-white/10 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="w-12 h-12 rounded-full bg-gradient-to-r from-purple-500 to-blue-600 flex items-center justify-center text-white font-semibold">
                            {prescription.patient_name.charAt(0)}
                          </div>
                          <div>
                            <h4 className="text-white font-medium">{prescription.patient_name}</h4>
                            <p className="text-purple-200 text-sm">
                              Dr. {prescription.doctor_name}
                            </p>
                            <p className="text-purple-200 text-sm">
                              {prescription.medicines_count} medicamentos
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-purple-300">
                            {format(new Date(prescription.created_at), 'dd/MM/yyyy HH:mm')}
                          </p>
                          <span className={`px-2 py-1 rounded text-xs font-medium inline-block mt-1 ${
                            prescription.priority === 'urgent' ? 'bg-red-500/20 text-red-300' :
                            prescription.priority === 'high' ? 'bg-orange-500/20 text-orange-300' :
                            'bg-blue-500/20 text-blue-300'
                          }`}>
                            {prescription.priority === 'urgent' ? 'Urgente' :
                             prescription.priority === 'high' ? 'Alta' :
                             'Normal'}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </motion.div>
        </div>

        {/* Movimientos Recientes */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mt-6 backdrop-blur-lg bg-white/10 rounded-2xl p-6 border border-white/20"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-white flex items-center">
              <TrendingUp className="h-5 w-5 mr-2 text-blue-400" />
              Movimientos Recientes
            </h2>
            <Link to="/pharmacy/movements" className="text-purple-300 hover:text-purple-200 text-sm flex items-center">
              Ver historial <ChevronRight className="h-4 w-4 ml-1" />
            </Link>
          </div>

          {loadingMovements ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {recentMovements?.length === 0 ? (
                <p className="text-purple-200 text-center py-8 col-span-full">No hay movimientos recientes</p>
              ) : (
                recentMovements?.map((movement) => (
                  <div
                    key={movement.id}
                    className="bg-white/5 rounded-xl p-4 border border-white/10"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center">
                        {movement.type === 'in' ? (
                          <Plus className="h-4 w-4 text-green-400 mr-2" />
                        ) : (
                          <Minus className="h-4 w-4 text-red-400 mr-2" />
                        )}
                        <span className={`text-xs font-medium ${
                          movement.type === 'in' ? 'text-green-300' : 'text-red-300'
                        }`}>
                          {movement.type === 'in' ? 'ENTRADA' : 'SALIDA'}
                        </span>
                      </div>
                      <span className="text-xs text-purple-300">
                        {format(new Date(movement.created_at), 'HH:mm')}
                      </span>
                    </div>
                    <h4 className="text-white font-medium mb-1">{movement.medicine_name}</h4>
                    <p className="text-purple-200 text-sm mb-2">
                      Cantidad: {movement.quantity}
                    </p>
                    <p className="text-purple-300 text-xs">
                      {movement.type === 'in' ? 'Proveedor' : 'Paciente'}: {movement.reference}
                    </p>
                  </div>
                ))
              )}
            </div>
          )}
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="mt-6 backdrop-blur-lg bg-white/10 rounded-2xl p-6 border border-white/20"
        >
          <h2 className="text-xl font-semibold text-white mb-4">Acciones Rápidas</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Link to="/pharmacy/dispense">
              <button className="w-full py-3 px-4 bg-gradient-to-r from-purple-500 to-blue-600 text-white font-medium rounded-xl hover:from-purple-600 hover:to-blue-700 transition duration-200 flex items-center justify-center">
                <Pill className="h-5 w-5 mr-2" />
                Despachar
              </button>
            </Link>
            <Link to="/pharmacy/inventory/add">
              <button className="w-full py-3 px-4 bg-white/10 text-white font-medium rounded-xl hover:bg-white/20 transition duration-200 flex items-center justify-center border border-white/20">
                <Plus className="h-5 w-5 mr-2" />
                Entrada Stock
              </button>
            </Link>
            <Link to="/pharmacy/search">
              <button className="w-full py-3 px-4 bg-white/10 text-white font-medium rounded-xl hover:bg-white/20 transition duration-200 flex items-center justify-center border border-white/20">
                <Search className="h-5 w-5 mr-2" />
                Buscar Medicina
              </button>
            </Link>
            <Link to="/pharmacy/reports">
              <button className="w-full py-3 px-4 bg-white/10 text-white font-medium rounded-xl hover:bg-white/20 transition duration-200 flex items-center justify-center border border-white/20">
                <FileText className="h-5 w-5 mr-2" />
                Reportes
              </button>
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default PharmacyDashboard;
