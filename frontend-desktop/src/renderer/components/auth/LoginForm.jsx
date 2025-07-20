import React, { useState, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Lock, Mail, Shield, User, LogIn } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import authService from '../../services/authService';
import toast from 'react-hot-toast';

const LoginForm = ({ onLoginSuccess }) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [twoFactorToken, setTwoFactorToken] = useState('');
  const [showTwoFactor, setShowTwoFactor] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [isBlocked, setIsBlocked] = useState(false);
  const [blockTimeLeft, setBlockTimeLeft] = useState(0);
  const [showWelcome, setShowWelcome] = useState(false);
  const [welcomeMessage, setWelcomeMessage] = useState('');
  const [isShaking, setIsShaking] = useState(false);
  const [isProcessingLogin, setIsProcessingLogin] = useState(false);

  // Función para validar rol de usuario autorizado
  const validateAuthorizedUser = (user) => {
    const authorizedRoles = ['admin', 'doctor', 'nurse', 'pharmacist', 'receptionist', 'emergency', 'obstetriz', 'odontologo'];
    return authorizedRoles.includes(user.role);
  };

  // Mutación para el login inicial
  const loginMutation = useMutation({
    mutationFn: (credentials) => authService.login(credentials),
    onSuccess: async (data) => {
      if (data.requires_2fa) {
        // Validar que el usuario sea autorizado antes de proceder con 2FA
        if (!validateAuthorizedUser(data.user)) {
          setLoginError('Acceso denegado: Esta aplicación está restringida al personal médico y administrativo.');
          toast.error('Acceso no autorizado para pacientes');
          return;
        }
        setShowTwoFactor(true);
        setFailedAttempts(0); // Resetear intentos fallidos después de login exitoso
        toast.info('Ingrese su código de autenticación de dos factores');
      } else {
        // Validar que el usuario sea autorizado
        if (!validateAuthorizedUser(data.user)) {
          setLoginError('Acceso denegado: Esta aplicación está restringida al personal médico y administrativo.');
          toast.error('Acceso no autorizado para pacientes');
          return;
        }
        
        // Login exitoso sin 2FA
        localStorage.setItem('access_token', data.access);
        localStorage.setItem('refresh_token', data.refresh);
        localStorage.setItem('user', JSON.stringify(data.user));
        
        // Resetear estados de seguridad
        setFailedAttempts(0);
        setLoginError('');
        
        // Mostrar mensaje de bienvenida personalizado
        showWelcomeMessage(data.user);
        
        // Llamar callback si se proporciona
        if (onLoginSuccess) {
          onLoginSuccess(data.user);
        }
        
        // Notificar a Electron que el login fue exitoso
        if (window.electronAPI) {
          try {
            setIsProcessingLogin(true);
            console.log('Notificando login exitoso a Electron con usuario:', data.user);
            const result = await window.electronAPI.loginSuccess(data.user);
            console.log('Respuesta de Electron:', result);
            // No navegar - la ventana se cerrará y abrirá la principal
          } catch (error) {
            console.error('Error notificando a Electron:', error);
            toast.error('Error al abrir la aplicación principal');
            setIsProcessingLogin(false);
          }
        } else {
          // Modo web - navegar al dashboard después del mensaje de bienvenida
          setTimeout(() => {
            navigate('/');
          }, 3000);
        }
      }
    },
    onError: (error) => {
      handleLoginFailure();
      setIsProcessingLogin(false); // Resetear estado de procesamiento
      toast.error('Credenciales incorrectas');
    }
  });

  // Mutación para verificar 2FA
  const twoFactorMutation = useMutation({
    mutationFn: (data) => authService.verify2FA(data),
    onSuccess: async (data) => {
      // Validar que el usuario sea autorizado después del 2FA
      if (!validateAuthorizedUser(data.user)) {
        setLoginError('Acceso denegado: Esta aplicación está restringida al personal médico y administrativo.');
        toast.error('Acceso no autorizado para pacientes');
        setShowTwoFactor(false); // Volver al login inicial
        setTwoFactorToken('');
        return;
      }
      
      localStorage.setItem('access_token', data.access);
      localStorage.setItem('refresh_token', data.refresh);
      localStorage.setItem('user', JSON.stringify(data.user));
      
      // Llamar callback si se proporciona
      if (onLoginSuccess) {
        onLoginSuccess(data.user);
      }
      
      // Notificar a Electron que el login fue exitoso
      if (window.electronAPI) {
        try {
          console.log('Notificando 2FA exitoso a Electron con usuario:', data.user);
          await window.electronAPI.loginSuccess(data.user);
          toast.success('¡Autenticación completada!');
        } catch (error) {
          console.error('Error notificando a Electron después de 2FA:', error);
          toast.error('Error al abrir la aplicación principal');
        }
      } else {
        // Modo web - navegar al dashboard
        toast.success('¡Autenticación completada!');
        navigate('/');
      }
    },
    onError: () => {
      toast.error('Código de verificación incorrecto');
    }
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setLoginError('');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // No permitir envío si está bloqueado o ya se está procesando
    if (isBlocked || isProcessingLogin || loginMutation.isPending || twoFactorMutation.isPending) {
      console.log('🚫 SUBMIT BLOCKED: Form submission blocked', {
        isBlocked,
        isProcessingLogin,
        loginPending: loginMutation.isPending,
        twoFactorPending: twoFactorMutation.isPending
      });
      return;
    }
    
    if (!showTwoFactor) {
      console.log('🔑 LOGIN ATTEMPT: Attempting login with credentials');
      loginMutation.mutate(formData);
    } else {
      console.log('🔐 2FA ATTEMPT: Attempting 2FA verification');
      twoFactorMutation.mutate({
        email: formData.email,
        token: twoFactorToken
      });
    }
  };

  const getRoleIcon = (role) => {
    switch(role) {
      case 'doctor': return <User className="h-4 w-4" />;
      case 'admin': return <Shield className="h-4 w-4" />;
      case 'nurse': return <User className="h-4 w-4" />;
      case 'pharmacist': return <User className="h-4 w-4" />;
      case 'receptionist': return <User className="h-4 w-4" />;
      case 'emergency': return <User className="h-4 w-4" />;
      default: return <User className="h-4 w-4" />;
    }
  };

  const getRoleName = (role) => {
    const roleNames = {
      'admin': 'Administrador',
      'doctor': 'Doctor',
      'nurse': 'Enfermero/a',
      'pharmacist': 'Farmacéutico',
      'receptionist': 'Recepcionista',
      'patient': 'Paciente'
    };
    return roleNames[role] || role;
  };

  // Función para generar mensaje de bienvenida personalizado
  const generateWelcomeMessage = (user) => {
    const { role, gender, first_name } = user;
    
    const genderSuffix = {
      'male': 'o',
      'female': 'a',
      'other': 'x'
    };
    
    const roleMessages = {
      'admin': `¡Bienvenid${genderSuffix[gender] || 'x'} Administrador${genderSuffix[gender] || 'x'}!`,
      'doctor': `¡Bienvenid${genderSuffix[gender] || 'x'} Doctor${genderSuffix[gender] || 'x'}!`,
      'nurse': `¡Bienvenid${genderSuffix[gender] || 'x'} ${gender === 'male' ? 'Enfermero' : 'Enfermerx'}!`,
      'pharmacist': `¡Bienvenid${genderSuffix[gender] || 'x'} Farmacéutic${genderSuffix[gender] || 'x'}!`,
      'receptionist': `¡Bienvenid${genderSuffix[gender] || 'x'} Administrativ${genderSuffix[gender] || 'x'}!`,
      'emergency': `¡Bienvenid${genderSuffix[gender] || 'x'} Personal de Emergencias!`,
      'obstetriz': `¡Bienvenid${genderSuffix[gender] || 'x'} Obstetriz!`,
      'odontologo': `¡Bienvenid${genderSuffix[gender] || 'x'} Odontólog${genderSuffix[gender] || 'x'}!`
    };
    
    return roleMessages[role] || `¡Bienvenid${genderSuffix[gender] || 'x'} ${first_name}!`;
  };

  // Función para manejar login fallido
  const handleLoginFailure = () => {
    const newAttempts = failedAttempts + 1;
    setFailedAttempts(newAttempts);
    
    // Activar animación de shake
    setIsShaking(true);
    setTimeout(() => setIsShaking(false), 600);
    
    const remainingAttempts = 3 - newAttempts;
    
    if (newAttempts >= 3) {
      // Bloquear después de 3 intentos
      setIsBlocked(true);
      setBlockTimeLeft(300); // 5 minutos
      setLoginError('Cuenta bloqueada por seguridad. Intente nuevamente en 5 minutos.');
    } else {
      setLoginError(`Credenciales incorrectas. Le quedan ${remainingAttempts} intento${remainingAttempts !== 1 ? 's' : ''}.`);
    }
  };

  // Función para mostrar mensaje de bienvenida
  const showWelcomeMessage = (user) => {
    const message = generateWelcomeMessage(user);
    setWelcomeMessage(message);
    setShowWelcome(true);
    
    // Ocultar después de 3 segundos
    setTimeout(() => {
      setShowWelcome(false);
    }, 3000);
  };

  // Effect para manejo del bloqueo por tiempo
  useEffect(() => {
    let timer;
    if (isBlocked && blockTimeLeft > 0) {
      timer = setInterval(() => {
        setBlockTimeLeft((prev) => {
          if (prev <= 1) {
            setIsBlocked(false);
            setFailedAttempts(0);
            setLoginError('');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isBlocked, blockTimeLeft]);

  // Formatear tiempo de bloqueo
  const formatBlockTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // Ocultar scrollbar solo en la ventana de login
  React.useEffect(() => {
    // Ocultar scrollbar al montar el componente
    document.body.style.overflow = 'hidden';
    
    // Restaurar scrollbar al desmontar el componente
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-6 overflow-hidden">
      {/* Modal de Bienvenida */}
      {showWelcome && (
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.5 }}
          className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm"
        >
          <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-8 py-6 rounded-2xl shadow-2xl border border-green-400/30">
            <motion.div
              initial={{ y: -20 }}
              animate={{ y: 0 }}
              className="text-center"
            >
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="h-8 w-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold mb-2">{welcomeMessage}</h2>
              <p className="text-green-100">Accediendo al sistema...</p>
            </motion.div>
          </div>
        </motion.div>
      )}
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ 
          opacity: 1, 
          y: 0,
          x: isShaking ? [-10, 10, -10, 10, 0] : 0
        }}
        transition={{ 
          duration: isShaking ? 0.6 : 0.5,
          ease: isShaking ? "easeInOut" : "easeOut"
        }}
        className="backdrop-blur-lg bg-white/10 rounded-3xl p-8 border border-white/20 w-full max-w-md shadow-2xl"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2 }}
            className="w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4"
          >
            <Shield className="h-10 w-10 text-white" />
          </motion.div>
          <h1 className="text-2xl font-bold text-white mb-2">
            Sistema Médico Integral
          </h1>
          <p className="text-gray-400">
            {showTwoFactor ? 'Verificación de dos factores' : 'Acceso para personal médico'}
          </p>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {!showTwoFactor ? (
            <>
              {/* Email Field */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    disabled={isBlocked}
                    className={`w-full pl-10 pr-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 transition-colors ${
                      isBlocked ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                    placeholder="usuario@hospital.pe"
                    required
                  />
                </div>
              </div>

              {/* Password Field */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Contraseña
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    disabled={isBlocked}
                    className={`w-full pl-10 pr-12 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 transition-colors ${
                      isBlocked ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                    placeholder="••••••••"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>
            </>
          ) : (
            /* 2FA Token Field */
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Código de verificación
              </label>
              <div className="relative">
                <Shield className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  value={twoFactorToken}
                  onChange={(e) => setTwoFactorToken(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 transition-colors text-center text-2xl tracking-widest"
                  placeholder="000000"
                  maxLength="6"
                  required
                />
              </div>
              <p className="text-xs text-gray-400 mt-2 text-center">
                Ingrese el código de 6 dígitos de su aplicación de autenticación
              </p>
            </div>
          )}

          {/* Error Message */}
          {loginError && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-red-500/20 border border-red-500/50 rounded-lg p-3"
            >
              <p className="text-red-300 text-sm">{loginError}</p>
              {isBlocked && blockTimeLeft > 0 && (
                <div className="mt-2 text-center">
                  <p className="text-red-200 text-xs">Tiempo restante: {formatBlockTime(blockTimeLeft)}</p>
                  <div className="w-full bg-red-900/30 rounded-full h-2 mt-1">
                    <div 
                      className="bg-red-400 h-2 rounded-full transition-all duration-1000"
                      style={{ width: `${((300 - blockTimeLeft) / 300) * 100}%` }}
                    ></div>
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isBlocked || loginMutation.isPending || twoFactorMutation.isPending || isProcessingLogin}
            className={`w-full font-semibold py-3 px-6 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900 transition-all duration-200 flex items-center justify-center ${
              isBlocked || isProcessingLogin
                ? 'bg-gray-600 text-gray-300 cursor-not-allowed'
                : 'bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:from-blue-600 hover:to-purple-700'
            }`}
          >
            {(loginMutation.isPending || twoFactorMutation.isPending || isProcessingLogin) ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
            ) : (
              <>
                <LogIn className="h-5 w-5 mr-2" />
                {isBlocked 
                  ? `Bloqueado (${formatBlockTime(blockTimeLeft)})`
                  : isProcessingLogin
                  ? 'Procesando...'
                  : showTwoFactor ? 'Verificar Código' : 'Iniciar Sesión'
                }
              </>
            )}
          </button>

          {/* Back Button for 2FA */}
          {showTwoFactor && (
            <button
              type="button"
              onClick={() => {
                setShowTwoFactor(false);
                setTwoFactorToken('');
              }}
              className="w-full text-gray-400 hover:text-white transition-colors text-sm"
            >
              ← Volver al inicio de sesión
            </button>
          )}
        </form>

        {/* Info Footer */}
        <div className="mt-8 pt-6 border-t border-white/10">
          <p className="text-center text-gray-400 text-xs">
            Aplicación de Escritorio - Personal Autorizado
          </p>
          <div className="flex items-center justify-center space-x-4 mt-3">
            <div className="flex items-center space-x-1 text-xs text-gray-500">
              {getRoleIcon('admin')}
              <span>Admin</span>
            </div>
            <div className="flex items-center space-x-1 text-xs text-gray-500">
              {getRoleIcon('doctor')}
              <span>Médicos</span>
            </div>
            <div className="flex items-center space-x-1 text-xs text-gray-500">
              {getRoleIcon('nurse')}
              <span>Personal</span>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default LoginForm;
