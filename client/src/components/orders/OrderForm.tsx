import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Staff, Table, MenuItem, InsertOrder, InsertOrderItem } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import MenuItemCard from "./MenuItemCard";
import OrderSummary from "./OrderSummary";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useLocation } from "wouter";

export default function OrderForm() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, navigate] = useLocation();
  
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [tableId, setTableId] = useState<string>("");
  const [staffId, setStaffId] = useState<string>("");
  
  const [orderItems, setOrderItems] = useState<Array<{
    menuItemId: number;
    menuItem: MenuItem;
    quantity: number;
    price: number;
    notes?: string;
    subtotal: number;
  }>>([]);
  
  // Fetch data
  const { data: categories } = useQuery({
    queryKey: ['/api/categories'],
  });
  
  const { data: menuItems, isLoading: isLoadingMenuItems } = useQuery({
    queryKey: ['/api/menu-items/active'],
  });
  
  const { data: tables, isLoading: isLoadingTables } = useQuery<Table[]>({
    queryKey: ['/api/tables'],
  });
  
  const { data: staffMembers, isLoading: isLoadingStaff } = useQuery<Staff[]>({
    queryKey: ['/api/staff/active'],
  });
  
  // Filtered menu items
  const filteredMenuItems = menuItems?.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (item.description?.toLowerCase()?.includes(searchTerm.toLowerCase()) || false);
    const matchesCategory = selectedCategory === "all" || item.categoryId === parseInt(selectedCategory);
    return matchesSearch && matchesCategory;
  });
  
  // Handle adding items to the order
  const handleAddItem = (menuItem: MenuItem) => {
    const existingItem = orderItems.find(item => item.menuItemId === menuItem.id);
    
    if (existingItem) {
      // Increment quantity if item already exists
      setOrderItems(orderItems.map(item => {
        if (item.menuItemId === menuItem.id) {
          const newQuantity = item.quantity + 1;
          return {
            ...item,
            quantity: newQuantity,
            subtotal: parseFloat((menuItem.price * newQuantity).toFixed(2))
          };
        }
        return item;
      }));
    } else {
      // Add new item
      setOrderItems([...orderItems, {
        menuItemId: menuItem.id,
        menuItem,
        quantity: 1,
        price: menuItem.price,
        subtotal: menuItem.price
      }]);
    }
    
    // Show a toast
    toast({
      title: "Item added",
      description: `Added ${menuItem.name} to the order`,
    });
  };
  
  // Handle removing items from order
  const handleRemoveItem = (menuItemId: number) => {
    setOrderItems(orderItems.filter(item => item.menuItemId !== menuItemId));
  };
  
  // Handle updating item quantity
  const handleUpdateQuantity = (menuItemId: number, quantity: number) => {
    if (quantity <= 0) {
      handleRemoveItem(menuItemId);
      return;
    }
    
    setOrderItems(orderItems.map(item => {
      if (item.menuItemId === menuItemId) {
        return {
          ...item,
          quantity,
          subtotal: parseFloat((item.price * quantity).toFixed(2))
        };
      }
      return item;
    }));
  };
  
  // Handle adding notes to an item
  const handleAddNotes = (menuItemId: number, notes: string) => {
    setOrderItems(orderItems.map(item => {
      if (item.menuItemId === menuItemId) {
        return {
          ...item,
          notes
        };
      }
      return item;
    }));
  };
  
  // Calculate order totals
  const subtotal = parseFloat(orderItems.reduce((sum, item) => sum + item.subtotal, 0).toFixed(2));
  const taxRate = 0.08; // 8%
  const tax = parseFloat((subtotal * taxRate).toFixed(2));
  const total = parseFloat((subtotal + tax).toFixed(2));
  
  // Save order mutation
  const saveOrderMutation = useMutation({
    mutationFn: async () => {
      // Validate required fields
      if (!tableId) throw new Error("Please select a table");
      if (!staffId) throw new Error("Please assign a server");
      if (orderItems.length === 0) throw new Error("Please add at least one item to the order");
      
      // Create order ID
      const orderIdCounter = Math.floor(5000 + Math.random() * 1000);
      const orderId = `#ORD-${orderIdCounter}`;
      
      // Prepare order data
      const order: InsertOrder = {
        orderId,
        tableId: parseInt(tableId),
        staffId: parseInt(staffId),
        status: "pending",
        subtotal,
        tax,
        total,
        paymentMethod: "cash",
      };
      
      // Prepare order items
      const items: InsertOrderItem[] = orderItems.map(item => ({
        menuItemId: item.menuItemId,
        quantity: item.quantity,
        price: item.price,
        notes: item.notes,
        subtotal: item.subtotal,
        orderId: 0 // This will be set by the server
      }));
      
      // Submit to API
      return await apiRequest("POST", "/api/orders", { order, items });
    },
    onSuccess: () => {
      toast({
        title: "Order created",
        description: "The order has been created successfully",
      });
      
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['/api/orders'] });
      queryClient.invalidateQueries({ queryKey: ['/api/orders/recent'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/stats'] });
      
      // Reset form or navigate
      navigate("/orders");
    },
    onError: (error) => {
      toast({
        title: "Failed to create order",
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  // Handle order submission
  const handleSaveOrder = () => {
    saveOrderMutation.mutate();
  };
  
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Menu Selection */}
      <div className="lg:col-span-2">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Menu Items</h2>
          <div className="relative">
            <Input
              type="text"
              placeholder="Search menu..."
              className="pl-8 py-1.5"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-muted"></i>
          </div>
        </div>

        {/* Category tabs */}
        <div className="flex overflow-x-auto pb-2 mb-4 -mx-2 px-2">
          <Button
            variant={selectedCategory === "all" ? "default" : "outline"}
            className="mr-2 flex-shrink-0 rounded-full"
            onClick={() => setSelectedCategory("all")}
          >
            All items
          </Button>
          
          {categories?.map((category) => (
            <Button
              key={category.id}
              variant={selectedCategory === category.id.toString() ? "default" : "outline"}
              className="mr-2 flex-shrink-0 rounded-full"
              onClick={() => setSelectedCategory(category.id.toString())}
            >
              {category.name}
            </Button>
          ))}
        </div>

        {/* Menu items grid */}
        {isLoadingMenuItems ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {Array(6).fill(0).map((_, index) => (
              <Skeleton key={index} className="h-28 w-full" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {filteredMenuItems?.map((menuItem) => (
              <MenuItemCard
                key={menuItem.id}
                menuItem={menuItem}
                onAddItem={handleAddItem}
              />
            ))}
            
            {(!filteredMenuItems || filteredMenuItems.length === 0) && (
              <div className="col-span-3 py-12 text-center text-muted">
                No menu items found matching your search criteria
              </div>
            )}
          </div>
        )}
      </div>

      {/* Order Summary */}
      <div>
        <OrderSummary
          orderItems={orderItems}
          subtotal={subtotal}
          tax={tax}
          total={total}
          onUpdateQuantity={handleUpdateQuantity}
          onRemoveItem={handleRemoveItem}
          onAddNotes={handleAddNotes}
          isSubmitting={saveOrderMutation.isPending}
          onSubmit={handleSaveOrder}
          tableSelection={
            <div className="mb-3">
              <label className="block text-sm font-medium mb-1">Table Number</label>
              <Select value={tableId} onValueChange={setTableId}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select table" />
                </SelectTrigger>
                <SelectContent>
                  {isLoadingTables ? (
                    <div className="p-2">
                      <Skeleton className="h-4 w-20 mb-2" />
                      <Skeleton className="h-4 w-16" />
                    </div>
                  ) : (
                    tables?.map((table) => (
                      <SelectItem key={table.id} value={table.id.toString()}>
                        {table.name} {table.status !== "available" && `(${table.status})`}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
          }
          staffSelection={
            <div className="mb-3">
              <label className="block text-sm font-medium mb-1">Server</label>
              <Select value={staffId} onValueChange={setStaffId}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Assign server" />
                </SelectTrigger>
                <SelectContent>
                  {isLoadingStaff ? (
                    <div className="p-2">
                      <Skeleton className="h-4 w-20 mb-2" />
                      <Skeleton className="h-4 w-16" />
                    </div>
                  ) : (
                    staffMembers?.map((staff) => (
                      <SelectItem key={staff.id} value={staff.id.toString()}>
                        {staff.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
          }
        />
      </div>
    </div>
  );
}
