import React from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Pill, CheckCircle, AlertCircle } from 'lucide-react';
import pharmacyService from '../../services/pharmacyService';

const PrescriptionDispensing = () => {
  const { data: prescriptions, isLoading } = useQuery({
    queryKey: ['dispensations'],
    queryFn: pharmacyService.getDispensations,
  });

  const mutation = useMutation(pharmacyService.createDispensation);

  const handleDispense = (prescriptionId) => {
    mutation.mutate(prescriptionId, {
      onSuccess: () => {
        console.log(`Prescription ${prescriptionId} dispensed successfully.`);
      },
      onError: () => {
        console.error(`Failed to dispense prescription ${prescriptionId}.`);
      },
    });
  };

  return (
    <div className="p-6 bg-white/10 rounded-2xl border border-white/20 min-h-screen">
      <h2 className="text-2xl font-bold text-white mb-4">Dispensación de Recetas</h2>
      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <div className="space-y-6">
          {prescriptions && prescriptions.map((prescription) => (
            <motion.div
              key={prescription.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white/5 rounded-xl p-4 border border-white/10"
            >
              <div className="flex justify-between items-center">
                <div>
                  <h4 className="text-white font-medium">
                    {prescription.patientName} - {prescription.medicationName}
                  </h4>
                  <p className="text-sm text-gray-400">
                    Cantidad: {prescription.quantity}
                  </p>
                </div>
                <button
                  className={`p-2 rounded-lg transition-colors ${
                    prescription.dispensed
                      ? 'text-green-400 hover:text-green-500'
                      : 'text-red-400 hover:text-red-500'
                  }`}
                  onClick={() => handleDispense(prescription.id)}
                  disabled={prescription.dispensed}
                >
                  {prescription.dispensed ? (
                    <CheckCircle className="h-6 w-6" />
                  ) : (
                    <AlertCircle className="h-6 w-6" />
                  )}
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PrescriptionDispensing;
