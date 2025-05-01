import React from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import StatCard from "@/components/dashboard/StatCard";
import RecentOrdersTable from "@/components/dashboard/RecentOrdersTable";
import TopMenuItems from "@/components/dashboard/TopMenuItems";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { DashboardStats } from "@shared/schema";
import { useLocation } from "wouter";
import { formatPKR } from "@/lib/utils";

export default function Dashboard() {
  const [, navigate] = useLocation();
  
  const { data: stats, isLoading } = useQuery<DashboardStats>({
    queryKey: ['/api/dashboard/stats'],
  });

  return (
    <DashboardLayout title="Dashboard">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-muted">Overview of your cafe operations</p>
        </div>
        <div className="mt-4 md:mt-0 flex flex-col sm:flex-row gap-2">
          <Button variant="outline" className="flex items-center gap-2">
            <i className="ri-calendar-line"></i>
            <span>Today</span>
          </Button>
          <Button className="flex items-center gap-2" onClick={() => navigate("/create-order")}>
            <i className="ri-add-line"></i>
            <span>New Order</span>
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          title="Total Orders"
          value={isLoading ? "..." : stats?.totalOrders || 0}
          icon="ri-shopping-bag-line"
          iconColor="secondary"
          change={{ value: "12.5%", trend: "up", label: "vs yesterday" }}
        />
        
        <StatCard
          title="Revenue"
          value={isLoading ? "..." : formatPKR(stats?.totalRevenue || 0)}
          icon="ri-money-dollar-circle-line"
          iconColor="success"
          change={{ value: "8.2%", trend: "up", label: "vs yesterday" }}
        />
        
        <StatCard
          title="Avg. Order Value"
          value={isLoading ? "..." : formatPKR(stats?.avgOrderValue || 0)}
          icon="ri-pie-chart-line"
          iconColor="warning"
          change={{ value: "3.1%", trend: "down", label: "vs yesterday" }}
        />
        
        <StatCard
          title="Active Staff"
          value={isLoading ? "..." : stats?.activeStaff || 0}
          icon="ri-team-line"
          iconColor="primary"
          change={{ value: "1", trend: "up", label: "vs yesterday" }}
        />
      </div>

      {/* Recent orders and menu performance */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <RecentOrdersTable limit={5} />
        </div>
        <div>
          <TopMenuItems limit={5} />
        </div>
      </div>
    </DashboardLayout>
  );
}
