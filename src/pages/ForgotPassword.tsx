import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { showSuccess, showError } from '@/utils/toast';
import { Truck, Mail, ArrowLeft, Loader2 } from 'lucide-react';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const { resetPassword } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim()) {
      showError('Please enter your email address');
      return;
    }

    setLoading(true);
    try {
      const { error } = await resetPassword(email);
      
      if (error) {
        showError(error.message || 'Failed to send reset email');
      } else {
        setSubmitted(true);
        showSuccess('Password reset email sent! Check your inbox.');
      }
    } catch (err: any) {
      showError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-xl shadow-lg">
          <div className="text-center">
            <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Mail className="h-8 w-8 text-green-600" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900">Check Your Email</h2>
            <p className="text-gray-600 mt-4">
              We've sent a password reset link to <strong>{email}</strong>. 
              Please check your inbox and follow the instructions to reset your password.
            </p>
            <p className="text-sm text-gray-500 mt-4">
              Didn't receive the email? Check your spam folder or try again.
            </p>
          </div>
                    <div className="space-y-4">
            <Button 
              onClick={() => setSubmitted(false)}
              variant="outline"
              className="w-full"
            >
              Try a different email
            </Button>
            <Button 
              onClick={() => navigate('/login')}
              className="w-full bg-orange-600 hover:bg-orange-700"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Login
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-xl shadow-lg">
        <div className="text-center">
          <Link to="/" className="flex items-center justify-center space-x-2 group">
            <Truck className="h-12 w-12 text-orange-600" />
          </Link>
          <h2 className="text-3xl font-bold text-gray-900 mt-4">Forgot Password?</h2>
          <p className="text-gray-600 mt-2">
            No worries! Enter your email and we'll send you a reset link.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-gray-700 font-medium">Email Address</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input 
                id="email"
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-10"
                required
                disabled={loading}
              />
            </div>
            <p className="text-xs text-gray-500">
              Enter the email associated with your account
            </p>
          </div>

          <Button 
            type="submit"
            className="w-full bg-orange-600 hover:bg-orange-700 h-11 font-medium"
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Sending reset link...
              </>
            ) : (
              'Send Reset Link'
            )}
          </Button>
        </form>

        <div className="text-center">
          <Link 
            to="/login" 
            className="text-sm text-orange-600 hover:text-orange-700 font-medium inline-flex items-center"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Login
          </Link>
        </div>
      </div>
    );
  );
};

export default ForgotPassword;