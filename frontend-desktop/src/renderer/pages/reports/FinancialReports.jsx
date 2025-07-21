import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { 
  DollarSign, TrendingUp, TrendingDown, BarChart3,
  PieChart, Calendar, Download, Filter, Search,
  CreditCard, Wallet, Receipt, ArrowUpRight,
  ArrowDownRight, Eye, FileText, Calculator,
  Target, Activity, Clock, Users,
  Pill, Stethoscope, Heart, Building,
  ChevronRight, RefreshCw
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import dashboardService from '../../services/dashboardService';
import { useAuth } from '../../contexts/AuthContext';

const FinancialReports = () => {
  const { user } = useAuth();
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedView, setSelectedView] = useState('overview');

  // Obtener datos financieros
  const { data: financialData, isLoading: loadingFinancial, refetch } = useQuery({
    queryKey: ['financialData', selectedPeriod],
    queryFn: () => dashboardService.getFinancialData(selectedPeriod),
    refetchInterval: 300000, // Actualizar cada 5 minutos
  });

  // Obtener ingresos por especialidad
  const { data: incomeBySpecialty, isLoading: loadingIncome } = useQuery({
    queryKey: ['incomeBySpecialty', selectedPeriod],
    queryFn: () => dashboardService.getIncomeBySpecialty(selectedPeriod),
  });

  // Obtener gastos operativos
  const { data: operationalExpenses, isLoading: loadingExpenses } = useQuery({
    queryKey: ['operationalExpenses', selectedPeriod],
    queryFn: () => dashboardService.getOperationalExpenses(selectedPeriod),
  });

  // Obtener transacciones recientes
  const { data: recentTransactions, isLoading: loadingTransactions } = useQuery({
    queryKey: ['recentTransactions'],
    queryFn: dashboardService.getRecentTransactions,
  });

  // Obtener métricas de farmacia
  const { data: pharmacyMetrics, isLoading: loadingPharmacy } = useQuery({
    queryKey: ['pharmacyFinancialMetrics', selectedPeriod],
    queryFn: () => dashboardService.getPharmacyFinancialMetrics(selectedPeriod),
  });

  const periods = [
    { value: 'day', label: 'Hoy' },
    { value: 'week', label: 'Esta semana' },
    { value: 'month', label: 'Este mes' },
    { value: 'quarter', label: 'Trimestre' },
    { value: 'year', label: 'Este año' }
  ];

  const categories = [
    { value: 'all', label: 'Todo', icon: BarChart3 },
    { value: 'income', label: 'Ingresos', icon: TrendingUp },
    { value: 'expenses', label: 'Gastos', icon: TrendingDown },
    { value: 'pharmacy', label: 'Farmacia', icon: Pill },
    { value: 'consultations', label: 'Consultas', icon: Stethoscope },
  ];

  const views = [
    { value: 'overview', label: 'Resumen', icon: BarChart3 },
    { value: 'detailed', label: 'Detallado', icon: FileText },
    { value: 'charts', label: 'Gráficos', icon: PieChart },
    { value: 'transactions', label: 'Transacciones', icon: Receipt },
  ];

  // Métricas principales
  const mainMetrics = [
    {
      title: 'Ingresos Totales',
      value: financialData?.total_income || 0,
      change: financialData?.income_change || '+0%',
      icon: DollarSign,
      color: 'from-green-500 to-emerald-600',
      type: 'currency',
    },
    {
      title: 'Gastos Totales',
      value: financialData?.total_expenses || 0,
      change: financialData?.expenses_change || '+0%',
      icon: CreditCard,
      color: 'from-red-500 to-pink-600',
      type: 'currency',
    },
    {
      title: 'Ganancia Neta',
      value: financialData?.net_profit || 0,
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

  const formatPercentage = (value) => {
    return `${value}%`;
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
              <BarChart3 className="h-8 w-8 mr-3 text-green-400" />
              Reportes Financieros
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
            <button className="flex items-center px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-medium hover:from-green-600 hover:to-emerald-700 transition-colors">
              <Download className="h-4 w-4 mr-2" />
              Exportar
            </button>
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
                    {metric.type === 'currency' ? formatCurrency(metric.value) : 
                     metric.type === 'percentage' ? formatPercentage(metric.value) : 
                     metric.value}
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
                placeholder="Buscar en reportes financieros..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-green-500"
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
                        ? 'bg-green-500 text-white'
                        : 'bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white border border-white/20'
                    }`}
                  >
                    <ViewIcon className="h-4 w-4 mr-2" />
                    {view.label}
                  </button>
                );
              })}
            </div>

            {/* Period Filter */}
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-green-500"
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
          {/* Income by Specialty */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="backdrop-blur-lg bg-white/10 rounded-2xl p-6 border border-white/20"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-white flex items-center">
                <Stethoscope className="h-5 w-5 mr-2 text-blue-400" />
                Ingresos por Especialidad
              </h2>
              <button className="text-slate-300 hover:text-white">
                <Eye className="h-5 w-5" />
              </button>
            </div>

            {loadingIncome ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
              </div>
            ) : (
              <div className="space-y-4 max-h-80 overflow-y-auto">
                {incomeBySpecialty?.map((specialty, index) => (
                  <div
                    key={specialty.name}
                    className="bg-white/5 rounded-xl p-4 border border-white/10 hover:bg-white/10 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-3">
                        <div className={`p-2 rounded-lg bg-gradient-to-r ${
                          specialty.name === 'Medicina General' ? 'from-blue-500 to-blue-600' :
                          specialty.name === 'Obstetricia' ? 'from-pink-500 to-pink-600' :
                          specialty.name === 'Odontología' ? 'from-green-500 to-green-600' :
                          'from-purple-500 to-purple-600'
                        }`}>
                          {specialty.name === 'Medicina General' ? <Stethoscope className="h-4 w-4 text-white" /> :
                           specialty.name === 'Obstetricia' ? <Heart className="h-4 w-4 text-white" /> :
                           specialty.name === 'Odontología' ? <Building className="h-4 w-4 text-white" /> :
                           <Activity className="h-4 w-4 text-white" />}
                        </div>
                        <div>
                          <h4 className="text-white font-medium text-sm">{specialty.name}</h4>
                          <p className="text-slate-300 text-xs">{specialty.appointments} consultas</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-white font-semibold">{formatCurrency(specialty.income)}</p>
                        <p className={`text-xs flex items-center ${getChangeColor(specialty.change)}`}>
                          {getChangeIcon(specialty.change)}
                          <span className="ml-1">{specialty.change}</span>
                        </p>
                      </div>
                    </div>
                    <div className="w-full bg-white/10 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full bg-gradient-to-r ${
                          specialty.name === 'Medicina General' ? 'from-blue-500 to-blue-600' :
                          specialty.name === 'Obstetricia' ? 'from-pink-500 to-pink-600' :
                          specialty.name === 'Odontología' ? 'from-green-500 to-green-600' :
                          'from-purple-500 to-purple-600'
                        }`}
                        style={{ width: `${specialty.percentage}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>

          {/* Pharmacy Metrics */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="backdrop-blur-lg bg-white/10 rounded-2xl p-6 border border-white/20"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-white flex items-center">
                <Pill className="h-5 w-5 mr-2 text-orange-400" />
                Métricas de Farmacia
              </h2>
            </div>

            {loadingPharmacy ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-slate-300 text-xs">Ventas</p>
                        <p className="text-white font-semibold">{formatCurrency(pharmacyMetrics?.sales || 0)}</p>
                      </div>
                      <Wallet className="h-5 w-5 text-green-400" />
                    </div>
                  </div>
                  <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-slate-300 text-xs">Productos</p>
                        <p className="text-white font-semibold">{pharmacyMetrics?.products_sold || 0}</p>
                      </div>
                      <Receipt className="h-5 w-5 text-blue-400" />
                    </div>
                  </div>
                </div>

                <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-white font-medium text-sm">Medicamentos más vendidos</h4>
                    <ChevronRight className="h-4 w-4 text-slate-400" />
                  </div>
                  <div className="space-y-2">
                    {pharmacyMetrics?.top_medicines?.slice(0, 3).map((medicine, index) => (
                      <div key={medicine.name} className="flex items-center justify-between">
                        <span className="text-slate-300 text-xs">{medicine.name}</span>
                        <span className="text-white text-xs font-medium">{formatCurrency(medicine.revenue)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </motion.div>

          {/* Recent Transactions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="backdrop-blur-lg bg-white/10 rounded-2xl p-6 border border-white/20"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-white flex items-center">
                <Clock className="h-5 w-5 mr-2 text-purple-400" />
                Transacciones Recientes
              </h2>
            </div>

            {loadingTransactions ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
              </div>
            ) : (
              <div className="space-y-3 max-h-80 overflow-y-auto">
                {recentTransactions?.map((transaction) => (
                  <div
                    key={transaction.id}
                    className="bg-white/5 rounded-xl p-4 border border-white/10 hover:bg-white/10 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-3">
                        <div className={`p-2 rounded-lg ${
                          transaction.type === 'income' ? 'bg-green-500/20 text-green-400' :
                          'bg-red-500/20 text-red-400'
                        }`}>
                          {transaction.type === 'income' ? 
                            <ArrowUpRight className="h-4 w-4" /> :
                            <ArrowDownRight className="h-4 w-4" />
                          }
                        </div>
                        <div>
                          <h4 className="text-white font-medium text-sm">{transaction.description}</h4>
                          <p className="text-slate-300 text-xs">{transaction.category}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`font-semibold text-sm ${
                          transaction.type === 'income' ? 'text-green-400' : 'text-red-400'
                        }`}>
                          {transaction.type === 'income' ? '+' : '-'}{formatCurrency(transaction.amount)}
                        </p>
                        <p className="text-slate-400 text-xs">
                          {format(new Date(transaction.date), 'dd/MM HH:mm')}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        </div>

        {/* Operational Expenses Summary */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="mt-6 backdrop-blur-lg bg-white/10 rounded-2xl p-6 border border-white/20"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-white flex items-center">
              <Calculator className="h-5 w-5 mr-2 text-red-400" />
              Resumen de Gastos Operativos
            </h2>
            <button className="text-slate-300 hover:text-white flex items-center text-sm">
              Ver detalle <ChevronRight className="h-4 w-4 ml-1" />
            </button>
          </div>

          {loadingExpenses ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {operationalExpenses?.map((expense, index) => (
                <div
                  key={expense.category}
                  className="bg-white/5 rounded-xl p-4 border border-white/10 hover:bg-white/10 transition-colors"
                >
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-white font-medium text-sm">{expense.category}</h4>
                    <div className={`p-2 rounded-lg ${expense.color || 'bg-gray-500/20 text-gray-400'}`}>
                      <expense.icon className="h-4 w-4" />
                    </div>
                  </div>
                  <p className="text-2xl font-bold text-white mb-1">
                    {formatCurrency(expense.amount)}
                  </p>
                  <div className={`flex items-center text-xs ${getChangeColor(expense.change)}`}>
                    {getChangeIcon(expense.change)}
                    <span className="ml-1">{expense.change}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default FinancialReports;
