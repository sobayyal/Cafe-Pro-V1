import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { MenuItemWithStats } from "@shared/schema";
import { formatPKR } from "@/lib/utils";

interface TopMenuItemsProps {
  limit?: number;
}

export default function TopMenuItems({ limit = 5 }: TopMenuItemsProps) {
  const { data: topItems, isLoading } = useQuery<MenuItemWithStats[]>({
    queryKey: ['/api/dashboard/top-menu-items', { limit }],
  });

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Top Menu Items</h2>
        <Button variant="link" className="text-secondary p-0 h-auto">View all</Button>
      </div>
      <Card>
        <CardContent className="p-4">
          <div className="space-y-4">
            {isLoading ? (
              Array(limit).fill(0).map((_, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Skeleton className="w-10 h-10 rounded mr-3" />
                    <div>
                      <Skeleton className="w-24 h-4 mb-2" />
                      <Skeleton className="w-12 h-3" />
                    </div>
                  </div>
                  <div className="text-right">
                    <Skeleton className="w-8 h-4 mb-2 ml-auto" />
                    <Skeleton className="w-12 h-3 ml-auto" />
                  </div>
                </div>
              ))
            ) : (
              topItems?.map((item) => (
                <div key={item.id} className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-10 h-10 rounded bg-gray-100 flex items-center justify-center mr-3">
                      <i className={`${item.icon} ${getIconColorClass(item.categoryId)}`}></i>
                    </div>
                    <div>
                      <p className="font-medium">{item.name}</p>
                      <p className="text-sm text-muted">{formatPKR(item.price)}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{item.soldCount}</p>
                    <p className={`text-sm ${item.trend > 0 ? 'text-success' : 'text-error'}`}>
                      {item.trend > 0 ? '+' : ''}{item.trend}%
                    </p>
                  </div>
                </div>
              ))
            )}
            
            {!isLoading && (!topItems || topItems.length === 0) && (
              <div className="py-8 text-center text-muted">
                No data available
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </>
  );
}

function getIconColorClass(categoryId: number): string {
  const colors = ["text-primary", "text-secondary", "text-accent", "text-warning"];
  return colors[(categoryId - 1) % colors.length];
}
