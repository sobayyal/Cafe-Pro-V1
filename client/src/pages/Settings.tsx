import React from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import InventoryManagement from "@/components/inventory/InventoryManagement";
import CafeSettingsForm from "@/components/settings/CafeSettings";

// Password change form schema
const passwordFormSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(6, "New password must be at least 6 characters"),
  confirmPassword: z.string().min(1, "Confirm password is required")
}).refine(data => data.newPassword === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"]
});

type PasswordFormValues = z.infer<typeof passwordFormSchema>;

// Profile form schema
const profileFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address").optional(),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

// Notification settings schema
const notificationFormSchema = z.object({
  orderNotifications: z.boolean().default(true),
  emailNotifications: z.boolean().default(false),
  systemNotifications: z.boolean().default(true),
});

type NotificationFormValues = z.infer<typeof notificationFormSchema>;

export default function Settings() {
  const { toast } = useToast();
  const { user } = useAuth();
  
  // Initialize password form
  const passwordForm = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordFormSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: ""
    }
  });
  
  // Initialize profile form
  const profileForm = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      name: user?.name || "",
      email: "",
    }
  });
  
  // Initialize notification settings form
  const notificationForm = useForm<NotificationFormValues>({
    resolver: zodResolver(notificationFormSchema),
    defaultValues: {
      orderNotifications: true,
      emailNotifications: false,
      systemNotifications: true,
    }
  });
  
  // Handle password form submission
  const onPasswordSubmit = (data: PasswordFormValues) => {
    // In a real app, this would make an API call to change the password
    toast({
      title: "Password updated",
      description: "Your password has been updated successfully.",
    });
    passwordForm.reset();
  };
  
  // Handle profile form submission
  const onProfileSubmit = (data: ProfileFormValues) => {
    // In a real app, this would make an API call to update the profile
    toast({
      title: "Profile updated",
      description: "Your profile has been updated successfully.",
    });
  };
  
  // Handle notification settings submission
  const onNotificationSubmit = (data: NotificationFormValues) => {
    // In a real app, this would make an API call to update notification settings
    toast({
      title: "Notification settings updated",
      description: "Your notification preferences have been saved.",
    });
  };

  return (
    <DashboardLayout title="Settings">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Settings</h1>
          <p className="text-muted">Manage your account and preferences</p>
        </div>
      </div>
      
      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="mb-4">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          {user?.role === 'admin' && (
            <TabsTrigger value="system">System</TabsTrigger>
          )}
          {user?.role === 'admin' && (
            <TabsTrigger value="receipt">Receipt</TabsTrigger>
          )}
          {user?.role === 'admin' && (
            <TabsTrigger value="inventory">Inventory</TabsTrigger>
          )}
        </TabsList>
        
        {/* Profile Settings */}
        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>Update your account details</CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...profileForm}>
                <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-6">
                  <div className="flex flex-col md:flex-row gap-4">
                    <div className="md:w-24 flex items-center justify-center">
                      <div className="w-20 h-20 rounded-full bg-primary flex items-center justify-center">
                        <span className="text-white text-xl font-medium">
                          {user?.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                        </span>
                      </div>
                    </div>
                    <div className="flex-1 space-y-4">
                      <FormField
                        control={profileForm.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Name</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={profileForm.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email</FormLabel>
                            <FormControl>
                              <Input type="email" {...field} />
                            </FormControl>
                            <FormDescription>
                              This email will be used for notifications
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <div className="flex items-center gap-2 pt-2">
                        <div>
                          <span className="text-sm font-medium">Role: </span>
                          <span className="capitalize">{user?.role}</span>
                        </div>
                        <Separator orientation="vertical" className="h-4" />
                        <div>
                          <span className="text-sm font-medium">Username: </span>
                          <span>{user?.username}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex justify-end">
                    <Button type="submit">Save Changes</Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Security Settings */}
        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle>Password</CardTitle>
              <CardDescription>Change your password</CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...passwordForm}>
                <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-4">
                  <FormField
                    control={passwordForm.control}
                    name="currentPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Current Password</FormLabel>
                        <FormControl>
                          <Input type="password" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={passwordForm.control}
                    name="newPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>New Password</FormLabel>
                        <FormControl>
                          <Input type="password" {...field} />
                        </FormControl>
                        <FormDescription>
                          Password must be at least 6 characters
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={passwordForm.control}
                    name="confirmPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Confirm New Password</FormLabel>
                        <FormControl>
                          <Input type="password" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="flex justify-end">
                    <Button type="submit">Change Password</Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Notification Settings */}
        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
              <CardDescription>Manage how you receive notifications</CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...notificationForm}>
                <form onSubmit={notificationForm.handleSubmit(onNotificationSubmit)} className="space-y-4">
                  <FormField
                    control={notificationForm.control}
                    name="orderNotifications"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between space-x-2 rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Order Notifications</FormLabel>
                          <FormDescription>
                            Receive notifications for new orders and order status changes
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
                  
                  <FormField
                    control={notificationForm.control}
                    name="emailNotifications"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between space-x-2 rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Email Notifications</FormLabel>
                          <FormDescription>
                            Receive daily summary emails of your cafe's performance
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
                  
                  <FormField
                    control={notificationForm.control}
                    name="systemNotifications"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between space-x-2 rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">System Notifications</FormLabel>
                          <FormDescription>
                            Receive notifications about system updates and maintenance
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
                  
                  <div className="flex justify-end">
                    <Button type="submit">Save Preferences</Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* System Settings (Admin Only) */}
        {user?.role === 'admin' && (
          <TabsContent value="system">
            <Card>
              <CardHeader>
                <CardTitle>System Settings</CardTitle>
                <CardDescription>Configure system-wide settings</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="tax-rate">Tax Rate (%)</Label>
                    <Input id="tax-rate" type="number" min="0" max="100" step="0.01" defaultValue="8.00" />
                    <p className="text-muted-foreground text-sm">
                      Set the default tax rate for all orders
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="default-tip">Default Tip (%)</Label>
                    <Input id="default-tip" type="number" min="0" max="100" step="0.01" defaultValue="15.00" />
                    <p className="text-muted-foreground text-sm">
                      Set the default suggested tip percentage
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="receipt-text">Receipt Footer Text</Label>
                    <Input id="receipt-text" defaultValue="Thank you for visiting our cafe!" />
                    <p className="text-muted-foreground text-sm">
                      This text will appear at the bottom of all receipts
                    </p>
                  </div>
                  
                  <div className="flex justify-end">
                    <Button onClick={() => {
                      toast({
                        title: "Settings saved",
                        description: "System settings have been updated successfully."
                      });
                    }}>
                      Save Settings
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {/* Receipt Customization (Admin Only) */}
        {user?.role === 'admin' && (
          <TabsContent value="receipt">
            <CafeSettingsForm />
          </TabsContent>
        )}

        {/* Inventory Management (Admin Only) */}
        {user?.role === 'admin' && (
          <TabsContent value="inventory">
            <InventoryManagement />
          </TabsContent>
        )}
      </Tabs>
    </DashboardLayout>
  );
}
