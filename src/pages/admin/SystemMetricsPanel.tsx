import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';

const SystemMetricsPanel: React.FC<{ metrics: any }> = ({ metrics }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchMetrics = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase.rpc('get_system_metrics', {});
      if (error) throw error;
      setMetrics(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
    const interval = setInterval(fetchMetrics, 30000); // 30-second polling
    return () => clearInterval(interval);
  }, [metrics]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    </div>
  );

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
        Error: {error}
      </div>
    );
  }

  return (
    <Card>
      <CardHeader className="flex items-center justify-between">
        <CardTitle>System Metrics</CardTitle>
        <div className="flex items-center gap-2">
          <Loader2 className="h-4 w-4" />
          <span className="text-xs text-gray-500">Refreshing...</span>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex justify-between items-center">
          <div className="text-2xl font-bold text-blue-600">
            {metrics.active_connections} Active Connections
          </div>
        </div>
        <div className="flex justify-between items-center">
          <div className="text-2xl font-bold text-green-600">
            {metrics.api_response_time}ms Avg Response Time
          </div>
        </div>
        <div className="flex justify-between items-center">
          <div className="text-2xl font-bold text-red-600">
            {metrics.error_rate}% Error Rate
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4 mt-4">
          <div className="bg-gray-50 p-3 rounded-lg">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-blue-100 rounded-full"></div>
              <span>Uptime: 99.9%</span>
            </div>
          </div>
          <div className="bg-gray-50 p-3 rounded-lg">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-green-100 rounded-full"></div>
              <span>Active Requests: {metrics.active_requests}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default SystemMetricsPanel;