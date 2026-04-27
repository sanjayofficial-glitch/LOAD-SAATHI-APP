"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

const ShipmentDetail = () => {
  return (
    <div>
      <Card className="border-blue-100">
        <CardHeader className="bg-blue-50/50 border-b border-blue-100">
          <CardTitle>Shipment Detail</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Shipment detail page</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default ShipmentDetail;