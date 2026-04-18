<<<<<<< SEARCH
import { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useAuth as useClerkAuth } from '@clerk/clerk-react';
import { useSupabase } from '@/hooks/useSupabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Truck, 
  MapPin, 
  Calendar, 
  IndianRupee, 
  ArrowLeft, 
  Loader2,
  CheckCircle, 
  AlertCircle, 
  Star, 
  PlusCircle,
  Filter,
  Eye,
  X,
  CheckCircle,
  XCircle,
  MessageSquare,
  Phone,
  Users} from 'lucide-react';
import { showError, showSuccess } from '@/utils/toast';
import { 
  notifyShipperOfRequestAccepted, 
  notifyShipperOfRequestDeclined, 
} from '@/utils/notifications';

const StatusBadge = ({ status }: { status: string }) => {
  const cfg: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    accepted: 'bg-green-100 text-green-700 border-green-200',
    active: 'bg-green-100 text-green-700 border-green-200',
    declined: 'bg-red-100 text-red-700 border-red-200',
    cancelled: 'bg-gray-100 text-gray-600 border-gray-200',
  };
  return (
    <Badge className={`font-semibold border ${cfg[status] ?? 'bg-gray-100 text-gray-600'}`}>
      {status.toUpperCase()}
    </Badge>
  );
};

const TruckerDashboard = () => {
  // ... existing code ...
  
  return (/* JSX */);
};

export default TruckerDashboard;
=======
import { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useAuth as useClerkAuth } from '@clerk/clerk-react';
import { useSupabase } from '@/hooks/useSupabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Truck, 
  MapPin, 
  Calendar,   IndianRupee, 
  ArrowLeft, 
  Loader2,
  CheckCircle, 
  AlertCircle,   Star, 
  PlusCircle,
  Filter,
  Eye,
  X,
  Check,
  XCircle,
  MessageSquare,
  Phone,
  Users
} from 'lucide-react';
import { showError, showSuccess } from '@/utils/toast';
import { notifyShipperOfRequestAccepted, notifyShipperOfRequestDeclined } from '@/utils/notifications';

// ─── Status Badge Helper ───────────────────────────────────────────────────────
const StatusBadge = ({ status }: { status: string }) => {
  const cfg: Record<string, string> = {
    pending: 'bg-orange-100 text-orange-800 border-orange-200',
    accepted: 'bg-green-100 text-green-700 border-green-200',
    active: 'bg-blue-100 text-blue-700 border-blue-200',
    declined: 'bg-red-100 text-red-700 border-red-200',
    cancelled: 'bg-gray-100 text-gray-600 border-gray-200',
  };
  return (
    <Badge className={`font-semibold border ${cfg[status] ?? 'bg-gray-100 text-gray-600'}`}>
      {status.toUpperCase()}
    </Badge>
  );
};

// ... rest of component unchanged ...