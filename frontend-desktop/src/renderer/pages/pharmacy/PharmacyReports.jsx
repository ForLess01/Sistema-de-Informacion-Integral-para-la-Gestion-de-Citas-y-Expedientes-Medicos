import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Search, Download, Calendar, BarChart, FileText, Filter } from 'lucide-react';
import pharmacyService from '../../services/pharmacyService';

const PharmacyReports = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('all');

  const { data: reports, isLoading, refetch } = useQuery({
    queryKey: ['pharmacyReports'],
    queryFn: pharmacyService.getPharmacyReports,
  });

  // Filtrar reportes basado en búsqueda y fecha
  const filteredReports = reports?.filter(report => {
    const matchesSearch = report.title.toLowerCase().includes(searchTerm.toLowerCase());
    // Aquí puedes añadir más lógica para filtrar por fecha
    return matchesSearch;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-800 to-indigo-900 p-6">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex justify-between items-center mb-8"
        >
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Reportes de Farmacia</h1>
          </div>
          <button
            className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-6 py-3 rounded-xl font-medium hover:from-blue-600 hover:to-indigo-700 transition duration-200 flex items-center"
            onClick={() => refetch()}
          >
            <Download className="h-5 w-5 mr-2" />
            Exportar
          </button>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-4 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-5 w-5" />
            <input
              type="text"
              placeholder="Buscar reportes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {filteredReports && filteredReports.map((report, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white/5 rounded-xl p-4 border border-white/10 hover:bg-white/10 transition-colors"
              >
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <h4 className="text-white font-medium">{report.title}</h4>
                    <p className="text-sm text-gray-400">
                      Generado el {new Date(report.date).toLocaleDateString()}
                    </p>
                  </div>
                  <FileText className="h-6 w-6 text-blue-300" />
                </div>
                <div className="flex justify-between items-center text-xs text-slate-300">
                  <span>{report.items} items</span>
                  <span>{report.author}</span>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default PharmacyReports;
