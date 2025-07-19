import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Loader2, Shield } from 'lucide-react';

const TwoFactorForm = () => {
  const navigate = useNavigate();
  const { verify2FA, user } = useAuth();
  const [token, setToken] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Redireccionar cuando la autenticación sea exitosa
  useEffect(() => {
    console.log('🔄 TwoFactorForm useEffect - usuario:', user);
    if (user) {
      console.log('🚀 Usuario detectado, redirigiendo a dashboard desde useEffect...');
      navigate('/dashboard');
    }
  }, [user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    console.log('🔐 Enviando código 2FA:', token);
    const result = await verify2FA(token);
    console.log('📋 Resultado verify2FA:', result);

    if (result.success) {
      console.log('✅ Verificación 2FA exitosa, redirigiendo...');
      // Redirigir inmediatamente después de la verificación exitosa
      navigate('/dashboard');
    } else {
      console.log('❌ Error en verificación 2FA:', result.error);
      setError(result.error);
    }

    setIsLoading(false);
  };

  return (
    <div className="w-full max-w-md">
      <div className="backdrop-blur-lg bg-white/10 rounded-3xl shadow-2xl p-8 border border-white/20">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-blue-500/20 rounded-full">
              <Shield className="h-8 w-8 text-blue-400" />
            </div>
          </div>
          <h2 className="text-3xl font-bold text-white mb-2">Verificación 2FA</h2>
          <p className="text-white/70">Introduce el código de 6 dígitos de tu aplicación autenticadora</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-white/80 text-sm font-medium mb-2">
              Código 2FA
            </label>
            <div className="relative">
              <Shield className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/50 h-5 w-5" />
              <input
                type="text"
                value={token}
                onChange={(e) => setToken(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="123456"
                maxLength="6"
                autoComplete="one-time-code"
                className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:border-blue-400 focus:bg-white/20 transition duration-200 text-center text-lg tracking-widest"
              />
            </div>
          </div>

          {error && (
            <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-3">
              <p className="text-red-300 text-sm">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 px-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold rounded-xl hover:from-blue-600 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-transparent transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {isLoading ? (
              <Loader2 className="animate-spin h-5 w-5 mr-2" />
            ) : (
              'Verificar'
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default TwoFactorForm;

