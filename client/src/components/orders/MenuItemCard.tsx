import React from "react";
import { Card } from "@/components/ui/card";
import { MenuItem } from "@shared/schema";
import { cn, formatPKR } from "@/lib/utils";

interface MenuItemCardProps {
  menuItem: MenuItem;
  onAddItem: (menuItem: MenuItem) => void;
}

export default function MenuItemCard({ menuItem, onAddItem }: MenuItemCardProps) {
  const handleClick = () => {
    onAddItem(menuItem);
  };

  const getIconColor = (categoryId: number): string => {
    const colors = ["primary", "secondary", "accent", "warning"];
    return colors[(categoryId - 1) % colors.length];
  };

  const iconColor = getIconColor(menuItem.categoryId);

  return (
    <Card 
      className="p-4 hover:border-primary cursor-pointer transition-colors"
      onClick={handleClick}
    >
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-medium">{menuItem.name}</h3>
          <p className="text-sm text-muted line-clamp-2">{menuItem.description || "No description"}</p>
          <p className="text-primary font-medium mt-2">{formatPKR(menuItem.price)}</p>
        </div>
        <div className={cn("w-12 h-12 rounded bg-gray-100 flex items-center justify-center", `text-${iconColor}`)}>
          <i className={`${menuItem.icon} text-lg`}></i>
        </div>
      </div>
    </Card>
  );
}
