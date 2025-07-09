import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { motion } from 'framer-motion';
import { Eye, EyeOff, User, Mail, Phone, Calendar, Loader2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';

const schema = yup.object({
  first_name: yup.string().required('Nombre es requerido'),
  last_name: yup.string().required('Apellido es requerido'),
  email: yup.string().email('Email inválido').required('Email es requerido'),
  password: yup.string()
    .min(8, 'La contraseña debe tener al menos 8 caracteres')
    .matches(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      'La contraseña debe contener mayúsculas, minúsculas y números'
    )
    .required('Contraseña es requerida'),
  confirm_password: yup.string()
    .oneOf([yup.ref('password'), null], 'Las contraseñas no coinciden')
    .required('Confirmar contraseña es requerido'),
  phone: yup.string().required('Teléfono es requerido'),
  birth_date: yup.date()
    .max(new Date(), 'La fecha de nacimiento no puede ser futura')
    .required('Fecha de nacimiento es requerida'),
  gender: yup.string().oneOf(['M', 'F', 'O']).required('Género es requerido'),
  dni: yup.string().required('DNI es requerido'),
});

const RegisterForm = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { register: registerUser } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(schema),
  });

  const onSubmit = async (data) => {
    setIsLoading(true);
    const result = await registerUser(data);
    
    if (result.success) {
      navigate('/login');
    } else {
      toast.error(result.error);
    }
    setIsLoading(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full max-w-2xl"
    >
      <div className="backdrop-blur-lg bg-white/10 rounded-3xl shadow-2xl p-8 border border-white/20">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-white mb-2">Crear Cuenta</h2>
          <p className="text-white/70">Regístrate para acceder a nuestros servicios</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-white/80 text-sm font-medium mb-2">
                Nombre
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/50 h-5 w-5" />
                <input
                  {...register('first_name')}
                  type="text"
                  placeholder="Juan"
                  className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:border-blue-400 focus:bg-white/20 transition duration-200"
                />
              </div>
              {errors.first_name && (
                <p className="mt-1 text-red-400 text-sm">{errors.first_name.message}</p>
              )}
            </div>

            <div>
              <label className="block text-white/80 text-sm font-medium mb-2">
                Apellido
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/50 h-5 w-5" />
                <input
                  {...register('last_name')}
                  type="text"
                  placeholder="Pérez"
                  className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:border-blue-400 focus:bg-white/20 transition duration-200"
                />
              </div>
              {errors.last_name && (
                <p className="mt-1 text-red-400 text-sm">{errors.last_name.message}</p>
              )}
            </div>

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
                Teléfono
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/50 h-5 w-5" />
                <input
                  {...register('phone')}
                  type="tel"
                  placeholder="999999999"
                  className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:border-blue-400 focus:bg-white/20 transition duration-200"
                />
              </div>
              {errors.phone && (
                <p className="mt-1 text-red-400 text-sm">{errors.phone.message}</p>
              )}
            </div>

            <div>
              <label className="block text-white/80 text-sm font-medium mb-2">
                DNI
              </label>
              <input
                {...register('dni')}
                type="text"
                placeholder="12345678"
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:border-blue-400 focus:bg-white/20 transition duration-200"
              />
              {errors.dni && (
                <p className="mt-1 text-red-400 text-sm">{errors.dni.message}</p>
              )}
            </div>

            <div>
              <label className="block text-white/80 text-sm font-medium mb-2">
                Fecha de Nacimiento
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/50 h-5 w-5" />
                <input
                  {...register('birth_date')}
                  type="date"
                  className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:border-blue-400 focus:bg-white/20 transition duration-200"
                />
              </div>
              {errors.birth_date && (
                <p className="mt-1 text-red-400 text-sm">{errors.birth_date.message}</p>
              )}
            </div>

            <div>
              <label className="block text-white/80 text-sm font-medium mb-2">
                Género
              </label>
              <select
                {...register('gender')}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:border-blue-400 focus:bg-white/20 transition duration-200"
              >
                <option value="" className="bg-gray-800">Selecciona género</option>
                <option value="M" className="bg-gray-800">Masculino</option>
                <option value="F" className="bg-gray-800">Femenino</option>
                <option value="O" className="bg-gray-800">Otro</option>
              </select>
              {errors.gender && (
                <p className="mt-1 text-red-400 text-sm">{errors.gender.message}</p>
              )}
            </div>

            <div>
              <label className="block text-white/80 text-sm font-medium mb-2">
                Contraseña
              </label>
              <div className="relative">
                <input
                  {...register('password')}
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  className="w-full px-4 pr-12 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:border-blue-400 focus:bg-white/20 transition duration-200"
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

            <div>
              <label className="block text-white/80 text-sm font-medium mb-2">
                Confirmar Contraseña
              </label>
              <div className="relative">
                <input
                  {...register('confirm_password')}
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  className="w-full px-4 pr-12 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:border-blue-400 focus:bg-white/20 transition duration-200"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/50 hover:text-white/80 transition-colors"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
              {errors.confirm_password && (
                <p className="mt-1 text-red-400 text-sm">{errors.confirm_password.message}</p>
              )}
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 px-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold rounded-xl hover:from-blue-600 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-transparent transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {isLoading ? (
              <>
                <Loader2 className="animate-spin h-5 w-5 mr-2" />
                Registrando...
              </>
            ) : (
              'Registrarse'
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-white/70">
            ¿Ya tienes una cuenta?{' '}
            <Link
              to="/login"
              className="text-blue-300 hover:text-blue-200 font-medium transition-colors"
            >
              Inicia sesión aquí
            </Link>
          </p>
        </div>
      </div>
    </motion.div>
  );
};

export default RegisterForm;
