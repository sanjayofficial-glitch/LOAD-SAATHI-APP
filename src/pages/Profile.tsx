import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabaseClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { showSuccess, showError } from '@/utils/toast';
import { User, Phone, Building, Star } from 'lucide-react';

const Profile = () => {
  const { userProfile, refreshProfile } = useAuth();
  const [fullName, setFullName] = useState(userProfile?.full_name || '');
  const [phone, setPhone] = useState(userProfile?.phone || '');

  const handleUpdate = async () => {
    const { error } = await supabase.from('users').update({ full_name: fullName, phone }).eq('id', userProfile?.id);
    if (error) showError(error.message);
    else {
      showSuccess('Profile updated!');
      refreshProfile();
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-md">
      <Card>
        <CardHeader>
          <CardTitle>My Profile</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Full Name</Label>
            <Input value={fullName} onChange={(e) => setFullName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Phone</Label>
            <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>
          <Button onClick={handleUpdate} className="w-full bg-orange-600 hover:bg-orange-700">Update Profile</Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default Profile;