import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  DollarSign, Receipt, CreditCard, Users, TrendingUp, TrendingDown,
  FileText, Search, Filter, Download, RefreshCw, Plus, Edit2, Save,
  Eye, X, CheckCircle, XCircle, AlertCircle, Clock, Calendar,
  ArrowLeft, ChevronRight, Wallet, PieChart, BarChart3,
  Calculator, Building, Phone, Mail, MapPin, Shield,
  Package, Target, Activity, Coins, Banknote, Smartphone,
  Printer, Send, Star, Award, Bell
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { format, startOfMonth, endOfMonth, isValid } from 'date-fns';
import { es } from 'date-fns/locale';
import { useAuth } from '../../contexts/AuthContext';

const BillingManagement = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Estados principales
  const [view, setView] = useState('overview'); // 'overview', 'invoices', 'payments', 'reports', 'settings'
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [paymentMethodFilter, setPaymentMethodFilter] = useState('all');
  const [dateRange, setDateRange] = useState('month');
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [showFilters, setShowFilters] = useState(false);

  // Estados para nueva factura
  const [showNewInvoiceModal, setShowNewInvoiceModal] = useState(false);
  const [newInvoiceData, setNewInvoiceData] = useState({
    patient_id: '',
    appointment_id: '',
    items: [],
    discount: 0,
    payment_method: 'cash',
    notes: '',
  });

  // Estados para registro de pago
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentData, setPaymentData] = useState({
    amount: 0,
    method: 'cash',
    reference: '',
    notes: '',
  });

  // Mock data - en producción estos serían llamadas reales al API
  const { data: billingStats, isLoading: loadingStats } = useQuery({
    queryKey: ['billing-stats', dateRange],
    queryFn: () => {
      return Promise.resolve({
        total_revenue: 125000,
        revenue_change: '+12.5%',
        pending_amount: 25000,
        pending_change: '-8.3%',
        total_invoices: 340,
        invoices_change: '+15.2%',
        average_ticket: 368,
        ticket_change: '+5.7%',
        payment_methods: {
          cash: { amount: 45000, percentage: 36, count: 125 },
          card: { amount: 52000, percentage: 42, count: 140 },
          transfer: { amount: 18000, percentage: 14, count: 48 },
          insurance: { amount: 10000, percentage: 8, count: 27 },
        },
        top_services: [
          { name: 'Consulta General', revenue: 35000, count: 175 },
          { name: 'Consulta Dental', revenue: 28000, count: 95 },
          { name: 'Control Prenatal', revenue: 22000, count: 88 },
          { name: 'Emergencias', revenue: 18000, count: 45 },
        ]
      });
    },
  });

  const { data: invoices, isLoading: loadingInvoices } = useQuery({
    queryKey: ['invoices', { search: searchTerm, status: statusFilter, date: dateRange }],
    queryFn: () => {
      return Promise.resolve({
        results: [
          {
            id: 'INV-2024-001',
            patient_name: 'María González Pérez',
            patient_dni: '12345678',
            service: 'Consulta General',
            doctor: 'Dr. Juan Medina',
            date: '2024-07-20T10:30:00',
            amount: 150,
            discount: 0,
            total: 150,
            status: 'paid',
            payment_method: 'card',
            paid_at: '2024-07-20T11:00:00',
            notes: 'Pago completo al finalizar consulta',
          },
          {
            id: 'INV-2024-002',
            patient_name: 'Carlos Ruiz Mendoza',
            patient_dni: '87654321',
            service: 'Consulta Dental - Limpieza',
            doctor: 'Dr. Ana Silva',
            date: '2024-07-20T09:15:00',
            amount: 200,
            discount: 20,
            total: 180,
            status: 'pending',
            payment_method: null,
            paid_at: null,
            notes: 'Pendiente de pago - Contactar paciente',
          },
          {
            id: 'INV-2024-003',
            patient_name: 'Ana Torres Silva',
            patient_dni: '11223344',
            service: 'Control Prenatal',
            doctor: 'Dra. Carmen López',
            date: '2024-07-20T08:45:00',
            amount: 120,
            discount: 0,
            total: 120,
            status: 'partial',
            payment_method: 'cash',
            paid_at: '2024-07-20T09:00:00',
            notes: 'Pago parcial S/80 - Resto pendiente',
            paid_amount: 80,
            pending_amount: 40,
          },
        ],
        count: 340,
        page: 1,
        pages: 23,
      });
    },
  });

  // Generar nueva factura (mock)
  const generateInvoiceMutation = useMutation({
    mutationFn: async (data) => {
      await new Promise(resolve => setTimeout(resolve, 1000));
      return { id: `INV-2024-${Math.floor(Math.random() * 1000)}`, ...data };
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['invoices']);
      queryClient.invalidateQueries(['billing-stats']);
      setShowNewInvoiceModal(false);
      setNewInvoiceData({
        patient_id: '',
        appointment_id: '',
        items: [],
        discount: 0,
        payment_method: 'cash',
        notes: '',
      });
    }
  });

  // Registrar pago (mock)
  const registerPaymentMutation = useMutation({
    mutationFn: async (data) => {
      await new Promise(resolve => setTimeout(resolve, 800));
      return { success: true, ...data };
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['invoices']);
      queryClient.invalidateQueries(['billing-stats']);
      setShowPaymentModal(false);
      setSelectedInvoice(null);
    }
  });

  const statusColors = {
    paid: 'bg-green-500/20 text-green-300 border-green-400',
    pending: 'bg-yellow-500/20 text-yellow-300 border-yellow-400',
    partial: 'bg-blue-500/20 text-blue-300 border-blue-400',
    cancelled: 'bg-red-500/20 text-red-300 border-red-400',
    overdue: 'bg-orange-500/20 text-orange-300 border-orange-400',
  };

  const statusLabels = {
    paid: 'Pagado',
    pending: 'Pendiente',
    partial: 'Parcial',
    cancelled: 'Cancelado',
    overdue: 'Vencido',
  };

  const paymentMethodIcons = {
    cash: Banknote,
    card: CreditCard,
    transfer: Smartphone,
    insurance: Shield,
  };

  const paymentMethodLabels = {
    cash: 'Efectivo',
    card: 'Tarjeta',
    transfer: 'Transferencia',
    insurance: 'Seguro',
  };

  const StatusIcon = ({ status }) => {
    switch (status) {
      case 'paid':
        return <CheckCircle className="h-4 w-4 text-green-400" />;
      case 'cancelled':
        return <XCircle className="h-4 w-4 text-red-400" />;
      case 'pending':
      case 'overdue':
        return <AlertCircle className="h-4 w-4 text-yellow-400" />;
      case 'partial':
        return <Clock className="h-4 w-4 text-blue-400" />;
      default:
        return <AlertCircle className="h-4 w-4 text-slate-400" />;
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency: 'PEN',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const handlePayment = (invoice) => {
    setSelectedInvoice(invoice);
    setPaymentData({
      amount: invoice.status === 'partial' ? invoice.pending_amount : invoice.total,
      method: 'cash',
      reference: '',
      notes: '',
    });
    setShowPaymentModal(true);
  };

  const mainStats = [
    {
      title: 'Ingresos del Mes',
      value: billingStats?.total_revenue || 0,
      change: billingStats?.revenue_change || '+0%',
      icon: DollarSign,
      color: 'from-green-500 to-emerald-600',
      type: 'currency',
    },
    {
      title: 'Monto Pendiente',
      value: billingStats?.pending_amount || 0,
      change: billingStats?.pending_change || '+0%',
      icon: AlertCircle,
      color: 'from-yellow-500 to-orange-600',
      type: 'currency',
    },
    {
      title: 'Total Facturas',
      value: billingStats?.total_invoices || 0,
      change: billingStats?.invoices_change || '+0%',
      icon: Receipt,
      color: 'from-blue-500 to-indigo-600',
      type: 'number',
    },
    {
      title: 'Ticket Promedio',
      value: billingStats?.average_ticket || 0,
      change: billingStats?.ticket_change || '+0%',
      icon: Calculator,
      color: 'from-purple-500 to-violet-600',
      type: 'currency',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-800 to-indigo-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8"
        >
          <div className="mb-4 lg:mb-0">
            <div className="flex items-center mb-2">
              <Link 
                to="/dashboard" 
                className="p-2 text-slate-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors mr-4"
              >
                <ArrowLeft className="h-6 w-6" />
              </Link>
              <h1 className="text-3xl font-bold text-white flex items-center">
                <Receipt className="h-8 w-8 mr-3 text-green-400" />
                Gestión de Facturación
              </h1>
            </div>
            <p className="text-slate-200 ml-14">
              Control financiero y facturación del centro médico
            </p>
          </div>
          
          <div className="flex items-center space-x-3">
            <div className="flex bg-white/10 rounded-lg p-1 border border-white/20">
              <button
                onClick={() => setView('overview')}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  view === 'overview' 
                    ? 'bg-blue-500 text-white' 
                    : 'text-slate-300 hover:text-white hover:bg-white/10'
                }`}
              >
                Resumen
              </button>
              <button
                onClick={() => setView('invoices')}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  view === 'invoices' 
                    ? 'bg-blue-500 text-white' 
                    : 'text-slate-300 hover:text-white hover:bg-white/10'
                }`}
              >
                Facturas
              </button>
              <button
                onClick={() => setView('payments')}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  view === 'payments' 
                    ? 'bg-blue-500 text-white' 
                    : 'text-slate-300 hover:text-white hover:bg-white/10'
                }`}
              >
                Pagos
              </button>
              <button
                onClick={() => setView('reports')}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  view === 'reports' 
                    ? 'bg-blue-500 text-white' 
                    : 'text-slate-300 hover:text-white hover:bg-white/10'
                }`}
              >
                Reportes
              </button>
            </div>
            <button
              onClick={() => setShowNewInvoiceModal(true)}
              className="px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-medium rounded-lg hover:from-green-600 hover:to-emerald-700 transition duration-200 flex items-center"
            >
              <Plus className="h-4 w-4 mr-2" />
              Nueva Factura
            </button>
          </div>
        </motion.div>

        {/* Vista de Resumen */}
        {view === 'overview' && (
          <div className="space-y-6">
            {/* Métricas Principales */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {mainStats.map((stat, index) => (
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
                        {stat.type === 'currency' ? formatCurrency(stat.value) : stat.value.toLocaleString()}
                      </p>
                      <p className={`text-sm ${
                        stat.change.startsWith('+') ? 'text-green-400' : 
                        stat.change.startsWith('-') ? 'text-red-400' : 'text-slate-400'
                      }`}>
                        {stat.change}
                      </p>
                    </div>
                  </div>
                  <h3 className="text-white/80 text-sm font-medium">{stat.title}</h3>
                </motion.div>
              ))}
            </div>

            {/* Gráficos y Métricas */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Métodos de Pago */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="backdrop-blur-lg bg-white/10 rounded-2xl p-6 border border-white/20"
              >
                <h3 className="text-xl font-semibold text-white mb-6 flex items-center">
                  <PieChart className="h-5 w-5 mr-2 text-blue-400" />
                  Métodos de Pago
                </h3>
                
                <div className="space-y-4">
                  {Object.entries(billingStats?.payment_methods || {}).map(([method, data]) => {
                    const Icon = paymentMethodIcons[method];
                    return (
                      <div key={method} className="bg-white/5 rounded-xl p-4 border border-white/10">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center">
                            <Icon className="h-5 w-5 text-blue-400 mr-2" />
                            <span className="text-white font-medium">
                              {paymentMethodLabels[method]}
                            </span>
                          </div>
                          <div className="text-right">
                            <p className="text-white font-semibold">{formatCurrency(data.amount)}</p>
                            <p className="text-slate-400 text-sm">{data.count} transacciones</p>
                          </div>
                        </div>
                        <div className="w-full bg-white/10 rounded-full h-2">
                          <div 
                            className="bg-gradient-to-r from-blue-500 to-indigo-600 h-2 rounded-full"
                            style={{ width: `${data.percentage}%` }}
                          />
                        </div>
                        <p className="text-slate-300 text-sm mt-1">{data.percentage}% del total</p>
                      </div>
                    );
                  })}
                </div>
              </motion.div>

              {/* Top Servicios */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="backdrop-blur-lg bg-white/10 rounded-2xl p-6 border border-white/20"
              >
                <h3 className="text-xl font-semibold text-white mb-6 flex items-center">
                  <BarChart3 className="h-5 w-5 mr-2 text-green-400" />
                  Servicios Más Rentables
                </h3>
                
                <div className="space-y-4">
                  {billingStats?.top_services?.map((service, index) => (
                    <div key={service.name} className="bg-white/5 rounded-xl p-4 border border-white/10">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-r from-green-500 to-emerald-600 flex items-center justify-center text-white font-bold text-sm mr-3">
                            {index + 1}
                          </div>
                          <span className="text-white font-medium">{service.name}</span>
                        </div>
                        <div className="text-right">
                          <p className="text-white font-semibold">{formatCurrency(service.revenue)}</p>
                          <p className="text-slate-400 text-sm">{service.count} consultas</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            </div>
          </div>
        )}

        {/* Vista de Facturas */}
        {view === 'invoices' && (
          <div className="space-y-6">
            {/* Filtros */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="backdrop-blur-lg bg-white/10 rounded-2xl p-6 border border-white/20"
            >
              <div className="flex flex-col lg:flex-row lg:items-center lg:space-x-4 space-y-4 lg:space-y-0">
                {/* Búsqueda */}
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Buscar por paciente, factura o servicio..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* Filtros */}
                <div className="flex items-center space-x-3">
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-3 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="all">Todos los estados</option>
                    <option value="paid">Pagados</option>
                    <option value="pending">Pendientes</option>
                    <option value="partial">Parciales</option>
                    <option value="cancelled">Cancelados</option>
                  </select>

                  <select
                    value={dateRange}
                    onChange={(e) => setDateRange(e.target.value)}
                    className="px-3 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="today">Hoy</option>
                    <option value="week">Esta semana</option>
                    <option value="month">Este mes</option>
                    <option value="quarter">Trimestre</option>
                  </select>

                  <button className="p-3 text-slate-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors">
                    <RefreshCw className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </motion.div>

            {/* Lista de Facturas */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="backdrop-blur-lg bg-white/10 rounded-2xl border border-white/20 overflow-hidden"
            >
              {loadingInvoices ? (
                <div className="flex justify-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
                </div>
              ) : invoices?.results?.length === 0 ? (
                <div className="text-center py-12">
                  <Receipt className="h-16 w-16 text-slate-400 mx-auto mb-4" />
                  <h3 className="text-xl font-medium text-white mb-2">No hay facturas</h3>
                  <p className="text-slate-400 mb-4">No se encontraron facturas para los filtros seleccionados.</p>
                  <button
                    onClick={() => setShowNewInvoiceModal(true)}
                    className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-medium rounded-xl hover:from-green-600 hover:to-emerald-700 transition duration-200 flex items-center mx-auto"
                  >
                    <Plus className="h-5 w-5 mr-2" />
                    Nueva Factura
                  </button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-white/5">
                      <tr>
                        <th className="px-6 py-4 text-left text-sm font-medium text-white">Factura</th>
                        <th className="px-6 py-4 text-left text-sm font-medium text-white">Paciente</th>
                        <th className="px-6 py-4 text-left text-sm font-medium text-white">Servicio</th>
                        <th className="px-6 py-4 text-left text-sm font-medium text-white">Fecha</th>
                        <th className="px-6 py-4 text-left text-sm font-medium text-white">Monto</th>
                        <th className="px-6 py-4 text-left text-sm font-medium text-white">Estado</th>
                        <th className="px-6 py-4 text-center text-sm font-medium text-white">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/10">
                      {invoices?.results?.map((invoice, index) => (
                        <motion.tr
                          key={invoice.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className="hover:bg-white/5 transition-colors"
                        >
                          <td className="px-6 py-4">
                            <div className="text-white font-mono font-medium">{invoice.id}</div>
                            <div className="text-slate-400 text-sm">Dr. {invoice.doctor}</div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-white font-medium">{invoice.patient_name}</div>
                            <div className="text-slate-400 text-sm">DNI: {invoice.patient_dni}</div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-white">{invoice.service}</div>
                            {invoice.discount > 0 && (
                              <div className="text-green-400 text-sm">Descuento: {formatCurrency(invoice.discount)}</div>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-white">{format(new Date(invoice.date), 'dd/MM/yyyy')}</div>
                            <div className="text-slate-400 text-sm">{format(new Date(invoice.date), 'HH:mm')}</div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-white font-semibold">{formatCurrency(invoice.total)}</div>
                            {invoice.status === 'partial' && (
                              <div className="text-yellow-400 text-sm">
                                Pendiente: {formatCurrency(invoice.pending_amount)}
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center">
                              <StatusIcon status={invoice.status} />
                              <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium border ${statusColors[invoice.status] || 'bg-gray-500/20 text-gray-300 border-gray-400'}`}>
                                {statusLabels[invoice.status] || invoice.status}
                              </span>
                            </div>
                            {invoice.payment_method && (
                              <div className="text-slate-400 text-xs mt-1">
                                {paymentMethodLabels[invoice.payment_method]}
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex justify-center space-x-2">
                              <button className="p-2 text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 rounded-lg transition-colors" title="Ver detalles">
                                <Eye className="h-4 w-4" />
                              </button>
                              <button className="p-2 text-slate-400 hover:text-slate-300 hover:bg-slate-500/10 rounded-lg transition-colors" title="Imprimir">
                                <Printer className="h-4 w-4" />
                              </button>
                              {(invoice.status === 'pending' || invoice.status === 'partial') && (
                                <button 
                                  onClick={() => handlePayment(invoice)}
                                  className="p-2 text-green-400 hover:text-green-300 hover:bg-green-500/10 rounded-lg transition-colors" 
                                  title="Registrar pago"
                                >
                                  <DollarSign className="h-4 w-4" />
                                </button>
                              )}
                            </div>
                          </td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </motion.div>
          </div>
        )}

        {/* Vista de Pagos */}
        {view === 'payments' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="backdrop-blur-lg bg-white/10 rounded-2xl p-6 border border-white/20"
          >
            <div className="text-center py-12">
              <Wallet className="h-16 w-16 text-slate-400 mx-auto mb-4" />
              <h3 className="text-xl font-medium text-white mb-2">Gestión de Pagos</h3>
              <p className="text-slate-400">Esta funcionalidad estará disponible próximamente.</p>
            </div>
          </motion.div>
        )}

        {/* Vista de Reportes */}
        {view === 'reports' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="backdrop-blur-lg bg-white/10 rounded-2xl p-6 border border-white/20"
          >
            <div className="text-center py-12">
              <BarChart3 className="h-16 w-16 text-slate-400 mx-auto mb-4" />
              <h3 className="text-xl font-medium text-white mb-2">Reportes Financieros</h3>
              <p className="text-slate-400">Esta funcionalidad estará disponible próximamente.</p>
            </div>
          </motion.div>
        )}
      </div>

      {/* Modal de Nueva Factura */}
      <AnimatePresence>
        {showNewInvoiceModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-slate-800 rounded-2xl p-6 border border-slate-700 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-white flex items-center">
                  <Plus className="h-6 w-6 mr-2 text-green-400" />
                  Nueva Factura
                </h3>
                <button
                  onClick={() => setShowNewInvoiceModal(false)}
                  className="text-slate-400 hover:text-white"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <div className="text-center py-8">
                <Receipt className="h-16 w-16 text-slate-400 mx-auto mb-4" />
                <h4 className="text-lg font-medium text-white mb-2">Crear Nueva Factura</h4>
                <p className="text-slate-400 mb-6">Esta funcionalidad estará disponible próximamente.</p>
                <button
                  onClick={() => setShowNewInvoiceModal(false)}
                  className="px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-medium rounded-xl hover:from-blue-600 hover:to-indigo-700 transition duration-200"
                >
                  Cerrar
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal de Registro de Pago */}
      <AnimatePresence>
        {showPaymentModal && selectedInvoice && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-slate-800 rounded-2xl p-6 border border-slate-700 max-w-md w-full"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-white flex items-center">
                  <DollarSign className="h-6 w-6 mr-2 text-green-400" />
                  Registrar Pago
                </h3>
                <button
                  onClick={() => setShowPaymentModal(false)}
                  className="text-slate-400 hover:text-white"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <div className="bg-slate-700/50 rounded-lg p-4 mb-6">
                <div className="text-sm text-slate-300 space-y-1">
                  <div><strong>Factura:</strong> {selectedInvoice.id}</div>
                  <div><strong>Paciente:</strong> {selectedInvoice.patient_name}</div>
                  <div><strong>Servicio:</strong> {selectedInvoice.service}</div>
                  <div><strong>Monto:</strong> {formatCurrency(selectedInvoice.total)}</div>
                  {selectedInvoice.status === 'partial' && (
                    <div className="text-yellow-400">
                      <strong>Pendiente:</strong> {formatCurrency(selectedInvoice.pending_amount)}
                    </div>
                  )}
                </div>
              </div>

              <form onSubmit={(e) => {
                e.preventDefault();
                registerPaymentMutation.mutate({
                  invoice_id: selectedInvoice.id,
                  ...paymentData
                });
              }} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-white mb-2">Monto a Pagar</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={paymentData.amount}
                    onChange={(e) => setPaymentData(prev => ({ ...prev, amount: parseFloat(e.target.value) || 0 }))}
                    className="w-full px-3 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-white mb-2">Método de Pago</label>
                  <select
                    value={paymentData.method}
                    onChange={(e) => setPaymentData(prev => ({ ...prev, method: e.target.value }))}
                    className="w-full px-3 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <option value="cash">Efectivo</option>
                    <option value="card">Tarjeta</option>
                    <option value="transfer">Transferencia</option>
                    <option value="insurance">Seguro</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-white mb-2">Referencia (Opcional)</label>
                  <input
                    type="text"
                    value={paymentData.reference}
                    onChange={(e) => setPaymentData(prev => ({ ...prev, reference: e.target.value }))}
                    className="w-full px-3 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="Número de transacción, etc."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-white mb-2">Notas</label>
                  <textarea
                    value={paymentData.notes}
                    onChange={(e) => setPaymentData(prev => ({ ...prev, notes: e.target.value }))}
                    rows={3}
                    className="w-full px-3 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
                    placeholder="Observaciones adicionales..."
                  />
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowPaymentModal(false)}
                    className="px-4 py-2 text-slate-300 hover:text-white border border-slate-600 hover:border-slate-500 rounded-lg transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={registerPaymentMutation.isLoading}
                    className="px-6 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-medium rounded-lg hover:from-green-600 hover:to-emerald-700 transition duration-200 disabled:opacity-50"
                  >
                    {registerPaymentMutation.isLoading ? 'Registrando...' : 'Registrar Pago'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default BillingManagement;
