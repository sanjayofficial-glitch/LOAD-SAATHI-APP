"use client";

import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import NotificationBell from './NotificationBell';
import { 
  Truck, 
  User, 
  LogOut, 
  Menu, 
  X,
  LayoutDashboard,
  Search,
  Package,
  PlusSquare,
  MessageSquare
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const Layout = ({ children }: { children: React.ReactNode }) => {
  const { userProfile, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const navItems = userProfile?.user_type === 'trucker' ? [
    { label: 'Dashboard', path: '/trucker/dashboard', icon: LayoutDashboard },
    { label: 'Post Trip', path: '/trucker/post-trip', icon: PlusSquare },
    { label: 'Find Goods', path: '/trucker/browse-shipments', icon: Search },
    { label: 'My Trips & Hub', path: '/trucker/my-trips', icon: Truck },
    { label: 'Requests', path: '/trucker/my-requests', icon: MessageSquare },
    { label: 'Messages', path: '/messages', icon: MessageSquare },
  ] : [
    { label: 'Dashboard', path: '/shipper/dashboard', icon: LayoutDashboard },
    { label: 'Post Shipment', path: '/shipper/post-shipment', icon: Package },
    { label: 'Find Trucks', path: '/browse-trucks', icon: Search },
    { label: 'My Shipments & Hub', path: '/shipper/my-shipments', icon: Package },
    { label: 'Messages', path: '/messages', icon: MessageSquare },
  ];

  const isTrucker = userProfile?.user_type === 'trucker';
  const activeClass = isTrucker 
    ? 'bg-orange-50 text-orange-700 shadow-sm' 
    : 'bg-blue-50 text-blue-700 shadow-sm';

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
                {navItems.map((item) => {
                  const isActive = location.pathname === item.path;
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                        isActive ? activeClass : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                      }`}
                    >
                      <item.icon className="h-4 w-4 mr-2" />
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center space-x-2 sm:space-x-4">
              <NotificationBell />

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center space-x-2 px-2 hover:bg-orange-50 transition-colors">
                    <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center border border-orange-200">
                      <User className="h-4 w-4 text-orange-600" />
                    </div>
                    <span className="hidden sm:block text-sm font-medium text-gray-700">
                      {userProfile?.full_name?.split(' ')[0]}
                    </span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48 animate-in fade-in slide-in-from-top-2">
                  <DropdownMenuLabel>My Account</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate('/profile')} className="cursor-pointer">
                    <User className="mr-2 h-4 w-4" />
                    Profile
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut} className="text-red-600 focus:text-red-600 cursor-pointer">
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
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setIsMenuOpen(false)}
                  className={`flex items-center px-3 py-3 rounded-md text-base font-medium ${
                    isActive ? activeClass : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <item.icon className="h-5 w-5 mr-3" />
                  {item.label}
                </Link>
              );
            })}
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
            <Link to="/about" className="hover:text-gray-600 transition-colors">About</Link>
            <Link to="/contact" className="hover:text-gray-600 transition-colors">Contact</Link>
            <Link to="/privacy" className="hover:text-gray-600 transition-colors">Privacy</Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Layout;