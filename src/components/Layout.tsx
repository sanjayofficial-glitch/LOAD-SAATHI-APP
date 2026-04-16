"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { Bell, User, LogOut, Search, MessageSquare, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function Layout({ children }: { children: React.ReactNode }) {
  const { userProfile } = useAuth();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Fetch notifications (placeholder implementation)
  useEffect(() => {
    if (!userProfile?.id) return;
    const mockNotifs = [
      {
        id: "1",
        message: "New booking request",
        is_read: false,
        created_at: new Date().toISOString(),
      },
    ];
    setNotifications(mockNotifs);
    setUnreadCount(mockNotifs.filter((n) => !n.is_read).length);
  }, [userProfile?.id]);

  // Navigation items - proper object syntax
  const navItems = [
    {
      label: "Dashboard",
      path: "/trucker/dashboard",
      icon: <User className="h-5 w-5 text-teal-600" />,
    },
    {
      label: "Post Trip",
      path: "/trucker/post-trip",
      icon: <Search className="h-5 w-5 text-teal-600" />,
    },
    {
      label: "Find Goods",
      path: "/trucker/browse-shipments",
      icon: <Search className="h-5 w-5 text-teal-600" />,
    },
    {
      label: "My Trips & Bookings",
      path: "/trucker/my-trips",
      icon: <User className="h-5 w-5 text-teal-600" />,
    },
    {
      label: "My Activity",
      path: "/trucker/my-activity",
      icon: <Clock className="h-5 w-5 text-teal-600" />,
    },
    {
      label: "Messages",
      path: "/messages",
      icon: <MessageSquare className="h-5 w-5 text-teal-600" />,
    },
  ];

  return (
    <nav className="bg-white border-b sticky top-0 z-50 shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex justify-between h-16">
          <div className="flex items-center space-x-2">
            <div className="flex items-center gap-2">
              <User className="h-8 w-8 text-teal-600" />
              <span className="text-lg font-semibold text-gray-900 hidden sm:block">
                LoadSaathi
              </span>
            </div>
            <div className="hidden md:flex ml-10 space-x-1">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  href={item.path}
                  className="text-sm font-medium transition-colors hover:text-teal-600"
                >
                  {item.icon}
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2 sm:space-x-4">
          <DropdownMenu onOpenChange={(open) => setIsMenuOpen(open)}>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <Bell className="h-5 w-5 text-gray-600" />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full border-2 border-white animate-pulse">
                    {unreadCount}
                  </span>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80 animate-in fade-in slide-in-from-top-2">
              <DropdownMenuLabel>Notifications</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {notifications.length === 0 ? (
                <div className="p-4 text-center text-sm text-gray-500">
                  No notifications yet
                </div>
              ) : (
                notifications.map((notif) => (
                  <DropdownMenuItem
                    key={notif.id}
                    className="p-3 cursor-default focus:bg-gray-50"
                  >
                    <div className="flex flex-col gap-1">
                      <p className={`text-sm ${notif.is_read ? "text-gray-600" : "font-semibold text-gray-900"}`}>
                        {notif.message}
                      </p>
                      <p className="text-xs text-gray-400">
                        {new Date(notif.created_at).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </DropdownMenuItem>
                ))}
              </>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </nav>

    <main className="flex-grow">
      {children}
    </main>

    <footer className="bg-white border-t py-8">
      <div className="container mx-auto px-4 text-center">
        <div className="flex items-center justify-center space-x-2 mb-4">
          <User className="h-6 w-6 text-teal-600" />
          <span className="text-xl font-bold text-gray-900">
            LoadSaathi
          </span>
        </div>
        <p className="text-gray-500 text-sm mb-4">
          Connecting India's truckers with small shippers directly.
        </p>
        <div className="flex justify-center space-x-6 text-sm text-gray-400">
          <Link href="/about" className="hover:text-gray-600 transition-colors">
            About          </Link>
          <Link href="/contact" className="hover:text-gray-600 transition-colors">
            Contact
          </Link>
          <Link href="/privacy" className="hover:text-gray-600 transition-colors">
            Privacy
          </Link>
        </div>
      </div>
    </footer>
  );
}