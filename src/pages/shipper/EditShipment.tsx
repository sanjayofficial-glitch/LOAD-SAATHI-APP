import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

const EditShipment = () => {
  const { id } = useParams();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  const { data: shipment, isLoading } = useQuery(["shipment", id], () =>
    fetch(`/api/shipments/${id}`).then(res => res.json())
  );

  const mutation = useMutation({
    mutationFn: (data) =>
      fetch(`/api/shipments/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      // Redirect or show success message
    },
  });

  useEffect(() => {
    if (shipment) {
      setTitle(shipment.title);
      setDescription(shipment.description);
    }
  }, [shipment]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate({ title, description });
  };

  return (
    <Card className="max-w-2xl mx-auto mt-8">
      <CardHeader>
        <CardTitle>Edit Shipment</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center p-4">
            <span className="text-lg font-medium">Loading...</span>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              placeholder="Shipment title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
            <Input
              placeholder="Description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
            />
            <Button type="submit" disabled={mutation.isLoading}>
              {mutation.isLoading ? "Saving..." : "Save Changes"}
            </Button>
          </form>
        )}
      </CardContent>
    </Card>
  );
};

export default EditShipment;
