"use client";

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabaseClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { showSuccess, showError } from '@/utils/toast';
import { 
  User, 
  Phone, 
  Building, 
  Star as StarIcon, 
  Shield, 
  Truck, 
  Package, 
  Mail, 
  Calendar,
  Lock,
  Loader2,
  CheckCircle2,
  MessageSquare
} from 'lucide-react';
import Star from '@/components/Star';
import { useUser } from '@clerk/clerk-react';

const Profile = () => {
  const { userProfile, refreshProfile } = useAuth();
  const { user } = useUser();
  const [fullName, setFullName] = useState(userProfile?.full_name || '');
  const [phone, setPhone] = useState(userProfile?.phone || '');
  const [companyName, setCompanyName] = useState(userProfile?.company_name || '');
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({ count: 0, rating: 0 });
  const [statsLoading, setStatsLoading] = useState(true);
  const [reviews, setReviews] = useState<any[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);

  useEffect(() => {
    if (userProfile) {
      setFullName(userProfile.full_name || '');
      setPhone(userProfile.phone || '');
      setCompanyName(userProfile.company_name || '');
      fetchStats();
      if (userProfile.user_type === 'trucker') {
        fetchReviews();
      }
    }
  }, [userProfile]);

  const fetchStats = async () => {
    if (!userProfile) return;
    setStatsLoading(true);
    
    try {
      if (userProfile.user_type === 'trucker') {
        const { count } = await supabase
          .from('trips')
          .select('*', { count: 'exact', head: true })
          .eq('trucker_id', userProfile.id);
        setStats({ count: count || 0, rating: userProfile.rating || 0 });
      } else {
        const { count } = await supabase
          .from('requests')
          .select('*', { count: 'exact', head: true })
          .eq('shipper_id', userProfile.id);
        setStats({ count: count || 0, rating: 0 });
      }
    } catch (err) {
      console.error("Error fetching stats:", err);
    } finally {
      setStatsLoading(false);
    }
  };

  const fetchReviews = async () => {
    if (!userProfile) return;
    setReviewsLoading(true);
    try {
      const { data, error } = await supabase
        .from('reviews')
        .select('*, shipper:users(full_name)')
        .eq('trucker_id', userProfile.id)
        .order('created_at', { ascending: false });
      
      if (data) {
        setReviews(data);
      }
    } catch (err) {
      console.error("Error fetching reviews:", err);
    } finally {
      setReviewsLoading(false);
    }
  };

  const handleUpdate = async () => {
    setLoading(true);
    const { error } = await supabase
      .from('users')
      .update({ 
        full_name: fullName, 
        phone, 
        company_name: companyName 
      })
      .eq('id', userProfile?.id);

    if (error) {
      showError(error.message);
    } else {
      showSuccess('Profile updated successfully!');
      refreshProfile();
      // Update Clerk metadata too
      await user?.update({
        firstName: fullName.split(' ')[0],
        lastName: fullName.split(' ').slice(1).join(' '),
        unsafeMetadata: {
          phone,
          company_name: companyName
        }
      });
    }
    setLoading(false);
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center border-2 border-orange-200">
            <User className="h-8 w-8 text-orange-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{userProfile?.full_name || 'User'}</h1>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="secondary" className="bg-orange-50 text-orange-700 border-orange-100">
                {userProfile?.user_type === 'trucker' ? 'Trucker' : 'Shipper'}
              </Badge>
              {userProfile?.is_verified && (
                <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-green-200">
                  <CheckCircle2 className="h-3 w-3 mr-1" /> Verified
                </Badge>
              )}
            </div>
          </div>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className={`grid w-full ${userProfile?.user_type === 'trucker' ? 'grid-cols-4' : 'grid-cols-3'} lg:w-[500px]`}>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          {userProfile?.user_type === 'trucker' && <TabsTrigger value="reviews">Reviews</TabsTrigger>}
          <TabsTrigger value="personal">Personal Info</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid gap-6 md:grid-cols-2">
            <Card className="border-orange-100 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">
                  {userProfile?.user_type === 'trucker' ? 'Total Trips' : 'Total Shipments'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="text-3xl font-bold">
                    {statsLoading ? <Loader2 className="h-6 w-6 animate-spin text-orange-600" /> : stats.count}
                  </div>
                  {userProfile?.user_type === 'trucker' ? (
                    <Truck className="h-8 w-8 text-orange-200" />
                  ) : (
                    <Package className="h-8 w-8 text-blue-200" />
                  )}
                </div>
              </CardContent>
            </Card>

            {userProfile?.user_type === 'trucker' && (
              <Card className="border-yellow-100 shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-500">Average Rating</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="text-3xl font-bold flex items-center">
                      {userProfile.rating?.toFixed(1) || '0.0'}
                      <StarIcon className="h-5 w-5 text-yellow-500 ml-2 fill-current" />
                    </div>
                    <StarIcon className="h-8 w-8 text-yellow-100" />
                  </div>
                </CardContent>
              </Card>
            )}

            <Card className="md:col-span-2 border-gray-100 shadow-sm">
              <CardHeader>
                <CardTitle>Account Summary</CardTitle>
                <CardDescription>Your basic contact and account details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                    <Mail className="h-5 w-5 text-gray-400 mr-3" />
                    <div>
                      <p className="text-xs text-gray-500">Email Address</p>
                      <p className="text-sm font-medium">{userProfile?.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                    <Phone className="h-5 w-5 text-gray-400 mr-3" />
                    <div>
                      <p className="text-xs text-gray-500">Phone Number</p>
                      <p className="text-sm font-medium">{userProfile?.phone || 'Not provided'}</p>
                    </div>
                  </div>
                  <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                    <Building className="h-5 w-5 text-gray-400 mr-3" />
                    <div>
                      <p className="text-xs text-gray-500">Company</p>
                      <p className="text-sm font-medium">{userProfile?.company_name || 'Individual'}</p>
                    </div>
                  </div>
                  <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                    <Calendar className="h-5 w-5 text-gray-400 mr-3" />
                    <div>
                      <p className="text-xs text-gray-500">Member Since</p>
                      <p className="text-sm font-medium">
                        {userProfile?.created_at ? new Date(userProfile.created_at).toLocaleDateString() : 'N/A'}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {userProfile?.user_type === 'trucker' && (
          <TabsContent value="reviews">
            <Card className="border-orange-100 shadow-sm">
              <CardHeader>
                <CardTitle>Customer Reviews</CardTitle>
                <CardDescription>What shippers are saying about your service</CardDescription>
              </CardHeader>
              <CardContent>
                {reviewsLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-orange-600" />
                  </div>
                ) : reviews.length === 0 ? (
                  <div className="text-center py-12 bg-gray-50 rounded-xl border border-dashed">
                    <MessageSquare className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">No reviews yet. Complete trips to get feedback!</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {reviews.map((review) => (
                      <div key={review.id} className="p-4 border rounded-lg bg-white">
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex items-center gap-2">
                            <div className="flex">
                              {[1, 2, 3, 4, 5].map((s) => (
                                <Star key={s} filled={review.rating >= s} className="h-4 w-4" />
                              ))}
                            </div>
                            <span className="text-sm font-bold text-gray-900">
                              {review.shipper?.full_name || 'Anonymous Shipper'}
                            </span>
                          </div>
                          <span className="text-xs text-gray-400">
                            {new Date(review.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        {review.comment && (
                          <p className="text-sm text-gray-600 italic">"{review.comment}"</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        )}

        <TabsContent value="personal">
          <Card className="border-orange-100 shadow-sm">
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
              <CardDescription>Update your profile details and contact information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input 
                      id="fullName"
                      className="pl-10"
                      value={fullName} 
                      onChange={(e) => setFullName(e.target.value)} 
                      placeholder="Enter your full name"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input 
                      id="phone"
                      className="pl-10"
                      value={phone} 
                      onChange={(e) => setPhone(e.target.value)} 
                      placeholder="+91 9876543210"
                    />
                  </div>
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="company">Company Name (Optional)</Label>
                  <div className="relative">
                    <Building className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input 
                      id="company"
                      className="pl-10"
                      value={companyName} 
                      onChange={(e) => setCompanyName(e.target.value)} 
                      placeholder="Enter your company name"
                    />
                  </div>
                </div>
              </div>
              <Button 
                onClick={handleUpdate} 
                className="w-full md:w-auto bg-orange-600 hover:bg-orange-700"
                disabled={loading}
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Save Changes
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security">
          <Card className="border-red-100 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center text-red-900">
                <Shield className="mr-2 h-5 w-5 text-red-600" />
                Security Settings
              </CardTitle>
              <CardDescription>Manage your password and account security</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="p-4 bg-red-50 rounded-lg border border-red-100">
                <div className="flex items-start gap-3">
                  <Lock className="h-5 w-5 text-red-600 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-bold text-red-900">Password Management</h4>
                    <p className="text-sm text-red-700 mt-1">
                      Need to change your password? We'll send a secure reset link to your registered email address.
                    </p>
                    <Button 
                      variant="outline" 
                      className="mt-4 border-red-200 text-red-700 hover:bg-red-100"
                      onClick={() => {/* Clerk handles password reset */}}
                    >
                      Change Password
                    </Button>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t">
                <h4 className="text-sm font-bold text-gray-900 mb-2">Account Safety</h4>
                <p className="text-sm text-gray-500">
                  Your account is protected by industry-standard encryption with Clerk. Always ensure you use a strong, unique password.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Profile;