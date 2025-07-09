import React from 'react';
import { motion } from 'framer-motion';

const AuthLayout = ({ children }) => {
  return (
    <div className="min-h-screen liquid-gradient relative overflow-hidden flex items-center justify-center p-4">
      {/* Burbujas flotantes de fondo */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          className="bubble w-64 h-64 -top-32 -left-32"
          animate={{
            y: [0, -30, 0],
            x: [0, 30, 0],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        <motion.div
          className="bubble w-96 h-96 -bottom-48 -right-48"
          animate={{
            y: [0, 30, 0],
            x: [0, -30, 0],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        <motion.div
          className="bubble w-48 h-48 top-1/2 left-1/4"
          animate={{
            y: [0, -20, 0],
          }}
          transition={{
            duration: 6,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      </div>
      
      {/* Contenido */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
};

export default AuthLayout;
