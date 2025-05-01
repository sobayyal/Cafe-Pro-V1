import React, { useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Staff, InsertStaff } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage
} from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Switch } from "@/components/ui/switch";

// Form schema for creating/editing staff
const staffFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  active: z.boolean().default(true)
});

type StaffFormValues = z.infer<typeof staffFormSchema>;

export default function StaffManagement() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<Staff | null>(null);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Fetch staff data
  const { data: staffList, isLoading } = useQuery<Staff[]>({
    queryKey: ['/api/staff'],
  });
  
  // Initialize form
  const form = useForm<StaffFormValues>({
    resolver: zodResolver(staffFormSchema),
    defaultValues: {
      name: "",
      active: true
    }
  });
  
  // Filter staff based on search term
  const filteredStaff = staffList?.filter(staff => 
    staff.name.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  // Add/Edit staff mutation
  const staffMutation = useMutation({
    mutationFn: async (data: StaffFormValues) => {
      if (editingStaff) {
        // Update existing staff
        return await apiRequest("PATCH", `/api/staff/${editingStaff.id}`, data);
      } else {
        // Create new staff
        return await apiRequest("POST", "/api/staff", data);
      }
    },
    onSuccess: () => {
      toast({
        title: editingStaff ? "Staff updated" : "Staff created",
        description: `The staff member has been ${editingStaff ? "updated" : "created"} successfully.`
      });
      
      // Reset form and close dialog
      form.reset();
      setIsAddDialogOpen(false);
      setEditingStaff(null);
      
      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ['/api/staff'] });
      queryClient.invalidateQueries({ queryKey: ['/api/staff/active'] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to ${editingStaff ? "update" : "create"} staff: ${error.message}`,
        variant: "destructive"
      });
    }
  });
  
  // Delete staff mutation
  const deleteStaffMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest("DELETE", `/api/staff/${id}`);
    },
    onSuccess: () => {
      toast({
        title: "Staff removed",
        description: "The staff member has been removed successfully."
      });
      
      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ['/api/staff'] });
      queryClient.invalidateQueries({ queryKey: ['/api/staff/active'] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to remove staff: ${error.message}`,
        variant: "destructive"
      });
    }
  });
  
  // Handle form submission
  const onSubmit = (data: StaffFormValues) => {
    staffMutation.mutate(data);
  };
  
  // Handle edit button click
  const handleEdit = (staff: Staff) => {
    setEditingStaff(staff);
    form.reset({
      name: staff.name,
      active: staff.active
    });
    setIsAddDialogOpen(true);
  };
  
  // Handle new staff button click
  const handleAddNew = () => {
    setEditingStaff(null);
    form.reset({
      name: "",
      active: true
    });
    setIsAddDialogOpen(true);
  };

  return (
    <DashboardLayout title="Staff Management" requireAdmin={true}>
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Staff Management</h1>
          <p className="text-muted">Manage waiters and service staff</p>
        </div>
        <div className="mt-4 md:mt-0">
          <Button onClick={handleAddNew}>
            <i className="ri-user-add-line mr-2"></i>
            Add Staff
          </Button>
        </div>
      </div>
      
      {/* Search */}
      <div className="flex mb-6">
        <div className="relative flex-1">
          <Input
            placeholder="Search staff..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
          <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-muted"></i>
        </div>
      </div>
      
      {/* Staff Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {isLoading ? (
          Array(8).fill(0).map((_, index) => (
            <Skeleton key={index} className="h-28 w-full" />
          ))
        ) : (
          filteredStaff?.map((staff) => (
            <Card key={staff.id} className="overflow-hidden">
              <CardContent className="p-4">
                <div className="flex items-center mb-3">
                  <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center mr-3">
                    <span className="text-white font-medium">
                      {staff.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-medium">{staff.name}</h3>
                    <Badge variant={staff.active ? "default" : "outline"} className="mt-1">
                      {staff.active ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                </div>
                
                <div className="flex gap-2 mt-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1"
                    onClick={() => handleEdit(staff)}
                  >
                    <i className="ri-pencil-line mr-1"></i>
                    Edit
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="flex-1 hover:bg-error/10 hover:text-error hover:border-error"
                    onClick={() => {
                      if (confirm("Are you sure you want to remove this staff member?")) {
                        deleteStaffMutation.mutate(staff.id);
                      }
                    }}
                  >
                    <i className="ri-delete-bin-line mr-1"></i>
                    Remove
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
        
        {!isLoading && (!filteredStaff || filteredStaff.length === 0) && (
          <div className="col-span-full py-12 text-center text-muted">
            No staff members found matching your search criteria
          </div>
        )}
      </div>
      
      {/* Add/Edit Staff Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingStaff ? "Edit Staff" : "Add New Staff"}</DialogTitle>
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
                      <Input placeholder="Staff name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="active"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                    <div>
                      <FormLabel>Active Status</FormLabel>
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
                <Button type="submit" disabled={staffMutation.isPending}>
                  {staffMutation.isPending ? (
                    <div className="flex items-center">
                      <i className="ri-loader-4-line animate-spin mr-2"></i>
                      {editingStaff ? "Updating..." : "Saving..."}
                    </div>
                  ) : (
                    editingStaff ? "Update" : "Save"
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
