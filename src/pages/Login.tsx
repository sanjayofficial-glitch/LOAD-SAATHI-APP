import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { showSuccess, showError } from '@/utils/toast';
import { Truck, Loader2, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from "@/components/ui/alert";

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const { signIn, userProfile } = useAuth();
  const navigate = useNavigate();

  // If user is already logged in, redirect them
  useEffect(() => {
    if (userProfile) {
      console.log("[Login] User profile detected, redirecting...", userProfile.user_type);
      if (userProfile.user_type === 'trucker') {
        navigate('/trucker/dashboard', { replace: true });
      } else {
        navigate('/shipper/dashboard', { replace: true });
      }
    }
  }, [userProfile, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);
    
    try {
      const { error } = await signIn(email, password);
      if (error) {
        let message = error.message;
        if (message === 'Invalid login credentials') {
          message = 'Invalid email or password. Please try again.';
        } else if (message.includes('Email not confirmed')) {
          message = 'Please check your email and confirm your account before logging in.';
        }
        setErrorMsg(message);
        showError(message);
        setLoading(false); // Only stop loading on error      } else {
        console.log("[Login] Sign in successful, waiting for profile...");
        showSuccess('Logged in successfully!');
        // We keep loading=true until the useEffect redirects us
      }
    } catch (err) {
      setErrorMsg('An unexpected error occurred. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-xl shadow-lg">
        <div className="text-center">
          <Truck className="h-12 w-12 text-orange-600 mx-auto mb-4" />
          <h2 className="text-3xl font-bold text-gray-900">Welcome back</h2>
          <p className="text-gray-600 mt-2">Sign in to your LoadSaathi account</p>
        </div>

        {errorMsg && (
          <Alert variant="destructive" className="bg-red-50 border-red-200 text-red-800">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{errorMsg}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input 
              id="email" 
              type="email" 
              placeholder="name@example.com"
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              required 
              disabled={loading}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input 
              id="password" 
              type="password" 
              placeholder="••••••••"
              value={password}               onChange={(e) => setPassword(e.target.value)} 
              required 
              disabled={loading}
            />
          </div>
          
          <div className="flex items-center justify-end">
            <Link 
              to="/forgot-password" 
              className="text-sm text-orange-600 hover:text-orange-700 font-medium"
            >
              Forgot password?
            </Link>
          </div>

          <Button 
            type="submit" 
            className="w-full bg-orange-600 hover:bg-orange-700 h-11" 
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Signing in...
              </>
            ) : 'Sign In'}
          </Button>
        </form>
        <p className="text-center text-gray-600">
          Don't have an account? <Link to="/register" className="text-orange-600 font-medium hover:underline">Register</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;