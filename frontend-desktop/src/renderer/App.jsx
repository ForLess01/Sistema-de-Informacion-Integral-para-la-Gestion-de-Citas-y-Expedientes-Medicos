import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import MedicalDashboard from './pages/MedicalDashboard';
import MedicalRecordManager from './components/medical/MedicalRecordManager';
import PharmacyManager from './components/pharmacy/PharmacyManager';
import EmergencyManager from './components/emergency/EmergencyManager';

const App = () => {
  return (
    <Router>
      <div className="min-h-screen bg-gray-900 text-white">
        <Routes>
          <Route path="/" element={<MedicalDashboard />} />
          <Route path="/medical-records" element={<MedicalRecordManager />} />
          <Route path="/pharmacy" element={<PharmacyManager />} />
          <Route path="/emergency" element={<EmergencyManager />} />
          {/* Agrega más rutas según sea necesario */}
        </Routes>
      </div>
    </Router>
  );
};

export default App;

