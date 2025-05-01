import React, { useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useQuery } from "@tanstack/react-query";
import { OrderWithDetails } from "@shared/schema";
import { Badge } from "@/components/ui/badge";
import { useLocation } from "wouter";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import OrderDetailsModal from "@/components/orders/OrderDetailsModal";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatPKR } from "@/lib/utils";

export default function Orders() {
  const [, navigate] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedOrder, setSelectedOrder] = useState<OrderWithDetails | null>(null);
  
  const { data: orders, isLoading } = useQuery<OrderWithDetails[]>({
    queryKey: ['/api/orders/recent', { limit: 100 }], // Get all recent orders
  });
  
  // Filter orders based on search term and status
  const filteredOrders = orders?.filter(order => {
    const matchesSearch = 
      order.orderId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.table.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.server.name.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || order.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });
  
  const getStatusBadgeClass = (status: string) => {
    switch (status.toLowerCase()) {
      case "completed":
        return "bg-success/10 text-success border-success/20";
      case "in_progress":
        return "bg-secondary/10 text-secondary border-secondary/20";
      case "preparing":
        return "bg-warning/10 text-warning border-warning/20";
      case "pending":
        return "bg-muted/10 text-muted border-muted/20";
      default:
        return "bg-muted/10 text-muted border-muted/20";
    }
  };

  return (
    <DashboardLayout title="Orders">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Orders</h1>
          <p className="text-muted">View and manage all cafe orders</p>
        </div>
        <div className="mt-4 md:mt-0">
          <Button onClick={() => navigate("/create-order")}>
            <i className="ri-add-line mr-2"></i>
            New Order
          </Button>
        </div>
      </div>
      
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Input
            placeholder="Search orders..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
          <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-muted"></i>
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="All Statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="preparing">Preparing</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      {/* Orders Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-left">
                <th className="px-4 py-3 font-medium">Order ID</th>
                <th className="px-4 py-3 font-medium">Date</th>
                <th className="px-4 py-3 font-medium">Table</th>
                <th className="px-4 py-3 font-medium">Server</th>
                <th className="px-4 py-3 font-medium">Amount</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium sr-only">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array(5).fill(0).map((_, index) => (
                  <tr key={index} className="border-t border-border">
                    <td className="px-4 py-3"><Skeleton className="h-4 w-20" /></td>
                    <td className="px-4 py-3"><Skeleton className="h-4 w-24" /></td>
                    <td className="px-4 py-3"><Skeleton className="h-4 w-16" /></td>
                    <td className="px-4 py-3"><Skeleton className="h-4 w-20" /></td>
                    <td className="px-4 py-3"><Skeleton className="h-4 w-16" /></td>
                    <td className="px-4 py-3"><Skeleton className="h-6 w-24" /></td>
                    <td className="px-4 py-3 text-right"><Skeleton className="h-8 w-8 rounded-full ml-auto" /></td>
                  </tr>
                ))
              ) : (
                filteredOrders?.map((order) => (
                  <tr 
                    key={order.id} 
                    className="border-t border-border hover:bg-gray-50 cursor-pointer"
                    onClick={() => setSelectedOrder(order)}
                  >
                    <td className="px-4 py-3">{order.orderId}</td>
                    <td className="px-4 py-3">{format(new Date(order.createdAt), "MMM d, h:mm a")}</td>
                    <td className="px-4 py-3">{order.table.name}</td>
                    <td className="px-4 py-3">{order.server.name}</td>
                    <td className="px-4 py-3 font-medium">{formatPKR(order.total)}</td>
                    <td className="px-4 py-3">
                      <Badge className={getStatusBadgeClass(order.status)} variant="outline">
                        {order.status.charAt(0).toUpperCase() + order.status.slice(1).replace("_", " ")}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted">
                        <i className="ri-more-2-fill"></i>
                      </Button>
                    </td>
                  </tr>
                ))
              )}
              
              {!isLoading && (!filteredOrders || filteredOrders.length === 0) && (
                <tr className="border-t border-border">
                  <td colSpan={7} className="px-4 py-8 text-center text-muted">
                    No orders found matching your search criteria
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
      
      {selectedOrder && (
        <OrderDetailsModal
          order={selectedOrder}
          open={!!selectedOrder}
          onClose={() => setSelectedOrder(null)}
        />
      )}
    </DashboardLayout>
  );
}
