"use client";

import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Truck, Package, CheckCircle, ArrowRight, MapPin, Calendar, IndianRupee } from 'lucide-react';
import { useUser } from '@clerk/clerk-react';
import { supabase } from '@/integrations/supabase/client';
import IndexSkeleton from '@/components/IndexSkeleton';
import { Trip } from '@/types';

const Index = () => {
  const { isLoaded, isSignedIn, user } = useUser();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [recentTrips, setRecentTrips] = useState<Trip[]>([]);

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
  }, []);

  useEffect(() => {
    if (!isLoaded) return;
    
    if (isSignedIn && user) {
      navigate('/auth-sync');
    }
  }, [isLoaded, isSignedIn, user, navigate]);

  if (isLoading || !isLoaded) {
    return <IndexSkeleton />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-blue-50">
      <header className="container mx-auto px-4 py-6">
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

      <main>
        <section className="container mx-auto px-4 py-20 text-center">
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
            India's Truck Space <span className="text-orange-600">Marketplace</span>
          </h1>
          <p className="text-xl text-gray-600 mb-10 max-w-3xl mx-auto leading-relaxed">
            Connect directly with truckers and shippers. Fill empty truck space, save on freight costs. 
            No brokers, no commission, just pure savings.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/register?type=shipper" className="bg-orange-600 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-orange-700 transition-all shadow-lg hover:shadow-xl flex items-center justify-center">
              I'm a Shipper - Find Trucks <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
            <Link to="/register?type=trucker" className="bg-white text-orange-600 border-2 border-orange-600 px-8 py-4 rounded-lg text-lg font-semibold hover:bg-orange-50 transition-all flex items-center justify-center">
              I'm a Trucker - Earn Extra <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </div>
        </section>

        {recentTrips.length > 0 && (
          <section className="container mx-auto px-4 py-12">
            <h2 className="text-2xl font-bold text-center mb-8 text-gray-900">Recently Posted Trips</h2>
            <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
              {recentTrips.map((trip) => (
                <div key={trip.id} className="bg-white p-6 rounded-xl shadow-sm border border-orange-100 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center text-orange-600 font-bold">
                      <MapPin className="h-4 w-4 mr-1" /> {trip.origin_city}
                    </div>
                    <ArrowRight className="h-4 w-4 text-gray-300" />
                    <div className="flex items-center text-blue-600 font-bold">
                      <MapPin className="h-4 w-4 mr-1" /> {trip.destination_city}
                    </div>
                  </div>
                  <div className="space-y-2 text-sm text-gray-600 mb-4">
                    <div className="flex items-center"><Calendar className="h-4 w-4 mr-2" /> {new Date(trip.departure_date).toLocaleDateString()}</div>
                    <div className="flex items-center"><Truck className="h-4 w-4 mr-2" /> {trip.vehicle_type}</div>
                  </div>
                  <div className="flex items-center justify-between pt-4 border-t">
                    <div className="text-lg font-bold text-orange-600 flex items-center">
                      <IndianRupee className="h-4 w-4" /> {trip.price_per_tonne}/t
                    </div>
                    <Link to="/login" className="text-sm font-medium text-blue-600 hover:underline">View Details</Link>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        <section className="bg-white py-16 shadow-sm">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
              <div><div className="text-4xl font-bold text-orange-600 mb-2">12M+</div><div className="text-gray-600 font-medium">Trucks in India</div></div>
              <div><div className="text-4xl font-bold text-orange-600 mb-2">30%</div><div className="text-gray-600 font-medium">Empty Return Rate</div></div>
              <div><div className="text-4xl font-bold text-orange-600 mb-2">₹8K-15K</div><div className="text-gray-600 font-medium">Extra Earnings/Trip</div></div>
              <div><div className="text-4xl font-bold text-orange-600 mb-2">50%</div><div className="text-gray-600 font-medium">Cost Savings</div></div>
            </div>
          </div>
        </section>

        <section className="container mx-auto px-4 py-20">
          <h2 className="text-4xl font-bold text-center mb-16 text-gray-900">How LoadSaathi Works</h2>
          <div className="grid md:grid-cols-2 gap-16 max-w-6xl mx-auto">
            <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100">
              <div className="flex items-center mb-6">
                <div className="bg-orange-100 p-3 rounded-full mr-4"><Truck className="h-8 w-8 text-orange-600" /></div>
                <h3 className="text-2xl font-bold text-gray-900">For Truckers</h3>
              </div>
              <ul className="space-y-4">
                {['Post your trip with available space', 'Set your price per tonne', 'Receive booking requests instantly', 'Accept or decline as you prefer', "Get shipper's contact after acceptance", 'Earn extra on empty return trips'].map((item, idx) => (
                  <li key={idx} className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100">
              <div className="flex items-center mb-6">
                <div className="bg-blue-100 p-3 rounded-full mr-4"><Package className="h-8 w-8 text-blue-600" /></div>
                <h3 className="text-2xl font-bold text-gray-900">For Shippers</h3>
              </div>
              <ul className="space-y-4">
                {['Search available trucks by route', 'Filter by date, capacity, price', 'View trucker ratings and details', 'Send booking requests with one click', 'Pay only for space you need', 'Save up to 50% vs full truck'].map((item, idx) => (
                  <li key={idx} className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-4 text-center">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <Truck className="h-6 w-6 text-orange-400" />
            <span className="text-xl font-bold">LoadSaathi</span>
          </div>
          <p className="text-gray-400">Connecting India's truckers with shippers</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;