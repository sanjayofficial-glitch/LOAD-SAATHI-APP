import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';

const MonitoringDashboardTest = () => {
  const navigate = useNavigate();
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded-xl shadow-lg text-center">
        <h1 className="text-3xl font-bold">Monitoring Dashboard</h1>
        <p className="text-lg text-gray-600 mb-4">This is the admin monitoring center</p>
        <Button 
          onClick={() => navigate('/admin/monitoring')}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded"
        >
          Go to Monitoring Dashboard
        </Button>
      </div>
    </div>
  );
};

export default MonitoringDashboardTest;