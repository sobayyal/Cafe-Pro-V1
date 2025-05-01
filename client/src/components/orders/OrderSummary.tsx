import React from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MenuItem } from "@shared/schema";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { formatPKR } from "@/lib/utils";

interface OrderItem {
  menuItemId: number;
  menuItem: MenuItem;
  quantity: number;
  price: number;
  notes?: string;
  subtotal: number;
}

interface OrderSummaryProps {
  orderItems: OrderItem[];
  subtotal: number;
  tax: number;
  total: number;
  onUpdateQuantity: (menuItemId: number, quantity: number) => void;
  onRemoveItem: (menuItemId: number) => void;
  onAddNotes: (menuItemId: number, notes: string) => void;
  tableSelection: React.ReactNode;
  staffSelection: React.ReactNode;
  isSubmitting?: boolean;
  onSubmit: () => void;
}

export default function OrderSummary({
  orderItems,
  subtotal,
  tax,
  total,
  onUpdateQuantity,
  onRemoveItem,
  onAddNotes,
  tableSelection,
  staffSelection,
  isSubmitting = false,
  onSubmit
}: OrderSummaryProps) {
  const [activeNoteItem, setActiveNoteItem] = React.useState<OrderItem | null>(null);
  const [noteText, setNoteText] = React.useState("");
  const [isNoteDialogOpen, setIsNoteDialogOpen] = React.useState(false);

  const handleOpenNoteDialog = (item: OrderItem) => {
    setActiveNoteItem(item);
    setNoteText(item.notes || "");
    setIsNoteDialogOpen(true);
  };

  const handleSaveNote = () => {
    if (activeNoteItem) {
      onAddNotes(activeNoteItem.menuItemId, noteText);
      setIsNoteDialogOpen(false);
    }
  };

  return (
    <Card className="overflow-hidden">
      <div className="p-4 bg-gray-50 border-b border-border">
        <h2 className="font-semibold">Current Order</h2>
      </div>
      <div className="p-4">
        <div className="mb-4 space-y-3">
          {tableSelection}
          {staffSelection}
        </div>

        <div className="mt-4 mb-3">
          <h3 className="text-sm font-medium mb-2">Order Items</h3>
          {orderItems.length === 0 ? (
            <div className="py-6 text-center text-muted border border-dashed border-gray-200 rounded-md">
              No items added yet
            </div>
          ) : (
            <div className="space-y-3">
              {orderItems.map((item) => (
                <div key={item.menuItemId} className="flex items-center justify-between pb-2 border-b border-border">
                  <div className="flex items-center">
                    <div className="mr-2">
                      <div className="flex items-center">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-6 w-6 rounded-r-none"
                          onClick={() => onUpdateQuantity(item.menuItemId, item.quantity - 1)}
                        >
                          <i className="ri-subtract-line text-xs"></i>
                        </Button>
                        <div className="inline-flex items-center justify-center bg-gray-100 w-6 h-6 text-sm">
                          {item.quantity}
                        </div>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-6 w-6 rounded-l-none"
                          onClick={() => onUpdateQuantity(item.menuItemId, item.quantity + 1)}
                        >
                          <i className="ri-add-line text-xs"></i>
                        </Button>
                      </div>
                    </div>
                    <div className="ml-2">
                      <p className="font-medium">{item.menuItem.name}</p>
                      {item.notes ? (
                        <Button 
                          variant="link" 
                          className="h-auto p-0 text-xs text-secondary"
                          onClick={() => handleOpenNoteDialog(item)}
                        >
                          View note
                        </Button>
                      ) : (
                        <Button 
                          variant="link" 
                          className="h-auto p-0 text-xs text-muted"
                          onClick={() => handleOpenNoteDialog(item)}
                        >
                          Add note
                        </Button>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center">
                    <p className="font-medium mr-2">{formatPKR(item.subtotal)}</p>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-muted hover:text-error"
                      onClick={() => onRemoveItem(item.menuItemId)}
                    >
                      <i className="ri-delete-bin-line"></i>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="border-t border-border pt-3 mt-4">
          <div className="flex justify-between py-1">
            <span className="text-muted">Subtotal</span>
            <span className="font-medium">{formatPKR(subtotal)}</span>
          </div>
          <div className="flex justify-between py-1">
            <span className="text-muted">Tax (8%)</span>
            <span className="font-medium">{formatPKR(tax)}</span>
          </div>
          <div className="flex justify-between py-2 text-lg font-semibold">
            <span>Total</span>
            <span>{formatPKR(total)}</span>
          </div>
        </div>

        <div className="mt-6 space-y-3">
          <Button 
            className="w-full"
            onClick={onSubmit}
            disabled={orderItems.length === 0 || isSubmitting}
          >
            <i className="ri-save-line mr-2"></i>
            Save Order
          </Button>
          <Button variant="secondary" className="w-full" disabled={orderItems.length === 0 || isSubmitting}>
            <i className="ri-bill-line mr-2"></i>
            Process Payment
          </Button>
        </div>
      </div>

      {/* Notes dialog */}
      <Dialog open={isNoteDialogOpen} onOpenChange={setIsNoteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {activeNoteItem && `Note for ${activeNoteItem.menuItem.name}`}
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Textarea
              placeholder="Add special instructions here..."
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              className="min-h-[100px]"
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsNoteDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveNote}>
              Save Note
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
