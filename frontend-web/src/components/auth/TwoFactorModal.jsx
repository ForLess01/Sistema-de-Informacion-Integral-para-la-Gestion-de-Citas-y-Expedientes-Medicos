import React, { useState, useEffect } from 'react';
import { Dialog } from '@headlessui/react';
import { X, AlertCircle } from 'lucide-react';

const TwoFactorModal = ({ isOpen, qrCode, onClose, onConfirm, verificationCode, setVerificationCode, isConfirming }) => {
  const [imageError, setImageError] = useState(false);
  
  useEffect(() => {
    console.log('🔍 TwoFactorModal - QR Code data:', {
      exists: !!qrCode,
      length: qrCode?.length,
      firstChars: qrCode?.substring(0, 50) + '...'
    });
    setImageError(false); // Reset error state when qrCode changes
  }, [qrCode]);
  
  // Función para obtener la URL correcta de la imagen
  const getQrImageSrc = (qrCodeData) => {
    if (!qrCodeData) return '';
    
    // Si ya viene con el prefijo data:image, usarlo directamente
    if (qrCodeData.startsWith('data:image/')) {
      return qrCodeData;
    }
    
    // Si no, agregarlo
    return `data:image/png;base64,${qrCodeData}`;
  };
  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
      
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="bg-gray-800 backdrop-blur-lg rounded-2xl p-6 w-full max-w-md mx-auto border border-white/20">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-white">Activar 2FA</h2>
            <button onClick={onClose} className="text-white hover:text-red-300">
              <X className="h-6 w-6" />
            </button>
          </div>
          <div className="mb-4">
            <p className="text-white/70 mb-4">Escanea este código QR con tu aplicación autenticadora para activar el 2FA.</p>
            
            {/* Área del código QR */}
            <div className="flex justify-center mb-4">
              {qrCode && !imageError ? (
                <div className="bg-white p-4 rounded-lg">
                  <img 
                    src={getQrImageSrc(qrCode)} 
                    alt="Código QR para 2FA" 
                    className="w-48 h-48 object-contain"
                    onError={(e) => {
                      console.error('❌ Error cargando imagen QR:', e);
                      console.log('🔍 Intentando cargar QR con src:', getQrImageSrc(qrCode)?.substring(0, 100) + '...');
                      setImageError(true);
                    }}
                    onLoad={() => {
                      console.log('✅ Imagen QR cargada exitosamente');
                    }}
                  />
                </div>
              ) : (
                <div className="w-48 h-48 bg-gray-700 rounded-lg border-2 border-dashed border-gray-500 flex items-center justify-center">
                  <div className="text-center">
                    <AlertCircle className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-400 text-sm">
                      {!qrCode ? 'Generando QR...' : 'Error cargando QR'}
                    </p>
                    {qrCode && imageError && (
                      <p className="text-xs text-red-400 mt-1">
                        Inténtalo de nuevo
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
            
            {/* Información adicional */}
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3 mb-4">
              <p className="text-blue-300 text-xs">
                💡 <strong>Aplicaciones recomendadas:</strong><br/>
                • Google Authenticator<br/>
                • Microsoft Authenticator<br/>
                • Authy<br/>
                • 1Password
              </p>
            </div>
          </div>
          <div className="mb-4">
            <label className="block text-white/70 text-sm mb-2">Ingresa el código de verificación:</label>
            <input
              type="text"
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value)}
              className="w-full px-4 py-2 bg-white/20 text-white rounded-lg focus:outline-none focus:border-blue-400"
              placeholder="123456"
            />
          </div>
          <button
            onClick={onConfirm}
            disabled={isConfirming}
            className="w-full py-2 px-4 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 transition-colors"
          >
            Confirmar
          </button>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
};

export default TwoFactorModal;

