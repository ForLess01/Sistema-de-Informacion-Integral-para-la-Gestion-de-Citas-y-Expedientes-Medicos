import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Download, 
  Calendar, 
  Filter, 
  BarChart3, 
  PieChart, 
  TrendingUp, 
  AlertTriangle,
  Users,
  Clock,
  Activity,
  Search,
  RefreshCw,
  Eye,
  Printer,
  Mail
} from 'lucide-react';

const EmergencyReports = () => {
  const [selectedDateRange, setSelectedDateRange] = useState('today');
  const [selectedReportType, setSelectedReportType] = useState('general');
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Mock data para reportes
  const [reportsData, setReportsData] = useState({
    dailyStats: {
      totalPatients: 45,
      criticalCases: 8,
      moderateCases: 22,
      minorCases: 15,
      averageWaitTime: '18 min',
      satisfactionRate: '4.2/5'
    },
    monthlyTrends: [
      { month: 'Ene', patients: 1200, critical: 180, satisfaction: 4.1 },
      { month: 'Feb', patients: 1350, critical: 195, satisfaction: 4.0 },
      { month: 'Mar', patients: 1180, critical: 165, satisfaction: 4.3 },
      { month: 'Abr', patients: 1420, critical: 220, satisfaction: 4.2 },
      { month: 'May', patients: 1380, critical: 205, satisfaction: 4.4 },
      { month: 'Jun', patients: 1250, critical: 175, satisfaction: 4.3 }
    ],
    reportsList: [
      {
        id: 1,
        title: 'Reporte Diario de Emergencias',
        date: '2024-01-20',
        type: 'Diario',
        status: 'Generado',
        patients: 45,
        critical: 8
      },
      {
        id: 2,
        title: 'Análisis Semanal - Semana 3',
        date: '2024-01-19',
        type: 'Semanal',
        status: 'En proceso',
        patients: 312,
        critical: 48
      },
      {
        id: 3,
        title: 'Reporte Mensual - Enero 2024',
        date: '2024-01-18',
        type: 'Mensual',
        status: 'Generado',
        patients: 1420,
        critical: 220
      },
      {
        id: 4,
        title: 'Estadísticas de Satisfacción',
        date: '2024-01-17',
        type: 'Especial',
        status: 'Generado',
        patients: 890,
        critical: 0
      },
      {
        id: 5,
        title: 'Análisis de Tiempos de Atención',
        date: '2024-01-16',
        type: 'Análisis',
        status: 'Generado',
        patients: 567,
        critical: 85
      }
    ]
  });

  const reportTypes = [
    { value: 'general', label: 'Reporte General', icon: FileText },
    { value: 'critical', label: 'Casos Críticos', icon: AlertTriangle },
    { value: 'satisfaction', label: 'Satisfacción', icon: TrendingUp },
    { value: 'performance', label: 'Rendimiento', icon: BarChart3 },
    { value: 'trends', label: 'Tendencias', icon: PieChart }
  ];

  const dateRanges = [
    { value: 'today', label: 'Hoy' },
    { value: 'yesterday', label: 'Ayer' },
    { value: 'week', label: 'Esta Semana' },
    { value: 'month', label: 'Este Mes' },
    { value: 'quarter', label: 'Este Trimestre' },
    { value: 'year', label: 'Este Año' },
    { value: 'custom', label: 'Personalizado' }
  ];

  const handleGenerateReport = async () => {
    setIsLoading(true);
    // Simular generación de reporte
    setTimeout(() => {
      setIsLoading(false);
      alert('Reporte generado exitosamente');
    }, 2000);
  };

  const handleExportReport = (format) => {
    alert(`Exportando reporte en formato ${format}`);
  };

  const getStatusBadge = (status) => {
    const styles = {
      'Generado': 'bg-green-100 text-green-800',
      'En proceso': 'bg-yellow-100 text-yellow-800',
      'Error': 'bg-red-100 text-red-800'
    };
    
    return `px-2 py-1 text-xs font-medium rounded-full ${styles[status] || 'bg-gray-100 text-gray-800'}`;
  };

  const getTypeIcon = (type) => {
    const icons = {
      'Diario': Clock,
      'Semanal': Calendar,
      'Mensual': BarChart3,
      'Especial': TrendingUp,
      'Análisis': PieChart
    };
    
    const IconComponent = icons[type] || FileText;
    return <IconComponent className="w-4 h-4" />;
  };

  const filteredReports = reportsData.reportsList.filter(report =>
    report.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    report.type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reportes de Emergencia</h1>
          <p className="text-gray-600 mt-1">Genere y gestione reportes estadísticos de emergencias</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleGenerateReport}
            disabled={isLoading}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 disabled:opacity-50"
          >
            {isLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
            {isLoading ? 'Generando...' : 'Generar Reporte'}
          </button>
        </div>
      </div>

      {/* Estadísticas Rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Pacientes Hoy</p>
              <p className="text-2xl font-bold text-blue-600">{reportsData.dailyStats.totalPatients}</p>
            </div>
            <Users className="w-8 h-8 text-blue-500" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Casos Críticos</p>
              <p className="text-2xl font-bold text-red-600">{reportsData.dailyStats.criticalCases}</p>
            </div>
            <AlertTriangle className="w-8 h-8 text-red-500" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Casos Moderados</p>
              <p className="text-2xl font-bold text-orange-600">{reportsData.dailyStats.moderateCases}</p>
            </div>
            <Activity className="w-8 h-8 text-orange-500" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Casos Menores</p>
              <p className="text-2xl font-bold text-green-600">{reportsData.dailyStats.minorCases}</p>
            </div>
            <TrendingUp className="w-8 h-8 text-green-500" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Tiempo Promedio</p>
              <p className="text-2xl font-bold text-purple-600">{reportsData.dailyStats.averageWaitTime}</p>
            </div>
            <Clock className="w-8 h-8 text-purple-500" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Satisfacción</p>
              <p className="text-2xl font-bold text-indigo-600">{reportsData.dailyStats.satisfactionRate}</p>
            </div>
            <BarChart3 className="w-8 h-8 text-indigo-500" />
          </div>
        </div>
      </div>

      {/* Filtros y Configuración */}
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Configuración de Reportes</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tipo de Reporte
            </label>
            <select
              value={selectedReportType}
              onChange={(e) => setSelectedReportType(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {reportTypes.map(type => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Rango de Fechas
            </label>
            <select
              value={selectedDateRange}
              onChange={(e) => setSelectedDateRange(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {dateRanges.map(range => (
                <option key={range.value} value={range.value}>
                  {range.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={handleGenerateReport}
              disabled={isLoading}
              className="w-full bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <BarChart3 className="w-4 h-4" />}
              Generar
            </button>
          </div>
        </div>
      </div>

      {/* Gráfico de Tendencias */}
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Tendencias Mensuales</h2>
          <div className="flex gap-2">
            <button className="p-2 text-gray-500 hover:text-gray-700">
              <PieChart className="w-5 h-5" />
            </button>
            <button className="p-2 text-gray-500 hover:text-gray-700">
              <BarChart3 className="w-5 h-5" />
            </button>
          </div>
        </div>
        
        <div className="h-64 bg-gradient-to-br from-blue-50 to-indigo-100 rounded-lg flex items-center justify-center">
          <div className="text-center">
            <BarChart3 className="w-16 h-16 text-blue-400 mx-auto mb-4" />
            <p className="text-gray-600">Gráfico de tendencias mensuales</p>
            <p className="text-sm text-gray-500 mt-2">Visualización de datos estadísticos</p>
          </div>
        </div>
      </div>

      {/* Lista de Reportes */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold text-gray-900">Historial de Reportes</h2>
            <div className="flex gap-3">
              <div className="relative">
                <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar reportes..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Reporte
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tipo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fecha
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Pacientes
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Críticos
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredReports.map((report) => (
                <tr key={report.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {getTypeIcon(report.type)}
                      <div className="ml-3">
                        <div className="text-sm font-medium text-gray-900">
                          {report.title}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {report.type}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {report.date}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={getStatusBadge(report.status)}>
                      {report.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {report.patients}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {report.critical > 0 ? (
                      <span className="text-sm font-medium text-red-600">
                        {report.critical}
                      </span>
                    ) : (
                      <span className="text-sm text-gray-400">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        className="text-blue-600 hover:text-blue-900 p-1 rounded"
                        title="Ver reporte"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleExportReport('PDF')}
                        className="text-red-600 hover:text-red-900 p-1 rounded"
                        title="Descargar PDF"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                      <button
                        className="text-gray-600 hover:text-gray-900 p-1 rounded"
                        title="Imprimir"
                      >
                        <Printer className="w-4 h-4" />
                      </button>
                      <button
                        className="text-green-600 hover:text-green-900 p-1 rounded"
                        title="Enviar por email"
                      >
                        <Mail className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredReports.length === 0 && (
          <div className="text-center py-12">
            <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No se encontraron reportes</p>
            <p className="text-sm text-gray-400 mt-1">
              Intente ajustar los filtros de búsqueda
            </p>
          </div>
        )}
      </div>

      {/* Exportar Reportes */}
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Exportar Reportes</h2>
        
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => handleExportReport('PDF')}
            className="bg-red-100 text-red-700 px-4 py-2 rounded-lg hover:bg-red-200 flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Exportar PDF
          </button>
          <button
            onClick={() => handleExportReport('Excel')}
            className="bg-green-100 text-green-700 px-4 py-2 rounded-lg hover:bg-green-200 flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Exportar Excel
          </button>
          <button
            onClick={() => handleExportReport('CSV')}
            className="bg-blue-100 text-blue-700 px-4 py-2 rounded-lg hover:bg-blue-200 flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Exportar CSV
          </button>
          <button
            className="bg-purple-100 text-purple-700 px-4 py-2 rounded-lg hover:bg-purple-200 flex items-center gap-2"
          >
            <Mail className="w-4 h-4" />
            Enviar por Email
          </button>
        </div>
      </div>
    </div>
  );
};

export default EmergencyReports;
