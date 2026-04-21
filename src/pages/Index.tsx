"use client";

import React, { useEffect, useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Truck, Package, CheckCircle, ArrowRight, MapPin, Calendar, IndianRupee } from 'lucide-react';
import { useUser } from '@clerk/clerk-react';
import { supabase } from '@/integrations/supabase/client';
import IndexSkeleton from '@/components/IndexSkeleton';
import { Trip } from '@/types';
import LottieLoader from '@/components/LottieLoader';

// Add type assertion for goods_description
declare module '@/types' {
  interface Trip {
    goods_description?: string;
  }
}

const Index = () => {
  const { isLoaded, isSignedIn, user } = useUser();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [recentTrips, setRecentTrips] = useState<Trip[]>([]);
  const [videoEnded, setVideoEnded] = useState(false);
  const [showSplash, setShowSplash] = useState(true);

  // Path to the Lottie file in public folder
  const lottieUrl = "/loader.lottie";

  useEffect(() => {
    const fetchRecentTrips = async () => {
      try {
        const { data, error } = await supabase
          .from('trips')
          .select('*')
          .eq('status', 'active')
          .order('created_at', { ascending: false })
          .limit(3);
        
        if (!error && data) {
          setRecentTrips(data as unknown as Trip[]);
        }
      } catch (err) {
        console.error("Error fetching trips for landing page:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRecentTrips();

    // Check if user has already seen splash in this session
    const hasSeen = localStorage.getItem('hasSeenSplash') === 'true';
    if (hasSeen) {
      setShowSplash(false);
      setVideoEnded(true);
    }
  }, []);

  // Handle redirection AFTER animation ends or if splash is skipped
  useEffect(() => {
    if (!isLoaded || !videoEnded) return;
    
    if (isSignedIn && user) {
      navigate('/auth-sync');
    }
  }, [isLoaded, isSignedIn, user, navigate, videoEnded]);

  const handleAnimationEnd = () => {
    localStorage.setItem('hasSeenSplash', 'true');
    setVideoEnded(true);
    setShowSplash(false);
  };

  if (isLoading || !isLoaded) {
    return <IndexSkeleton />;
  }

  // If we are showing the splash (Lottie), we don't show the rest of the content yet
  if (showSplash && !videoEnded) {
    return (
      <div className="h-screen w-full bg-white flex items-center justify-center">
        <LottieLoader 
          src={lottieUrl} 
          onComplete={handleAnimationEnd} 
        />
        <button 
          onClick={handleAnimationEnd}
          className="absolute bottom-10 right-10 bg-gray-100 hover:bg-gray-200 text-gray-600 px-6 py-2 rounded-full border border-gray-200 transition-all z-50 text-sm font-medium shadow-sm"
        >
          Skip Intro
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white animate-in fade-in duration-1000">
      <header className="container mx-auto px-4 py-6 border-b border-gray-100">
        <nav className="flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <Truck className="h-8 w-8 text-orange-600" />
            <span className="text-2xl font-bold text-gray-900">LoadSaathi</span>
          </div>
          <div className="flex space-x-4">
            <Link to="/login" className="text-gray-600 hover:text-gray-900 font-medium px-6 py-2 rounded-lg hover:bg-gray-50 transition-colors">Login</Link>
            <Link to="/register" className="bg-orange-600 text-white px-6 py-2 rounded-lg hover:bg-orange-700 transition-colors font-medium">Get Started</Link>
          </div>
        </nav>
      </header>

      <main className="flex flex-col">
        <section className="relative py-20 bg-gradient-to-br from-orange-50 to-white overflow-hidden">
          <div className="container mx-auto px-4 relative z-10">
            <div className="max-w-4xl mx-auto text-center">
              <h1 className="text-5xl md:text-7xl font-bold text-gray-900 mb-6 leading-tight">
                India's Truck Space <span className="text-orange-600">Marketplace</span>
              </h1>
              <p className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto leading-relaxed">
                Connect directly with truckers and shippers. Fill empty truck space, save on freight costs.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link to="/register?type=shipper" className="bg-orange-600 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-orange-700 transition-all shadow-lg hover:shadow-xl flex items-center justify-center">
                  Find Trucks <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
                <Link to="/register?type=trucker" className="bg-white text-orange-600 border-2 border-orange-600 px-8 py-4 rounded-lg text-lg font-semibold hover:bg-orange-50 transition-all flex items-center justify-center">
                  Earn Extra <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </div>
            </div>
          </div>
        </section>

        {recentTrips.length > 0 && (
          <section className="container mx-auto px-4 py-16">
            <h2 className="text-3xl font-bold text-center mb-12 text-gray-900">Recently Posted Trips</h2>
            <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
              {recentTrips.map((trip) => (
                <div key={trip.id} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-xl transition-all duration-300 group">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center space-x-3">
                      <div className="bg-orange-100 p-3 rounded-full">
                        <Package className="h-6 w-6 text-orange-600" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-gray-900">From {trip.origin_city}</h3>
                        <p className="text-sm text-gray-600">{trip.goods_description}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 gap-3 text-sm text-gray-500">
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 mr-2 text-orange-600" /> 
                      {new Date(trip.departure_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </div>
                    <div className="flex items-center">
                      <Package className="h-4 w-4 mr-2 text-blue-600" /> 
                      {trip.available_capacity_tonnes}t available
                    </div>
                    <div className="flex items-center font-semibold text-gray-900">
                      <IndianRupee className="h-4 w-4 mr-1" /> {trip.price_per_tonne.toLocaleString()} /t
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        <section className="bg-gray-50 py-20">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-12 text-center">
              <div className="space-y-2">
                <div className="text-5xl font-extrabold text-orange-600">12M+</div>
                <div className="text-gray-500 font-medium uppercase tracking-widest text-xs">Trucks in India</div>
              </div>
              <div className="space-y-2">
                <div className="text-5xl font-extrabold text-orange-600">30%</div>
                <div className="text-gray-500 font-medium uppercase tracking-widest text-xs">Empty Return Rate</div>
              </div>
              <div className="space-y-2">
                <div className="text-5xl font-extrabold text-orange-600">₹15K</div>
                <div className="text-gray-500 font-medium uppercase tracking-widest text-xs">Extra Earnings/Trip</div>
              </div>
              <div className="space-y-2">
                <div className="text-5xl font-extrabold text-orange-600">50%</div>
                <div className="text-gray-500 font-medium uppercase tracking-widest text-xs">Cost Savings</div>
              </div>
            </div>
          </div>
        </section>

        <section className="container mx-auto px-4 py-24">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">How LoadSaathi Works</h2>
            <p className="text-gray-500 max-w-2xl mx-auto">A simple, transparent marketplace for India's logistics ecosystem.</p>
          </div>
          <div className="grid md:grid-cols-2 gap-12 max-w-6xl mx-auto">
            <div className="bg-white p-10 rounded-3xl shadow-sm border border-gray-100 hover:border-orange-200 transition-colors">
              <div className="flex items-center mb-8">
                <div className="bg-orange-100 p-4 rounded-2xl mr-5"><Truck className="h-10 w-10 text-orange-600" /></div>
                <h3 className="text-3xl font-bold text-gray-900">For Truckers</h3>
              </div>
              <ul className="space-y-5">
                {['Post your trip with available space', 'Set your price per tonne', 'Receive booking requests instantly', 'Accept or decline as you prefer', "Get shipper's contact after acceptance", 'Earn extra on empty return trips'].map((item, idx) => (
                  <li key={idx} className="flex items-start">
                    <div className="bg-green-100 p-1 rounded-full mr-4 mt-1">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    </div>
                    <span className="text-gray-700 text-lg">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-white p-10 rounded-3xl shadow-sm border border-gray-100 hover:border-blue-200 transition-colors">
              <div className="flex items-center mb-8">
                <div className="bg-blue-100 p-4 rounded-2xl mr-5"><Package className="h-10 w-10 text-blue-600" /></div>
                <h3 className="text-3xl font-bold text-gray-900">For Shippers</h3>
              </div>
              <ul className="space-y-5">
                {['Search available trucks by route', 'Filter by date, capacity, price', 'View trucker ratings and details', 'Send booking requests with one click', 'Pay only for space you need', 'Save up to 50% vs full truck'].map((item, idx) => (
                  <li key={idx} className="flex items-start">
                    <div className="bg-green-100 p-1 rounded-full mr-4 mt-1">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    </div>
                    <span className="text-gray-700 text-lg">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-gray-900 text-white py-20">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center border-b border-gray-800 pb-12 mb-12">
            <div className="flex items-center space-x-2 mb-8 md:mb-0">
              <Truck className="h-10 w-10 text-orange-500" />
              <span className="text-3xl font-bold">LoadSaathi</span>
            </div>
            <div className="flex space-x-8 text-gray-400 font-medium">
              <a href="#" className="hover:text-white transition-colors">About</a>
              <a href="#" className="hover:text-white transition-colors">Contact</a>
              <a href="#" className="hover:text-white transition-colors">Privacy</a>
              <a href="#" className="hover:text-white transition-colors">Terms</a>
            </div>
          </div>
          <div className="text-center text-gray-500 text-sm">
            © {new Date().getFullYear()} LoadSaathi. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;