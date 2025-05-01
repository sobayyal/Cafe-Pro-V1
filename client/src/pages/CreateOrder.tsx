import React from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import OrderForm from "@/components/orders/OrderForm";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";

export default function CreateOrder() {
  const [, navigate] = useLocation();

  return (
    <DashboardLayout title="Create Order">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Create Order</h1>
          <p className="text-muted">Select items and assign to a table</p>
        </div>
        <div className="mt-4 md:mt-0">
          <Button variant="outline" onClick={() => navigate("/orders")}>
            <i className="ri-arrow-left-line mr-2"></i>
            Back
          </Button>
        </div>
      </div>

      <OrderForm />
    </DashboardLayout>
  );
}
