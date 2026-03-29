import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabaseClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { showSuccess, showError } from '@/utils/toast';
import { Truck, Eye, EyeOff, Lock, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';

const UpdatePassword = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isVerifying, setIsVerifying] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const checkSession = async () => {
      try {
        // Check if we have a recovery token in the URL (hash or query params)
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const queryParams = new URLSearchParams(window.location.search);
        
        const hasAccessToken = hashParams.has('access_token') || queryParams.has('access_token');
        const hasCode = hashParams.has('code') || queryParams.has('code');
        
        if (hasAccessToken || hasCode) {
          console.log('Password reset token detected in URL');
          // The token is in the URL, Supabase will handle it automatically
          // Just wait a moment for the session to be established
          await new Promise(resolve => setTimeout(resolve, 1500));
          
          // Now check if we have a session
          const { data: { session }, error } = await supabase.auth.getSession();
          
          if (session) {
            console.log('Session established for password reset');
            setIsVerifying(false);
          } else {
            // Try to get user directly
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
              console.log('User authenticated for password reset');
              setIsVerifying(false);
            } else {
              setErrorMsg('Unable to verify reset link. The link may have expired or is invalid.');
              setIsVerifying(false);
            }
          }
        } else {
          // No token in URL - this is an invalid access
          console.log('No password reset token found in URL');
          setErrorMsg('Invalid or expired reset link. Please request a new one.');
          setIsVerifying(false);
        }
      } catch (err) {
        console.error('Error checking session:', err);
        setErrorMsg('An error occurred. Please try again.');
        setIsVerifying(false);
      }
    };

    checkSession();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      showError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      showError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: password,
      });

      if (error) {
        showError(error.message || 'Failed to update password');
        setLoading(false);
        return;
      }

      setSuccess(true);
      showSuccess('Password updated successfully!');

      // Sign out to force a fresh login with the new password
      await supabase.auth.signOut();

      // Redirect to login after a short delay
      setTimeout(() => {
        navigate('/login', { replace: true });
      }, 3000);
    } catch (err: any) {
      showError(err.message || 'An unexpected error occurred');
      setLoading(false);
    }
  };

  if (isVerifying) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-orange-600 mx-auto mb-4" />
          <p className="text-gray-600 font-medium">Verifying reset link...</p>
          <p className="text-sm text-gray-500 mt-2">This may take a few seconds</p>
        </div>
      </div>
    );
  }

  if (errorMsg) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-xl shadow-lg">
          <div className="text-center">
            <div className="bg-red-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="h-8 w-8 text-red-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Invalid or Expired Link</h2>
            <p className="text-gray-600 mt-4">
              {errorMsg}
            </p>
          </div>
          <div className="space-y-4">
            <Button 
              onClick={() => navigate('/forgot-password')}
              className="w-full bg-orange-600 hover:bg-orange-700"
            >
              Request New Reset Link
            </Button>
            <Button 
              onClick={() => navigate('/login')}
              variant="outline"
              className="w-full"
            >
              Back to Login
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-xl shadow-lg">
          <div className="text-center">
            <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Password Updated!</h2>
            <p className="text-gray-600 mt-4">
              Your password has been successfully updated.
            </p>
            <p className="text-sm text-gray-500 mt-2">
              Redirecting to login in 3 seconds...
            </p>
          </div>
          <Button 
            onClick={() => navigate('/login', { replace: true })}
            className="w-full bg-orange-600 hover:bg-orange-700"
          >
            Go to Login Now
          </Button>
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
          <h2 className="text-2xl font-bold text-gray-900 mt-4">Set New Password</h2>
          <p className="text-gray-600 mt-2">
            Enter your new password below
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="password">New Password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter new password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-10 pr-10"
                required
                disabled={loading}
                minLength={6}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                id="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder="Confirm new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="pl-10 pr-10"
                required
                disabled={loading}
                minLength={6}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                tabIndex={-1}
              >
                {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <Button
            type="submit"
            className="w-full bg-orange-600 hover:bg-orange-700 h-11 font-medium"
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Updating Password...
              </>
            ) : (
              'Update Password'
            )}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default UpdatePassword;