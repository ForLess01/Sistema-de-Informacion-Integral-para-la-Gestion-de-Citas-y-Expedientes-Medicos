import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { motion } from 'framer-motion';
import { User, Mail, Phone, Calendar, MapPin, Camera, Save, ChevronLeft, Lock, Bell, Shield } from 'lucide-react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import toast from 'react-hot-toast';
import TwoFactorModal from '../components/auth/TwoFactorModal';

const Profile = () => {
  const { user, enable2FA, confirm2FA, disable2FA, regenerateBackupTokens } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState('personal');
  const [show2FAModal, setShow2FAModal] = useState(false);
  const [qrCode, setQrCode] = useState(null);
  const [backupTokens, setBackupTokens] = useState([]);
  const [verificationCode, setVerificationCode] = useState('');
  const [isConfirming2FA, setIsConfirming2FA] = useState(false);
  const [showBackupTokens, setShowBackupTokens] = useState(false);
  const [disablePassword, setDisablePassword] = useState('');
  const [isDisabling2FA, setIsDisabling2FA] = useState(false);
  
  const [formData, setFormData] = useState({
    first_name: user?.first_name || '',
    last_name: user?.last_name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    address: user?.address || '',
    birth_date: user?.birth_date || '',
    emergency_contact: user?.emergency_contact || '',
    emergency_phone: user?.emergency_phone || '',
  });

  const [passwordData, setPasswordData] = useState({
    current_password: '',
    new_password: '',
    confirm_password: '',
  });

  const [notifications, setNotifications] = useState({
    email_appointments: true,
    sms_appointments: true,
    email_results: true,
    email_promotions: false,
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleNotificationChange = (key) => {
    setNotifications(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleSaveProfile = async () => {
    try {
      // Aquí iría la llamada a la API para actualizar el perfil
      toast.success('Perfil actualizado exitosamente');
      setIsEditing(false);
    } catch (error) {
      toast.error('Error al actualizar el perfil');
    }
  };

  const handleChangePassword = async () => {
    if (passwordData.new_password !== passwordData.confirm_password) {
      toast.error('Las contraseñas no coinciden');
      return;
    }
    try {
      // Aquí iría la llamada a la API para cambiar la contraseña
      toast.success('Contraseña actualizada exitosamente');
      setPasswordData({
        current_password: '',
        new_password: '',
        confirm_password: '',
      });
    } catch (error) {
      toast.error('Error al cambiar la contraseña');
    }
  };

  const handleEnable2FA = async () => {
    try {
      const result = await enable2FA();
      if (result.success) {
        setQrCode(result.data.qr_code);
        setBackupTokens(result.data.backup_tokens || []);
        setShow2FAModal(true);
      } else {
        toast.error(result.error || 'Error al habilitar 2FA');
      }
    } catch (error) {
      toast.error('Error al habilitar 2FA');
    }
  };

  const handleConfirm2FA = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      toast.error('Por favor ingresa un código válido de 6 dígitos');
      return;
    }

    setIsConfirming2FA(true);
    try {
      const result = await confirm2FA(verificationCode);
      if (result.success) {
        toast.success('2FA habilitado exitosamente');
        setShow2FAModal(false);
        setVerificationCode('');
        setShowBackupTokens(true);
      } else {
        toast.error(result.error || 'Código incorrecto');
      }
    } catch (error) {
      toast.error('Error al confirmar 2FA');
    } finally {
      setIsConfirming2FA(false);
    }
  };

  const handleDisable2FA = async () => {
    if (!disablePassword) {
      toast.error('Por favor ingresa tu contraseña');
      return;
    }

    setIsDisabling2FA(true);
    try {
      const result = await disable2FA(disablePassword);
      if (result.success) {
        toast.success('2FA deshabilitado exitosamente');
        setDisablePassword('');
      } else {
        toast.error(result.error || 'Error al deshabilitar 2FA');
      }
    } catch (error) {
      toast.error('Error al deshabilitar 2FA');
    } finally {
      setIsDisabling2FA(false);
    }
  };

  const handleRegenerateBackupTokens = async () => {
    try {
      const result = await regenerateBackupTokens();
      if (result.success) {
        setBackupTokens(result.data.backup_tokens || []);
        setShowBackupTokens(true);
        toast.success('Tokens de respaldo regenerados');
      } else {
        toast.error(result.error || 'Error al regenerar tokens');
      }
    } catch (error) {
      toast.error('Error al regenerar tokens de respaldo');
    }
  };

  const tabs = [
    { id: 'personal', label: 'Información Personal', icon: User },
    { id: 'security', label: 'Seguridad', icon: Lock },
    { id: 'notifications', label: 'Notificaciones', icon: Bell },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      {/* Header */}
      <header className="backdrop-blur-lg bg-white/10 border-b border-white/20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Link to="/dashboard" className="text-white hover:text-blue-400 transition-colors">
                <ChevronLeft className="h-6 w-6" />
              </Link>
              <h1 className="text-xl font-bold text-white">Mi Perfil</h1>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar con foto de perfil */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-1"
          >
            <div className="backdrop-blur-lg bg-white/10 rounded-2xl p-6 border border-white/20 text-center">
              <div className="relative inline-block">
                <div className="h-32 w-32 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto">
                  <User className="h-16 w-16 text-white" />
                </div>
                <button className="absolute bottom-0 right-0 p-2 bg-white/20 rounded-full hover:bg-white/30 transition-colors">
                  <Camera className="h-5 w-5 text-white" />
                </button>
              </div>
              <h2 className="text-xl font-bold text-white mt-4">
                {user?.first_name} {user?.last_name}
              </h2>
              <p className="text-gray-400">{user?.email}</p>
              <div className="mt-4 space-y-2">
                <div className="text-sm text-gray-300">
                  <span className="text-gray-400">Miembro desde:</span>
                  <p>{user?.created_at && format(new Date(user.created_at), "MMMM 'de' yyyy", { locale: es })}</p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Contenido principal */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-3"
          >
            <div className="backdrop-blur-lg bg-white/10 rounded-2xl border border-white/20">
              {/* Tabs */}
              <div className="border-b border-white/10 p-4">
                <div className="flex space-x-4">
                  {tabs.map((tab) => {
                    const Icon = tab.icon;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all ${
                          activeTab === tab.id
                            ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white'
                            : 'text-gray-300 hover:bg-white/10'
                        }`}
                      >
                        <Icon className="h-4 w-4" />
                        <span>{tab.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Tab content */}
              <div className="p-6">
                {activeTab === 'personal' && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="space-y-6"
                  >
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-semibold text-white">Información Personal</h3>
                      {!isEditing ? (
                        <button
                          onClick={() => setIsEditing(true)}
                          className="px-4 py-2 bg-blue-500/20 text-blue-300 rounded-lg hover:bg-blue-500/30 transition-colors"
                        >
                          Editar
                        </button>
                      ) : (
                        <div className="space-x-2">
                          <button
                            onClick={() => setIsEditing(false)}
                            className="px-4 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors"
                          >
                            Cancelar
                          </button>
                          <button
                            onClick={handleSaveProfile}
                            className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all"
                          >
                            <Save className="h-4 w-4 inline mr-2" />
                            Guardar
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Nombre
                        </label>
                        <input
                          type="text"
                          name="first_name"
                          value={formData.first_name}
                          onChange={handleInputChange}
                          disabled={!isEditing}
                          className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-400 disabled:opacity-60"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Apellido
                        </label>
                        <input
                          type="text"
                          name="last_name"
                          value={formData.last_name}
                          onChange={handleInputChange}
                          disabled={!isEditing}
                          className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-400 disabled:opacity-60"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          <Mail className="h-4 w-4 inline mr-1" />
                          Correo Electrónico
                        </label>
                        <input
                          type="email"
                          name="email"
                          value={formData.email}
                          onChange={handleInputChange}
                          disabled={!isEditing}
                          className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-400 disabled:opacity-60"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          <Phone className="h-4 w-4 inline mr-1" />
                          Teléfono
                        </label>
                        <input
                          type="tel"
                          name="phone"
                          value={formData.phone}
                          onChange={handleInputChange}
                          disabled={!isEditing}
                          className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-400 disabled:opacity-60"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          <Calendar className="h-4 w-4 inline mr-1" />
                          Fecha de Nacimiento
                        </label>
                        <input
                          type="date"
                          name="birth_date"
                          value={formData.birth_date}
                          onChange={handleInputChange}
                          disabled={!isEditing}
                          className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-400 disabled:opacity-60"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          <MapPin className="h-4 w-4 inline mr-1" />
                          Dirección
                        </label>
                        <input
                          type="text"
                          name="address"
                          value={formData.address}
                          onChange={handleInputChange}
                          disabled={!isEditing}
                          className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-400 disabled:opacity-60"
                        />
                      </div>
                    </div>

                    <div className="border-t border-white/10 pt-4">
                      <h4 className="text-white font-medium mb-4">Contacto de Emergencia</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">
                            Nombre del Contacto
                          </label>
                          <input
                            type="text"
                            name="emergency_contact"
                            value={formData.emergency_contact}
                            onChange={handleInputChange}
                            disabled={!isEditing}
                            className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-400 disabled:opacity-60"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">
                            Teléfono de Emergencia
                          </label>
                          <input
                            type="tel"
                            name="emergency_phone"
                            value={formData.emergency_phone}
                            onChange={handleInputChange}
                            disabled={!isEditing}
                            className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-400 disabled:opacity-60"
                          />
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {activeTab === 'security' && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="space-y-6"
                  >
                    <h3 className="text-lg font-semibold text-white mb-4">Cambiar Contraseña</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Contraseña Actual
                        </label>
                        <input
                          type="password"
                          name="current_password"
                          value={passwordData.current_password}
                          onChange={handlePasswordChange}
                          className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-400"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Nueva Contraseña
                        </label>
                        <input
                          type="password"
                          name="new_password"
                          value={passwordData.new_password}
                          onChange={handlePasswordChange}
                          className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-400"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Confirmar Nueva Contraseña
                        </label>
                        <input
                          type="password"
                          name="confirm_password"
                          value={passwordData.confirm_password}
                          onChange={handlePasswordChange}
                          className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-400"
                        />
                      </div>
                      <button
                        onClick={handleChangePassword}
                        className="px-6 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all"
                      >
                        Actualizar Contraseña
                      </button>
                    </div>

                    <div className="border-t border-white/10 pt-6 mt-6">
                      <div className="flex items-center space-x-3 mb-4">
                        <Shield className={`h-5 w-5 ${user?.two_factor_enabled ? 'text-green-400' : 'text-yellow-400'}`} />
                        <h4 className="font-medium text-white">Autenticación de Dos Factores</h4>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          user?.two_factor_enabled 
                            ? 'bg-green-500/20 text-green-300' 
                            : 'bg-red-500/20 text-red-300'
                        }`}>
                          {user?.two_factor_enabled ? 'Habilitado' : 'Deshabilitado'}
                        </span>
                      </div>
                      <p className="text-gray-300 mb-4">
                        Añade una capa extra de seguridad a tu cuenta habilitando la autenticación de dos factores.
                      </p>
                      
                      {!user?.two_factor_enabled ? (
                        /* Usuario NO tiene 2FA habilitado */
                        <div className="space-y-4">
                          <button
                            onClick={handleEnable2FA}
                            className="px-4 py-2 bg-yellow-500/20 text-yellow-300 rounded-lg hover:bg-yellow-500/30 transition-colors"
                          >
                            ✨ Habilitar 2FA
                          </button>
                        </div>
                      ) : (
                        /* Usuario SI tiene 2FA habilitado */
                        <div className="space-y-4">
                          <div className="flex flex-wrap gap-3">
                            <button
                              onClick={handleRegenerateBackupTokens}
                              className="px-4 py-2 bg-blue-500/20 text-blue-300 rounded-lg hover:bg-blue-500/30 transition-colors"
                            >
                              🔄 Regenerar Tokens de Respaldo
                            </button>
                          </div>
                          
                          {/* Sección para deshabilitar 2FA */}
                          <div className="border-t border-white/10 pt-4 mt-4">
                            <h5 className="text-white font-medium mb-2">⚠️ Deshabilitar 2FA</h5>
                            <p className="text-gray-400 text-sm mb-3">
                              Ingresa tu contraseña actual para deshabilitar la autenticación de dos factores.
                            </p>
                            <div className="flex gap-3">
                              <input
                                type="password"
                                value={disablePassword}
                                onChange={(e) => setDisablePassword(e.target.value)}
                                placeholder="Contraseña actual"
                                className="flex-1 px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-red-400"
                              />
                              <button
                                onClick={handleDisable2FA}
                                disabled={isDisabling2FA || !disablePassword}
                                className="px-4 py-2 bg-red-500/20 text-red-300 rounded-lg hover:bg-red-500/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                {isDisabling2FA ? 'Deshabilitando...' : 'Deshabilitar'}
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    {/* Modal para mostrar tokens de respaldo */}
                    {showBackupTokens && backupTokens.length > 0 && (
                      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                        <div className="bg-gray-800 rounded-2xl p-6 max-w-md w-full mx-4">
                          <h3 className="text-lg font-bold text-white mb-4">🔐 Tokens de Respaldo</h3>
                          <p className="text-gray-300 text-sm mb-4">
                            Guarda estos tokens de respaldo en un lugar seguro. Puedes usarlos para acceder a tu cuenta si pierdes tu dispositivo de autenticación.
                          </p>
                          <div className="bg-gray-900 rounded-lg p-4 mb-4 max-h-60 overflow-y-auto">
                            <div className="grid grid-cols-2 gap-2">
                              {backupTokens.map((token, index) => (
                                <code key={index} className="text-green-300 text-sm font-mono block">
                                  {token}
                                </code>
                              ))}
                            </div>
                          </div>
                          <div className="flex gap-3">
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(backupTokens.join('\n'));
                                toast.success('Tokens copiados al portapapeles');
                              }}
                              className="flex-1 px-4 py-2 bg-blue-500/20 text-blue-300 rounded-lg hover:bg-blue-500/30 transition-colors"
                            >
                              Copiar Tokens
                            </button>
                            <button
                              onClick={() => setShowBackupTokens(false)}
                              className="flex-1 px-4 py-2 bg-gray-500/20 text-gray-300 rounded-lg hover:bg-gray-500/30 transition-colors"
                            >
                              Cerrar
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}

                {activeTab === 'notifications' && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="space-y-6"
                  >
                    <h3 className="text-lg font-semibold text-white mb-4">Preferencias de Notificaciones</h3>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
                        <div>
                          <h4 className="text-white font-medium">Recordatorios de Citas por Email</h4>
                          <p className="text-gray-400 text-sm">Recibe recordatorios de tus citas próximas</p>
                        </div>
                        <button
                          onClick={() => handleNotificationChange('email_appointments')}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                            notifications.email_appointments ? 'bg-blue-500' : 'bg-gray-600'
                          }`}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                              notifications.email_appointments ? 'translate-x-6' : 'translate-x-1'
                            }`}
                          />
                        </button>
                      </div>

                      <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
                        <div>
                          <h4 className="text-white font-medium">Recordatorios de Citas por SMS</h4>
                          <p className="text-gray-400 text-sm">Recibe mensajes de texto con recordatorios</p>
                        </div>
                        <button
                          onClick={() => handleNotificationChange('sms_appointments')}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                            notifications.sms_appointments ? 'bg-blue-500' : 'bg-gray-600'
                          }`}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                              notifications.sms_appointments ? 'translate-x-6' : 'translate-x-1'
                            }`}
                          />
                        </button>
                      </div>

                      <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
                        <div>
                          <h4 className="text-white font-medium">Resultados de Exámenes</h4>
                          <p className="text-gray-400 text-sm">Notificaciones cuando estén listos tus resultados</p>
                        </div>
                        <button
                          onClick={() => handleNotificationChange('email_results')}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                            notifications.email_results ? 'bg-blue-500' : 'bg-gray-600'
                          }`}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                              notifications.email_results ? 'translate-x-6' : 'translate-x-1'
                            }`}
                          />
                        </button>
                      </div>

                      <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
                        <div>
                          <h4 className="text-white font-medium">Promociones y Noticias</h4>
                          <p className="text-gray-400 text-sm">Información sobre servicios y promociones</p>
                        </div>
                        <button
                          onClick={() => handleNotificationChange('email_promotions')}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                            notifications.email_promotions ? 'bg-blue-500' : 'bg-gray-600'
                          }`}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                              notifications.email_promotions ? 'translate-x-6' : 'translate-x-1'
                            }`}
                          />
                        </button>
                      </div>
                    </div>

                    <div className="pt-4">
                      <button className="px-6 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all">
                        Guardar Preferencias
                      </button>
                    </div>
                  </motion.div>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Modal de 2FA */}
      <TwoFactorModal
        isOpen={show2FAModal}
        qrCode={qrCode}
        onClose={() => {
          setShow2FAModal(false);
          setVerificationCode('');
        }}
        onConfirm={handleConfirm2FA}
        verificationCode={verificationCode}
        setVerificationCode={setVerificationCode}
        isConfirming={isConfirming2FA}
      />
    </div>
  );
};

export default Profile;
