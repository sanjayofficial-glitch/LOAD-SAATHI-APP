import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Link } from "react-router-dom";

const BrowseShipments = () => {
  const { user } = useAuth();
  const { data: shipments = [], isLoading } = useQuery({
    queryKey: ["browse-shipments"],
    queryFn: () => fetch(`/api/shipments`).then(res => res.json())
  });

  return (
    <Card className="max-w-4xl mx-auto mt-8">>
      <CardHeader>
        <CardTitleBrowse Shipments</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center p-4">
            <span className="text-lg font-medium">Loading...</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols--3 gap4">
            {shipments.map((shipment: any) => (
              <div key={shipment.id} className="bg-white rounded-lg shadow-md p-4">
                <CardHeader>
                  <CardTitle>{shipment.title}</CardTitle>
                </CardHeader>>
                <CardContent
                  <p className="text-sm text-gray-600">{shipment.description}</p>
                  <div className="flex justify-between mt-2">
                    <span className="text-sm font-medium">{shipment.status}</span>
                    <Link to={`/shipments/${shipment.id}/edit`} className="text-blue-500 hover:underline">>Edit</Link>
                  </div
                </CardContent>>
              </div
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default BrowseShipments;

      <CardHeader>
        <CardTitle>Browse Shipments</CardTitle>
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
                    <Link to={`/shipments/${shipment.id}/edit`} className="text-blue-500 hover:underline">Edit</Link>
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

export default BrowseShipments;
