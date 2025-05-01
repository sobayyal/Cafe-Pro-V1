import React, { useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { MenuItem, Category, InsertMenuItem } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, 
  DialogFooter, DialogDescription 
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage
} from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

// Form schema for creating/editing menu items
const menuItemFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  price: z.coerce.number().positive("Price must be positive"),
  categoryId: z.coerce.number({
    required_error: "Category is required"
  }),
  icon: z.string().default("ri-restaurant-line"),
  active: z.boolean().default(true)
});

type MenuItemFormValues = z.infer<typeof menuItemFormSchema>;

export default function MenuManagement() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("all");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingMenuItem, setEditingMenuItem] = useState<MenuItem | null>(null);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Fetch data
  const { data: categories } = useQuery<Category[]>({
    queryKey: ['/api/categories'],
  });
  
  const { data: menuItems, isLoading: isLoadingMenuItems } = useQuery<MenuItem[]>({
    queryKey: ['/api/menu-items'],
  });
  
  // Initialize form
  const form = useForm<MenuItemFormValues>({
    resolver: zodResolver(menuItemFormSchema),
    defaultValues: {
      name: "",
      description: "",
      price: 0,
      categoryId: 0,
      icon: "ri-restaurant-line",
      active: true
    }
  });
  
  // Filter menu items
  const filteredMenuItems = menuItems?.filter(item => {
    const matchesSearch = 
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.description?.toLowerCase().includes(searchTerm.toLowerCase()) || false);
    
    const matchesCategory = selectedCategoryId === "all" || 
      item.categoryId.toString() === selectedCategoryId;
    
    return matchesSearch && matchesCategory;
  });
  
  // Add/Edit menu item mutation
  const menuItemMutation = useMutation({
    mutationFn: async (data: MenuItemFormValues) => {
      if (editingMenuItem) {
        // Update existing item
        return await apiRequest("PATCH", `/api/menu-items/${editingMenuItem.id}`, data);
      } else {
        // Create new item
        return await apiRequest("POST", "/api/menu-items", data);
      }
    },
    onSuccess: () => {
      toast({
        title: editingMenuItem ? "Menu item updated" : "Menu item created",
        description: `The menu item has been ${editingMenuItem ? "updated" : "created"} successfully.`
      });
      
      // Reset form and close dialog
      form.reset();
      setIsAddDialogOpen(false);
      setEditingMenuItem(null);
      
      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ['/api/menu-items'] });
      queryClient.invalidateQueries({ queryKey: ['/api/menu-items/active'] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to ${editingMenuItem ? "update" : "create"} menu item: ${error.message}`,
        variant: "destructive"
      });
    }
  });
  
  // Delete menu item mutation
  const deleteMenuItemMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest("DELETE", `/api/menu-items/${id}`);
    },
    onSuccess: () => {
      toast({
        title: "Menu item deleted",
        description: "The menu item has been deleted successfully."
      });
      
      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ['/api/menu-items'] });
      queryClient.invalidateQueries({ queryKey: ['/api/menu-items/active'] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to delete menu item: ${error.message}`,
        variant: "destructive"
      });
    }
  });
  
  // Handle form submission
  const onSubmit = (data: MenuItemFormValues) => {
    menuItemMutation.mutate(data);
  };
  
  // Handle edit button click
  const handleEdit = (menuItem: MenuItem) => {
    setEditingMenuItem(menuItem);
    form.reset({
      name: menuItem.name,
      description: menuItem.description || "",
      price: menuItem.price,
      categoryId: menuItem.categoryId,
      icon: menuItem.icon,
      active: menuItem.active
    });
    setIsAddDialogOpen(true);
  };
  
  // Handle new menu item button click
  const handleAddNew = () => {
    setEditingMenuItem(null);
    form.reset({
      name: "",
      description: "",
      price: 0,
      categoryId: 0,
      icon: "ri-restaurant-line",
      active: true
    });
    setIsAddDialogOpen(true);
  };
  
  // Get category name by id
  const getCategoryName = (categoryId: number) => {
    const category = categories?.find(c => c.id === categoryId);
    return category?.name || "Unknown";
  };
  
  // Get icon for category
  const getIconForCategory = (categoryId: number): string => {
    const iconOptions: Record<number, string> = {
      1: "ri-cup-line",
      2: "ri-ice-cream-line",
      3: "ri-cake-3-line",
      4: "ri-bread-line",
      5: "ri-restaurant-line"
    };
    
    return iconOptions[categoryId] || "ri-restaurant-line";
  };

  return (
    <DashboardLayout title="Menu Management" requireAdmin={true}>
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Menu Management</h1>
          <p className="text-muted">Manage menu items and categories</p>
        </div>
        <div className="mt-4 md:mt-0">
          <Button onClick={handleAddNew}>
            <i className="ri-add-line mr-2"></i>
            Add Menu Item
          </Button>
        </div>
      </div>
      
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Input
            placeholder="Search menu items..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
          <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-muted"></i>
        </div>
        <Select value={selectedCategoryId} onValueChange={setSelectedCategoryId}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories?.map((category) => (
              <SelectItem key={category.id} value={category.id.toString()}>
                {category.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      {/* Menu Items Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoadingMenuItems ? (
          Array(6).fill(0).map((_, index) => (
            <Skeleton key={index} className="h-40 w-full" />
          ))
        ) : (
          filteredMenuItems?.map((menuItem) => (
            <Card key={menuItem.id} className="overflow-hidden">
              <CardContent className="p-0">
                <div className="flex items-start p-4">
                  <div className="mr-4 mt-1 w-12 h-12 rounded bg-gray-100 flex items-center justify-center">
                    <i className={`${menuItem.icon} text-lg ${menuItem.categoryId === 1 ? 'text-primary' : 
                      menuItem.categoryId === 2 ? 'text-secondary' : 
                      menuItem.categoryId === 3 ? 'text-accent' : 
                      'text-warning'}`}></i>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium truncate">{menuItem.name}</h3>
                      <Badge variant={menuItem.active ? "default" : "outline"} className="ml-2">
                        {menuItem.active ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted line-clamp-2 mt-1">
                      {menuItem.description || "No description"}
                    </p>
                    <div className="flex items-center justify-between mt-2">
                      <div>
                        <span className="text-primary font-medium">${menuItem.price.toFixed(2)}</span>
                        <span className="text-xs text-muted ml-2">
                          {getCategoryName(menuItem.categoryId)}
                        </span>
                      </div>
                      <div className="flex gap-1">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8" 
                          onClick={() => handleEdit(menuItem)}
                        >
                          <i className="ri-pencil-line"></i>
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 hover:text-error hover:bg-error/10" 
                          onClick={() => {
                            if (confirm("Are you sure you want to delete this menu item?")) {
                              deleteMenuItemMutation.mutate(menuItem.id);
                            }
                          }}
                        >
                          <i className="ri-delete-bin-line"></i>
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
        
        {!isLoadingMenuItems && (!filteredMenuItems || filteredMenuItems.length === 0) && (
          <div className="col-span-full py-12 text-center text-muted">
            No menu items found matching your search criteria
          </div>
        )}
      </div>
      
      {/* Add/Edit Menu Item Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{editingMenuItem ? "Edit Menu Item" : "Add New Menu Item"}</DialogTitle>
            <DialogDescription>
              {editingMenuItem 
                ? "Update the information for this menu item." 
                : "Fill in the details to create a new menu item."}
            </DialogDescription>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Item name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Item description" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Price</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2">$</span>
                          <Input type="number" step="0.01" min="0" className="pl-7" {...field} />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="categoryId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                      <Select 
                        onValueChange={(value) => field.onChange(parseInt(value))} 
                        defaultValue={field.value.toString()}
                        value={field.value.toString()}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {categories?.map((category) => (
                            <SelectItem key={category.id} value={category.id.toString()}>
                              {category.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={form.control}
                name="icon"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Icon</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue>
                            <span className="flex items-center">
                              <i className={`${field.value} mr-2`}></i>
                              {field.value}
                            </span>
                          </SelectValue>
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="ri-restaurant-line">
                          <span className="flex items-center">
                            <i className="ri-restaurant-line mr-2"></i>
                            General Food
                          </span>
                        </SelectItem>
                        <SelectItem value="ri-cup-line">
                          <span className="flex items-center">
                            <i className="ri-cup-line mr-2"></i>
                            Hot Drink
                          </span>
                        </SelectItem>
                        <SelectItem value="ri-goblet-line">
                          <span className="flex items-center">
                            <i className="ri-goblet-line mr-2"></i>
                            Espresso
                          </span>
                        </SelectItem>
                        <SelectItem value="ri-ice-cream-line">
                          <span className="flex items-center">
                            <i className="ri-ice-cream-line mr-2"></i>
                            Cold Drink
                          </span>
                        </SelectItem>
                        <SelectItem value="ri-cake-3-line">
                          <span className="flex items-center">
                            <i className="ri-cake-3-line mr-2"></i>
                            Cake
                          </span>
                        </SelectItem>
                        <SelectItem value="ri-bread-line">
                          <span className="flex items-center">
                            <i className="ri-bread-line mr-2"></i>
                            Bakery
                          </span>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="active"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                    <div className="space-y-0.5">
                      <FormLabel>Active</FormLabel>
                      <FormDescription>
                        Make this item available for ordering
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={menuItemMutation.isPending}>
                  {menuItemMutation.isPending ? (
                    <div className="flex items-center">
                      <i className="ri-loader-4-line animate-spin mr-2"></i>
                      {editingMenuItem ? "Updating..." : "Saving..."}
                    </div>
                  ) : (
                    editingMenuItem ? "Update" : "Save"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
