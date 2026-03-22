import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabaseClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Truck, 
  User, 
  Mail, 
  Phone, 
  Building, 
  Shield, 
  CheckCircle, 
  XCircle, 
  RefreshCw,
  LogOut,
  Eye,
  Database
} from 'lucide-react';
import { showSuccess, showError } from '@/utils/toast';

const TestAuth = () => {
  const { user, userProfile, loading, signUp, signIn, signOut, refreshProfile } = useAuth();
  
  const [testEmail, setTestEmail] = useState(`test${Date.now()}@example.com`);
  const [testPassword, setTestPassword] = useState('Test123456');
  const [testFullName, setTestFullName] = useState('Test User');
  const [testPhone, setTestPhone] = useState('+91 9876543210');
  const [testUserType, setTestUserType] = useState<'trucker' | 'shipper'>('shipper');
  const [testCompany, setTestCompany] = useState('Test Company');
  
  const [dbCheck, setDbCheck] = useState<any>(null);
  const [checkingDb, setCheckingDb] = useState(false);

  const checkDatabase = async () => {
    setCheckingDb(true);
    try {
      // Check if users table exists and has data
      const { data: users, error: usersError } = await supabase
        .from('users')
        .select('*')
        .limit(5);
      
      // Check trips table
      const { data: trips, error: tripsError } = await supabase
        .from('trips')
        .select('*')
        .limit(5);
      
      // Check requests table
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

  const handleTestSignUp = async () => {
    try {
      const { error } = await signUp(
        testEmail,
        testPassword,
        testUserType,
        testFullName,
        testPhone,
        testCompany
      );
      
      if (error) {
        showError(`Sign up failed: ${error.message}`);
      } else {
        showSuccess('Sign up successful! Check your email (or check the console for dev mode).');
        // Wait a moment then refresh profile
        setTimeout(async () => {
          await refreshProfile();
        }, 1000);
      }
    } catch (err: any) {
      showError(`Unexpected error: ${err.message}`);
    }
  };

  const handleTestLogin = async () => {
    try {
      const { error } = await signIn(testEmail, testPassword);
      if (error) {
        showError(`Login failed: ${error.message}`);
      } else {
        showSuccess('Login successful!');
      }
    } catch (err: any) {
      showError(`Unexpected error: ${err.message}`);
    }
  };

  const handleTestLogout = async () => {
    try {
      await signOut();
      showSuccess('Logged out successfully');
    } catch (err: any) {
      showError(`Logout failed: ${err.message}`);
    }
  };

  const handleQuickFill = (type: 'trucker' | 'shipper') => {
    setTestUserType(type);
    setTestEmail(`test${type}${Date.now()}@example.com`);
    setTestFullName(type === 'trucker' ? 'Rahul Kumar' : 'Priya Sharma');
    setTestPhone('+91 9876543210');
    setTestCompany(type === 'trucker' ? 'Kumar Transport' : 'Sharma Enterprises');
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
            <Truck className="h-10 w-10 text-orange-600" />
            <h1 className="text-4xl font-bold text-gray-900">LoadSaathi Auth Test</h1>
          </div>
          <p className="text-gray-600 text-lg">
            Test authentication flow and database connectivity
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Left Column - Auth Actions */}
          <div className="space-y-6">
            {/* Current Status */}
            <Card className="border-orange-100 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <User className="mr-2 h-5 w-5 text-orange-600" />
                  Current Authentication Status
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
                  <span className="text-sm font-medium">User Logged In:</span>
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
                    onClick={handleTestLogout} 
                    variant="destructive" 
                    className="w-full mt-4"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign Out
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* Test Actions */}
            <Card className="border-orange-100 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <RefreshCw className="mr-2 h-5 w-5 text-orange-600" />
                  Test Authentication
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <Button 
                      onClick={() => handleQuickFill('shipper')}
                      variant="outline"
                      className="border-blue-200 text-blue-700 hover:bg-blue-50"
                    >
                      <Building className="mr-2 h-4 w-4" />
                      Fill Shipper Data
                    </Button>
                    <Button 
                      onClick={() => handleQuickFill('trucker')}
                      variant="outline"
                      className="border-green-200 text-green-700 hover:bg-green-50"
                    >
                      <Truck className="mr-2 h-4 w-4" />
                      Fill Trucker Data
                    </Button>
                  </div>

                  <div className="space-y-3">
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input 
                        id="email"
                        type="email"
                        value={testEmail}
                        onChange={(e) => setTestEmail(e.target.value)}
                        placeholder="test@example.com"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="password">Password</Label>
                      <Input 
                        id="password"
                        type="password"
                        value={testPassword}
                        onChange={(e) => setTestPassword(e.target.value)}
                        placeholder="Min. 6 characters"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="fullName">Full Name</Label>
                      <Input 
                        id="fullName"
                        value={testFullName}
                        onChange={(e) => setTestFullName(e.target.value)}
                        placeholder="Enter full name"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone</Label>
                      <Input 
                        id="phone"
                        value={testPhone}
                        onChange={(e) => setTestPhone(e.target.value)}
                        placeholder="+91 9876543210"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>User Type</Label>
                      <RadioGroup 
                        value={testUserType} 
                        onValueChange={(v: any) => setTestUserType(v)}
                        className="flex space-x-4"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="shipper" id="shipper-test" />
                          <Label htmlFor="shipper-test" className="cursor-pointer">Shipper</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="trucker" id="trucker-test" />
                          <Label htmlFor="trucker-test" className="cursor-pointer">Trucker</Label>
                        </div>
                      </RadioGroup>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="company">Company (Optional)</Label>
                      <Input 
                        id="company"
                        value={testCompany}
                        onChange={(e) => setTestCompany(e.target.value)}
                        placeholder="Company name"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <Button 
                      onClick={handleTestSignUp}
                      className="bg-orange-600 hover:bg-orange-700"
                      disabled={loading}
                    >
                      <Shield className="mr-2 h-4 w-4" />
                      Sign Up
                    </Button>
                    <Button 
                      onClick={handleTestLogin}
                      variant="outline"
                      className="border-orange-200 text-orange-700 hover:bg-orange-50"
                      disabled={loading}
                    >
                      <Eye className="mr-2 h-4 w-4" />
                      Login
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Database Check */}
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

            {/* Instructions */}
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
                  <p className="text-gray-600 ml-4">Fill in the form (use the quick-fill buttons) and click "Sign Up". In development mode, Supabase will sign you up without email verification.</p>
                </div>
                
                <div className="space-y-2">
                  <p className="font-semibold">Step 3: Check Profile</p>
                  <p className="text-gray-600 ml-4">After sign-up, the profile data should appear in "Current Authentication Status". This confirms the trigger is working.</p>
                </div>
                
                <div className="space-y-2">
                  <p className="font-semibold">Step 4: Test Login</p>
                  <p className="text-gray-600 ml-4">Sign out, then use the same credentials to log in. Profile should load correctly.</p>
                </div>

                <div className="space-y-2">
                  <p className="font-semibold">Step 5: Verify RLS</p>
                  <p className="text-gray-600 ml-4">The database check should show all tables are accessible. If you see errors, RLS policies may need adjustment.</p>
                </div>
              </CardContent>
            </Card>

            {/* Console Log */}
            <Card className="border-orange-100 shadow-lg">
              <CardHeader>
                <CardTitle>Console Output</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-gray-600">
                  Open browser DevTools (F12) and check the Console tab for detailed logs. 
                  Look for <code className="bg-gray-100 px-1 rounded">[AuthContext]</code> and <code className="bg-gray-100 px-1 rounded">[TestAuth]</code> messages.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestAuth;