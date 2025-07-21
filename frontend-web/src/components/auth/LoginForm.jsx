import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Lock, Mail, Loader2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import TwoFactorForm from './TwoFactorForm';

const schema = yup.object({
  email: yup.string().email('Email inválido').required('Email es requerido'),
  password: yup.string().required('Contraseña es requerida'),
});

const LoginForm = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { login, twoFactorRequired, resetTwoFactor, user } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
    clearErrors,
  } = useForm({
    resolver: yupResolver(schema),
  });

  // Redireccionar cuando el usuario se autentique exitosamente
  useEffect(() => {
    console.log('🔄 LoginForm useEffect - usuario:', user);
    if (user) {
      console.log('🚀 Redirigiendo a dashboard...');
      navigate('/dashboard');
    }
  }, [user, navigate]);

  const onSubmit = async (data) => {
    console.log('📝 LoginForm onSubmit - datos:', data);
    setIsLoading(true);
    clearErrors(); // Limpiar errores previos
    
    const result = await login(data);
    console.log('📝 LoginForm onSubmit - resultado:', result);
    
    if (result.success) {
      console.log('✅ Login exitoso en LoginForm');
      // Redireccionar directamente sin esperar al useEffect
      console.log('🚀 Redirigiendo directamente a dashboard...');
      navigate('/dashboard');
    } else if (result.requires2FA) {
      console.log('🔑 Se requiere 2FA en LoginForm');
      // No mostrar error, solo indicar que se requiere 2FA
      // El componente TwoFactorForm se mostrará automáticamente
    } else {
      console.log('❌ Error en LoginForm:', result.error);
      setError('root', { message: result.error });
    }
    
    setIsLoading(false);
  };

  const handleBackToLogin = () => {
    resetTwoFactor();
    clearErrors();
  };

  // Si se requiere 2FA, mostrar el componente TwoFactorForm
  if (twoFactorRequired) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <TwoFactorForm />
        <div className="mt-4 text-center">
          <button
            onClick={handleBackToLogin}
            className="text-sm text-blue-300 hover:text-blue-200 transition-colors"
          >
            ← Volver al login
          </button>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full max-w-md"
    >
      <div className="backdrop-blur-lg bg-white/10 rounded-3xl shadow-2xl p-8 border border-white/20">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">
            <span className="bg-blue-500 bg-clip-text text-transparent text-5xl">
              SIIGCEM
            </span>
          </h1>
          <h2 className="text-2xl font-semibold text-white mb-2">
            👩‍⚕️Bienvenido,querido Paciente🫀
          </h2>
          <p className="text-white/80 text-lg">
            Tu salud es nuestra prioridad. Inicia sesión para acceder a nuestros servicios médicos.
          </p>
          <p className="text-white/60 text-sm mt-2">
            Sistema Integral de Información para la Gestión de Citas y Expedientes Médicos
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div>
            <label className="block text-white/80 text-sm font-medium mb-2">
              Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/50 h-5 w-5" />
              <input
                {...register('email')}
                type="email"
                placeholder="tu@email.com"
                className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:border-blue-400 focus:bg-white/20 transition duration-200"
              />
            </div>
            {errors.email && (
              <p className="mt-1 text-red-400 text-sm">{errors.email.message}</p>
            )}
          </div>

          <div>
            <label className="block text-white/80 text-sm font-medium mb-2">
              Contraseña
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/50 h-5 w-5" />
              <input
                {...register('password')}
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                className="w-full pl-10 pr-12 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:border-blue-400 focus:bg-white/20 transition duration-200"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/50 hover:text-white/80 transition-colors"
              >
                {showPassword ? (
                  <EyeOff className="h-5 w-5" />
                ) : (
                  <Eye className="h-5 w-5" />
                )}
              </button>
            </div>
            {errors.password && (
              <p className="mt-1 text-red-400 text-sm">{errors.password.message}</p>
            )}
          </div>

          <div className="flex items-center justify-between">
            <Link
              to="/forgot-password"
              className="font-semibold text-sm text-red-500 hover:text-red-300 transition-colors"
            >
              ¿Olvidaste tu contraseña?
            </Link>
          </div>

          {errors.root && (
            <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-3">
              <p className="text-red-300 text-sm">{errors.root.message}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 px-4 bg-blue-500/40 text-white font-semibold rounded-2xl backdrop-blur-md shadow-lg border border-white/20 hover:bg-blue-600/50 transition duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {isLoading ? (
              <>
                <Loader2 className="animate-spin h-5 w-5 mr-2" />
                Iniciando sesión...
              </>
            ) : (
              'Iniciar Sesión'
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-white/70">
            ¿No tienes una cuenta?{' '}
            <Link
              to="/register"
              className="font-semibold text-sm text-blue-600 hover:text-blue-300 transition-colors"
            >
              Regístrate aquí
            </Link>
          </p>
        </div>
      </div>
    </motion.div>
  );
};

export default LoginForm;
