"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  User, 
  Database,
  RefreshCw,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { showSuccess, showError } from '@/utils/toast';

const TestAuth = () => {
  const { user, userProfile, loading, signOut } = useAuth();
  
  const [dbCheck, setDbCheck] = useState<any>(null);
  const [checkingDb, setCheckingDb] = useState(false);

  const checkDatabase = async () => {
    setCheckingDb(true);
    try {
      const { data: users, error: usersError } = await supabase
        .from('users')
        .select('*')
        .limit(5);
      
      const { data: trips, error: tripsError } = await supabase
        .from('trips')
        .select('*')
        .limit(5);
      
      const { data: requests, error: requestsError } = await supabase
        .from('requests')
        .select('*')
        .limit(5);

      setDbCheck({
        users: { count: users?.length || 0, data: users, error: usersError },
        trips: { count: trips?.length || 0, data: trips, error: tripsError },
        requests: { count: requests?.length || 0, data: requests, error: requestsError },
        timestamp: new Date().toISOString()
      });
    } catch (err) {
      setDbCheck({ error: err });
    } finally {
      setCheckingDb(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      showSuccess('Logged out successfully');
    } catch (err: any) {
      showError(`Logout failed: ${err.message}`);
    }
  };

  useEffect(() => {
    if (userProfile) {
      console.log('[TestAuth] Current user profile:', userProfile);
    }
  }, [userProfile]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-blue-50 p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="text-center">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <User className="h-10 w-10 text-orange-600" />
            <h1 className="text-4xl font-bold text-gray-900">Clerk Auth Test</h1>
          </div>
          <p className="text-gray-600 text-lg">
            Test Clerk authentication with Supabase database
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          <div className="space-y-6">
            <Card className="border-orange-100 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <User className="mr-2 h-5 w-5 text-orange-600" />
                  Authentication Status
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Loading:</span>
                  <Badge variant={loading ? "destructive" : "default"} className={loading ? "bg-yellow-100 text-yellow-700" : "bg-green-100 text-green-700"}>
                    {loading ? 'Loading...' : 'Ready'}
                  </Badge>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Signed In:</span>
                  <Badge variant={user ? "default" : "outline"} className={user ? "bg-green-100 text-green-700" : "text-gray-500"}>
                    {user ? 'Yes' : 'No'}
                  </Badge>
                </div>

                {userProfile && (
                  <>
                    <Separator />
                    <div className="space-y-3">
                      <p className="text-sm font-semibold text-gray-900">Profile Data:</p>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div className="text-gray-600">Name:</div>
                        <div className="font-medium text-right">{userProfile.full_name}</div>
                        
                        <div className="text-gray-600">Email:</div>
                        <div className="font-medium text-right text-xs">{userProfile.email}</div>
                        
                        <div className="text-gray-600">Phone:</div>
                        <div className="font-medium text-right">{userProfile.phone || 'N/A'}</div>
                        
                        <div className="text-gray-600">Type:</div>
                        <div className="font-medium text-right">
                          <Badge variant={userProfile.user_type === 'trucker' ? "default" : "secondary"}>
                            {userProfile.user_type}
                          </Badge>
                        </div>
                        
                        <div className="text-gray-600">Company:</div>
                        <div className="font-medium text-right">{userProfile.company_name || 'N/A'}</div>
                        
                        <div className="text-gray-600">Rating:</div>
                        <div className="font-medium text-right">{userProfile.rating?.toFixed(1) || '0.0'}</div>
                        
                        <div className="text-gray-600">Trips:</div>
                        <div className="font-medium text-right">{userProfile.total_trips || 0}</div>
                      </div>
                    </div>
                  </>
                )}

                {user && (
                  <Button 
                    onClick={handleSignOut} 
                    variant="destructive" 
                    className="w-full mt-4"
                  >
                    Sign Out
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="border-orange-100 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Database className="mr-2 h-5 w-5 text-orange-600" />
                  Database Status
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button 
                  onClick={checkDatabase} 
                  variant="outline"
                  className="w-full"
                  disabled={checkingDb}
                >
                  {checkingDb ? (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                      Checking...
                    </>
                  ) : (
                    <>
                      <Database className="mr-2 h-4 w-4" />
                      Check Database Tables
                    </>
                  )}
                </Button>

                {dbCheck && (
                  <div className="space-y-4 mt-4">
                    <div className="border rounded-lg p-4 bg-gray-50">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-semibold text-gray-900">users table</span>
                        <Badge variant={dbCheck.users.error ? "destructive" : "default"}>
                          {dbCheck.users.count} records
                        </Badge>
                      </div>
                      {dbCheck.users.error ? (
                        <p className="text-xs text-red-600 flex items-center">
                          <XCircle className="h-3 w-3 mr-1" />
                          Error: {dbCheck.users.error.message}
                        </p>
                      ) : (
                        <p className="text-xs text-green-600 flex items-center">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Table exists and accessible
                        </p>
                      )}
                    </div>

                    <div className="border rounded-lg p-4 bg-gray-50">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-semibold text-gray-900">trips table</span>
                        <Badge variant={dbCheck.trips.error ? "destructive" : "default"}>
                          {dbCheck.trips.count} records
                        </Badge>
                      </div>
                      {dbCheck.trips.error ? (
                        <p className="text-xs text-red-600 flex items-center">
                          <XCircle className="h-3 w-3 mr-1" />
                          Error: {dbCheck.trips.error.message}
                        </p>
                      ) : (
                        <p className="text-xs text-green-600 flex items-center">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Table exists and accessible
                        </p>
                      )}
                    </div>

                    <div className="border rounded-lg p-4 bg-gray-50">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-semibold text-gray-900">requests table</span>
                        <Badge variant={dbCheck.requests.error ? "destructive" : "default"}>
                          {dbCheck.requests.count} records
                        </Badge>
                      </div>
                      {dbCheck.requests.error ? (
                        <p className="text-xs text-red-600 flex items-center">
                          <XCircle className="h-3 w-3 mr-1" />
                          Error: {dbCheck.requests.error.message}
                        </p>
                      ) : (
                        <p className="text-xs text-green-600 flex items-center">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Table exists and accessible
                        </p>
                      )}
                    </div>

                    <div className="text-xs text-gray-500 pt-2 border-t">
                      Last checked: {new Date(dbCheck.timestamp).toLocaleTimeString()}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="border-orange-100 shadow-lg">
              <CardHeader>
                <CardTitle>Testing Instructions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-gray-700">
                <div className="space-y-2">
                  <p className="font-semibold">Step 1: Check Database</p>
                  <p className="text-gray-600 ml-4">Click "Check Database Tables" to verify all tables exist and are accessible.</p>
                </div>
                
                <div className="space-y-2">
                  <p className="font-semibold">Step 2: Test Sign Up</p>
                  <p className="text-gray-600 ml-4">Go to /register, select user type, and complete the Clerk sign-up form. The profile will be auto-created in Supabase.</p>
                </div>
                
                <div className="space-y-2">
                  <p className="font-semibold">Step 3: Check Profile</p>
                  <p className="text-gray-600 ml-4">After sign-up, the profile data should appear in "Authentication Status". This confirms the integration is working.</p>
                </div>
                
                <div className="space-y-2">
                  <p className="font-semibold">Step 4: Test Login</p>
                  <p className="text-gray-600 ml-4">Sign out, then log in with your credentials. Profile should load correctly from Supabase.</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestAuth;