import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Settings,
  Save,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  XCircle,
  Server,
  Shield,
  Bell,
  Users,
  Calendar,
  Database,
  Download,
  Upload,
  RotateCcw,
  Monitor,
  Clock,
  Globe,
  Mail,
  Phone,
  Key,
  Lock,
  HardDrive,
  Activity,
  FileText,
  Trash2,
  Play,
  Pause,
  AlertTriangle,
  Info,
  Plus,
  Minus,
  Eye,
  EyeOff,
  Zap,
  Wifi,
  Volume2
} from 'lucide-react';
import * as settingsService from '../../services/settingsService';

const SystemSettings = () => {
  const queryClient = useQueryClient();
  
  // Estados locales
  const [activeTab, setActiveTab] = useState('general');
  const [isLoading, setIsLoading] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  const [showPasswords, setShowPasswords] = useState({});
  
  // Estados para formularios
  const [generalSettings, setGeneralSettings] = useState({});
  const [appointmentSettings, setAppointmentSettings] = useState({});
  const [userSettings, setUserSettings] = useState({});
  const [notificationSettings, setNotificationSettings] = useState({});
  const [securitySettings, setSecuritySettings] = useState({});
  const [pharmacySettings, setPharmacySettings] = useState({});

  // Queries para obtener datos
  const { data: systemData, isLoading: systemLoading, error, refetch } = useQuery(
    'systemSettings',
    settingsService.getSystemSettings,
    {
      onSuccess: (data) => {
        setGeneralSettings(data.general || {});
        setAppointmentSettings(data.appointments || {});
        setUserSettings(data.users || {});
        setNotificationSettings(data.notifications || {});
        setSecuritySettings(data.security || {});
        setPharmacySettings(data.pharmacy || {});
      }
    }
  );

  const { data: systemStats } = useQuery('systemStats', settingsService.getSystemStats);
  const { data: servicesStatus } = useQuery('servicesStatus', settingsService.getServicesStatus);

  // Mutaciones
  const updateGeneralMutation = useMutation(settingsService.updateGeneralSettings, {
    onSuccess: () => {
      queryClient.invalidateQueries('systemSettings');
      setSaveMessage('Configuración general guardada exitosamente');
      setTimeout(() => setSaveMessage(''), 3000);
    }
  });

  const updateAppointmentMutation = useMutation(settingsService.updateAppointmentSettings, {
    onSuccess: () => {
      queryClient.invalidateQueries('systemSettings');
      setSaveMessage('Configuración de citas guardada exitosamente');
      setTimeout(() => setSaveMessage(''), 3000);
    }
  });

  const updateUserMutation = useMutation(settingsService.updateUserSettings, {
    onSuccess: () => {
      queryClient.invalidateQueries('systemSettings');
      setSaveMessage('Configuración de usuarios guardada exitosamente');
      setTimeout(() => setSaveMessage(''), 3000);
    }
  });

  const updateNotificationMutation = useMutation(settingsService.updateNotificationSettings, {
    onSuccess: () => {
      queryClient.invalidateQueries('systemSettings');
      setSaveMessage('Configuración de notificaciones guardada exitosamente');
      setTimeout(() => setSaveMessage(''), 3000);
    }
  });

  const updateSecurityMutation = useMutation(settingsService.updateSecuritySettings, {
    onSuccess: () => {
      queryClient.invalidateQueries('systemSettings');
      setSaveMessage('Configuración de seguridad guardada exitosamente');
      setTimeout(() => setSaveMessage(''), 3000);
    }
  });

  const updatePharmacyMutation = useMutation(settingsService.updatePharmacySettings, {
    onSuccess: () => {
      queryClient.invalidateQueries('systemSettings');
      setSaveMessage('Configuración de farmacia guardada exitosamente');
      setTimeout(() => setSaveMessage(''), 3000);
    }
  });

  const createBackupMutation = useMutation(settingsService.createManualBackup, {
    onSuccess: () => {
      setSaveMessage('Backup creado exitosamente');
      setTimeout(() => setSaveMessage(''), 3000);
    }
  });

  // Definición de tabs
  const tabs = [
    {
      id: 'general',
      label: 'General',
      icon: <Settings className="w-5 h-5" />,
      color: 'blue'
    },
    {
      id: 'appointments',
      label: 'Citas',
      icon: <Calendar className="w-5 h-5" />,
      color: 'green'
    },
    {
      id: 'users',
      label: 'Usuarios',
      icon: <Users className="w-5 h-5" />,
      color: 'purple'
    },
    {
      id: 'notifications',
      label: 'Notificaciones',
      icon: <Bell className="w-5 h-5" />,
      color: 'yellow'
    },
    {
      id: 'security',
      label: 'Seguridad',
      icon: <Shield className="w-5 h-5" />,
      color: 'red'
    },
    {
      id: 'pharmacy',
      label: 'Farmacia',
      icon: <Database className="w-5 h-5" />,
      color: 'indigo'
    },
    {
      id: 'system',
      label: 'Sistema',
      icon: <Monitor className="w-5 h-5" />,
      color: 'gray'
    }
  ];

  // Handlers
  const handleSaveSettings = async (category) => {
    setIsLoading(true);
    try {
      switch (category) {
        case 'general':
          await updateGeneralMutation.mutateAsync(generalSettings);
          break;
        case 'appointments':
          await updateAppointmentMutation.mutateAsync(appointmentSettings);
          break;
        case 'users':
          await updateUserMutation.mutateAsync(userSettings);
          break;
        case 'notifications':
          await updateNotificationMutation.mutateAsync(notificationSettings);
          break;
        case 'security':
          await updateSecurityMutation.mutateAsync(securitySettings);
          break;
        case 'pharmacy':
          await updatePharmacyMutation.mutateAsync(pharmacySettings);
          break;
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      setSaveMessage('Error al guardar configuración');
      setTimeout(() => setSaveMessage(''), 3000);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateBackup = async () => {
    try {
      await createBackupMutation.mutateAsync();
    } catch (error) {
      console.error('Error creating backup:', error);
    }
  };

  const togglePasswordVisibility = (field) => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  if (systemLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
        <div className="flex items-center justify-center h-64">
          <div className="flex items-center space-x-2">
            <RefreshCw className="w-6 h-6 animate-spin text-blue-600" />
            <span className="text-lg text-gray-600">Cargando configuración...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-800 mb-2">Error al cargar</h3>
            <p className="text-gray-600 mb-4">No se pudieron cargar las configuraciones</p>
            <button 
              onClick={() => refetch()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Reintentar
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-7xl mx-auto"
      >
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 mb-2 flex items-center">
                <Settings className="w-8 h-8 mr-3 text-blue-600" />
                Configuración del Sistema
              </h1>
              <p className="text-gray-600">Gestiona las configuraciones generales del sistema</p>
            </div>
            <div className="flex space-x-4">
              <button
                onClick={() => refetch()}
                className="flex items-center space-x-2 px-4 py-2 bg-white text-gray-700 rounded-lg hover:bg-gray-50 border transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Actualizar</span>
              </button>
            </div>
          </div>

          {/* Sistema Stats */}
          {systemStats && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white rounded-xl p-6 shadow-lg border border-gray-100"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Tiempo Activo</p>
                    <p className="text-2xl font-bold text-green-600">{systemStats.uptime}</p>
                  </div>
                  <div className="p-3 bg-green-100 rounded-full">
                    <Activity className="w-6 h-6 text-green-600" />
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 }}
                className="bg-white rounded-xl p-6 shadow-lg border border-gray-100"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Uso de CPU</p>
                    <p className="text-2xl font-bold text-blue-600">{systemStats.cpuUsage}%</p>
                  </div>
                  <div className="p-3 bg-blue-100 rounded-full">
                    <Zap className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 }}
                className="bg-white rounded-xl p-6 shadow-lg border border-gray-100"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Uso de Memoria</p>
                    <p className="text-2xl font-bold text-purple-600">{systemStats.memoryUsage}%</p>
                  </div>
                  <div className="p-3 bg-purple-100 rounded-full">
                    <HardDrive className="w-6 h-6 text-purple-600" />
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 }}
                className="bg-white rounded-xl p-6 shadow-lg border border-gray-100"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Conexiones</p>
                    <p className="text-2xl font-bold text-orange-600">{systemStats.activeConnections}</p>
                  </div>
                  <div className="p-3 bg-orange-100 rounded-full">
                    <Wifi className="w-6 h-6 text-orange-600" />
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </div>

        {/* Mensaje de Guardado */}
        <AnimatePresence>
          {saveMessage && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className={`mb-6 p-4 rounded-lg flex items-center ${
                saveMessage.includes('Error') 
                  ? 'bg-red-50 text-red-800' 
                  : 'bg-green-50 text-green-800'
              }`}
            >
              {saveMessage.includes('Error') 
                ? <XCircle className="w-5 h-5 mr-2" />
                : <CheckCircle className="w-5 h-5 mr-2" />
              }
              {saveMessage}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Tabs Navigation */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6" aria-label="Tabs">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 transition-colors ${
                    activeTab === tab.id
                      ? `border-${tab.color}-500 text-${tab.color}-600`
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tab.icon}
                  <span>{tab.label}</span>
                </button>
              ))}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            <AnimatePresence mode="wait">
              {activeTab === 'general' && (
                <motion.div
                  key="general"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Configuración General</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Nombre del Hospital
                      </label>
                      <input
                        type="text"
                        value={generalSettings.hospital_name || ''}
                        onChange={(e) => setGeneralSettings({
                          ...generalSettings,
                          hospital_name: e.target.value
                        })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Timezone
                      </label>
                      <select
                        value={generalSettings.timezone || ''}
                        onChange={(e) => setGeneralSettings({
                          ...generalSettings,
                          timezone: e.target.value
                        })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="">Seleccionar Timezone</option>
                        <option value="America/Lima">Lima (GMT-5)</option>
                        <option value="America/Bogota">Bogotá (GMT-5)</option>
                        <option value="America/Mexico_City">Ciudad de México (GMT-6)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Idioma del Sistema
                      </label>
                      <select
                        value={generalSettings.language || ''}
                        onChange={(e) => setGeneralSettings({
                          ...generalSettings,
                          language: e.target.value
                        })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="">Seleccionar Idioma</option>
                        <option value="es">Español</option>
                        <option value="en">English</option>
                        <option value="pt">Português</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Teléfono Principal
                      </label>
                      <input
                        type="tel"
                        value={generalSettings.main_phone || ''}
                        onChange={(e) => setGeneralSettings({
                          ...generalSettings,
                          main_phone: e.target.value
                        })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Dirección del Hospital
                      </label>
                      <textarea
                        value={generalSettings.address || ''}
                        onChange={(e) => setGeneralSettings({
                          ...generalSettings,
                          address: e.target.value
                        })}
                        rows={3}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end space-x-4">
                    <button
                      onClick={() => handleSaveSettings('general')}
                      disabled={isLoading || updateGeneralMutation.isLoading}
                      className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center space-x-2"
                    >
                      {(isLoading || updateGeneralMutation.isLoading) ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                      ) : (
                        <Save className="w-4 h-4" />
                      )}
                      <span>Guardar Cambios</span>
                    </button>
                  </div>
                </motion.div>
              )}

              {activeTab === 'appointments' && (
                <motion.div
                  key="appointments"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Configuración de Citas</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Duración por Defecto (minutos)
                      </label>
                      <input
                        type="number"
                        min="15"
                        max="120"
                        value={appointmentSettings.default_duration || 30}
                        onChange={(e) => setAppointmentSettings({
                          ...appointmentSettings,
                          default_duration: parseInt(e.target.value)
                        })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Máximo de Citas por Día
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="100"
                        value={appointmentSettings.max_per_day || 20}
                        onChange={(e) => setAppointmentSettings({
                          ...appointmentSettings,
                          max_per_day: parseInt(e.target.value)
                        })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Horario de Inicio
                      </label>
                      <input
                        type="time"
                        value={appointmentSettings.start_time || '08:00'}
                        onChange={(e) => setAppointmentSettings({
                          ...appointmentSettings,
                          start_time: e.target.value
                        })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Horario de Fin
                      </label>
                      <input
                        type="time"
                        value={appointmentSettings.end_time || '18:00'}
                        onChange={(e) => setAppointmentSettings({
                          ...appointmentSettings,
                          end_time: e.target.value
                        })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          checked={appointmentSettings.allow_weekends || false}
                          onChange={(e) => setAppointmentSettings({
                            ...appointmentSettings,
                            allow_weekends: e.target.checked
                          })}
                          className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                        />
                        <label className="ml-2 text-sm text-gray-700">
                          Permitir citas en fines de semana
                        </label>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end space-x-4">
                    <button
                      onClick={() => handleSaveSettings('appointments')}
                      disabled={isLoading || updateAppointmentMutation.isLoading}
                      className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center space-x-2"
                    >
                      {(isLoading || updateAppointmentMutation.isLoading) ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                      ) : (
                        <Save className="w-4 h-4" />
                      )}
                      <span>Guardar Cambios</span>
                    </button>
                  </div>
                </motion.div>
              )}

              {activeTab === 'system' && (
                <motion.div
                  key="system"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Sistema y Mantenimiento</h3>
                  
                  {/* Servicios del Sistema */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 mb-4 flex items-center">
                      <Server className="w-5 h-5 mr-2" />
                      Estado de Servicios
                    </h4>
                    
                    {servicesStatus && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {servicesStatus.map((service, index) => (
                          <div key={index} className="flex items-center justify-between p-3 bg-white rounded border">
                            <div className="flex items-center space-x-3">
                              <div className={`w-3 h-3 rounded-full ${
                                service.status === 'running' ? 'bg-green-500' : 
                                service.status === 'stopped' ? 'bg-red-500' : 'bg-yellow-500'
                              }`}></div>
                              <span className="font-medium text-gray-900">{service.name}</span>
                            </div>
                            <span className={`text-sm font-medium ${
                              service.status === 'running' ? 'text-green-600' : 
                              service.status === 'stopped' ? 'text-red-600' : 'text-yellow-600'
                            }`}>
                              {service.status}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Backup y Restauración */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 mb-4 flex items-center">
                      <Database className="w-5 h-5 mr-2" />
                      Backup y Restauración
                    </h4>
                    
                    <div className="flex space-x-4">
                      <button
                        onClick={handleCreateBackup}
                        disabled={createBackupMutation.isLoading}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center space-x-2"
                      >
                        {createBackupMutation.isLoading ? (
                          <RefreshCw className="w-4 h-4 animate-spin" />
                        ) : (
                          <Download className="w-4 h-4" />
                        )}
                        <span>Crear Backup</span>
                      </button>
                      
                      <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2">
                        <Upload className="w-4 h-4" />
                        <span>Restaurar Backup</span>
                      </button>
                    </div>
                  </div>

                  {/* Logs del Sistema */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 mb-4 flex items-center">
                      <FileText className="w-5 h-5 mr-2" />
                      Logs del Sistema
                    </h4>
                    
                    <div className="flex space-x-4">
                      <button className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center space-x-2">
                        <Eye className="w-4 h-4" />
                        <span>Ver Logs</span>
                      </button>
                      
                      <button className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center space-x-2">
                        <Trash2 className="w-4 h-4" />
                        <span>Limpiar Logs</span>
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default SystemSettings;

