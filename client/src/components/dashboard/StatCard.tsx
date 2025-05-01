import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: string;
  iconColor: string;
  change?: {
    value: string | number;
    trend: "up" | "down" | "neutral";
    label?: string;
  };
}

export default function StatCard({ title, value, icon, iconColor, change }: StatCardProps) {
  return (
    <Card className="p-4">
      <CardContent className="p-0">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-muted text-sm">{title}</p>
            <h3 className="text-2xl font-bold mt-1">{value}</h3>
          </div>
          <div className={cn("w-10 h-10 rounded-full flex items-center justify-center text-lg", `bg-${iconColor}/10 text-${iconColor}`)}>
            <i className={icon}></i>
          </div>
        </div>
        {change && (
          <div className="flex items-center mt-4 text-sm">
            <span className={cn(
              "flex items-center",
              change.trend === "up" ? "text-success" : 
              change.trend === "down" ? "text-error" : "text-muted"
            )}>
              <i className={cn(
                "mr-1",
                change.trend === "up" ? "ri-arrow-up-line" : 
                change.trend === "down" ? "ri-arrow-down-line" : ""
              )}></i>
              {change.value}
            </span>
            {change.label && <span className="text-muted ml-2">{change.label}</span>}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
