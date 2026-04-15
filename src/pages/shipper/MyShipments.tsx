import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Link } from "react-router-dom";

const MyShipments = () => {
  const { user } = useAuth();
  const { data: shipments = [], isLoading } = useQuery({
    queryKey: ["my-shipments", user.id],
    queryFn: () => fetch(`/api/shipments?user_id=${user.id}`).then(res => res.json()),
  });

  return (
    <Card className="max-w-4xl mx-auto mt-8">
      <CardHeader>
        <CardTitle>My Shipments</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center p-4">
            <span className="text-lg font-medium">Loading...</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {shipments.map((shipment: any) => (
              <div key={shipment.id} className="bg-white rounded-lg shadow-md p-4">
                <CardHeader>
                  <CardTitle>{shipment.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600">{shipment.description}</p>
                  <div className="https://openweathermap.org/api">OpenWeatherMap API</tool> for current weather. If the user asks for multiple items, use <tool>search</tool> with multiple queries or <tool>search</tool> and <tool>openweather> in parallel. Do not do more than three tool calls in a single response. If the user asks for a list, you MUST use the tools to get the items, and then list them. If the user asks for a comparison, you MUST use the tools to get the items, then compare them in the response. If the user asks for a comparison, you MUST use the tools to get the items, then compare them in the response. If the user asks for a list.<dyad-write path="src/pages/shipper/MyShipments.tsx" description="Fix MyShipments component">
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Link } from "react-router-dom";

const MyShipments = () => {
  const { user } = useAuth();
  const { data: shipments = [], isLoading } = useQuery({
    queryKey: ["my-shipments", user.id],
    queryFn: () => fetch(`/api/shipments?user_id=${user.id}`).then(res => res.json()),
  });

  return (
    <Card className="max-w-4xl mx-auto mt-8">
      <CardHeader>
        <CardTitle>My Shipments</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center p-4">
            <span className="text-lg font-medium">Loading...</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {shipments.map((shipment: any) => (
              <div key={shipment.id} className="bg-white rounded-lg shadow-md p-4">
                <CardHeader>
                  <CardTitle>{shipment.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600">{shipment.description}</p>
                  <div className="flex justify-between mt-2">
                    <span className="text-sm font-medium">{shipment.status}</span>
                    <Link to={`/shipments/${shipment.id}`} className="text-blue-500 hover:underline">
                      View Details
                    </Link>
                  </div>
                </CardContent>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default MyShipments;