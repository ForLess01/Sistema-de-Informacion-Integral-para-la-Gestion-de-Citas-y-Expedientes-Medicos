import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { 
  Activity, Heart, Thermometer, Droplets, Clock,
  Bell, AlertTriangle, CheckCircle, Pill, FileText,
  User, Calendar, Monitor, Zap, RefreshCw,
  ChevronRight, Plus, Minus, Eye, Edit3,
  ClipboardList, Stethoscope, Shield, Users,
  TrendingUp, TrendingDown, Pause, Play,
  BarChart3, LineChart, ArrowUp, ArrowDown,
  CircleDot, Wifi, WifiOff, Settings,
  Volume2, VolumeX, Filter, Search
} from 'lucide-react';
import { format, subHours, isAfter, isBefore } from 'date-fns';
import { es } from 'date-fns/locale';
import dashboardService from '../../services/dashboardService';
import medicalRecordService from '../../services/medicalRecordService';

const PatientMonitoring = () => {
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [monitoringMode, setMonitoringMode] = useState('realtime'); // 'realtime', 'trends', 'alerts'
  const [timeRange, setTimeRange] = useState(24); // hours
  const [isMonitoringActive, setIsMonitoringActive] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCritical, setFilterCritical] = useState(false);
  const [chartType, setChartType] = useState('line');
  const audioRef = useRef(null);

  const queryClient = useQueryClient();

  // Obtener pacientes para monitoreo
  const { data: monitoringPatients, isLoading: loadingPatients } = useQuery({
    queryKey: ['monitoringPatients'],
    queryFn: dashboardService.getMonitoringPatients,
    refetchInterval: isMonitoringActive ? 5000 : false, // 5 segundos en tiempo real
  });

  // Obtener alertas críticas en tiempo real
  const { data: criticalAlerts, isLoading: loadingAlerts } = useQuery({
    queryKey: ['criticalAlerts'],
    queryFn: dashboardService.getCriticalAlerts,
    refetchInterval: isMonitoringActive ? 3000 : false, // 3 segundos para alertas
  });

  // Obtener historial de signos vitales
  const { data: vitalsHistory, isLoading: loadingHistory } = useQuery({
    queryKey: ['vitalsHistory', selectedPatient?.id, timeRange],
    queryFn: () => selectedPatient ? 
      dashboardService.getVitalsHistory(selectedPatient.id, timeRange) : null,
    enabled: !!selectedPatient,
    refetchInterval: isMonitoringActive ? 10000 : false,
  });

  // Mutation para reconocer alerta
  const acknowledgeAlert = useMutation({
    mutationFn: (alertId) => dashboardService.acknowledgeAlert(alertId),
    onSuccess: () => {
      queryClient.invalidateQueries(['criticalAlerts']);
    },
  });

  // Mutation para actualizar configuración de monitoreo
  const updateMonitoringConfig = useMutation({
    mutationFn: (config) => dashboardService.updatePatientMonitoringConfig(config),
    onSuccess: () => {
      queryClient.invalidateQueries(['monitoringPatients']);
    },
  });

  // Efecto para reproducir sonidos de alerta
  useEffect(() => {
    if (criticalAlerts && criticalAlerts.length > 0 && soundEnabled) {
      playAlertSound();
    }
  }, [criticalAlerts, soundEnabled]);

  const playAlertSound = () => {
    if (audioRef.current) {
      audioRef.current.play().catch(e => console.log('Audio play failed:', e));
    }
  };

  const modes = [
    { id: 'realtime', name: 'Tiempo Real', icon: CircleDot },
    { id: 'trends', name: 'Tendencias', icon: TrendingUp },
    { id: 'alerts', name: 'Alertas', icon: AlertTriangle },
    { id: 'history', name: 'Historial', icon: BarChart3 },
  ];

  const timeRanges = [
    { value: 1, label: '1 hora' },
    { value: 6, label: '6 horas' },
    { value: 12, label: '12 horas' },
    { value: 24, label: '24 horas' },
    { value: 48, label: '48 horas' },
    { value: 168, label: '7 días' },
  ];

  const getVitalStatus = (vital, value) => {
    const ranges = {
      heart_rate: { normal: [60, 100], warning: [50, 120], critical: [40, 140] },
      temperature: { normal: [36.1, 37.2], warning: [35.5, 38.0], critical: [35, 39] },
      blood_pressure_sys: { normal: [90, 140], warning: [80, 160], critical: [70, 180] },
      oxygen_saturation: { normal: [95, 100], warning: [90, 94], critical: [80, 89] }
    };

    const range = ranges[vital];
    if (!range || !value) return { status: 'unknown', color: 'text-gray-400', bg: 'bg-gray-500' };

    const numValue = parseFloat(value);
    
    if (numValue >= range.normal[0] && numValue <= range.normal[1]) {
      return { status: 'normal', color: 'text-green-400', bg: 'bg-green-500' };
    } else if (numValue >= range.warning[0] && numValue <= range.warning[1]) {
      return { status: 'warning', color: 'text-yellow-400', bg: 'bg-yellow-500' };
    } else if (numValue >= range.critical[0] && numValue <= range.critical[1]) {
      return { status: 'critical', color: 'text-red-400', bg: 'bg-red-500' };
    }
    
    return { status: 'critical', color: 'text-red-400', bg: 'bg-red-500' };
  };

  const getVitalTrend = (current, previous) => {
    if (!current || !previous) return null;
    const diff = current - previous;
    const threshold = 0.1; // 10% change threshold
    
    if (Math.abs(diff) < threshold) return 'stable';
    return diff > 0 ? 'up' : 'down';
  };

  const filteredPatients = monitoringPatients?.filter(patient => {
    const matchesSearch = patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         patient.room.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (filterCritical) {
      const hasCriticalVitals = ['heart_rate', 'temperature', 'blood_pressure_sys', 'oxygen_saturation']
        .some(vital => getVitalStatus(vital, patient[vital]).status === 'critical');
      return matchesSearch && hasCriticalVitals;
    }
    
    return matchesSearch;
  });

  const renderVitalCard = (vital, icon, label, value, unit = '') => {
    const vitalStatus = getVitalStatus(vital, value);
    const prevValue = vitalsHistory?.[vital]?.[vitalsHistory[vital].length - 2]?.value;
    const trend = getVitalTrend(value, prevValue);
    
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white/5 rounded-xl p-4 border border-white/10 relative overflow-hidden"
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center">
            {React.createElement(icon, { className: `h-5 w-5 mr-2 ${vitalStatus.color}` })}
            <span className="text-white font-medium">{label}</span>
          </div>
          <div className="flex items-center space-x-1">
            {trend === 'up' && <ArrowUp className="h-4 w-4 text-red-400" />}
            {trend === 'down' && <ArrowDown className="h-4 w-4 text-blue-400" />}
            {trend === 'stable' && <Minus className="h-4 w-4 text-green-400" />}
          </div>
        </div>
        
        <div className="flex items-end justify-between">
          <span className={`text-3xl font-bold ${vitalStatus.color}`}>
            {value || '--'}{unit}
          </span>
          <div className={`w-3 h-3 rounded-full ${vitalStatus.bg} animate-pulse`}></div>
        </div>
        
        <div className="h-2 bg-white/10 rounded-full overflow-hidden mt-3">
          <div 
            className={`h-full ${vitalStatus.bg} transition-all duration-1000`}
            style={{ 
              width: vital === 'oxygen_saturation' ? `${value || 0}%` :
                     vital === 'heart_rate' ? `${Math.min((value || 0) / 120 * 100, 100)}%` :
                     vital === 'temperature' ? `${Math.min(((value || 36) - 35) / 5 * 100, 100)}%` :
                     '50%'
            }}
          />
        </div>
        
        {vitalStatus.status === 'critical' && (
          <div className="absolute top-2 right-2">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-ping"></div>
          </div>
        )}
      </motion.div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-indigo-800 to-purple-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8 space-y-4 lg:space-y-0"
        >
          <div>
            <h1 className="text-3xl font-bold text-white mb-2 flex items-center">
              <Monitor className="h-8 w-8 mr-3 text-blue-400" />
              Monitoreo de Pacientes
            </h1>
            <p className="text-blue-200">
              {format(new Date(), "EEEE, d 'de' MMMM 'de' yyyy - HH:mm", { locale: es })}
            </p>
          </div>
          
          <div className="flex items-center space-x-3 flex-wrap">
            <div className="flex items-center space-x-2 bg-white/10 rounded-xl px-3 py-2">
              <Search className="h-4 w-4 text-white" />
              <input
                type="text"
                placeholder="Buscar paciente..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-transparent text-white placeholder-blue-300 border-none outline-none w-32"
              />
            </div>
            
            <button
              onClick={() => setFilterCritical(!filterCritical)}
              className={`flex items-center px-3 py-2 rounded-xl border transition-colors ${
                filterCritical 
                  ? 'bg-red-500/20 border-red-500/30 text-red-300' 
                  : 'bg-white/10 border-white/20 text-white'
              }`}
            >
              <Filter className="h-4 w-4 mr-1" />
              Críticos
            </button>
            
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className={`p-2 rounded-xl border transition-colors ${
                soundEnabled 
                  ? 'bg-green-500/20 border-green-500/30 text-green-300' 
                  : 'bg-white/10 border-white/20 text-white'
              }`}
            >
              {soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
            </button>
            
            <button
              onClick={() => setIsMonitoringActive(!isMonitoringActive)}
              className={`flex items-center px-4 py-2 rounded-xl border transition-colors ${
                isMonitoringActive 
                  ? 'bg-green-500/20 border-green-500/30 text-green-300' 
                  : 'bg-red-500/20 border-red-500/30 text-red-300'
              }`}
            >
              {isMonitoringActive ? <Pause className="h-4 w-4 mr-2" /> : <Play className="h-4 w-4 mr-2" />}
              {isMonitoringActive ? 'Pausar' : 'Reanudar'}
            </button>
            
            <div className="flex items-center px-3 py-2 bg-white/10 rounded-xl">
              <div className="flex items-center mr-2">
                {isMonitoringActive ? (
                  <Wifi className="h-4 w-4 text-green-400" />
                ) : (
                  <WifiOff className="h-4 w-4 text-red-400" />
                )}
              </div>
              <span className="text-white text-sm">
                {isMonitoringActive ? 'En línea' : 'Desconectado'}
              </span>
            </div>
          </div>
        </motion.div>

        {/* Mode Selection */}
        <div className="flex space-x-1 mb-6 bg-white/5 p-1 rounded-xl">
          {modes.map((mode) => (
            <button
              key={mode.id}
              onClick={() => setMonitoringMode(mode.id)}
              className={`flex-1 flex items-center justify-center px-4 py-3 rounded-lg font-medium transition-colors ${
                monitoringMode === mode.id
                  ? 'bg-blue-500 text-white'
                  : 'text-blue-200 hover:text-white hover:bg-white/5'
              }`}
            >
              <mode.icon className="h-4 w-4 mr-2" />
              {mode.name}
            </button>
          ))}
        </div>

        {/* Critical Alerts Banner */}
        {criticalAlerts && criticalAlerts.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 backdrop-blur-lg bg-red-500/20 rounded-2xl p-4 border border-red-500/30"
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold text-red-300 flex items-center">
                <AlertTriangle className="h-5 w-5 mr-2 animate-pulse" />
                Alertas Críticas ({criticalAlerts.length})
              </h3>
              <button
                onClick={() => setSoundEnabled(!soundEnabled)}
                className="p-2 rounded-lg bg-red-500/20 hover:bg-red-500/30 transition-colors"
              >
                {soundEnabled ? <Volume2 className="h-4 w-4 text-red-300" /> : <VolumeX className="h-4 w-4 text-red-300" />}
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {criticalAlerts.slice(0, 6).map((alert) => (
                <div
                  key={alert.id}
                  className="bg-red-500/10 rounded-xl p-3 border border-red-500/20 flex items-center justify-between"
                >
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                    <div>
                      <h4 className="text-white font-medium text-sm">{alert.patient_name}</h4>
                      <p className="text-red-200 text-xs">{alert.message}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => acknowledgeAlert.mutate(alert.id)}
                    className="px-2 py-1 bg-red-500 hover:bg-red-600 text-white rounded text-xs transition-colors"
                  >
                    OK
                  </button>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Patient List */}
          <div className="lg:col-span-1">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="backdrop-blur-lg bg-white/10 rounded-2xl p-6 border border-white/20 h-fit"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-white flex items-center">
                  <Users className="h-5 w-5 mr-2 text-blue-400" />
                  Pacientes ({filteredPatients?.length || 0})
                </h2>
              </div>

              <div className="space-y-3 max-h-[600px] overflow-y-auto">
                {loadingPatients ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                  </div>
                ) : filteredPatients?.length === 0 ? (
                  <p className="text-blue-200 text-center py-8">No hay pacientes para monitorear</p>
                ) : (
                  filteredPatients?.map((patient) => {
                    const criticalCount = ['heart_rate', 'temperature', 'blood_pressure_sys', 'oxygen_saturation']
                      .filter(vital => getVitalStatus(vital, patient[vital]).status === 'critical').length;
                    
                    return (
                      <motion.div
                        key={patient.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        onClick={() => setSelectedPatient(patient)}
                        className={`p-4 rounded-xl border cursor-pointer transition-all duration-200 ${
                          selectedPatient?.id === patient.id
                            ? 'bg-blue-500/20 border-blue-500/50'
                            : 'bg-white/5 border-white/10 hover:bg-white/10'
                        } ${criticalCount > 0 ? 'ring-2 ring-red-500/30' : ''}`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-3">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold relative ${
                              criticalCount > 0 ? 'bg-gradient-to-r from-red-500 to-red-600' : 'bg-gradient-to-r from-blue-500 to-indigo-600'
                            }`}>
                              {patient.name.charAt(0)}
                              {criticalCount > 0 && (
                                <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-ping"></div>
                              )}
                            </div>
                            <div>
                              <h4 className="text-white font-medium">{patient.name}</h4>
                              <p className="text-blue-300 text-sm">Hab: {patient.room}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            {criticalCount > 0 && (
                              <span className="inline-flex items-center px-2 py-1 rounded bg-red-500 text-white text-xs animate-pulse">
                                {criticalCount} crítico{criticalCount > 1 ? 's' : ''}
                              </span>
                            )}
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          {[
                            { vital: 'heart_rate', icon: Heart, value: patient.heart_rate, unit: ' bpm', color: 'text-red-400' },
                            { vital: 'temperature', icon: Thermometer, value: patient.temperature, unit: '°C', color: 'text-orange-400' },
                            { vital: 'blood_pressure_sys', icon: Activity, value: `${patient.bp_systolic || '--'}/${patient.bp_diastolic || '--'}`, unit: '', color: 'text-blue-400' },
                            { vital: 'oxygen_saturation', icon: Droplets, value: patient.oxygen_saturation, unit: '%', color: 'text-cyan-400' }
                          ].map(({ vital, icon, value, unit, color }) => {
                            const status = getVitalStatus(vital, typeof value === 'string' && value.includes('/') ? patient.bp_systolic : value);
                            return (
                              <div key={vital} className="flex items-center">
                                {React.createElement(icon, { className: `h-3 w-3 mr-1 ${color}` })}
                                <span className={status.color}>
                                  {value || '--'}{unit}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </motion.div>
                    );
                  })
                )}
              </div>
            </motion.div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {selectedPatient ? (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="backdrop-blur-lg bg-white/10 rounded-2xl p-6 border border-white/20"
              >
                {/* Patient Header */}
                <div className="flex items-center justify-between mb-6 p-4 bg-white/5 rounded-xl border border-white/10">
                  <div className="flex items-center space-x-4">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-xl">
                      {selectedPatient.name.charAt(0)}
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-white">{selectedPatient.name}</h3>
                      <div className="flex items-center space-x-4 text-sm text-blue-200">
                        <span>Habitación: {selectedPatient.room}</span>
                        <span>Edad: {selectedPatient.age} años</span>
                        <span>DNI: {selectedPatient.dni}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-blue-300 text-sm">Última actualización</p>
                    <p className="text-white font-medium">
                      {format(new Date(), 'HH:mm:ss')}
                    </p>
                  </div>
                </div>

                {/* Content based on mode */}
                {monitoringMode === 'realtime' && (
                  <div className="space-y-6">
                    <h4 className="text-lg font-semibold text-white mb-4">Signos Vitales en Tiempo Real</h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {renderVitalCard('heart_rate', Heart, 'Frecuencia Cardíaca', selectedPatient.heart_rate, ' bpm')}
                      {renderVitalCard('temperature', Thermometer, 'Temperatura', selectedPatient.temperature, '°C')}
                      {renderVitalCard('blood_pressure_sys', Activity, 'Presión Arterial', `${selectedPatient.bp_systolic || '--'}/${selectedPatient.bp_diastolic || '--'}`)}
                      {renderVitalCard('oxygen_saturation', Droplets, 'Saturación O₂', selectedPatient.oxygen_saturation, '%')}
                    </div>
                    
                    <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                      <h5 className="text-white font-medium mb-3">Estado General del Paciente</h5>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-green-400">Estable</div>
                          <div className="text-blue-200">Estado</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-blue-400">{selectedPatient.alerts_count || 0}</div>
                          <div className="text-blue-200">Alertas</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-purple-400">{selectedPatient.medications_pending || 0}</div>
                          <div className="text-blue-200">Medicamentos</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-yellow-400">{selectedPatient.tasks_pending || 0}</div>
                          <div className="text-blue-200">Tareas</div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {monitoringMode === 'trends' && (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <h4 className="text-lg font-semibold text-white">Tendencias de Signos Vitales</h4>
                      <select
                        value={timeRange}
                        onChange={(e) => setTimeRange(parseInt(e.target.value))}
                        className="bg-white/10 text-white border border-white/20 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        {timeRanges.map(range => (
                          <option key={range.value} value={range.value} className="bg-gray-800">
                            {range.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    <div className="bg-white/5 rounded-xl p-4 border border-white/10 h-64">
                      <div className="flex items-center justify-center h-full text-blue-200">
                        <LineChart className="h-8 w-8 mr-2" />
                        Gráfico de tendencias - Integración pendiente
                      </div>
                    </div>
                  </div>
                )}

                {monitoringMode === 'alerts' && (
                  <div className="space-y-6">
                    <h4 className="text-lg font-semibold text-white">Historial de Alertas</h4>
                    
                    <div className="space-y-3">
                      {criticalAlerts?.filter(alert => alert.patient_id === selectedPatient.id).map((alert) => (
                        <div key={alert.id} className="bg-red-500/10 rounded-xl p-4 border border-red-500/20">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <AlertTriangle className="h-5 w-5 text-red-400" />
                              <div>
                                <h5 className="text-white font-medium">{alert.type}</h5>
                                <p className="text-red-200 text-sm">{alert.message}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <span className="px-2 py-1 bg-red-500 text-white text-xs rounded">
                                {alert.priority?.toUpperCase()}
                              </span>
                              <p className="text-red-300 text-xs mt-1">
                                {format(new Date(alert.timestamp), 'HH:mm:ss')}
                              </p>
                            </div>
                          </div>
                        </div>
                      )) || (
                        <p className="text-blue-200 text-center py-8">No hay alertas para este paciente</p>
                      )}
                    </div>
                  </div>
                )}

                {monitoringMode === 'history' && (
                  <div className="space-y-6">
                    <h4 className="text-lg font-semibold text-white">Historial Detallado</h4>
                    
                    <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b border-white/10">
                              <th className="text-left text-blue-200 p-2">Hora</th>
                              <th className="text-left text-blue-200 p-2">FC</th>
                              <th className="text-left text-blue-200 p-2">Temp</th>
                              <th className="text-left text-blue-200 p-2">PA</th>
                              <th className="text-left text-blue-200 p-2">SpO₂</th>
                              <th className="text-left text-blue-200 p-2">Estado</th>
                            </tr>
                          </thead>
                          <tbody>
                            {Array.from({ length: 10 }, (_, i) => (
                              <tr key={i} className="border-b border-white/5">
                                <td className="text-white p-2">{format(subHours(new Date(), i), 'HH:mm')}</td>
                                <td className="text-white p-2">{(Math.random() * 40 + 60).toFixed(0)}</td>
                                <td className="text-white p-2">{(Math.random() * 2 + 36).toFixed(1)}°C</td>
                                <td className="text-white p-2">{(Math.random() * 40 + 100).toFixed(0)}/{(Math.random() * 20 + 70).toFixed(0)}</td>
                                <td className="text-white p-2">{(Math.random() * 10 + 90).toFixed(0)}%</td>
                                <td className="p-2">
                                  <span className="px-2 py-1 bg-green-500/20 text-green-300 rounded text-xs">
                                    Normal
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="backdrop-blur-lg bg-white/10 rounded-2xl p-12 border border-white/20 text-center"
              >
                <Monitor className="h-16 w-16 text-blue-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">
                  Selecciona un Paciente para Monitorear
                </h3>
                <p className="text-blue-200">
                  Selecciona un paciente de la lista para ver su monitoreo detallado en tiempo real
                </p>
              </motion.div>
            )}
          </div>
        </div>

        {/* Audio element for alerts */}
        <audio ref={audioRef} preload="auto">
          <source src="/sounds/alert.mp3" type="audio/mpeg" />
          <source src="/sounds/alert.ogg" type="audio/ogg" />
        </audio>
      </div>
    </div>
  );
};

export default PatientMonitoring;
