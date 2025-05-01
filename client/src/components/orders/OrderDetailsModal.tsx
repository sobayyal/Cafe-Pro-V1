import React, { useState } from "react";
import { OrderWithDetails, Order } from "@shared/schema";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { formatPKR } from "@/lib/utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

interface OrderDetailsModalProps {
  order: OrderWithDetails;
  open: boolean;
  onClose: () => void;
}

export default function OrderDetailsModal({ order, open, onClose }: OrderDetailsModalProps) {
  const [showReceipt, setShowReceipt] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [orderStatus, setOrderStatus] = useState(order.status);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const updateOrderMutation = useMutation({
    mutationFn: async (data: Partial<Order>) => {
      return await apiRequest("PATCH", `/api/orders/${order.id}`, data);
    },
    onSuccess: () => {
      toast({
        title: "Order updated",
        description: "The order has been updated successfully."
      });
      
      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ['/api/orders'] });
      queryClient.invalidateQueries({ queryKey: ['/api/orders/recent'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/stats'] });
      setIsEditing(false);
      onClose();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to update order: ${error.message}`,
        variant: "destructive"
      });
    }
  });

  const handleStatusChange = (newStatus: string) => {
    setOrderStatus(newStatus);
  };

  const handleSaveChanges = () => {
    updateOrderMutation.mutate({ status: orderStatus });
  };
  
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

  const printReceipt = () => {
    const receiptWindow = window.open('', '_blank');
    if (receiptWindow) {
      receiptWindow.document.write(`
        <html>
          <head>
            <title>Receipt - ${order.orderId}</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }
              .receipt { max-width: 300px; margin: 0 auto; }
              .header { text-align: center; margin-bottom: 20px; }
              .divider { border-top: 1px dashed #ccc; margin: 10px 0; }
              .item { display: flex; justify-content: space-between; margin: 5px 0; }
              .total { font-weight: bold; margin-top: 10px; }
              .footer { text-align: center; margin-top: 30px; font-size: 12px; }
            </style>
          </head>
          <body>
            <div class="receipt">
              <div class="header">
                <h2>Cafe Management</h2>
                <p>Order: ${order.orderId}</p>
                <p>Date: ${format(new Date(order.createdAt), "MMMM d, yyyy - HH:mm")}</p>
                <p>Server: ${order.server.name}</p>
                <p>Table: ${order.table.name}</p>
              </div>
              
              <div class="divider"></div>
              
              <div>
                ${order.items.map(item => `
                  <div class="item">
                    <span>${item.quantity} × ${item.menuItem.name}</span>
                    <span>${formatPKR(item.subtotal)}</span>
                  </div>
                  ${item.notes ? `<div style="font-size: 12px; color: #666; margin-left: 10px;">Note: ${item.notes}</div>` : ''}
                `).join('')}
              </div>
              
              <div class="divider"></div>
              
              <div class="item">
                <span>Subtotal</span>
                <span>${formatPKR(order.subtotal)}</span>
              </div>
              
              <div class="item">
                <span>Tax</span>
                <span>${formatPKR(order.tax)}</span>
              </div>
              
              ${order.tip !== null && order.tip > 0 ? `
                <div class="item">
                  <span>Tip</span>
                  <span>${formatPKR(order.tip)}</span>
                </div>
              ` : ''}
              
              <div class="item total">
                <span>Total</span>
                <span>${formatPKR(order.total)}</span>
              </div>
              
              <div class="divider"></div>
              
              <div class="footer">
                <p>Thank you for your visit!</p>
                <p>Please come again</p>
              </div>
            </div>
            <script>
              window.onload = function() {
                window.print();
              }
            </script>
          </body>
        </html>
      `);
      receiptWindow.document.close();
    } else {
      toast({
        title: "Error",
        description: "Unable to open print window. Please check your browser settings.",
        variant: "destructive"
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-auto">
        <DialogHeader>
          <DialogTitle className="text-lg">Order {order.orderId}</DialogTitle>
          {isEditing && (
            <DialogDescription>
              Edit order details
            </DialogDescription>
          )}
        </DialogHeader>
        <div className="py-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <h3 className="text-sm font-medium text-muted mb-1">Order Details</h3>
              <p className="mb-1"><span className="font-medium">Table:</span> {order.table.name}</p>
              <p className="mb-1"><span className="font-medium">Server:</span> {order.server.name}</p>
              <p className="mb-1">
                <span className="font-medium">Date:</span> {format(new Date(order.createdAt), "MMMM d, yyyy - HH:mm")}
              </p>
              <div className="mb-1">
                <span className="font-medium">Status:</span>{" "}
                {isEditing ? (
                  <Select value={orderStatus} onValueChange={handleStatusChange}>
                    <SelectTrigger className="w-[180px] mt-1">
                      <SelectValue/>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="preparing">Preparing</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <Badge className={getStatusBadgeClass(order.status)} variant="outline">
                    {order.status.charAt(0).toUpperCase() + order.status.slice(1).replace("_", " ")}
                  </Badge>
                )}
              </div>
            </div>
            <div>
              <h3 className="text-sm font-medium text-muted mb-1">Payment Info</h3>
              <p className="mb-1">
                <span className="font-medium">Payment:</span> {
                  order.paymentMethod === "credit_card" ? "Credit Card" : 
                  order.paymentMethod === "cash" ? "Cash" : 
                  order.paymentMethod
                }
              </p>
              <p>
                <span className="font-medium">Receipt:</span>{" "}
                <Button variant="link" className="p-0 h-auto" onClick={() => printReceipt()}>
                  View Receipt
                </Button>
              </p>
            </div>
          </div>

          <h3 className="font-medium border-b border-border pb-2 mb-3">Order Items</h3>
          <div className="space-y-3 mb-6">
            {order.items.map((item) => (
              <div key={item.id} className="flex justify-between items-start">
                <div>
                  <p className="font-medium">
                    {item.quantity} × {item.menuItem.name}
                  </p>
                  {item.notes && <p className="text-sm text-muted">{item.notes}</p>}
                </div>
                <p className="font-medium">{formatPKR(item.subtotal)}</p>
              </div>
            ))}
          </div>

          <div className="border-t border-border pt-4 mb-6">
            <div className="flex justify-between py-1">
              <span className="text-muted">Subtotal</span>
              <span className="font-medium">{formatPKR(order.subtotal)}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-muted">Tax</span>
              <span className="font-medium">{formatPKR(order.tax)}</span>
            </div>
            {order.tip !== null && order.tip > 0 && (
              <div className="flex justify-between py-1">
                <span className="text-muted">Tip</span>
                <span className="font-medium">{formatPKR(order.tip)}</span>
              </div>
            )}
            <div className="flex justify-between py-2 text-lg font-semibold">
              <span>Total</span>
              <span>{formatPKR(order.total)}</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-end">
            {isEditing ? (
              <>
                <Button variant="outline" onClick={() => setIsEditing(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSaveChanges} disabled={updateOrderMutation.isPending}>
                  {updateOrderMutation.isPending ? "Saving..." : "Save Changes"}
                </Button>
              </>
            ) : (
              <>
                <Button variant="outline" onClick={printReceipt}>
                  <i className="ri-printer-line mr-2"></i>
                  Print Receipt
                </Button>
                {isAdmin && (
                  <Button variant="secondary" onClick={() => setIsEditing(true)}>
                    <i className="ri-edit-line mr-2"></i>
                    Edit Order
                  </Button>
                )}
              </>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
