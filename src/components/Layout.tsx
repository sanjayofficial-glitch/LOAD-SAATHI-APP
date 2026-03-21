import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabaseClient';
import { Notification } from '@/types';
import { Button } from '@/components/ui/button';
import { 
  Truck, 
  Bell, 
  User, 
  LogOut, 
  Menu, 
  X,
  LayoutDashboard,
  Search,
  Package,
  PlusSquare
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { showSuccess } from '@/utils/toast';

const Layout = ({ children }: { children: React.ReactNode }) => {
  const { userProfile, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchNotifications = useCallback(async () => {
    if (!userProfile?.id) return;
    
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userProfile.id)
      .order('created_at', { ascending: false })
      .limit(10);

    if (data) {
      setNotifications(data as Notification[]);
      setUnreadCount(data.filter(n => !n.is_read).length);
    }
  }, [userProfile?.id]);

  useEffect(() => {
    if (userProfile) {
      fetchNotifications();
      
      const subscription = supabase
        .channel(`notifications:${userProfile.id}`)
        .on('postgres_changes', { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'notifications',
          filter: `user_id=eq.${userProfile.id}`
        }, (payload) => {
          const newNotif = payload.new as Notification;
          setNotifications(prev => [newNotif, ...prev].slice(0, 10));
          setUnreadCount(prev => prev + 1);
          showSuccess(newNotif.message);
        })
        .subscribe();

      return () => {
        subscription.unsubscribe();
      };
    }
  }, [userProfile, fetchNotifications]);

  const markAsRead = async () => {
    if (unreadCount === 0 || !userProfile?.id) return;
    
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', userProfile.id)
      .eq('is_read', false);
    
    if (!error) {
      setUnreadCount(0);
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const navItems = userProfile?.user_type === 'trucker' ? [
    { label: 'Dashboard', path: '/trucker/dashboard', icon: LayoutDashboard },
    { label: 'Post Trip', path: '/trucker/post-trip', icon: PlusSquare },
    { label: 'My Trips', path: '/trucker/my-trips', icon: Truck },
  ] : [
    { label: 'Dashboard', path: '/shipper/dashboard', icon: LayoutDashboard },
    { label: 'Find Trucks', path: '/browse-trucks', icon: Search },
    { label: 'My Shipments', path: '/shipper/my-shipments', icon: Package },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <nav className="bg-white border-b sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-4">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link to="/" className="flex items-center space-x-2 group">
                <Truck className="h-8 w-8 text-orange-600 transition-transform group-hover:scale-110" />
                <span className="text-xl font-bold text-gray-900 hidden sm:block">LoadSaathi</span>
              </Link>
              
              <div className="hidden md:flex ml-10 space-x-1">
                {navItems.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      location.pathname === item.path
                        ? 'bg-orange-50 text-orange-700 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    <item.icon className="h-4 w-4 mr-2" />
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>

            <div className="flex items-center space-x-2 sm:space-x-4">
              <DropdownMenu onOpenChange={(open) => open && markAsRead()}>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="relative hover:bg-orange-50">
                    <Bell className="h-5 w-5 text-gray-600" />
                    {unreadCount > 0 && (
                      <span className="absolute top-1.5 right-1.5 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full border-2 border-white">
                        {unreadCount}
                      </span>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-80">
                  <DropdownMenuLabel>Notifications</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <div className="max-h-80 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="p-4 text-center text-sm text-gray-500">
                        No notifications yet
                      </div>
                    ) : (
                      notifications.map((notif) => (
                        <DropdownMenuItem key={notif.id} className="p-3 cursor-default focus:bg-gray-50">
                          <div className="flex flex-col gap-1">
                            <p className={`text-sm ${notif.is_read ? 'text-gray-600' : 'font-semibold text-gray-900'}`}>
                              {notif.message}
                            </p>
                            <p className="text-xs text-gray-400">
                              {new Date(notif.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                        </DropdownMenuItem>
                      ))
                    )}
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center space-x-2 px-2 hover:bg-orange-50">
                    <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                      <User className="h-4 w-4 text-orange-600" />
                    </div>
                    <span className="hidden sm:block text-sm font-medium text-gray-700">
                      {userProfile?.full_name?.split(' ')[0]}
                    </span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuLabel>My Account</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate('/profile')}>
                    <User className="mr-2 h-4 w-4" />
                    Profile
                  </DropdownMenuItem>
                  {userProfile?.user_type === 'trucker' && (
                    <DropdownMenuItem onClick={() => navigate('/admin')}>
                      <LayoutDashboard className="mr-2 h-4 w-4" />
                      Admin Panel
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut} className="text-red-600 focus:text-red-600">
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <Button
                variant="ghost"
                size="icon"
                className="md:hidden"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
              >
                {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </Button>
            </div>
          </div>
        </div>

        {isMenuOpen && (
          <div className="md:hidden border-t bg-white px-4 py-2 space-y-1 animate-in slide-in-from-top duration-200">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setIsMenuOpen(false)}
                className={`flex items-center px-3 py-3 rounded-md text-base font-medium ${
                  location.pathname === item.path
                    ? 'bg-orange-50 text-orange-700'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <item.icon className="h-5 w-5 mr-3" />
                {item.label}
              </Link>
            ))}
          </div>
        )}
      </nav>

      <main className="flex-grow">
        {children}
      </main>

      <footer className="bg-white border-t py-8">
        <div className="container mx-auto px-4 text-center">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <Truck className="h-6 w-6 text-orange-600" />
            <span className="text-xl font-bold text-gray-900">LoadSaathi</span>
          </div>
          <p className="text-gray-500 text-sm mb-4">
            Connecting India's truckers with small shippers directly.
          </p>
          <div className="flex justify-center space-x-6 text-sm text-gray-400">
            <Link to="/about" className="hover:text-gray-600">About</Link>
            <Link to="/contact" className="hover:text-gray-600">Contact</Link>
            <Link to="/privacy" className="hover:text-gray-600">Privacy</Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Layout;