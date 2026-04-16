"use client";

import React from "react";
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
import { 
  User, 
  Search, 
  Clock, 
  Truck, 
  Menu, 
  LogOut, 
  MessageSquare, 
  History,
  PlusCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import NotificationBell from "./NotificationBell";

export default function Layout({ children }: { children: React.ReactNode }) {
  const { userProfile, signOut } = useAuth();
  const navigate = useNavigate();

  const navItems = userProfile?.user_type === 'trucker' ? [
    { label: "Dashboard", path: "/trucker/dashboard", icon: <Clock className="h-4 w-4" /> },
    { label: "Post Trip", path: "/trucker/post-trip", icon: <PlusCircle className="h-4 w-4" /> },
    { label: "Find Goods", path: "/trucker/browse-shipments", icon: <Search className="h-4 w-4" /> },
    { label: "My Trips", path: "/trucker/my-trips", icon: <Truck className="h-4 w-4" /> },
    { label: "History", path: "/trucker/history", icon: <History className="h-4 w-4" /> },
  ] : [
    { label: "Dashboard", path: "/shipper/dashboard", icon: <Clock className="h-4 w-4" /> },
    { label: "Post Load", path: "/shipper/post-shipment", icon: <PlusCircle className="h-4 w-4" /> },
    { label: "Find Trucks", path: "/browse-trucks", icon: <Truck className="h-4 w-4" /> },
    { label: "My Loads", path: "/shipper/my-shipments", icon: <Search className="h-4 w-4" /> },
    { label: "History", path: "/shipper/history", icon: <History className="h-4 w-4" /> },
  ];

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

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
              
              <div className="hidden lg:flex space-x-1">
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

            <div className="flex items-center space-x-1 sm:space-x-3">
              <NotificationBell />

              <Link to="/messages">
                <Button variant="ghost" size="icon" className="text-gray-600">
                  <MessageSquare className="h-5 w-5" />
                </Button>
              </Link>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="text-gray-600">
                    <Menu className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>Navigation</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {navItems.map((item) => (
                    <DropdownMenuItem key={item.path} asChild>
                      <Link to={item.path} className="flex items-center gap-2 cursor-pointer">
                        {item.icon}
                        {item.label}
                      </Link>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="text-gray-600">
                    <User className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>
                    <div className="flex flex-col">
                      <span>{userProfile?.full_name || "My Account"}</span>
                      <span className="text-xs font-normal text-gray-500 capitalize">{userProfile?.user_type}</span>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to="/profile" className="flex items-center gap-2 cursor-pointer">
                      <User className="h-4 w-4" />
                      Profile Settings
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={handleSignOut}
                    className="flex items-center gap-2 cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50"
                  >
                    <LogOut className="h-4 w-4" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
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
            <Link to="/" className="hover:text-gray-600">Home</Link>
            <Link to="/profile" className="hover:text-gray-600">Profile</Link>
            <Link to="/messages" className="hover:text-gray-600">Messages</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}