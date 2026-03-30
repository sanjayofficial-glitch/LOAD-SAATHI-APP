import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { showSuccess, showError } from '@/utils/toast';
import { Truck, Loader2, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from "@/components/ui/alert";

const Register = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { signUp } = useAuth();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [userType, setUserType] = useState<'trucker' | 'shipper' | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const type = params.get('type');
    if (type === 'trucker' || type === 'shipper') {
      setUserType(type);
    }
  }, [location]);

  const validateForm = () => {
    if (!userType) {
      return 'Please select whether you are a Shipper or a Trucker.';
    }
    if (fullName.trim().length < 2) {
      return 'Please enter your full name.';
    }
    if (!/^\+?[\d\s-]{10,}$/.test(phone.trim())) {
      return 'Please enter a valid phone number.';
    }
    if (password.length < 6) {
      return 'Password must be at least 6 characters long.';
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    
    const validationError = validateForm();
    if (validationError) {
      setErrorMsg(validationError);
      showError(validationError);
      return;
    }

    setLoading(true);
    try {
      // userType is guaranteed to be 'trucker' | 'shipper' here due to validation
      const { error } = await signUp(email, password, userType as 'trucker' | 'shipper', fullName, phone);
      if (error) {
        setErrorMsg(error.message || 'Registration failed. Please try again.');
        showError(error.message || 'Registration failed.');
      } else {
        showSuccess('Account created! Please check your email for verification.');
        navigate('/login');
      }
    } catch (err) {
      setErrorMsg('An unexpected error occurred.');
      showError('An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-12">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-xl shadow-lg">
        <div className="text-center">
          <Truck className="h-12 w-12 text-orange-600 mx-auto mb-4" />
          <h2 className="text-3xl font-bold text-gray-900">Create Account</h2>
          <p className="text-gray-600 mt-2">Join India's truck space marketplace</p>
        </div>

        {errorMsg && (
          <Alert variant="destructive" className="bg-red-50 border-red-200 text-red-800">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{errorMsg}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-3 p-4 bg-orange-50/50 rounded-lg border border-orange-100">
            <Label className="text-orange-900 font-bold">I am a...</Label>
            <RadioGroup 
              value={userType || ''} 
              onValueChange={(v: any) => setUserType(v)} 
              className="flex space-x-6"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="shipper" id="shipper" className="border-orange-300 text-orange-600" />
                <Label htmlFor="shipper" className="cursor-pointer font-medium text-gray-700">Shipper</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="trucker" id="trucker" className="border-orange-300 text-orange-600" />
                <Label htmlFor="trucker" className="cursor-pointer font-medium text-gray-700">Trucker</Label>
              </div>
            </RadioGroup>
            {!userType && <p className="text-[10px] text-orange-600 font-medium">* Required selection</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="fullName">Full Name</Label>
            <Input 
              id="fullName" 
              placeholder="Enter your full name"
              value={fullName} 
              onChange={(e) => setFullName(e.target.value)} 
              required 
              disabled={loading}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number</Label>
            <Input 
              id="phone" 
              type="tel"
              placeholder="e.g. +91 9876543210"
              value={phone} 
              onChange={(e) => setPhone(e.target.value)} 
              required 
              disabled={loading}
            />
          </div>
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
              placeholder="Min. 6 characters"
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              required 
              disabled={loading}
            />
          </div>
          <Button 
            type="submit" 
            className="w-full bg-orange-600 hover:bg-orange-700 h-11 font-bold shadow-md" 
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating account...
              </>
            ) : 'Register'}
          </Button>
        </form>
        <p className="text-center text-gray-600">
          Already have an account? <Link to="/login" className="text-orange-600 font-medium hover:underline">Login</Link>
        </p>
      </div>
    </div>
  );
};

export default Register;