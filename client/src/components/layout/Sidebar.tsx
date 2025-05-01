import React from "react";
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { ScrollArea } from "@/components/ui/scroll-area";

interface SidebarProps {
  className?: string;
}

export default function Sidebar({ className }: SidebarProps) {
  const [location] = useLocation();
  const { user, logout } = useAuth();

  const initials = user?.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase();

  const menuItems = [
    {
      title: "Dashboard",
      icon: "ri-dashboard-line",
      path: "/",
      role: ["admin", "staff"],
    },
    {
      title: "Orders",
      icon: "ri-shopping-basket-2-line",
      path: "/orders",
      role: ["admin", "staff"],
    },
    {
      title: "Menu",
      icon: "ri-restaurant-line",
      path: "/menu",
      role: ["admin", "staff"],
    },
    {
      title: "Staff",
      icon: "ri-user-line",
      path: "/staff",
      role: ["admin"],
    },
    {
      title: "Reports",
      icon: "ri-file-chart-line",
      path: "/reports",
      role: ["admin"],
    },
    {
      title: "Settings",
      icon: "ri-settings-4-line",
      path: "/settings",
      role: ["admin", "staff"],
    },
  ];

  const filteredMenuItems = menuItems.filter(
    (item) => !item.role || item.role.includes(user?.role || "")
  );

  return (
    <div className={cn("bg-background-dark text-white w-64 flex-shrink-0 flex flex-col h-full", className)}>
      <div className="p-4 border-b border-white/10">
        <h1 className="text-xl font-bold text-white flex items-center gap-2">
          <i className="ri-cup-line"></i>
          <span>Cafe Manager</span>
        </h1>
      </div>
      
      <ScrollArea className="flex-1">
        <div className="py-4">
          <div className="px-4 mb-2 text-xs uppercase tracking-wider text-white/60">
            Dashboard
          </div>
          
          {filteredMenuItems.map((item) => (
            <Link
              key={item.path}
              href={item.path}
              className={cn(
                "flex items-center px-4 py-2 text-white/80 hover:bg-white/5 border-l-2 border-transparent",
                location === item.path && "bg-white/10 border-l-2 border-accent text-white"
              )}
            >
              <i className={cn(item.icon, "mr-3")}></i>
              <span>{item.title}</span>
            </Link>
          ))}
        </div>
      </ScrollArea>
      
      <div className="mt-auto p-4 border-t border-white/10">
        <div className="flex items-center">
          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
            <span className="font-medium text-white">{initials}</span>
          </div>
          <div className="ml-3">
            <p className="text-sm font-medium">{user?.name}</p>
            <p className="text-xs text-white/60 capitalize">{user?.role}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
