import React, { useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { DashboardStats, MenuItemWithStats, OrderWithDetails } from "@shared/schema";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format, subDays, isWithinInterval, startOfDay, endOfDay } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell
} from "recharts";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function Reports() {
  const [timeRange, setTimeRange] = useState("week");
  const [revenueChartView, setRevenueChartView] = useState("daily");
  
  // Fetch stats and data
  const { data: stats, isLoading: isLoadingStats } = useQuery<DashboardStats>({
    queryKey: ['/api/dashboard/stats'],
  });
  
  const { data: topItems } = useQuery<MenuItemWithStats[]>({
    queryKey: ['/api/dashboard/top-menu-items', { limit: 10 }],
  });
  
  const { data: orders } = useQuery<OrderWithDetails[]>({
    queryKey: ['/api/orders/recent', { limit: 100 }],
  });
  
  // Format revenue data for chart
  const getRevenueData = () => {
    if (!orders) return [];
    
    const today = new Date();
    let startDate: Date;
    
    // Determine date range based on selection
    switch (timeRange) {
      case "week":
        startDate = subDays(today, 7);
        break;
      case "month":
        startDate = subDays(today, 30);
        break;
      case "quarter":
        startDate = subDays(today, 90);
        break;
      default:
        startDate = subDays(today, 7);
    }
    
    // Filter orders within date range
    const filteredOrders = orders.filter(order => {
      const orderDate = new Date(order.createdAt);
      return isWithinInterval(orderDate, {
        start: startOfDay(startDate),
        end: endOfDay(today)
      });
    });
    
    if (revenueChartView === "daily") {
      // Group by day
      const dailyRevenue: Record<string, number> = {};
      
      filteredOrders.forEach(order => {
        const dateStr = format(new Date(order.createdAt), 'MM/dd');
        if (!dailyRevenue[dateStr]) {
          dailyRevenue[dateStr] = 0;
        }
        dailyRevenue[dateStr] += order.total;
      });
      
      // Convert to array for chart
      return Object.entries(dailyRevenue).map(([date, amount]) => ({
        date,
        revenue: parseFloat(amount.toFixed(2))
      })).sort((a, b) => {
        // Sort by date
        const [aMonth, aDay] = a.date.split('/').map(Number);
        const [bMonth, bDay] = b.date.split('/').map(Number);
        
        if (aMonth !== bMonth) return aMonth - bMonth;
        return aDay - bDay;
      });
    } else {
      // Group by payment method
      const paymentMethodRevenue: Record<string, number> = {
        'Cash': 0,
        'Credit Card': 0
      };
      
      filteredOrders.forEach(order => {
        const method = order.paymentMethod === 'cash' ? 'Cash' : 'Credit Card';
        paymentMethodRevenue[method] += order.total;
      });
      
      // Convert to array for chart
      return Object.entries(paymentMethodRevenue).map(([method, amount]) => ({
        name: method,
        value: parseFloat(amount.toFixed(2))
      }));
    }
  };
  
  // Get top items data for chart
  const getTopItemsData = () => {
    if (!topItems) return [];
    
    return topItems.map(item => ({
      name: item.name,
      value: item.soldCount
    }));
  };
  
  // Prepare data for charts
  const revenueData = getRevenueData();
  const topItemsData = getTopItemsData();
  
  // Chart colors
  const CHART_COLORS = ['#3b82f6', '#f97316', '#10b981', '#854d0e', '#8b5cf6'];

  return (
    <DashboardLayout title="Reports" requireAdmin={true}>
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Reports</h1>
          <p className="text-muted">Review sales and performance metrics</p>
        </div>
        <div className="mt-4 md:mt-0 flex flex-col sm:flex-row gap-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select time range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">Last 7 Days</SelectItem>
              <SelectItem value="month">Last 30 Days</SelectItem>
              <SelectItem value="quarter">Last 90 Days</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline">
            <i className="ri-download-line mr-2"></i>
            Export
          </Button>
        </div>
      </div>
      
      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted">Total Orders</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingStats ? (
              <Skeleton className="h-7 w-16" />
            ) : (
              <div className="text-2xl font-bold">{stats?.totalOrders || 0}</div>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted">Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingStats ? (
              <Skeleton className="h-7 w-20" />
            ) : (
              <div className="text-2xl font-bold">${stats?.totalRevenue.toFixed(2) || "0.00"}</div>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted">Avg. Order Value</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingStats ? (
              <Skeleton className="h-7 w-16" />
            ) : (
              <div className="text-2xl font-bold">${stats?.avgOrderValue.toFixed(2) || "0.00"}</div>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted">Active Staff</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingStats ? (
              <Skeleton className="h-7 w-12" />
            ) : (
              <div className="text-2xl font-bold">{stats?.activeStaff || 0}</div>
            )}
          </CardContent>
        </Card>
      </div>
      
      {/* Charts */}
      <Tabs defaultValue="revenue" className="mb-6">
        <TabsList>
          <TabsTrigger value="revenue">Revenue</TabsTrigger>
          <TabsTrigger value="products">Products</TabsTrigger>
        </TabsList>
        
        <TabsContent value="revenue">
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle>Revenue Overview</CardTitle>
                <Select value={revenueChartView} onValueChange={setRevenueChartView}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Chart Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="paymentMethod">By Payment</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                {revenueChartView === 'daily' ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={revenueData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip 
                        formatter={(value: number) => [`$${value.toFixed(2)}`, 'Revenue']}
                      />
                      <Legend />
                      <Bar dataKey="revenue" fill="#3b82f6" name="Revenue" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={revenueData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={150}
                        fill="#8884d8"
                        dataKey="value"
                        label={({name, percent}) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      >
                        {revenueData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: number) => [`$${value.toFixed(2)}`, 'Revenue']} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="products">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Top Selling Products</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={topItemsData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis type="category" dataKey="name" width={120} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="value" fill="#f97316" name="Items Sold" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      {/* Order data table would go here */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle>Report Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted py-6">
            This report provides a summary of sales data for the selected time period. 
            Use the controls above to adjust the time range and chart views.
          </p>
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}
