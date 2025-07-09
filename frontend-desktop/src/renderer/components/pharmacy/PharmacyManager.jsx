import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Pill } from 'lucide-react';
import pharmacyService from '../../services/pharmacyService';

const PharmacyManager = () => {
  const { data: inventory, isLoading } = useQuery({
    queryKey: ['pharmacyInventory'],
    queryFn: pharmacyService.getInventory,
  });

  return (
    <div className="p-6 bg-white/10 rounded-2xl border border-white/20">
      <h2 className="text-2xl font-bold text-white mb-4">
        Inventario de Farmacia
      </h2>
      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <div className="space-y-6">
          {inventory.map((med, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white/5 rounded-xl p-4 border border-white/10"
            >
              <div className="flex justify-between items-center">
                <div>
                  <h4 className="text-white font-medium">
                    {med.name}
                  </h4>
                  <p className="text-sm text-gray-400">
                    {med.dosage} - {med.quantity} disponibles
                  </p>
                </div>
                <Pill className="h-6 w-6 text-white" />
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PharmacyManager;

