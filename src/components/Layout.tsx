"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate, Link } from "react-router-dom";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { Bell, User, Search, MessageSquare, Clock, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Layout({ children }: { children: React.ReactNode }) {
  const { userProfile } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!userProfile?.id) return;
    // Placeholder for real notification logic
    const mockNotifs = [
      {
        id: "1",
        message: "Welcome to LoadSaathi!",
        is_read: false,
        created_at: new Date().toISOString(),
      },
    ];
    setNotifications(mockNotifs);
    setUnreadCount(mockNotifs.filter((n) => !n.is_read).length);
  }, [userProfile?.id]);

  const navItems = userProfile?.user_type === 'trucker' ? [
    { label: "Dashboard", path: "/trucker/dashboard", icon: <Clock className="h-4 w-4" /> },
    { label: "Post Trip", path: "/trucker/post-trip", icon: <Truck className="h-4 w-4" /> },
    { label: "Find Goods", path: "/trucker/browse-shipments", icon: <Search className="h-4 w-4" /> },
    { label: "My Trips", path: "/trucker/my-trips", icon: <Truck className="h-4 w-4" /> },
  ] : [
    { label: "Dashboard", path: "/shipper/dashboard", icon: <Clock className="h-4 w-4" /> },
    { label: "Post Load", path: "/shipper/post-shipment", icon: <Search className="h-4 w-4" /> },
    { label: "Find Trucks", path: "/browse-trucks", icon: <Truck className="h-4 w-4" /> },
    { label: "My Loads", path: "/shipper/my-shipments", icon: <Search className="h-4 w-4" /> },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <nav className="bg-white border-b sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-4">
          <div className="flex justify-between h-16">
            <div className="flex items-center space-x-8">
              <Link to="/" className="flex items-center gap-2">
                <Truck className="h-8 w-8 text-orange-600" />
                <span className="text-xl font-bold text-gray-900 hidden sm:block">
                  LoadSaathi
                </span>
              </Link>
              
              <div className="hidden md:flex space-x-1">
                {navItems.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    className="px-3 py-2 rounded-md text-sm font-medium text-gray-600 hover:text-orange-600 hover:bg-orange-50 transition-colors flex items-center gap-2"
                  >
                    {item.icon}
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>

            <div className="flex items-center space-x-2 sm:space-x-4">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="relative">
                    <Bell className="h-5 w-5 text-gray-600" />
                    {unreadCount > 0 && (
                      <span className="absolute top-1.5 right-1.5 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full border-2 border-white animate-pulse">
                        {unreadCount}
                      </span>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-80">
                  <DropdownMenuLabel>Notifications</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {notifications.length === 0 ? (
                    <div className="p-4 text-center text-sm text-gray-500">
                      No notifications yet
                    </div>
                  ) : (
                    notifications.map((notif) => (
                      <DropdownMenuItem key={notif.id} className="p-3 cursor-default focus:bg-gray-50">
                        <div className="flex flex-col gap-1">
                          <p className={`text-sm ${notif.is_read ? "text-gray-600" : "font-semibold text-gray-900"}`}>
                            {notif.message}
                          </p>
                          <p className="text-xs text-gray-400">
                            {new Date(notif.created_at).toLocaleTimeString()}
                          </p>
                        </div>
                      </DropdownMenuItem>
                    ))
                  )}
                </DropdownMenuContent>
              </DropdownMenu>

              <Link to="/profile">
                <Button variant="ghost" size="icon">
                  <User className="h-5 w-5 text-gray-600" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <main className="flex-grow">
        {children}
      </main>

      <footer className="bg-white border-t py-8 mt-auto">
        <div className="container mx-auto px-4 text-center">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <Truck className="h-6 w-6 text-orange-600" />
            <span className="text-xl font-bold text-gray-900">LoadSaathi</span>
          </div>
          <p className="text-gray-500 text-sm mb-4">
            Connecting India's truckers with shippers directly.
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
}