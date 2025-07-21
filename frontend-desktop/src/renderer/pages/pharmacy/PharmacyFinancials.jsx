import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { 
  DollarSign, TrendingUp, TrendingDown, BarChart3,
  Pill, ShoppingCart, Package, Calculator,
  PieChart, Target, Activity, Clock,
  Download, RefreshCw, Filter, Search,
  ArrowUpRight, ArrowDownRight, Eye,
  Wallet, Receipt, CreditCard, Coins,
  FileText, ChevronRight, AlertTriangle,
  Star, Zap, Package2, Truck,
  Users, Calendar, Building, Award
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import pharmacyService from '../../services/pharmacyService';
import { useAuth } from '../../contexts/AuthContext';

const PharmacyFinancials = () => {
  const { user } = useAuth();
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedView, setSelectedView] = useState('overview');
  const [searchTerm, setSearchTerm] = useState('');

  // Obtener datos financieros de farmacia
  const { data: financialData, isLoading: loadingFinancial, refetch } = useQuery({
    queryKey: ['pharmacyFinancialData', selectedPeriod],
    queryFn: () => pharmacyService.getPharmacyFinancialData(selectedPeriod),
    refetchInterval: 300000, // Actualizar cada 5 minutos
  });

  // Obtener análisis de productos más rentables
  const { data: productAnalysis, isLoading: loadingProducts } = useQuery({
    queryKey: ['pharmacyProductAnalysis', selectedPeriod],
    queryFn: () => pharmacyService.getProductProfitabilityAnalysis(selectedPeriod),
  });

  // Obtener análisis de costos
  const { data: costAnalysis, isLoading: loadingCosts } = useQuery({
    queryKey: ['pharmacyCostAnalysis', selectedPeriod],
    queryFn: () => pharmacyService.getCostAnalysis(selectedPeriod),
  });

  // Obtener tendencias de ventas
  const { data: salesTrends, isLoading: loadingTrends } = useQuery({
    queryKey: ['pharmacySalesTrends', selectedPeriod],
    queryFn: () => pharmacyService.getSalesTrends(selectedPeriod),
  });

  // Obtener métricas de inventario
  const { data: inventoryMetrics, isLoading: loadingInventory } = useQuery({
    queryKey: ['pharmacyInventoryMetrics', selectedPeriod],
    queryFn: () => pharmacyService.getInventoryFinancialMetrics(selectedPeriod),
  });

  const periods = [
    { value: 'day', label: 'Hoy' },
    { value: 'week', label: 'Esta semana' },
    { value: 'month', label: 'Este mes' },
    { value: 'quarter', label: 'Trimestre' },
    { value: 'year', label: 'Este año' }
  ];

  const categories = [
    { value: 'all', label: 'Todas las categorías', icon: Package },
    { value: 'medicines', label: 'Medicamentos', icon: Pill },
    { value: 'supplies', label: 'Insumos médicos', icon: Package2 },
    { value: 'equipment', label: 'Equipamiento', icon: Building },
  ];

  const views = [
    { value: 'overview', label: 'Resumen', icon: BarChart3 },
    { value: 'products', label: 'Productos', icon: Package },
    { value: 'costs', label: 'Costos', icon: Calculator },
    { value: 'trends', label: 'Tendencias', icon: TrendingUp },
  ];

  // Métricas financieras principales
  const mainMetrics = [
    {
      title: 'Ingresos Totales',
      value: financialData?.total_revenue || 0,
      change: financialData?.revenue_change || '+0%',
      icon: DollarSign,
      color: 'from-green-500 to-emerald-600',
      type: 'currency',
    },
    {
      title: 'Costo de Ventas',
      value: financialData?.cost_of_sales || 0,
      change: financialData?.cost_change || '+0%',
      icon: ShoppingCart,
      color: 'from-red-500 to-pink-600',
      type: 'currency',
    },
    {
      title: 'Ganancia Bruta',
      value: financialData?.gross_profit || 0,
      change: financialData?.profit_change || '+0%',
      icon: TrendingUp,
      color: 'from-blue-500 to-indigo-600',
      type: 'currency',
    },
    {
      title: 'Margen de Ganancia',
      value: financialData?.profit_margin || 0,
      change: financialData?.margin_change || '+0%',
      icon: Target,
      color: 'from-purple-500 to-violet-600',
      type: 'percentage',
    },
  ];

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency: 'PEN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatValue = (value, type) => {
    switch (type) {
      case 'currency':
        return formatCurrency(value);
      case 'percentage':
        return `${value}%`;
      default:
        return value.toLocaleString();
    }
  };

  const getChangeIcon = (change) => {
    if (change.startsWith('+')) {
      return <ArrowUpRight className="h-4 w-4 text-green-400" />;
    } else if (change.startsWith('-')) {
      return <ArrowDownRight className="h-4 w-4 text-red-400" />;
    }
    return null;
  };

  const getChangeColor = (change) => {
    if (change.startsWith('+')) {
      return 'text-green-400';
    } else if (change.startsWith('-')) {
      return 'text-red-400';
    }
    return 'text-slate-400';
  };

  const getProfitabilityColor = (margin) => {
    if (margin >= 30) return 'from-green-500 to-emerald-600';
    if (margin >= 20) return 'from-blue-500 to-indigo-600';
    if (margin >= 10) return 'from-yellow-500 to-orange-600';
    return 'from-red-500 to-pink-600';
  };

  const handleExport = (format = 'excel') => {
    console.log(`Exporting pharmacy financial report as ${format}`);
  };

  const filteredProducts = productAnalysis?.products?.filter(product => 
    product.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-800 to-indigo-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 space-y-4 sm:space-y-0"
        >
          <div>
            <h1 className="text-3xl font-bold text-white mb-2 flex items-center">
              <Pill className="h-8 w-8 mr-3 text-orange-400" />
              Análisis Financiero - Farmacia
            </h1>
            <p className="text-slate-200">
              {format(new Date(), "EEEE, d 'de' MMMM 'de' yyyy", { locale: es })}
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <button 
              onClick={() => refetch()}
              className="flex items-center px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl border border-white/20 transition-colors"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Actualizar
            </button>
            <div className="flex items-center space-x-2">
              <button 
                onClick={() => handleExport('excel')}
                className="flex items-center px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-medium hover:from-green-600 hover:to-emerald-700 transition-colors"
              >
                <Download className="h-4 w-4 mr-2" />
                Excel
              </button>
              <button 
                onClick={() => handleExport('pdf')}
                className="flex items-center px-4 py-2 bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-xl font-medium hover:from-orange-600 hover:to-red-700 transition-colors"
              >
                <Download className="h-4 w-4 mr-2" />
                PDF
              </button>
            </div>
          </div>
        </motion.div>

        {/* Main Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {mainMetrics.map((metric, index) => (
            <motion.div
              key={metric.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="backdrop-blur-lg bg-white/10 rounded-2xl p-6 border border-white/20"
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-xl bg-gradient-to-r ${metric.color}`}>
                  <metric.icon className="h-6 w-6 text-white" />
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-white">
                    {formatValue(metric.value, metric.type)}
                  </p>
                  <div className={`flex items-center text-sm ${getChangeColor(metric.change)}`}>
                    {getChangeIcon(metric.change)}
                    <span className="ml-1">{metric.change}</span>
                  </div>
                </div>
              </div>
              <h3 className="text-white/80 text-sm">{metric.title}</h3>
            </motion.div>
          ))}
        </div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="backdrop-blur-lg bg-white/10 rounded-2xl p-6 border border-white/20 mb-8"
        >
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-5 w-5" />
              <input
                type="text"
                placeholder="Buscar productos, categorías o proveedores..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>

            {/* View Selector */}
            <div className="flex items-center space-x-2">
              {views.map((view) => {
                const ViewIcon = view.icon;
                return (
                  <button
                    key={view.value}
                    onClick={() => setSelectedView(view.value)}
                    className={`flex items-center px-4 py-2 rounded-xl font-medium transition-colors ${
                      selectedView === view.value
                        ? 'bg-orange-500 text-white'
                        : 'bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white border border-white/20'
                    }`}
                  >
                    <ViewIcon className="h-4 w-4 mr-2" />
                    {view.label}
                  </button>
                );
              })}
            </div>

            {/* Category Filter */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              {categories.map((category) => (
                <option key={category.value} value={category.value} className="bg-slate-800">
                  {category.label}
                </option>
              ))}
            </select>

            {/* Period Filter */}
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              {periods.map((period) => (
                <option key={period.value} value={period.value} className="bg-slate-800">
                  {period.label}
                </option>
              ))}
            </select>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Product Profitability Analysis */}
          <div className="lg:col-span-2">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="backdrop-blur-lg bg-white/10 rounded-2xl p-6 border border-white/20"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-white flex items-center">
                  <BarChart3 className="h-5 w-5 mr-2 text-orange-400" />
                  Análisis de Rentabilidad por Producto
                </h2>
                <div className="flex items-center space-x-2">
                  <button className="text-slate-300 hover:text-white">
                    <Filter className="h-5 w-5" />
                  </button>
                  <button className="text-slate-300 hover:text-white">
                    <Eye className="h-5 w-5" />
                  </button>
                </div>
              </div>

              {loadingProducts ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                </div>
              ) : (
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {filteredProducts?.length === 0 ? (
                    <p className="text-slate-200 text-center py-8">
                      No se encontraron productos
                    </p>
                  ) : (
                    filteredProducts?.map((product, index) => (
                      <motion.div
                        key={product.id}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-white/5 rounded-xl p-5 border border-white/10 hover:bg-white/10 transition-colors"
                      >
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center space-x-4">
                            <div className={`p-3 rounded-lg bg-gradient-to-r ${getProfitabilityColor(product.profit_margin)}`}>
                              <Pill className="h-5 w-5 text-white" />
                            </div>
                            <div>
                              <h4 className="text-white font-semibold">{product.name}</h4>
                              <div className="flex items-center space-x-4 text-slate-300 text-sm">
                                <span>Categoría: {product.category}</span>
                                <span>Stock: {product.stock} unidades</span>
                              </div>
                              <div className="flex items-center space-x-4 text-xs text-slate-400 mt-1">
                                <span>Proveedor: {product.supplier}</span>
                                <span>Código: {product.code}</span>
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gradient-to-r ${getProfitabilityColor(product.profit_margin)} text-white`}>
                              <Target className="h-3 w-3 mr-1" />
                              {product.profit_margin}% margen
                            </div>
                            <p className="text-white font-semibold mt-1">
                              {formatCurrency(product.total_revenue)}
                            </p>
                          </div>
                        </div>

                        {/* Financial Metrics */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div className="text-center">
                            <p className="text-slate-300 text-xs">Unidades Vendidas</p>
                            <p className="text-white font-semibold">{product.units_sold}</p>
                            <div className={`text-xs flex items-center justify-center ${getChangeColor(product.units_change)}`}>
                              {getChangeIcon(product.units_change)}
                              <span className="ml-1">{product.units_change}</span>
                            </div>
                          </div>
                          <div className="text-center">
                            <p className="text-slate-300 text-xs">Precio Promedio</p>
                            <p className="text-white font-semibold">{formatCurrency(product.avg_price)}</p>
                          </div>
                          <div className="text-center">
                            <p className="text-slate-300 text-xs">Costo Unitario</p>
                            <p className="text-white font-semibold">{formatCurrency(product.unit_cost)}</p>
                          </div>
                          <div className="text-center">
                            <p className="text-slate-300 text-xs">Ganancia</p>
                            <p className="text-white font-semibold">{formatCurrency(product.profit)}</p>
                          </div>
                        </div>

                        {/* Profitability Bar */}
                        <div className="mt-4">
                          <div className="flex justify-between text-xs text-slate-300 mb-2">
                            <span>Rentabilidad</span>
                            <span>{product.profit_margin}%</span>
                          </div>
                          <div className="w-full bg-white/10 rounded-full h-2">
                            <div 
                              className={`h-2 rounded-full bg-gradient-to-r ${getProfitabilityColor(product.profit_margin)}`}
                              style={{ width: `${Math.min(product.profit_margin, 100)}%` }}
                            />
                          </div>
                        </div>
                      </motion.div>
                    ))
                  )}
                </div>
              )}
            </motion.div>
          </div>

          {/* Financial Summary & Trends */}
          <div className="space-y-6">
            {/* Cost Breakdown */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="backdrop-blur-lg bg-white/10 rounded-2xl p-6 border border-white/20"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-white flex items-center">
                  <Calculator className="h-5 w-5 mr-2 text-red-400" />
                  Desglose de Costos
                </h2>
              </div>

              {loadingCosts ? (
                <div className="flex justify-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                </div>
              ) : (
                <div className="space-y-4">
                  {[
                    { name: 'Costo de Productos', amount: costAnalysis?.product_costs || 45670, percentage: 78, color: 'bg-red-500' },
                    { name: 'Gastos Operativos', amount: costAnalysis?.operational_costs || 8930, percentage: 15, color: 'bg-orange-500' },
                    { name: 'Gastos de Personal', amount: costAnalysis?.staff_costs || 4120, percentage: 7, color: 'bg-yellow-500' }
                  ].map((cost) => (
                    <div key={cost.name} className="bg-white/5 rounded-xl p-4 border border-white/10">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-white font-medium text-sm">{cost.name}</h4>
                        <div className="text-right">
                          <p className="text-white font-semibold">{formatCurrency(cost.amount)}</p>
                          <p className="text-slate-300 text-xs">{cost.percentage}% del total</p>
                        </div>
                      </div>
                      <div className="w-full bg-white/10 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full ${cost.color}`}
                          style={{ width: `${cost.percentage}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>

            {/* Key Performance Indicators */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              className="backdrop-blur-lg bg-white/10 rounded-2xl p-6 border border-white/20"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-white flex items-center">
                  <Activity className="h-5 w-5 mr-2 text-blue-400" />
                  Indicadores Clave
                </h2>
              </div>

              <div className="space-y-4">
                <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-slate-300 text-xs">Rotación de Inventario</p>
                      <p className="text-white font-semibold text-lg">{inventoryMetrics?.turnover_rate || 6.2}x</p>
                    </div>
                    <Zap className="h-6 w-6 text-purple-400" />
                  </div>
                  <p className="text-green-300 text-xs mt-1">+0.8x vs período anterior</p>
                </div>

                <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-slate-300 text-xs">Ticket Promedio</p>
                      <p className="text-white font-semibold text-lg">{formatCurrency(financialData?.avg_ticket || 145)}</p>
                    </div>
                    <Receipt className="h-6 w-6 text-green-400" />
                  </div>
                  <p className="text-green-300 text-xs mt-1">+S/ 12 vs período anterior</p>
                </div>

                <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-slate-300 text-xs">ROI Inventario</p>
                      <p className="text-white font-semibold text-lg">{inventoryMetrics?.roi || 18.5}%</p>
                    </div>
                    <Target className="h-6 w-6 text-yellow-400" />
                  </div>
                  <p className="text-green-300 text-xs mt-1">+2.1% vs período anterior</p>
                </div>

                <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-slate-300 text-xs">Días de Inventario</p>
                      <p className="text-white font-semibold text-lg">{inventoryMetrics?.days_on_hand || 45} días</p>
                    </div>
                    <Clock className="h-6 w-6 text-orange-400" />
                  </div>
                  <p className="text-red-300 text-xs mt-1">+3 días vs período anterior</p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Sales Trends & Seasonal Analysis */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="mt-6 backdrop-blur-lg bg-white/10 rounded-2xl p-6 border border-white/20"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-white flex items-center">
              <TrendingUp className="h-5 w-5 mr-2 text-green-400" />
              Tendencias de Ventas y Análisis Estacional
            </h2>
            <button className="text-slate-300 hover:text-white flex items-center text-sm">
              Ver análisis completo <ChevronRight className="h-4 w-4 ml-1" />
            </button>
          </div>

          {loadingTrends ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {/* Trends by Category */}
              <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h4 className="text-white font-medium text-sm">Medicamentos</h4>
                    <p className="text-slate-300 text-xs">{salesTrends?.medicines?.units || '1,247'} unidades</p>
                  </div>
                  <Pill className="h-6 w-6 text-blue-400" />
                </div>
                <p className="text-white font-semibold text-lg">{formatCurrency(salesTrends?.medicines?.revenue || 98750)}</p>
                <p className="text-green-300 text-xs">+15.2% vs período anterior</p>
              </div>

              <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h4 className="text-white font-medium text-sm">Insumos</h4>
                    <p className="text-slate-300 text-xs">{salesTrends?.supplies?.units || '856'} unidades</p>
                  </div>
                  <Package2 className="h-6 w-6 text-green-400" />
                </div>
                <p className="text-white font-semibold text-lg">{formatCurrency(salesTrends?.supplies?.revenue || 34520)}</p>
                <p className="text-green-300 text-xs">+8.7% vs período anterior</p>
              </div>

              <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h4 className="text-white font-medium text-sm">Equipamiento</h4>
                    <p className="text-slate-300 text-xs">{salesTrends?.equipment?.units || '23'} unidades</p>
                  </div>
                  <Building className="h-6 w-6 text-purple-400" />
                </div>
                <p className="text-white font-semibold text-lg">{formatCurrency(salesTrends?.equipment?.revenue || 12870)}</p>
                <p className="text-red-300 text-xs">-5.3% vs período anterior</p>
              </div>

              <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h4 className="text-white font-medium text-sm">Otros</h4>
                    <p className="text-slate-300 text-xs">{salesTrends?.others?.units || '432'} unidades</p>
                  </div>
                  <Package className="h-6 w-6 text-orange-400" />
                </div>
                <p className="text-white font-semibold text-lg">{formatCurrency(salesTrends?.others?.revenue || 8950)}</p>
                <p className="text-green-300 text-xs">+12.1% vs período anterior</p>
              </div>
            </div>
          )}

          {/* Additional Metrics */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white/5 rounded-xl p-4 border border-white/10 text-center">
              <div className="flex items-center justify-center mb-2">
                <Users className="h-8 w-8 text-blue-400" />
              </div>
              <p className="text-2xl font-bold text-white mb-1">
                {financialData?.total_customers || 1847}
              </p>
              <p className="text-slate-300 text-sm">Clientes Únicos</p>
              <p className="text-green-300 text-xs">+156 nuevos este mes</p>
            </div>

            <div className="bg-white/5 rounded-xl p-4 border border-white/10 text-center">
              <div className="flex items-center justify-center mb-2">
                <Calendar className="h-8 w-8 text-green-400" />
              </div>
              <p className="text-2xl font-bold text-white mb-1">
                {financialData?.total_transactions || 3624}
              </p>
              <p className="text-slate-300 text-sm">Transacciones</p>
              <p className="text-green-300 text-xs">Promedio: 117/día</p>
            </div>

            <div className="bg-white/5 rounded-xl p-4 border border-white/10 text-center">
              <div className="flex items-center justify-center mb-2">
                <Star className="h-8 w-8 text-yellow-400" />
              </div>
              <p className="text-2xl font-bold text-white mb-1">
                {financialData?.satisfaction_rating || 4.6}
              </p>
              <p className="text-slate-300 text-sm">Satisfacción Cliente</p>
              <p className="text-green-300 text-xs">+0.2 vs mes anterior</p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default PharmacyFinancials;
