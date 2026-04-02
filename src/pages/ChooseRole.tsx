"use client";

import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Toaster } from '@/components/ui/toaster';
import { Loader2 } from '@/components/ui/loader';
import { showSuccess, showError } from '@/utils/toast';

const ChooseRole = () => {
  const { user, isLoaded } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRoleSelection = async (role: "shipper" | "trucker") => {
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      const supabaseToken = await session.getToken({ template: "supabase" });
      if (!supabaseToken) throw new Error("No Supabase token available");

      const supabase = createClerkSupabaseClient(supabaseToken);
      
      const { data, error: upsertError } = await supabase
        .from('users')
        .upsert({
          id: user.id,
          user_type: role,
          ...user
        }, { on_conflict: 'id' });

      if (upsertError) throw upsertError;

      showSuccess(`Welcome ${role === 'shipper' ? 'Shipper' : 'Trucker'}!`);
      navigate(role === 'shipper' ? '/shipper/dashboard' : '/trucker/dashboard', { replace: true });
    } catch (err: any) {
      console.error("[ChooseRole] Error:", err);
      setError(err.message || "Failed to set role");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-2xl w-full mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Welcome to LoadSaathi!</h1>
          <p className="text-gray-600">Please select your role to get started</p>
        </div>

        <div className="space-y-6">
          <button
            onClick={() => handleRoleSelection("shipper")}
            className="flex items-center justify-between w-full bg-orange-600 hover:bg-orange-700 transition-colors"
          >
            <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
              <User className="h-8 w-8 text-gray-900" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">I am a Shipper</h2>
              <p className="text-sm text-gray-500">Find trucks and ship your goods efficiently</p>
            </div>
          </button>

          <button
            onClick={() => handleRoleSelection("trucker")}
            className="flex items-center justify-between w-full"
          >
            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
              <Truck className="h-8 w-8 text-gray-900" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">I am a Trucker</h2>
              <p className="text-sm text-gray-500">Find loads and maximize your earnings</p>
            </div>
          </button>
        </div>

        {loading && (
          <div className="text-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-orange-600" />
            <p className="text-sm text-gray-500 mt-2">Setting up your account...</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChooseRole;