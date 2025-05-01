import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { 
  Table, 
  TableBody, 
  TableCaption, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { apiRequest } from "@/lib/queryClient";
import { toast } from "@/hooks/use-toast";
import { formatPKR } from "@/lib/utils";

type MenuItem = {
  id: number;
  name: string;
  price: number;
  categoryId: number;
  icon: string;
  description: string | null;
  active: boolean;
  stockQuantity: number | null;
  trackInventory: boolean;
};

type InventoryHistory = {
  id: number;
  menuItemId: number;
  quantityChange: number;
  reason: string;
  previousStock: number;
  newStock: number;
  userId: number;
  createdAt: Date;
};

export default function InventoryManagement() {
  const [selectedMenuItem, setSelectedMenuItem] = useState<MenuItem | null>(null);
  const [isStockDialogOpen, setIsStockDialogOpen] = useState(false);
  const [quantity, setQuantity] = useState<number>(0);
  const [reason, setReason] = useState<string>("");
  const [selectedMenuItemForHistory, setSelectedMenuItemForHistory] = useState<number | undefined>(undefined);

  const queryClient = useQueryClient();

  const { data: menuItems = [], isLoading: isMenuItemsLoading } = useQuery({
    queryKey: ['/api/menu-items'],
    enabled: true,
  });

  const { data: inventoryHistory = [], isLoading: isHistoryLoading } = useQuery({
    queryKey: ['/api/inventory/history', selectedMenuItemForHistory],
    queryFn: async () => {
      const url = selectedMenuItemForHistory 
        ? `/api/inventory/history?menuItemId=${selectedMenuItemForHistory}`
        : '/api/inventory/history';
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch inventory history');
      return await response.json();
    },
    enabled: true,
  });

  const updateStockMutation = useMutation({
    mutationFn: async ({ menuItemId, quantity, reason }: { menuItemId: number, quantity: number, reason: string }) => {
      return await apiRequest(`/api/inventory/menu-items/${menuItemId}/stock`, {
        method: 'POST',
        body: JSON.stringify({ quantity, reason }),
        headers: {
          'Content-Type': 'application/json',
        },
      });
    },
    onSuccess: () => {
      toast({
        title: "Stock updated",
        description: "The inventory has been updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/menu-items'] });
      queryClient.invalidateQueries({ queryKey: ['/api/inventory/history'] });
      setIsStockDialogOpen(false);
      setQuantity(0);
      setReason("");
    },
    onError: (error) => {
      toast({
        title: "Failed to update stock",
        description: String(error),
        variant: "destructive",
      });
    },
  });

  const handleUpdateStock = () => {
    if (!selectedMenuItem) return;
    
    if (!reason.trim()) {
      toast({
        title: "Reason required",
        description: "Please provide a reason for the stock update.",
        variant: "destructive",
      });
      return;
    }

    updateStockMutation.mutate({
      menuItemId: selectedMenuItem.id,
      quantity,
      reason,
    });
  };

  const openStockDialog = (menuItem: MenuItem) => {
    setSelectedMenuItem(menuItem);
    setQuantity(0);
    setReason("");
    setIsStockDialogOpen(true);
  };

  if (isMenuItemsLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Inventory Management</CardTitle>
          <CardDescription>
            View and manage stock levels for all menu items
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableCaption>List of menu items with inventory information</TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead>Item</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Stock</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {menuItems.map((item: MenuItem) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.name}</TableCell>
                  <TableCell>{formatPKR(item.price)}</TableCell>
                  <TableCell>
                    {item.trackInventory 
                      ? item.stockQuantity !== null 
                        ? item.stockQuantity 
                        : '0'
                      : 'Not tracked'}
                  </TableCell>
                  <TableCell>
                    {item.active ? (
                      <span className="px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
                        Active
                      </span>
                    ) : (
                      <span className="px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-800">
                        Inactive
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => openStockDialog(item)}
                    >
                      Update Stock
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Stock Update Dialog */}
      <Dialog open={isStockDialogOpen} onOpenChange={setIsStockDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Stock</DialogTitle>
            <DialogDescription>
              {selectedMenuItem && `Update stock quantity for ${selectedMenuItem.name}`}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="currentStock" className="text-right">
                Current Stock
              </Label>
              <div className="col-span-3">
                <Input
                  id="currentStock"
                  value={selectedMenuItem?.stockQuantity || 0}
                  readOnly
                  className="bg-gray-50"
                />
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="quantity" className="text-right">
                Quantity Change
              </Label>
              <div className="col-span-3">
                <Input
                  id="quantity"
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(parseInt(e.target.value || '0'))}
                  className="w-full"
                  placeholder="Enter positive or negative number"
                />
                <p className="text-xs text-gray-500 mt-1">
                  (Positive = add stock, Negative = remove stock)
                </p>
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="newStock" className="text-right">
                New Stock
              </Label>
              <div className="col-span-3">
                <Input
                  id="newStock"
                  value={(selectedMenuItem?.stockQuantity || 0) + quantity}
                  readOnly
                  className="bg-gray-50"
                />
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="reason" className="text-right">
                Reason
              </Label>
              <Textarea
                id="reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Explain why you're updating the stock"
                className="col-span-3"
              />
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsStockDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleUpdateStock}
              disabled={updateStockMutation.isPending}
            >
              {updateStockMutation.isPending ? "Updating..." : "Update Stock"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Inventory History */}
      <Card>
        <CardHeader>
          <CardTitle>Inventory History</CardTitle>
          <CardDescription>
            Track all inventory changes with reasons
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <Label htmlFor="menuItemFilter">Filter by Menu Item</Label>
            <div className="flex space-x-2 mt-1">
              <Select 
                value={selectedMenuItemForHistory?.toString() || ""} 
                onValueChange={(value) => setSelectedMenuItemForHistory(value ? parseInt(value) : undefined)}
              >
                <SelectTrigger className="w-[300px]">
                  <SelectValue placeholder="All menu items" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All menu items</SelectItem>
                  {menuItems.map((item: MenuItem) => (
                    <SelectItem key={item.id} value={item.id.toString()}>
                      {item.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedMenuItemForHistory && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setSelectedMenuItemForHistory(undefined)}
                >
                  Clear Filter
                </Button>
              )}
            </div>
          </div>

          {isHistoryLoading ? (
            <div>Loading history...</div>
          ) : (
            <Table>
              <TableCaption>History of inventory changes</TableCaption>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Item</TableHead>
                  <TableHead>Change</TableHead>
                  <TableHead>Previous</TableHead>
                  <TableHead>New</TableHead>
                  <TableHead>Reason</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {inventoryHistory.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-4">
                      No inventory changes recorded
                    </TableCell>
                  </TableRow>
                ) : (
                  inventoryHistory.map((history: InventoryHistory) => {
                    const item = menuItems.find((i: MenuItem) => i.id === history.menuItemId);
                    return (
                      <TableRow key={history.id}>
                        <TableCell>
                          {new Date(history.createdAt).toLocaleDateString()}
                          {' '}
                          {new Date(history.createdAt).toLocaleTimeString()}
                        </TableCell>
                        <TableCell>{item?.name || `Item #${history.menuItemId}`}</TableCell>
                        <TableCell className={history.quantityChange > 0 ? 'text-green-600' : 'text-red-600'}>
                          {history.quantityChange > 0 ? '+' : ''}{history.quantityChange}
                        </TableCell>
                        <TableCell>{history.previousStock}</TableCell>
                        <TableCell>{history.newStock}</TableCell>
                        <TableCell>{history.reason}</TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}