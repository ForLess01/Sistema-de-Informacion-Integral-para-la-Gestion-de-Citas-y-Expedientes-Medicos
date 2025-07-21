import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import patientService from '../services/patientService';

const PatientReports = () => {
  const [filters, setFilters] = useState({
    dateRange: '',
    status: '',
    demographics: '',
    reportType: '',
  });

  const { data, error, isLoading } = useQuery([
    'patientReports',
    filters,
  ], () => patientService.getPatients(filters), {
    keepPreviousData: true,
  });

  const handleFilterChange = (event) => {
    const { name, value } = event.target;
    setFilters((prevFilters) => ({
      ...prevFilters,
      [name]: value,
    }));
  };

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error loading patient reports</div>;

  return (
    <div className="p-6 glassmorphism">
      <h2 className="text-2xl font-bold mb-4">Patient Reports</h2>
      <div className="mb-4">
        <input
          type="text"
          name="dateRange"
          value={filters.dateRange}
          onChange={handleFilterChange}
          placeholder="Date Range"
          className="p-2 border rounded mb-2"
        />
        <input
          type="text"
          name="status"
          value={filters.status}
          onChange={handleFilterChange}
          placeholder="Status"
          className="p-2 border rounded mb-2"
        />
        <input
          type="text"
          name="demographics"
          value={filters.demographics}
          onChange={handleFilterChange}
          placeholder="Demographics"
          className="p-2 border rounded mb-2"
        />
        <input
          type="text"
          name="reportType"
          value={filters.reportType}
          onChange={handleFilterChange}
          placeholder="Report Type"
          className="p-2 border rounded mb-2"
        />
      </div>
      <div>
        {data && data.results.map((patient) => (
          <div key={patient.id} className="mb-2 p-4 border rounded">
            <h3>{`${patient.first_name} ${patient.last_name}`}</h3>
            <p>DNI: {patient.dni}</p>
            <p>Age: {patient.age}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PatientReports;

