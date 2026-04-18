import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useAuth as useClerkAuth } from '@clerk/clerk-react';
import { createClerkSupabaseClient } from '@/utils/supabaseClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Truck, Clock, TrendingUp, PlusCircle, Search, DollarSign, Calendar, MapPin, BellRing, ArrowRight, Loader2 } from 'lucide-react';
import { showError, showSuccess } from '@/utils/toast';

// Add AI search state
const [aiSearchQuery, setAiSearchQuery] = useState('');
const [aiSearchResults, setAiSearchResults] = useState<any[]>([]);

// AI search handler
const handleAiSearch = async () => {
  if (!aiSearchQuery.trim()) return;
  try {
    // Simulate AI search (replace with actual AI API call)
    const results = await fetch(`/api/ai-search?query=${encodeURIComponent(aiSearchQuery)}`)
      .then(res => res.json());
    setAiSearchResults(results);
  } catch (err) {
    showError('AI search failed');
  }
};

const TruckerDashboard = () => {
  // ... existing state and useEffect...

  return (
    <div className="container mx-auto px-4 py-8">
      {/* ... existing content ... */}

      {/* Add AI Search Section */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900">AI-Powered Search</h2>
        <div className="flex flex-col md:flex-row items-center mb-4">
          <input
            type="text"
            placeholder="Search goods, routes, or trucks"
            value={aiSearchQuery}
            onChange={e => setAiSearchQuery(e.target.value)}
            className="w-full md:w-64 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <Button
            onClick={handleAiSearch}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
          >
            <Search className="h-4 w-4 mr-2" /> Search
          </Button>
        </div>
        {aiSearchResults.length > 0 && (
          <div className="mt-4 p-4 bg-white rounded-lg shadow-sm">
            <h3 className="text-xl font-medium text-gray-800">Results</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {aiSearchResults.map((result, index) => (
                <div key={index} className="p-4 border border-gray-100 rounded-lg hover:bg-gray-50">
                  <div className="flex items-center space-x-4">
                    <div>
                      <p className="font-medium text-gray-700">{result.type}</p>
                      <p className="text-gray-600">{result.query}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">{result.suggestion}</p>
                    </div>
                  </div>
                  <div>
                    <Button
                      onClick={() => {
                        // Handle result selection
                        if (result.type === 'goods') {
                          // Navigate to goods search
                        }
                        if (result.type === 'route') {
                          // Navigate to route search
                        }
                      }}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
                    >
                      View
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ... existing content ... */}
    </div>
  );
};


export default TruckerDashboard;