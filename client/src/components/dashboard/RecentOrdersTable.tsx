import React from "react";
import { Card } from "@/components/ui/card";
import { OrderWithDetails } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import OrderDetailsModal from "../orders/OrderDetailsModal";
import { formatPKR } from "@/lib/utils";

interface RecentOrdersTableProps {
  limit?: number;
}

export default function RecentOrdersTable({ limit = 5 }: RecentOrdersTableProps) {
  const [selectedOrder, setSelectedOrder] = React.useState<OrderWithDetails | null>(null);
  
  const { data: orders, isLoading } = useQuery<OrderWithDetails[]>({
    queryKey: ['/api/orders/recent', { limit }],
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
    <>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Recent Orders</h2>
        <Button variant="link" className="text-secondary p-0 h-auto">View all</Button>
      </div>
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-left">
                <th className="px-4 py-3 font-medium">Order ID</th>
                <th className="px-4 py-3 font-medium">Table</th>
                <th className="px-4 py-3 font-medium">Server</th>
                <th className="px-4 py-3 font-medium">Amount</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium sr-only">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array(limit).fill(0).map((_, index) => (
                  <tr key={index} className="border-t border-border">
                    <td className="px-4 py-3"><Skeleton className="h-4 w-20" /></td>
                    <td className="px-4 py-3"><Skeleton className="h-4 w-16" /></td>
                    <td className="px-4 py-3"><Skeleton className="h-4 w-20" /></td>
                    <td className="px-4 py-3"><Skeleton className="h-4 w-16" /></td>
                    <td className="px-4 py-3"><Skeleton className="h-6 w-24" /></td>
                    <td className="px-4 py-3 text-right"><Skeleton className="h-8 w-8 rounded-full ml-auto" /></td>
                  </tr>
                ))
              ) : (
                orders?.map((order) => (
                  <tr 
                    key={order.id} 
                    className="border-t border-border hover:bg-gray-50 cursor-pointer"
                    onClick={() => setSelectedOrder(order)}
                  >
                    <td className="px-4 py-3">{order.orderId}</td>
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
              
              {!isLoading && (!orders || orders.length === 0) && (
                <tr className="border-t border-border">
                  <td colSpan={6} className="px-4 py-8 text-center text-muted">
                    No orders found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between px-4 py-3 border-t border-border">
          <p className="text-sm text-muted">
            {!isLoading && orders 
              ? `Showing ${orders.length} of ${orders.length} orders` 
              : "Loading orders..."
            }
          </p>
          <div className="flex items-center gap-1">
            <Button variant="outline" size="icon" disabled>
              <i className="ri-arrow-left-s-line"></i>
            </Button>
            <Button variant="outline" size="icon" disabled>
              <i className="ri-arrow-right-s-line"></i>
            </Button>
          </div>
        </div>
      </Card>
      
      {selectedOrder && (
        <OrderDetailsModal
          order={selectedOrder}
          open={!!selectedOrder}
          onClose={() => setSelectedOrder(null)}
        />
      )}
    </>
  );
}
