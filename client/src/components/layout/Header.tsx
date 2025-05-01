import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { useAuth } from "@/contexts/AuthContext";
import Sidebar from "./Sidebar";

interface HeaderProps {
  title?: string;
  showNotifications?: boolean;
}

export default function Header({ title, showNotifications = true }: HeaderProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { user } = useAuth();

  const initials = user?.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase();

  return (
    <header className="bg-white border-b border-border sticky top-0 z-30">
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center">
          <Button
            variant="ghost"
            size="icon"
            className="mr-2 md:hidden"
            onClick={() => setIsSidebarOpen(true)}
          >
            <i className="ri-menu-line text-lg"></i>
            <span className="sr-only">Toggle menu</span>
          </Button>
          <h1 className="text-xl font-bold md:hidden flex items-center gap-2 text-primary">
            <i className="ri-cup-line"></i>
            <span>{title || "Cafe Manager"}</span>
          </h1>
        </div>
        <div className="flex items-center gap-4">
          {showNotifications && (
            <Button variant="outline" size="sm" className="hidden sm:flex">
              <i className="ri-notification-3-line mr-1"></i>
              <span>Notifications</span>
            </Button>
          )}
          <div className="md:hidden flex items-center">
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
              <span className="font-medium text-white">{initials}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile sidebar */}
      <Sheet open={isSidebarOpen} onOpenChange={setIsSidebarOpen}>
        <SheetContent side="left" className="p-0 w-64">
          <Sidebar />
        </SheetContent>
      </Sheet>
    </header>
  );
}
