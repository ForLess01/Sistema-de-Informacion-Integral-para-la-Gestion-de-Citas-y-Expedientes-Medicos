import React, { useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { motion } from 'framer-motion';
import { Eye, EyeOff, User, Mail, Phone, Calendar, Loader2, CheckCircle, XCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';

const schema = yup.object({
  first_name: yup.string()
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(50, 'El nombre no puede exceder 50 caracteres')
    .matches(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/, 'El nombre solo puede contener letras y espacios')
    .required('Nombre es requerido'),
  last_name: yup.string()
    .min(2, 'El apellido debe tener al menos 2 caracteres')
    .max(50, 'El apellido no puede exceder 50 caracteres')
    .matches(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/, 'El apellido solo puede contener letras y espacios')
    .required('Apellido es requerido'),
  email: yup.string()
    .email('Ingrese un email válido (ej: usuario@dominio.com)')
    .max(100, 'El email no puede exceder 100 caracteres')
    .matches(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Formato de email inválido')
    .required('Email es requerido'),
  password: yup.string()
    .min(8, 'La contraseña debe tener al menos 8 caracteres')
    .max(128, 'La contraseña no puede exceder 128 caracteres')
    .matches(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/,
      'La contraseña debe contener: mayúsculas, minúsculas, números y símbolos (@$!%*?&)' 
    )
    .required('Contraseña es requerida'),
  confirm_password: yup.string()
    .oneOf([yup.ref('password'), null], 'Las contraseñas no coinciden')
    .required('Confirmar contraseña es requerido'),
  phone: yup.string()
    .matches(/^9\d{8}$/, 'El teléfono debe tener 9 dígitos y comenzar con 9 (ej: 987654321)')
    .required('Teléfono es requerido'),
  birth_date: yup.date()
    .max(new Date(), 'La fecha de nacimiento no puede ser futura')
    .min(new Date('1900-01-01'), 'Fecha de nacimiento inválida')
    .required('Fecha de nacimiento es requerida'),
  gender: yup.string()
    .oneOf(['M', 'F', 'O'], 'Selecciona un género válido')
    .required('Género es requerido'),
  dni: yup.string()
    .matches(/^\d{8}$/, 'El DNI debe tener exactamente 8 dígitos')
    .required('DNI es requerido'),
});

const RegisterForm = () => {
  // States for real-time validation
  const [emailValidation, setEmailValidation] = useState({ message: '', status: 'idle' }); // idle, checking, valid, invalid
  const [dniValidation, setDniValidation] = useState({ message: '', status: 'idle' });
  const [emailTimeout, setEmailTimeout] = useState(null);
  const [dniTimeout, setDniTimeout] = useState(null);

  // Function to allow only numeric input
  const handleNumericInput = (e) => {
    const value = e.target.value.replace(/[^0-9]/g, '');
    return value;
  };

  // Function to handle phone input
  const handlePhoneInput = (e) => {
    let value = e.target.value.replace(/[^0-9]/g, '');
    if (value.length > 9) {
      value = value.slice(0, 9);
    }
    e.target.value = value;
  };

  // Function to handle DNI input with real-time validation
  const handleDniInput = (e) => {
    let value = e.target.value.replace(/[^0-9]/g, '');
    if (value.length > 8) {
      value = value.slice(0, 8);
    }
    e.target.value = value;
    
    // Clear previous timeout
    if (dniTimeout) {
      clearTimeout(dniTimeout);
    }
    
    // Reset validation state
    setDniValidation({ message: '', status: 'idle' });
    
    // If DNI has 8 digits, validate after 500ms delay
    if (value.length === 8) {
      setDniValidation({ message: '', status: 'checking' });
      const timeout = setTimeout(() => {
        validateDni(value);
      }, 500);
      setDniTimeout(timeout);
    }
  };

  // Function to prevent non-numeric input
  const preventNonNumeric = (e) => {
    if (!/[0-9]/.test(e.key) && !['Backspace', 'Delete', 'Tab', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
      e.preventDefault();
    }
  };

  // Function to validate email in real-time
  const validateEmail = useCallback(async (email) => {
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      const response = await fetch(`${apiUrl}/api/v1/auth/check-email/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        if (data.exists) {
          setEmailValidation({ 
            message: 'Este email ya está registrado', 
            status: 'invalid' 
          });
        } else {
          setEmailValidation({ 
            message: 'Email disponible', 
            status: 'valid' 
          });
        }
      } else {
        setEmailValidation({ 
          message: 'Error al verificar email', 
          status: 'invalid' 
        });
      }
    } catch (error) {
      setEmailValidation({ 
        message: 'Error al verificar email', 
        status: 'invalid' 
      });
    }
  }, []);

  // Function to validate DNI in real-time
  const validateDni = useCallback(async (dni) => {
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      const response = await fetch(`${apiUrl}/api/v1/auth/check-dni/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ dni }),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        if (data.exists) {
          setDniValidation({ 
            message: 'Este DNI ya está registrado', 
            status: 'invalid' 
          });
        } else {
          setDniValidation({ 
            message: 'DNI disponible', 
            status: 'valid' 
          });
        }
      } else {
        setDniValidation({ 
          message: 'Error al verificar DNI', 
          status: 'invalid' 
        });
      }
    } catch (error) {
      setDniValidation({ 
        message: 'Error al verificar DNI', 
        status: 'invalid' 
      });
    }
  }, []);

  // Function to handle email input change
  const handleEmailChange = (e) => {
    const email = e.target.value;
    
    // Clear previous timeout
    if (emailTimeout) {
      clearTimeout(emailTimeout);
    }
    
    // Reset validation state
    setEmailValidation({ message: '', status: 'idle' });
    
    // Basic email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (email && emailRegex.test(email)) {
      setEmailValidation({ message: '', status: 'checking' });
      const timeout = setTimeout(() => {
        validateEmail(email);
      }, 500);
      setEmailTimeout(timeout);
    }
  };

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
                  onChange={(e) => {
                    register('email').onChange(e);
                    handleEmailChange(e);
                  }}
                  className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:border-blue-400 focus:bg-white/20 transition duration-200"
                />
                {emailValidation.status === 'checking' && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <Loader2 className="animate-spin h-4 w-4 text-blue-400" />
                  </div>
                )}
                {emailValidation.status === 'valid' && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <CheckCircle className="h-4 w-4 text-green-400" />
                  </div>
                )}
                {emailValidation.status === 'invalid' && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <XCircle className="h-4 w-4 text-red-400" />
                  </div>
                )}
              </div>
              {errors.email && (
                <p className="mt-1 text-red-400 text-sm">{errors.email.message}</p>
              )}
              {emailValidation.message && (
                <div className={`mt-1 text-sm flex items-center ${
                  emailValidation.status === 'valid' ? 'text-green-400' : 'text-red-400'
                }`}>
                  {emailValidation.status === 'valid' ? (
                    <CheckCircle className="h-4 w-4 mr-1" />
                  ) : (
                    <XCircle className="h-4 w-4 mr-1" />
                  )}
                  {emailValidation.message}
                </div>
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
                  onInput={handlePhoneInput}
                  onKeyDown={preventNonNumeric}
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
                onInput={handleDniInput}
                onKeyDown={preventNonNumeric}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:border-blue-400 focus:bg-white/20 transition duration-200"
              />
              {dniValidation.status === 'checking' && (
                <Loader2 className="animate-spin h-4 w-4 text-blue-400 ml-2" />
              )}
              {dniValidation.status === 'valid' && (
                <CheckCircle className="h-4 w-4 text-green-400 ml-2" />
              )}
              {dniValidation.status === 'invalid' && (
                <XCircle className="h-4 w-4 text-red-400 ml-2" />
              )}
              {errors.dni && (
                <p className="mt-1 text-red-400 text-sm">{errors.dni.message}</p>
              )}
              {dniValidation.message && (
                <div className={`mt-1 text-sm flex items-center ${
                  dniValidation.status === 'valid' ? 'text-green-400' : 'text-red-400'
                }`}>
                  {dniValidation.status === 'valid' ? (
                    <CheckCircle className="h-4 w-4 mr-1" />
                  ) : (
                    <XCircle className="h-4 w-4 mr-1" />
                  )}
                  {dniValidation.message}
                </div>
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
            className="w-full py-3 px-4 bg-blue-500/40 text-white font-semibold rounded-2xl backdrop-blur-md shadow-lg border border-white/20 hover:bg-blue-600/50 transition duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
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
