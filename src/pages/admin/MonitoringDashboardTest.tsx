import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ShieldCheck, ArrowRight } from 'lucide-react';

const MonitoringDashboardTest = () => {
  const navigate = useNavigate();
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800 p-4">
      <div className="bg-white p-10 rounded-3xl shadow-2xl text-center max-w-md w-full border border-slate-100">
        <div className="bg-orange-100 w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6 rotate-3">
          <ShieldCheck className="h-12 w-12 text-orange-600" />
        </div>
        <h1 className="text-3xl font-black text-slate-900 mb-2">Admin Portal</h1>
        <p className="text-slate-500 mb-8">
          Access the real-time Command Center to monitor system health, revenue, and logistics flow.
        </p>
        <Button 
          onClick={() => navigate('/admin/monitoring')}
          className="w-full bg-orange-600 hover:bg-orange-700 text-white h-14 rounded-xl text-lg font-bold shadow-lg shadow-orange-200 transition-all group"
        >
          Launch Dashboard
          <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
        </Button>
        <p className="mt-6 text-xs text-slate-400 uppercase tracking-widest font-bold">
          Authorized Personnel Only
        </p>
      </div>
    </div>
  );
};

export default MonitoringDashboardTest;