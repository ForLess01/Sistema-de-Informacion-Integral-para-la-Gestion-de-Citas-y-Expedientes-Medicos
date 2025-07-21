import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  Calendar,
  Users,
  FileText,
  Download,
  RefreshCw,
  Filter,
  Search,
  Activity,
  Heart,
  UserCheck,
  AlertCircle,
  TrendingUp,
  BarChart3,
  Eye,
  Plus,
  Clock,
  MapPin,
  Phone,
  User,
  Calendar as CalendarIcon
} from 'lucide-react';
import { format, startOfMonth, endOfMonth, startOfYear, endOfYear, subDays, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { patientService } from '../../services/patientService';

const PatientReports = () => {
  // Estados para filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('month'); // month, year, custom
  const [customDateFrom, setCustomDateFrom] = useState('');
  const [customDateTo, setCustomDateTo] = useState('');
  const [ageGroup, setAgeGroup] = useState('all');
  const [gender, setGender] = useState('all');
  const [riskLevel, setRiskLevel] = useState('all');
  const [hasActiveConditions, setHasActiveConditions] = useState('all');

  // Estados para exportación y visualización
  const [isExporting, setIsExporting] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  // Obtener datos de pacientes
  const { data: patientsData, isLoading, isError, refetch } = useQuery(
    ['patientReports', searchTerm, dateFilter, customDateFrom, customDateTo, ageGroup, gender, riskLevel, hasActiveConditions],
    async () => {
      try {
        // Construir filtros para la API
        const filters = {
          search: searchTerm,
          age_group: ageGroup !== 'all' ? ageGroup : undefined,
          gender: gender !== 'all' ? gender : undefined,
          risk_level: riskLevel !== 'all' ? riskLevel : undefined,
          has_active_conditions: hasActiveConditions !== 'all' ? hasActiveConditions : undefined,
          page: 1,
          limit: 1000 // Para reportes, queremos todos los datos
        };

        // Manejar filtros de fecha
        if (dateFilter === 'custom' && customDateFrom && customDateTo) {
          filters.date_from = customDateFrom;
          filters.date_to = customDateTo;
        }

        const result = await patientService.getPatients(searchTerm, 1, 1000);
        
        // Simular datos adicionales para el reporte mientras no esté en la API
        const enhancedResults = result.results?.map(patient => ({
          ...patient,
          age: patient.age || Math.floor(Math.random() * 80) + 10,
          gender: patient.gender || (Math.random() > 0.5 ? 'M' : 'F'),
          last_visit: patient.last_visit || format(subDays(new Date(), Math.floor(Math.random() * 365)), 'yyyy-MM-dd'),
          active_conditions: patient.active_conditions || Math.floor(Math.random() * 3),
          risk_level: patient.risk_level || ['low', 'medium', 'high'][Math.floor(Math.random() * 3)],
          total_visits: patient.total_visits || Math.floor(Math.random() * 20) + 1,
          city: patient.city || 'Puno'
        })) || [];

        return {
          ...result,
          results: enhancedResults
        };
      } catch (error) {
        console.error('Error fetching patient reports:', error);
        // Datos mock para desarrollo
        return {
          results: [
            {
              id: 1,
              first_name: 'María',
              last_name: 'González',
              dni: '12345678',
              age: 35,
              gender: 'F',
              phone: '987654321',
              last_visit: '2024-01-15',
              active_conditions: 1,
              risk_level: 'low',
              total_visits: 8,
              city: 'Puno'
            },
            {
              id: 2,
              first_name: 'Carlos',
              last_name: 'Ruiz',
              dni: '87654321',
              age: 42,
              gender: 'M',
              phone: '123456789',
              last_visit: '2024-01-10',
              active_conditions: 2,
              risk_level: 'medium',
              total_visits: 15,
              city: 'Juliaca'
            },
            {
              id: 3,
              first_name: 'Ana',
              last_name: 'Torres',
              dni: '11223344',
              age: 28,
              gender: 'F',
              phone: '555666777',
              last_visit: '2024-01-20',
              active_conditions: 0,
              risk_level: 'low',
              total_visits: 5,
              city: 'Puno'
            }
          ],
          total: 3
        };
      }
    }
  );

  // Calcular estadísticas
  const statistics = useMemo(() => {
    if (!patientsData?.results) return null;

    const patients = patientsData.results;
    const totalPatients = patients.length;
    
    const averageAge = totalPatients > 0 
      ? (patients.reduce((sum, p) => sum + (p.age || 0), 0) / totalPatients).toFixed(1)
      : 0;

    const genderDistribution = patients.reduce((acc, p) => {
      acc[p.gender === 'F' ? 'female' : 'male']++;
      return acc;
    }, { male: 0, female: 0 });

    const riskDistribution = patients.reduce((acc, p) => {
      acc[p.risk_level]++;
      return acc;
    }, { low: 0, medium: 0, high: 0 });

    const patientsWithConditions = patients.filter(p => p.active_conditions > 0).length;
    const recentVisits = patients.filter(p => {
      if (!p.last_visit) return false;
      const visitDate = new Date(p.last_visit);
      const thirtyDaysAgo = subDays(new Date(), 30);
      return visitDate >= thirtyDaysAgo;
    }).length;

    return {
      totalPatients,
      averageAge,
      genderDistribution,
      riskDistribution,
      patientsWithConditions,
      recentVisits
    };
  }, [patientsData]);

  // Función para exportar datos
  const handleExport = async (format) => {
    setIsExporting(true);
    try {
      // Simular exportación - en la implementación real, esto iría al backend
      const data = patientsData?.results || [];
      
      if (format === 'csv') {
        const csvHeaders = 'DNI,Nombre,Apellido,Edad,Género,Teléfono,Última Visita,Condiciones Activas,Nivel de Riesgo,Total Visitas\n';
        const csvContent = data.map(p => 
          `${p.dni},"${p.first_name}","${p.last_name}",${p.age},${p.gender === 'F' ? 'Femenino' : 'Masculino'},"${p.phone}","${p.last_visit}",${p.active_conditions},"${p.risk_level}",${p.total_visits}`
        ).join('\n');
        
        const blob = new Blob([csvHeaders + csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `reporte_pacientes_${format(new Date(), 'yyyy-MM-dd')}.csv`;
        a.click();
      } else if (format === 'pdf') {
        // En la implementación real, esto generaría un PDF
        alert('Funcionalidad de exportación PDF será implementada próximamente');
      }
    } catch (error) {
      console.error('Error exporting data:', error);
      alert('Error al exportar los datos');
    } finally {
      setIsExporting(false);
    }
  };

  // Función para limpiar filtros
  const clearFilters = () => {
    setSearchTerm('');
    setDateFilter('month');
    setCustomDateFrom('');
    setCustomDateTo('');
    setAgeGroup('all');
    setGender('all');
    setRiskLevel('all');
    setHasActiveConditions('all');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="animate-spin h-8 w-8 text-blue-500" />
        <span className="ml-2 text-gray-600">Cargando reportes de pacientes...</span>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="flex items-center">
          <AlertCircle className="h-5 w-5 text-red-400" />
          <h3 className="ml-2 text-sm font-medium text-red-800">Error al cargar los datos</h3>
        </div>
        <div className="mt-2">
          <p className="text-sm text-red-700">
            No se pudieron cargar los reportes de pacientes. Por favor, intente nuevamente.
          </p>
          <button
            onClick={() => refetch()}
            className="mt-2 bg-red-600 text-white px-4 py-2 rounded-md text-sm hover:bg-red-700"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reportes de Pacientes</h1>
          <p className="text-gray-600 mt-1">Análisis detallado de la población de pacientes</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center px-4 py-2 rounded-lg border transition-colors ${
              showFilters ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            <Filter className="h-4 w-4 mr-2" />
            Filtros
          </button>
          <button
            onClick={() => refetch()}
            disabled={isLoading}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Actualizar
          </button>
        </div>
      </div>

      {/* Panel de filtros */}
      {showFilters && (
        <div className="bg-white p-6 rounded-lg border border-gray-200 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900">Filtros de Búsqueda</h3>
            <button
              onClick={clearFilters}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Limpiar filtros
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Búsqueda por texto */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Buscar paciente
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="DNI, nombre o apellido..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            {/* Filtro por grupo etario */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Grupo de edad
              </label>
              <select
                value={ageGroup}
                onChange={(e) => setAgeGroup(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">Todas las edades</option>
                <option value="0-17">0-17 años</option>
                <option value="18-35">18-35 años</option>
                <option value="36-55">36-55 años</option>
                <option value="56+">56+ años</option>
              </select>
            </div>

            {/* Filtro por género */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Género
              </label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">Todos</option>
                <option value="M">Masculino</option>
                <option value="F">Femenino</option>
              </select>
            </div>

            {/* Filtro por nivel de riesgo */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nivel de riesgo
              </label>
              <select
                value={riskLevel}
                onChange={(e) => setRiskLevel(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">Todos los niveles</option>
                <option value="low">Bajo</option>
                <option value="medium">Medio</option>
                <option value="high">Alto</option>
              </select>
            </div>
          </div>

          {/* Filtros de fecha personalizados */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-gray-200">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Período
              </label>
              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="month">Este mes</option>
                <option value="year">Este año</option>
                <option value="custom">Personalizado</option>
              </select>
            </div>
            
            {dateFilter === 'custom' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Fecha desde
                  </label>
                  <input
                    type="date"
                    value={customDateFrom}
                    onChange={(e) => setCustomDateFrom(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Fecha hasta
                  </label>
                  <input
                    type="date"
                    value={customDateTo}
                    onChange={(e) => setCustomDateTo(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Tarjetas de estadísticas */}
      {statistics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-6 rounded-lg text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100">Total de Pacientes</p>
                <p className="text-3xl font-bold">{statistics.totalPatients}</p>
              </div>
              <Users className="h-8 w-8 text-blue-200" />
            </div>
          </div>

          <div className="bg-gradient-to-r from-green-500 to-green-600 p-6 rounded-lg text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100">Edad Promedio</p>
                <p className="text-3xl font-bold">{statistics.averageAge}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-200" />
            </div>
          </div>

          <div className="bg-gradient-to-r from-purple-500 to-purple-600 p-6 rounded-lg text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100">Con Condiciones Activas</p>
                <p className="text-3xl font-bold">{statistics.patientsWithConditions}</p>
              </div>
              <Heart className="h-8 w-8 text-purple-200" />
            </div>
          </div>

          <div className="bg-gradient-to-r from-orange-500 to-orange-600 p-6 rounded-lg text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-100">Visitas Recientes (30d)</p>
                <p className="text-3xl font-bold">{statistics.recentVisits}</p>
              </div>
              <Activity className="h-8 w-8 text-orange-200" />
            </div>
          </div>
        </div>
      )}

      {/* Panel de acciones rápidas */}
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Acciones Rápidas</h3>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => handleExport('csv')}
            disabled={isExporting}
            className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
          >
            <Download className="h-4 w-4 mr-2" />
            Exportar CSV
          </button>
          <button
            onClick={() => handleExport('pdf')}
            disabled={isExporting}
            className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
          >
            <FileText className="h-4 w-4 mr-2" />
            Generar PDF
          </button>
          <button className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            <BarChart3 className="h-4 w-4 mr-2" />
            Gráficos Avanzados
          </button>
          <button className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700">
            <Plus className="h-4 w-4 mr-2" />
            Análisis Personalizado
          </button>
        </div>
      </div>

      {/* Tabla de pacientes */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Lista de Pacientes</h3>
          <p className="text-sm text-gray-500 mt-1">
            {patientsData?.total || 0} pacientes encontrados
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Paciente
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Información Personal
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Historial Médico
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {patientsData?.results?.map((patient) => (
                <tr key={patient.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                        <User className="h-5 w-5 text-blue-600" />
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {patient.first_name} {patient.last_name}
                        </div>
                        <div className="text-sm text-gray-500">DNI: {patient.dni}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      <div className="flex items-center">
                        <CalendarIcon className="h-4 w-4 text-gray-400 mr-1" />
                        {patient.age} años
                      </div>
                      <div className="flex items-center mt-1">
                        <Phone className="h-4 w-4 text-gray-400 mr-1" />
                        {patient.phone}
                      </div>
                      <div className="flex items-center mt-1">
                        <MapPin className="h-4 w-4 text-gray-400 mr-1" />
                        {patient.city}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      <div>Condiciones: {patient.active_conditions}</div>
                      <div className="flex items-center mt-1">
                        <Clock className="h-4 w-4 text-gray-400 mr-1" />
                        Última visita: {patient.last_visit ? format(parseISO(patient.last_visit), 'dd/MM/yyyy', { locale: es }) : 'N/A'}
                      </div>
                      <div>Total visitas: {patient.total_visits}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      patient.risk_level === 'low' 
                        ? 'bg-green-100 text-green-800'
                        : patient.risk_level === 'medium'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      Riesgo {patient.risk_level === 'low' ? 'Bajo' : patient.risk_level === 'medium' ? 'Medio' : 'Alto'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button className="text-blue-600 hover:text-blue-900 mr-3">
                      <Eye className="h-4 w-4" />
                    </button>
                    <button className="text-green-600 hover:text-green-900">
                      <FileText className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mensaje cuando no hay datos */}
        {(!patientsData?.results || patientsData.results.length === 0) && (
          <div className="text-center py-12">
            <Users className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No se encontraron pacientes</h3>
            <p className="mt-1 text-sm text-gray-500">
              Ajusta los filtros de búsqueda para encontrar pacientes.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PatientReports;

