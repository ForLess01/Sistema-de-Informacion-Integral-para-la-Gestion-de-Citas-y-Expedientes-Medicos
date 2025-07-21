import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { PlusCircle } from 'lucide-react';
import pharmacyService from '../../services/pharmacyService';

const MedicineEntry = () => {
  const [medicationName, setMedicationName] = useState('');
  const [batchNumber, setBatchNumber] = useState('');
  const [quantity, setQuantity] = useState('');
  const [expiryDate, setExpiryDate] = useState('');

  const mutation = useMutation(pharmacyService.createMedication);

  const handleSubmit = (e) => {
    e.preventDefault();
    const newMedication = {
      name: medicationName,
      batch_number: batchNumber,
      quantity,
      expiry_date: expiryDate,
    };
    mutation.mutate(newMedication, {
      onSuccess: () => {
        console.log('Medication entry successful');
      },
      onError: () => {
        console.error('Failed to enter medication');
      },
    });
  };

  return (
    <div className="p-6 bg-white/10 rounded-2xl border border-white/20 min-h-screen">
      <h2 className="text-2xl font-bold text-white mb-4">Entrada de Medicamentos</h2>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-white mb-2">Nombre del Medicamento</label>
          <input
            type="text"
            value={medicationName}
            onChange={(e) => setMedicationName(e.target.value)}
            className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
        <div>
          <label className="block text-white mb-2">Número de Lote</label>
          <input
            type="text"
            value={batchNumber}
            onChange={(e) => setBatchNumber(e.target.value)}
            className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
        <div>
          <label className="block text-white mb-2">Cantidad</label>
          <input
            type="number"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
        <div>
          <label className="block text-white mb-2">Fecha de Vencimiento</label>
          <input
            type="date"
            value={expiryDate}
            onChange={(e) => setExpiryDate(e.target.value)}
            className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
        <button
          type="submit"
          className="w-full py-3 bg-gradient-to-r from-green-500 to-green-600 text-white font-medium rounded-xl hover:from-green-600 hover:to-green-700 transition duration-200 flex items-center justify-center"
        >
          <PlusCircle className="h-5 w-5 mr-2" />
          Agregar Medicamento
        </button>
      </form>
    </div>
  );
};

export default MedicineEntry;
