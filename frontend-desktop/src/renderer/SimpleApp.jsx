import React from "react";

const SimpleApp = () => {
  return (
    <div className="min-h-screen bg-blue-500 text-white p-8">
      <h1 className="text-4xl font-bold mb-6">🏥 Sistema Médico Integral</h1>
      <div className="bg-white text-black p-4 rounded-lg">
        <p className="text-lg">Si puedes leer este texto con estilos, Tailwind funciona correctamente.</p>
      </div>
      <div className="mt-4 space-y-2">
        <button className="bg-green-500 hover:bg-green-600 px-4 py-2 rounded text-white font-semibold">
          Botón Verde
        </button>
        <button className="bg-red-500 hover:bg-red-600 px-4 py-2 rounded text-white font-semibold ml-4">
          Botón Rojo  
        </button>
      </div>
    </div>
  );
};

export default SimpleApp;
