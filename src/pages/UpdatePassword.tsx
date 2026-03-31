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

  const validateResetToken = useCallback(async () => {
    try {
      setStatus('checking');
      setErrorMsg(null);

      // 1. First check if we already have a session (Supabase often handles the token automatically)
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) throw sessionError;

      // If we have a session, check if it's a recovery session or just a valid one
      if (session) {
        console.log("[UpdatePassword] Valid session found, proceeding to reset.");
        setStatus('ready');
        return;
      }

      // 2. If no session, check for token/code in URL (hash or query params)
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const queryParams = new URLSearchParams(window.location.search);
      
      const accessToken = hashParams.get('access_token') || queryParams.get('access_token');
      const code = hashParams.get('code') || queryParams.get('code');
      const type = hashParams.get('type') || queryParams.get('type');
      
      if (accessToken || code || type === 'recovery') {
        // Give Supabase a moment to process the URL token if it just landed
        console.log("[UpdatePassword] Token detected in URL, waiting for session...");
        
        // Small delay to allow Supabase client to initialize session from URL
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const { data: { session: retrySession } } = await supabase.auth.getSession();
        if (retrySession) {
          setStatus('ready');
          return;
        }
      }

      // 3. If we get here, we truly have no reset context
      setErrorMsg('Invalid or missing reset token. Please request a new password reset link from the "Forgot Password" page.');
      setStatus('error');
    } catch (err: any) {
      console.error('[UpdatePassword] Validation error:', err);
      setErrorMsg('Unable to verify reset link. It may have expired or been used already.');
      setStatus('error');
    }
  }, []);

  useEffect(() => {
    validateResetToken();
  }, [validateResetToken]);

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

      // Sign out and redirect after delay
      setTimeout(async () => {
        await supabase.auth.signOut();
        navigate('/login', { replace: true });
      }, 2000);
    } catch (err: any) {
      showError(err.message || 'An unexpected error occurred');
      setLoading(false);
    }
  };

  if (status === 'checking') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="h-10 w-10 animate-spin text-orange-600 mx-auto mb-4" />
          <p className="text-gray-600">Verifying reset link...</p>
        </div>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="max-w-md w-full bg-white p-8 rounded-xl shadow-lg text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Reset Link Error</h2>
          <p className="text-gray-600 mb-6">{errorMsg}</p>
          <Link to="/forgot-password">
            <Button className="w-full bg-orange-600 hover:bg-orange-700">Request New Link</Button>
          </Link>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="max-w-md w-full bg-white p-8 rounded-xl shadow-lg text-center">
          <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Success!</h2>
          <p className="text-gray-600 mb-6">Your password has been updated. Redirecting to login...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-xl shadow-lg">
        <div className="text-center">
          <Truck className="h-12 w-12 text-orange-600 mx-auto mb-4" />
          <h2 className="text-3xl font-bold text-gray-900">Set New Password</h2>
          <p className="text-gray-600 mt-2">Please enter your new password below</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="password">New Password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Min. 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-10"
                required
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
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
                placeholder="Repeat new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="pl-10"
                required
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
              >
                {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <Button 
            type="submit" 
            className="w-full bg-orange-600 hover:bg-orange-700 h-11" 
            disabled={loading}
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Update Password
          </Button>
        </form>
      </div>
    </div>
  );
};

export default UpdatePassword;