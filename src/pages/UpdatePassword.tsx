import React, { useState, useEffect, useCallback } from 'react';
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
  const [status, setStatus] = useState<'checking' | 'ready' | 'error'>('checking');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const navigate = useNavigate();

  const verifyResetToken = useCallback(async () => {
    try {
      // Check for token in URL (hash or query params)
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const queryParams = new URLSearchParams(window.location.search);
      
      const hasToken = hashParams.has('access_token') || hashParams.has('code') || 
                      queryParams.has('access_token') || queryParams.has('code');
      
      if (!hasToken) {
        setErrorMsg('Invalid or expired reset link. Please request a new one.');
        setStatus('error');
        return;
      }

      // Try to get session directly first
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        console.log('Session already established');
        setStatus('ready');
        return;
      }

      // If no session, try to recover from the token in URL
      // Supabase should handle this automatically, but we need to wait
      const maxAttempts = 15;
      let attempts = 0;
      
      while (attempts < maxAttempts) {
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        
        if (currentSession) {
          console.log('Session established after waiting');
          setStatus('ready');
          return;
        }
        
        // Also check for user
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          console.log('User authenticated');
          setStatus('ready');
          return;
        }
        
        attempts++;
        // Wait 1 second between attempts
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      
      // If we get here, we couldn't establish a session
      setErrorMsg('Unable to verify reset link. The link may have expired or you took too long to respond.');
      setStatus('error');
      
    } catch (err) {
      console.error('Error in password reset verification:', err);
      setErrorMsg('An error occurred while verifying your reset link. Please try again.');
      setStatus('error');
    }
  }, []);

  useEffect(() => {
    verifyResetToken();
  }, [verifyResetToken]);

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

      // Clear URL parameters
      window.history.replaceState({}, document.title, window.location.pathname);

      // Sign out and redirect
      await supabase.auth.signOut();
      
      setTimeout(() => {
        navigate('/login', { replace: true });
      }, 2000);
    } catch (err: any) {
      showError(err.message || 'An unexpected error occurred');
      setLoading(false);
    }
  };

  // Loading state
  if (status === 'checking') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 via-white to-blue-50">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="relative mb-6">
            <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto">
              <Lock className="h-10 w-10 text-orange-600" />
            </div>
            <div className="absolute inset-0 flex items-center justify-center">
              <Loader2 className="h-20 w-20 animate-spin text-orange-600 opacity-30" />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Verifying Reset Link</h2>
          <p className="text-gray-600 mb-4">
            Please wait while we verify your password reset link...
          </p>
          <p className="text-sm text-gray-500">
            This usually takes a few seconds
          </p>
        </div>
      </div>
    );
  }

  // Error state
  if (status === 'error' && errorMsg) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 via-white to-blue-50">
        <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-2xl shadow-lg">
          <div className="text-center">
            <div className="bg-red-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertCircle className="h-10 w-10 text-red-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Invalid or Expired Link</h2>
            <p className="text-gray-600 mb-6">
              {errorMsg}
            </p>
          </div>
          <div className="space-y-3">
            <Button 
              onClick={() => navigate('/forgot-password')}
              className="w-full bg-orange-600 hover:bg-orange-700 h-11 font-medium"
            >
              Request New Reset Link
            </Button>
            <Button 
              onClick={() => navigate('/login')}
              variant="outline"
              className="w-full h-11 font-medium border-orange-200 text-orange-700 hover:bg-orange-50"
            >
              Back to Login
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Success state
  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 via-white to-blue-50">
        <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-2xl shadow-lg">
          <div className="text-center">
            <div className="bg-green-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="h-10 w-10 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Password Updated!</h2>
            <p className="text-gray-600 mb-4">
              Your password has been successfully updated.
            </p>
            <p className="text-sm text-gray-500 mb-6">
              Redirecting you to login in 2 seconds...
            </p>
            <Button 
              onClick={() => navigate('/login', { replace: true })}
              className="w-full bg-orange-600 hover:bg-orange-700 h-11 font-medium"
            >
              Go to Login Now
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Main form
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 via-white to-blue-50">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-2xl shadow-lg">
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
            <Label htmlFor="password" className="text-sm font-medium text-gray-700">
              New Password
            </Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter new password (min. 6 characters)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-10 pr-10 h-11"
                required
                disabled={loading}
                minLength={6}
                autoFocus
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                tabIndex={-1}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <p className="text-xs text-gray-500">
              Must be at least 6 characters long
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword" className="text-sm font-medium text-gray-700">
              Confirm New Password
            </Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                id="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder="Confirm your new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="pl-10 pr-10 h-11"
                required
                disabled={loading}
                minLength={6}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                tabIndex={-1}
                aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
              >
                {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <Button
            type="submit"
            className="w-full bg-orange-600 hover:bg-orange-700 h-11 font-medium text-base shadow-md hover:shadow-lg transition-all"
            disabled={loading || !password || !confirmPassword}
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

        <p className="text-center text-sm text-gray-500">
          After updating, you'll need to log in with your new password.
        </p>
      </div>
    </div>
  );
};

export default UpdatePassword;