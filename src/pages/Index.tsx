import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Truck, Package, IndianRupee, Users, CheckCircle, Database, AlertCircle } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { Badge } from '@/components/ui/badge';

const Index = () => {
  const [dbStatus, setDbStatus] = useState<'checking' | 'connected' | 'no-env' | 'no-tables'>('checking');

  useEffect(() => {
    const checkConnection = async () => {
      if (!supabase) {
        setDbStatus('no-env');
        return;
      }

      try {
        // Try to fetch from the users table to see if it exists
        const { error } = await supabase.from('users').select('id').limit(1);
        if (error) {
          if (error.code === 'PGRST116' || error.message.includes('does not exist')) {
            setDbStatus('no-tables');
          } else {
            console.error("DB Check Error:", error);
            setDbStatus('connected'); // Env is there, but maybe table is empty
          }
        } else {
          setDbStatus('connected');
        }
      } catch (e) {
        setDbStatus('no-env');
      }
    };

    checkConnection();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-blue-50">
      <header className="container mx-auto px-4 py-6">
        <nav className="flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <Truck className="h-8 w-8 text-orange-600" />
            <span className="text-2xl font-bold text-gray-900">LoadSaathi</span>
          </div>
          <div className="flex space-x-4">
            <Link to="/login" className="text-gray-600 hover:text-gray-900 font-medium">
              Login
            </Link>
            <Link 
              to="/register" 
              className="bg-orange-600 text-white px-6 py-2 rounded-lg hover:bg-orange-700 transition-colors font-medium"
            >
              Get Started
            </Link>
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
            <Link 
              to="/register?type=shipper" 
              className="bg-orange-600 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-orange-700 transition-all shadow-lg hover:shadow-xl"
            >
              I'm a Shipper - Find Trucks
            </Link>
            <Link 
              to="/register?type=trucker" 
              className="bg-white text-orange-600 border-2 border-orange-600 px-8 py-4 rounded-lg text-lg font-semibold hover:bg-orange-50 transition-all"
            >
              I'm a Trucker - Earn Extra
            </Link>
          </div>
        </section>

        <section className="bg-white py-16 shadow-sm">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
              <div>
                <div className="text-4xl font-bold text-orange-600 mb-2">12M+</div>
                <div className="text-gray-600 font-medium">Trucks in India</div>
              </div>
              <div>
                <div className="text-4xl font-bold text-orange-600 mb-2">30%</div>
                <div className="text-gray-600 font-medium">Empty Return Rate</div>
              </div>
              <div>
                <div className="text-4xl font-bold text-orange-600 mb-2">₹8K-15K</div>
                <div className="text-gray-600 font-medium">Extra Earnings/Trip</div>
              </div>
              <div>
                <div className="text-4xl font-bold text-orange-600 mb-2">50%</div>
                <div className="text-gray-600 font-medium">Cost Savings</div>
              </div>
            </div>
          </div>
        </section>

        <section className="container mx-auto px-4 py-20">
          <h2 className="text-4xl font-bold text-center mb-16 text-gray-900">How LoadSaathi Works</h2>
          <div className="grid md:grid-cols-2 gap-16 max-w-6xl mx-auto">
            <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100">
              <div className="flex items-center mb-6">
                <div className="bg-orange-100 p-3 rounded-full mr-4">
                  <Truck className="h-8 w-8 text-orange-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900">For Truckers</h3>
              </div>
              <ul className="space-y-4">
                {[
                  'Post your trip with available space',
                  'Set your price per tonne',
                  'Receive booking requests instantly',
                  'Accept or decline as you prefer',
                  "Get shipper's contact after acceptance",
                  'Earn extra on empty return trips'
                ].map((item, idx) => (
                  <li key={idx} className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700">{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100">
              <div className="flex items-center mb-6">
                <div className="bg-blue-100 p-3 rounded-full mr-4">
                  <Package className="h-8 w-8 text-blue-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900">For Shippers</h3>
              </div>
              <ul className="space-y-4">
                {[
                  'Search available trucks by route',
                  'Filter by date, capacity, price',
                  'View trucker ratings and details',
                  'Send booking requests with one click',
                  'Pay only for space you need',
                  'Save up to 50% vs full truck'
                ].map((item, idx) => (
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
          <p className="text-gray-400 mb-8">Connecting India's truckers with shippers</p>
          
          {/* Connection Status Badge */}
          <div className="inline-flex items-center px-4 py-2 rounded-full bg-gray-800 border border-gray-700">
            <Database className="h-4 w-4 mr-2 text-gray-400" />
            <span className="text-xs font-medium text-gray-400 mr-2">Supabase:</span>
            {dbStatus === 'checking' && <span className="text-xs text-gray-500 animate-pulse">Checking...</span>}
            {dbStatus === 'connected' && (
              <Badge variant="outline" className="bg-green-500/10 text-green-400 border-green-500/20">
                <CheckCircle className="h-3 w-3 mr-1" /> Connected
              </Badge>
            )}
            {dbStatus === 'no-env' && (
              <Badge variant="outline" className="bg-red-500/10 text-red-400 border-red-500/20">
                <AlertCircle className="h-3 w-3 mr-1" /> Not Connected
              </Badge>
            )}
            {dbStatus === 'no-tables' && (
              <Badge variant="outline" className="bg-yellow-500/10 text-yellow-400 border-yellow-500/20">
                <AlertCircle className="h-3 w-3 mr-1" /> Tables Missing
              </Badge>
            )}
          </div>
          {dbStatus === 'no-tables' && (
            <p className="text-[10px] text-yellow-500/60 mt-2">
              Please run the SQL schema in your Supabase SQL Editor.
            </p>
          )}
        </div>
      </footer>
    </div>
  );
};

export default Index;