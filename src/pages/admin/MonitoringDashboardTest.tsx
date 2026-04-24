import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useAuth as useClerkAuth } from '@clerk/clerk-react';
import { createClerkSupabaseClient } from '@/utils/supabaseClient';
import { Button } from '@/components/ui/button';
import { ShieldCheck, ArrowRight, UserCheck, Loader2 } from 'lucide-react';
import { showSuccess, showError } from '@/utils/toast';

const MonitoringDashboardTest = () => {
  const navigate = useNavigate();
  const { userProfile, refreshProfile } = useAuth();
  const { getToken } = useClerkAuth();
  const [loading, setLoading] = useState(false);

  const isAdmin = userProfile?.user_type === 'admin';

  const handleBecomeAdmin = async () => {
    if (!userProfile) {
      showError("Please log in first");
      return;
    }
    
    setLoading(true);
    try {
      const token = await getToken({ template: 'supabase' });
      if (!token) throw new Error("No auth token");
      
      const supabase = createClerkSupabaseClient(token);
      const { error } = await supabase
        .from('users')
        .update({ user_type: 'admin' })
        .eq('id', userProfile.id);

      if (error) throw error;

      await refreshProfile();
      showSuccess("You are now an Admin!");
    } catch (err: any) {
      showError(err.message || "Failed to update role");
    } finally {
      setLoading(false);
    }
  };
  
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

        <div className="space-y-4">
          {!isAdmin ? (
            <Button 
              onClick={handleBecomeAdmin}
              disabled={loading}
              variant="outline"
              className="w-full border-orange-200 text-orange-600 h-14 rounded-xl text-lg font-bold hover:bg-orange-50"
            >
              {loading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <UserCheck className="mr-2 h-5 w-5" />}
              Set my role to Admin
            </Button>
          ) : (
            <div className="bg-green-50 text-green-700 p-4 rounded-xl mb-4 flex items-center justify-center font-bold">
              <UserCheck className="mr-2 h-5 w-5" /> Role: Admin Verified
            </div>
          )}

          <Button 
            onClick={() => navigate('/admin/monitoring')}
            disabled={!isAdmin}
            className="w-full bg-orange-600 hover:bg-orange-700 text-white h-14 rounded-xl text-lg font-bold shadow-lg shadow-orange-200 transition-all group disabled:opacity-50"
          >
            Launch Dashboard
            <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
          </Button>
        </div>

        <p className="mt-6 text-xs text-slate-400 uppercase tracking-widest font-bold">
          Authorized Personnel Only
        </p>
      </div>
    </div>
  );
};

export default MonitoringDashboardTest;